import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Ajv2020 } from 'ajv/dist/2020.js'
import Fastify from 'fastify'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { match } from 'ts-pattern'
import { parse } from 'yaml'
import { createInMemoryEmailGateway, sendSpouseInvitation } from './email.js'
import type { EmailGateway } from './email.js'

type Identity = {
  firstName: string
  lastName: string
}

type PersonalInformation = Identity & (
  | {
      maritalStatus: 'married'
      spouseFirstName: string
      spouseLastName: string
      spouseEmail: string
    }
  | {
      maritalStatus: 'single' | 'divorced' | 'widowed'
  }
)

type Address = {
  addressFirstLine: string
  addressSecondLine: string
  postCode: string
  city: string
  country: string
}

type EmergencyContact = {
  name: string
  relationship: string
  phoneNumber: string
  email: string
}

export type Person = {
  personalInformation: PersonalInformation
  address: Address
  emergencyContacts:
    | { status: 'declined' }
    | {
        status: 'provided'
        primaryEmergencyContact: EmergencyContact
        alternativeEmergencyContacts: EmergencyContact[]
      }
}

const currentDirectory = dirname(fileURLToPath(import.meta.url))
const openApiPath = resolve(currentDirectory, '../../../openapi/person-api.yaml')
const openApiDocument = parse(readFileSync(openApiPath, 'utf8')) as {
  components: { schemas: object }
}
const validator = new Ajv2020({ allErrors: true, strict: false }).compile({
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $ref: '#/components/schemas/PersonUpdate',
  components: openApiDocument.components,
})

const hasDistinctEmergencyPhoneNumbers = (person: Person): boolean => {
  if (person.emergencyContacts.status === 'declined') {
    return true
  }

  const phoneNumbers = [
    person.emergencyContacts.primaryEmergencyContact,
    ...person.emergencyContacts.alternativeEmergencyContacts,
  ].map(contact => contact.phoneNumber.trim())

  return new Set(phoneNumbers).size === phoneNumbers.length
}

export const buildApp = (emailGateway: EmailGateway = createInMemoryEmailGateway()) => {
  const app = Fastify()
  const people = new Map<string, Person>([
    [
      'ada',
      {
        personalInformation: {
          firstName: 'Ada',
          lastName: 'Lovelace',
          maritalStatus: 'married',
          spouseFirstName: 'William',
          spouseLastName: 'King-Noel',
          spouseEmail: 'william@example.com',
        },
        address: {
          addressFirstLine: '12 St James Square',
          addressSecondLine: '',
          postCode: 'SW1Y 4LB',
          city: 'London',
          country: 'GB',
        },
        emergencyContacts: {
          status: 'provided',
          primaryEmergencyContact: {
            name: 'Charles Babbage',
            relationship: 'Friend',
            phoneNumber: '+442079460001',
            email: 'charles@example.com',
          },
          alternativeEmergencyContacts: [],
        },
      },
    ],
  ])

  app.register(swagger, {
    mode: 'static',
    // @fastify/swagger's static-mode declarations still only accept OpenAPI 3.0.
    // The plugin serves this OpenAPI 3.1 document unchanged at runtime.
    specification: { document: openApiDocument as never },
  })
  app.register(swaggerUi, {
    routePrefix: '/docs',
  })

  app.get('/openapi.json', () => openApiDocument)

  app.put<{ Params: { personId: string }; Body: unknown }>(
    '/people/:personId',
    async (request, reply) => {
      if (
        !validator(request.body) ||
        !hasDistinctEmergencyPhoneNumbers(request.body as Person)
      ) {
        return reply.status(400).send({ errors: validator.errors })
      }

      const person = request.body as Person
      people.set(request.params.personId, person)
      match(person.personalInformation)
        .with({ maritalStatus: 'married' }, (person) =>
          sendSpouseInvitation(
            {
              firstName: person.spouseFirstName,
              lastName: person.spouseLastName,
              email: person.spouseEmail,
            },
            emailGateway,
          ),
        )
        .otherwise(() => undefined)
      return reply.status(200).send(person)
    },
  )

  return app
}

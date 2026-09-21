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
import { createInMemoryPeopleRepository } from './people-repository.js'
import type { PeopleRepository } from './people-repository.js'
import type { Person } from './person.js'

export type { Person } from './person.js'

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

export const buildApp = (
  emailGateway: EmailGateway = createInMemoryEmailGateway(),
  peopleRepository: PeopleRepository = createInMemoryPeopleRepository(),
) => {
  const app = Fastify()

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

  app.get<{ Params: { personId: string } }>('/people/:personId', (request, reply) => {
    if (!peopleRepository.has(request.params.personId)) {
      return reply.status(404).send()
    }

    return reply.status(200).send(peopleRepository.get(request.params.personId))
  })

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
      peopleRepository.replace(request.params.personId, person)
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
      return reply.status(200).send(peopleRepository.get(request.params.personId))
    },
  )

  return app
}

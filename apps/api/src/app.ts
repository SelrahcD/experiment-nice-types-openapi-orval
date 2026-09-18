import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Ajv2020 } from 'ajv/dist/2020.js'
import Fastify from 'fastify'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { parse } from 'yaml'

type PersonBase = {
  firstName: string
  lastName: string
}

type Person = PersonBase & (
  | {
      maritalStatus: 'married'
      spouseFirstName: string
      spouseLastName: string
    }
  | {
      maritalStatus: 'single' | 'divorced' | 'widowed'
    }
)

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

export const buildApp = () => {
  const app = Fastify()
  const people = new Map<string, Person>([
    [
      'ada',
      {
        firstName: 'Ada',
        lastName: 'Lovelace',
        maritalStatus: 'married',
        spouseFirstName: 'William',
        spouseLastName: 'King-Noel',
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
      if (!validator(request.body)) {
        return reply.status(400).send({ errors: validator.errors })
      }

      const person = request.body as Person
      people.set(request.params.personId, person)
      return reply.status(200).send(person)
    },
  )

  return app
}

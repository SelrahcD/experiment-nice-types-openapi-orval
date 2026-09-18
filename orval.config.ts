import { defineConfig } from 'orval'

export default defineConfig({
  personApi: {
    input: {
      target: './openapi/person-api.yaml',
    },
    output: {
      client: 'fetch',
      mode: 'split',
      target: './apps/web/src/api/generated/person-api.ts',
      schemas: {
        path: './apps/web/src/api/generated/models',
        type: 'zod',
      },
      clean: true,
      override: {
        zod: {
          version: 4,
          generateDiscriminatedUnion: true,
        },
      },
    },
  },
})

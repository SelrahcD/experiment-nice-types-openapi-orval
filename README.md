# OpenAPI discriminated-union POC

This workspace tests whether Orval converts an OpenAPI 3.1 `allOf` plus `oneOf`
schema into a useful TypeScript discriminated union.

## Run it

```sh
pnpm install
pnpm check
pnpm dev:api
pnpm dev:web
```

Open the Vite URL, normally `http://localhost:5173`. The API is available on
`http://localhost:3000`; its source OpenAPI document is served at
`http://localhost:3000/openapi.json`. Swagger UI is available at
`http://localhost:3000/docs`.

## What is being proved

`openapi/person-api.yaml` is the only contract source. It describes a person
as two explicit sections: `personalInformation` and `address`. The personal
information section is `Identity & (MarriedPerson | UnmarriedPerson)`:

- `married` requires both spouse names and an email matching the OpenAPI regex;
- `single`, `divorced`, and `widowed` reject either spouse-name property.

The request also has an `emergencyContacts` section. It is a discriminated
union: a person either provides one primary contact and up to two alternatives,
or submits `{ status: 'declined' }` to decline sharing any contact.

`pnpm check` regenerates the Orval client, validates the API behavior with
Fastify injection tests, and type-checks `apps/web/src/type-proof.ts`. That
file proves that TypeScript narrows a generated `PersonUpdate` to the married
branch after checking `maritalStatus`.

Orval also generates Zod 4 schemas in `apps/web/src/api/generated/models`.
TanStack Form uses `PersonUpdate` as its generated Zod submit validator, shows
field errors, and parses the form value again before its HTTP request. `pnpm
test` includes both API and generated Zod validation tests.

`apps/web/src/person-form-validation.ts` translates generated Zod errors into
human-readable form errors; OpenAPI remains the source of validation rules.
For the spouse email, an empty value and an invalid format have distinct
messages.

The generated Zod schema validates the required spouse names for `married`.
For this `allOf`-wrapped `oneOf`, it is generated as an intersection with a
union rather than `z.discriminatedUnion`. Also, Orval does not translate the
OpenAPI `not` constraint used to reject spouse fields for unmarried people:
Zod strips those unknown fields, while the API still rejects them. The test
suite records this deliberate comparison.

The API uses an in-memory email gateway for this POC. Saving a person whose
`personalInformation.maritalStatus` is `married` maps the spouse data to an
invitation email through `ts-pattern`; other marital statuses send no email.

If the primary schema does not produce that property with the installed Orval
version, add a separate `oneOf`-only comparison schema rather than weakening
the primary POC silently.

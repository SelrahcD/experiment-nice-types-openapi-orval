import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { match } from 'ts-pattern'
import type { PersonUpdate } from './api/generated/models/personUpdate.zod'
import { formatErrors } from './form-errors'
import { usePersonForm } from './person-form'
import type { PersonForm } from './person-form'

const unmarriedStatuses = ['single', 'divorced', 'widowed'] as const

const SpouseFields = ({ form }: { form: PersonForm }) => (
  <>
    <form.Field name="spouseFirstName">
      {(field) => (
        <label>
          Spouse first name
          <input
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
          />
          {field.state.meta.errors.length > 0 && <small>{formatErrors(field.state.meta.errors)}</small>}
        </label>
      )}
    </form.Field>
    <form.Field name="spouseLastName">
      {(field) => (
        <label>
          Spouse last name
          <input
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
          />
          {field.state.meta.errors.length > 0 && <small>{formatErrors(field.state.meta.errors)}</small>}
        </label>
      )}
    </form.Field>
  </>
)

const App = () => {
  const [result, setResult] = useState('')
  const form = usePersonForm(setResult)

  return (
    <main>
      <h1>OpenAPI discriminated union POC</h1>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          event.stopPropagation()
          void form.handleSubmit()
        }}
      >
        <form.Field name="firstName">
          {(field) => (
            <label>
              First name
              <input
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
              {field.state.meta.errors.length > 0 && <small>{formatErrors(field.state.meta.errors)}</small>}
            </label>
          )}
        </form.Field>
        <form.Field name="lastName">
          {(field) => (
            <label>
              Last name
              <input
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
              {field.state.meta.errors.length > 0 && <small>{formatErrors(field.state.meta.errors)}</small>}
            </label>
          )}
        </form.Field>
        <form.Field name="maritalStatus">
          {(field) => (
            <label>
              Marital status
              <select
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value as PersonUpdate['maritalStatus'])}
              >
                <option value="married">Married</option>
                {unmarriedStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              {field.state.meta.errors.length > 0 && <small>{formatErrors(field.state.meta.errors)}</small>}
            </label>
          )}
        </form.Field>
        <form.Subscribe selector={(state) => state.values.maritalStatus}>
          {(maritalStatus) =>
            match(maritalStatus)
              .with('married', () => <SpouseFields form={form} />)
              .with('single', 'divorced', 'widowed', () => null)
              .exhaustive()
          }
        </form.Subscribe>
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <button type="submit" disabled={isSubmitting}>
              Save
            </button>
          )}
        </form.Subscribe>
      </form>
      <output>{result}</output>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(<App />)

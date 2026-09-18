import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { useForm } from '@tanstack/react-form'
import { replacePerson } from './api/generated/person-api'
import { PersonUpdate as PersonUpdateSchema } from './api/generated/models/personUpdate.zod'
import type { PersonUpdate } from './api/generated/models/personUpdate.zod'

const unmarriedStatuses = ['single', 'divorced', 'widowed'] as const

const initialPerson: PersonUpdate = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  maritalStatus: 'married',
  spouseFirstName: 'William',
  spouseLastName: 'King-Noel',
}

const formatErrors = (errors: unknown[]) =>
  errors
    .map((error) => {
      if (typeof error === 'string') return error
      if (error instanceof Error) return error.message
      return JSON.stringify(error)
    })
    .join(', ')

const App = () => {
  const [result, setResult] = useState('')
  const form = useForm({
    defaultValues: initialPerson as PersonUpdate,
    validators: {
      onSubmit: PersonUpdateSchema,
    },
    onSubmit: async ({ value }) => {
      const person = PersonUpdateSchema.parse(value)
      const response = await replacePerson('ada', person)
      if (response.status === 200) {
        setResult(`Saved ${response.data.maritalStatus} person.`)
        return
      }

      setResult('The API rejected the person.')
    },
  })

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
            maritalStatus === 'married' && (
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

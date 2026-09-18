import { useState } from 'react'
import { createRoot } from 'react-dom/client'
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

const App = () => {
  const [person, setPerson] = useState<PersonUpdate>(initialPerson)
  const [result, setResult] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const changeMaritalStatus = (status: PersonUpdate['maritalStatus']) => {
    if (status === 'married') {
      setPerson({
        firstName: person.firstName,
        lastName: person.lastName,
        maritalStatus: 'married',
        spouseFirstName: person.maritalStatus === 'married' ? person.spouseFirstName : '',
        spouseLastName: person.maritalStatus === 'married' ? person.spouseLastName : '',
      })
      return
    }

    setPerson({ firstName: person.firstName, lastName: person.lastName, maritalStatus: status })
  }

  const save = async () => {
    const validation = PersonUpdateSchema.safeParse(person)
    if (!validation.success) {
      setErrors(
        Object.fromEntries(
          validation.error.issues.map((issue) => [issue.path.join('.'), issue.message]),
        ),
      )
      setResult('Please fix the highlighted fields.')
      return
    }

    setErrors({})
    const response = await replacePerson('ada', validation.data)
    if (response.status === 200) {
      setResult(`Saved ${response.data.maritalStatus} person.`)
      return
    }

    setResult('The API rejected the person.')
  }

  return (
    <main>
      <h1>OpenAPI discriminated union POC</h1>
      <label>
        First name
        <input
          value={person.firstName}
          onChange={(event) => setPerson({ ...person, firstName: event.target.value })}
        />
        {errors.firstName && <small>{errors.firstName}</small>}
      </label>
      <label>
        Last name
        <input
          value={person.lastName}
          onChange={(event) => setPerson({ ...person, lastName: event.target.value })}
        />
        {errors.lastName && <small>{errors.lastName}</small>}
      </label>
      <label>
        Marital status
        <select
          value={person.maritalStatus}
          onChange={(event) => changeMaritalStatus(event.target.value as PersonUpdate['maritalStatus'])}
        >
          <option value="married">Married</option>
          {unmarriedStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>
      {person.maritalStatus === 'married' && (
        <>
          <label>
            Spouse first name
            <input
              value={person.spouseFirstName}
              onChange={(event) => setPerson({ ...person, spouseFirstName: event.target.value })}
            />
            {errors.spouseFirstName && <small>{errors.spouseFirstName}</small>}
          </label>
          <label>
            Spouse last name
            <input
              value={person.spouseLastName}
              onChange={(event) => setPerson({ ...person, spouseLastName: event.target.value })}
            />
            {errors.spouseLastName && <small>{errors.spouseLastName}</small>}
          </label>
        </>
      )}
      <button type="button" onClick={save}>
        Save
      </button>
      <output>{result}</output>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(<App />)

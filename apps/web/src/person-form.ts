import { useForm } from '@tanstack/react-form'
import { replacePerson } from './api/generated/person-api'
import { PersonUpdate as PersonUpdateSchema } from './api/generated/models/personUpdate.zod'
import type { PersonUpdate } from './api/generated/models/personUpdate.zod'

const initialPerson: PersonUpdate = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  maritalStatus: 'married',
  spouseFirstName: 'William',
  spouseLastName: 'King-Noel',
}

export const usePersonForm = (setResult: (result: string) => void) =>
  useForm({
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

export type PersonForm = ReturnType<typeof usePersonForm>

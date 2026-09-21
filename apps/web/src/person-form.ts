import { useForm } from '@tanstack/react-form'
import { replacePerson } from './api/generated/person-api'
import { PersonUpdate as PersonUpdateSchema } from './api/generated/models/personUpdate.zod'
import type { PersonUpdate } from './api/generated/models/personUpdate.zod'
import { validatePersonForm } from './person-form-validation'

const initialPerson: PersonUpdate = {
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
    primaryEmergencyContact: {
      name: 'Charles Babbage',
      relationship: 'Friend',
      phoneNumber: '+442079460001',
      email: 'charles@example.com',
    },
    alternativeEmergencyContacts: [],
  },
}

export const usePersonForm = (setResult: (result: string) => void) =>
  useForm({
    defaultValues: initialPerson as PersonUpdate,
    validators: {
      onSubmit: validatePersonForm,
    },
    onSubmit: async ({ value }) => {
      const person = PersonUpdateSchema.parse(value)
      const response = await replacePerson('ada', person)
      if (response.status === 200) {
        setResult(`Saved ${response.data.personalInformation.maritalStatus} person.`)
        return
      }

      setResult('The API rejected the person.')
    },
  })

export type PersonForm = ReturnType<typeof usePersonForm>

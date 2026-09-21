import { revalidateLogic, useForm } from '@tanstack/react-form'
import { replacePerson } from './api/generated/person-api'
import { PersonUpdate as PersonUpdateSchema } from './api/generated/models/personUpdate.zod'
import { toPersonUpdate, type PersonFormValues } from './person-form-data'
import { validatePersonForm } from './person-form-validation'

export const usePersonForm = (
  initialPerson: PersonFormValues,
  setResult: (result: string) => void,
) =>
  useForm({
    defaultValues: initialPerson,
    validationLogic: revalidateLogic({
      mode: 'submit',
      modeAfterSubmission: 'change',
    }),
    validators: {
      onDynamic: validatePersonForm,
    },
    onSubmit: async ({ value }) => {
      const person = PersonUpdateSchema.parse(toPersonUpdate(value))
      const response = await replacePerson('ada', person)
      if (response.status === 200) {
        setResult(`Saved ${response.data.personalInformation.maritalStatus} person.`)
        return
      }

      setResult('The API rejected the person.')
    },
  })

export type PersonForm = ReturnType<typeof usePersonForm>

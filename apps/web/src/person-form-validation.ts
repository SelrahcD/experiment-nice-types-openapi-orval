import { PersonUpdate as PersonUpdateSchema } from './api/generated/models/personUpdate.zod'
import type { PersonUpdate } from './api/generated/models/personUpdate.zod'

const messages: Record<string, string> = {
  'personalInformation.firstName.too_small': 'Enter a first name.',
  'personalInformation.lastName.too_small': 'Enter a last name.',
  'personalInformation.spouseFirstName.too_small': 'Enter the spouse’s first name.',
  'personalInformation.spouseLastName.too_small': 'Enter the spouse’s last name.',
  'personalInformation.spouseEmail.too_small': 'Enter the spouse’s email address.',
  'personalInformation.spouseEmail.invalid_format': 'Enter a valid email address for the spouse.',
  'address.addressFirstLine.too_small': 'Enter the first address line.',
  'address.postCode.too_small': 'Enter a postcode.',
  'address.city.too_small': 'Enter a city.',
  'address.country.too_small': 'Enter a country.',
}

const getMessage = (fieldName: string, issueCode: string) =>
  messages[`${fieldName}.${issueCode}`] ?? 'This value is invalid.'

export const validatePersonForm = ({ value }: { value: PersonUpdate }) => {
  const validation = PersonUpdateSchema.safeParse(value)
  if (validation.success) return undefined

  const fields = validation.error.issues.reduce<Record<string, string>>((errors, issue) => {
    const fieldName = issue.path.join('.')
    if (errors[fieldName] === undefined) {
      errors[fieldName] = getMessage(fieldName, issue.code)
    }
    return errors
  }, {})

  return { fields }
}

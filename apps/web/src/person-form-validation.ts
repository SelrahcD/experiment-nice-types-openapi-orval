import { PersonUpdate as PersonUpdateSchema } from './api/generated/models/personUpdate.zod'
import type { PersonUpdate } from './api/generated/models/personUpdate.zod'

const messages: Record<string, string> = {
  'firstName.too_small': 'Enter a first name.',
  'lastName.too_small': 'Enter a last name.',
  'spouseFirstName.too_small': 'Enter the spouse’s first name.',
  'spouseLastName.too_small': 'Enter the spouse’s last name.',
  'spouseEmail.too_small': 'Enter the spouse’s email address.',
  'spouseEmail.invalid_format': 'Enter a valid email address for the spouse.',
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

import { PersonUpdate as PersonUpdateSchema } from './api/generated/models/personUpdate.zod'
import { EmergencyContacts } from './emergency-contacts-validation'
import type { PersonFormValues } from './person-form-data'

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
  'emergencyContacts.primaryEmergencyContact.invalid_type':
    'Enter a primary emergency contact.',
  'emergencyContacts.alternativeEmergencyContacts.too_big':
    'You can add at most two alternative emergency contacts.',
}

const getMessage = (fieldName: string, issueCode: string) =>
  messages[`${fieldName}.${issueCode}`] ??
  getEmergencyContactMessage(fieldName, issueCode) ??
  'This value is invalid.'

const getEmergencyContactMessage = (fieldName: string, issueCode: string) => {
  if (!fieldName.startsWith('emergencyContacts.')) {
    return undefined
  }

  if (fieldName.endsWith('.name') && issueCode === 'too_small') {
    return 'Enter the contact name.'
  }

  if (fieldName.endsWith('.phoneNumber') && issueCode === 'too_small') {
    return 'Enter the contact phone number.'
  }

  if (fieldName.endsWith('.email') && issueCode === 'invalid_format') {
    return 'Enter a valid contact email address.'
  }

  return undefined
}

const getFieldName = (path: ReadonlyArray<PropertyKey>) =>
  path.reduce<string>(
    (fieldName, segment) =>
      typeof segment === 'number'
        ? `${fieldName}[${segment}]`
        : fieldName === ''
          ? String(segment)
          : `${fieldName}.${String(segment)}`,
    '',
  )

export const validatePersonForm = ({ value }: { value: PersonFormValues }) => {
  const validation = PersonUpdateSchema.safeParse(value)
  const emergencyContactsValidation = EmergencyContacts.safeParse(
    value.emergencyContacts,
  )

  if (validation.success && emergencyContactsValidation.success) {
    return undefined
  }

  const issues = [
    ...(validation.success ? [] : validation.error.issues),
    ...(emergencyContactsValidation.success
      ? []
      : emergencyContactsValidation.error.issues.map(issue => ({
          ...issue,
          path: ['emergencyContacts', ...issue.path],
        }))),
  ]

  const fields = issues.reduce<Record<string, string>>((errors, issue) => {
    const fieldName = getFieldName(issue.path)
    if (errors[fieldName] === undefined) {
      errors[fieldName] =
        issue.code === 'custom'
          ? issue.message
          : getMessage(fieldName, String(issue.code))
    }
    return errors
  }, {})

  return { fields }
}

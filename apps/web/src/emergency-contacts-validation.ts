import { EmergencyContacts as GeneratedEmergencyContacts } from './api/generated/models/emergencyContacts.zod'

export const EmergencyContacts = GeneratedEmergencyContacts.superRefine(
  (emergencyContacts, context) => {
    if (emergencyContacts.status === 'declined') {
      return
    }

    const phoneNumbers = new Map<string, Array<Array<string | number>>>()
    const contacts = [
      {
        contact: emergencyContacts.primaryEmergencyContact,
        path: ['primaryEmergencyContact'],
      },
      ...emergencyContacts.alternativeEmergencyContacts.map((contact, index) => ({
        contact,
        path: ['alternativeEmergencyContacts', index],
      })),
    ]

    contacts.forEach(({ contact, path }) => {
      const phoneNumber = contact.phoneNumber.trim()
      phoneNumbers.set(phoneNumber, [...(phoneNumbers.get(phoneNumber) ?? []), path])
    })

    phoneNumbers.forEach((paths) => {
      if (paths.length < 2) {
        return
      }

      paths.forEach((path) => {
        context.addIssue({
          code: 'custom',
          message: 'Use a different phone number for each emergency contact.',
          path: [...path, 'phoneNumber'],
        })
      })
    })
  },
)

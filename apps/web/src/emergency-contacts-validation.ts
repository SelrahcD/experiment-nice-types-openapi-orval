import { EmergencyContacts as GeneratedEmergencyContacts } from './api/generated/models/emergencyContacts.zod'

export const EmergencyContacts = GeneratedEmergencyContacts.superRefine(
  (emergencyContacts, context) => {
    if (emergencyContacts.status === 'declined') {
      return
    }

    const phoneNumbers = new Map<string, Array<string | number>>()
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
      const existingPath = phoneNumbers.get(phoneNumber)

      if (existingPath !== undefined) {
        context.addIssue({
          code: 'custom',
          message: 'Use a different phone number for each emergency contact.',
          path: [...existingPath, 'phoneNumber'],
        })
        context.addIssue({
          code: 'custom',
          message: 'Use a different phone number for each emergency contact.',
          path: [...path, 'phoneNumber'],
        })
        return
      }

      phoneNumbers.set(phoneNumber, path)
    })
  },
)

import type { PersonUpdate } from './api/generated/models/personUpdate.zod'

export type EmergencyContactForm = Extract<
  PersonUpdate['emergencyContacts'],
  { status: 'provided' }
>['primaryEmergencyContact'] & {
  isPrimary: boolean
}

export type PersonFormValues = Omit<PersonUpdate, 'emergencyContacts'> & {
  emergencyContacts: {
    status: 'provided' | 'declined'
    contacts: EmergencyContactForm[]
  }
}

const withoutPrimaryMarker = ({ isPrimary: _, ...contact }: EmergencyContactForm) => contact

export const toPersonUpdate = (person: PersonFormValues): PersonUpdate => {
  if (person.emergencyContacts.status === 'declined') {
    return {
      ...person,
      emergencyContacts: { status: 'declined' },
    }
  }

  const primaryEmergencyContact = person.emergencyContacts.contacts.find(
    (contact) => contact.isPrimary,
  )

  if (primaryEmergencyContact === undefined) {
    throw new Error('A primary emergency contact is required.')
  }

  return {
    ...person,
    emergencyContacts: {
      status: 'provided',
      primaryEmergencyContact: withoutPrimaryMarker(primaryEmergencyContact),
      alternativeEmergencyContacts: person.emergencyContacts.contacts
        .filter((contact) => !contact.isPrimary)
        .map(withoutPrimaryMarker),
    },
  }
}

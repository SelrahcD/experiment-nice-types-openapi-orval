import type { PersonUpdate } from './api/generated/models/personUpdate.zod'

export type EmergencyContactForm = Extract<
  PersonUpdate['emergencyContacts'],
  { status: 'provided' }
>['primaryEmergencyContact']

export type PersonFormValues = Omit<PersonUpdate, 'emergencyContacts'> & {
  emergencyContacts: {
    status: 'provided' | 'declined'
    primaryEmergencyContact: EmergencyContactForm
    alternativeEmergencyContacts: EmergencyContactForm[]
  }
}

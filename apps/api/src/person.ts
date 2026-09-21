type Identity = {
  firstName: string
  lastName: string
}

type PersonalInformation = Identity &
  (
    | {
        maritalStatus: 'married'
        spouseFirstName: string
        spouseLastName: string
        spouseEmail: string
      }
    | {
        maritalStatus: 'single' | 'divorced' | 'widowed'
      }
  )

type Address = {
  addressFirstLine: string
  addressSecondLine: string
  postCode: string
  city: string
  country: string
}

type EmergencyContact = {
  name: string
  relationship: string
  phoneNumber: string
  email: string
}

export type Person = {
  personalInformation: PersonalInformation
  address: Address
  emergencyContacts:
    | { status: 'declined' }
    | {
        status: 'provided'
        primaryEmergencyContact: EmergencyContact
        alternativeEmergencyContacts: EmergencyContact[]
      }
}

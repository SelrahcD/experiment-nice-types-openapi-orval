import { FormApi, revalidateLogic } from '@tanstack/react-form'
import { describe, expect, it } from 'vitest'
import { Address } from './api/generated/models/address.zod'
import { EmergencyContacts } from './api/generated/models/emergencyContacts.zod'
import { PersonalInformation } from './api/generated/models/personalInformation.zod'
import { PersonUpdate } from './api/generated/models/personUpdate.zod'
import { validatePersonForm } from './person-form-validation'

const emergencyContacts = {
  status: 'provided' as const,
  primaryEmergencyContact: {
    name: 'Charles Babbage',
    relationship: 'Friend',
    phoneNumber: '+442079460001',
    email: 'charles@example.com',
  },
  alternativeEmergencyContacts: [],
}

const emergencyContactsForm = {
  status: 'provided' as const,
  primaryEmergencyContact: emergencyContacts.primaryEmergencyContact,
  alternativeEmergencyContacts: [],
}

describe('generated PersonUpdate Zod schema', () => {
  it('exposes every form section as an independently usable schema', () => {
    const personalInformation = PersonalInformation.parse({
      firstName: 'Ada',
      lastName: 'Lovelace',
      maritalStatus: 'single',
    })
    const address = Address.parse({
      addressFirstLine: '12 St James Square',
      addressSecondLine: '',
      postCode: 'SW1Y 4LB',
      city: 'London',
      country: 'GB',
    })
    const emergencyContacts = EmergencyContacts.parse({
      status: 'provided',
      primaryEmergencyContact: {
        name: 'Charles Babbage',
        relationship: 'Friend',
        phoneNumber: '+442079460001',
        email: 'charles@example.com',
      },
      alternativeEmergencyContacts: [],
    })

    expect(personalInformation.maritalStatus).toBe('single')
    expect(address.city).toBe('London')
    if (emergencyContacts.status === 'provided') {
      expect(emergencyContacts.primaryEmergencyContact.name).toBe('Charles Babbage')
    }
  })

  it('rejects an empty spouse name for a married person', () => {
    const result = PersonUpdate.safeParse({
      personalInformation: {
        firstName: 'Ada', lastName: 'Lovelace', maritalStatus: 'married', spouseFirstName: '', spouseLastName: 'King-Noel', spouseEmail: 'william@example.com',
      },
      address: { addressFirstLine: '12 St James Square', addressSecondLine: '', postCode: 'SW1Y 4LB', city: 'London', country: 'GB' },
      emergencyContacts,
    })

    expect(result.success).toBe(false)
  })

  it('accepts an unmarried person without spouse names', () => {
    const result = PersonUpdate.safeParse({
      personalInformation: { firstName: 'Ada', lastName: 'Lovelace', maritalStatus: 'single' },
      address: { addressFirstLine: '12 St James Square', addressSecondLine: '', postCode: 'SW1Y 4LB', city: 'London', country: 'GB' },
      emergencyContacts,
    })

    expect(result.success).toBe(true)
  })

  it('rejects an invalid spouse email for a married person', () => {
    const result = PersonUpdate.safeParse({
      personalInformation: { firstName: 'Ada', lastName: 'Lovelace', maritalStatus: 'married', spouseFirstName: 'William', spouseLastName: 'King-Noel', spouseEmail: 'not-an-email' },
      address: { addressFirstLine: '12 St James Square', addressSecondLine: '', postCode: 'SW1Y 4LB', city: 'London', country: 'GB' },
      emergencyContacts,
    })

    expect(result.success).toBe(false)
  })

  it('translates generated Zod errors for the form', () => {
    const errors = validatePersonForm({
      value: {
        personalInformation: { firstName: 'Ada', lastName: 'Lovelace', maritalStatus: 'married', spouseFirstName: 'William', spouseLastName: 'King-Noel', spouseEmail: 'not-an-email' },
        address: { addressFirstLine: '12 St James Square', addressSecondLine: '', postCode: 'SW1Y 4LB', city: 'London', country: 'GB' },
        emergencyContacts: emergencyContactsForm,
      },
    })

    expect(errors).toEqual({
      fields: { 'personalInformation.spouseEmail': 'Enter a valid email address for the spouse.' },
    })
  })

  it('reports a missing spouse email before its format', () => {
    const errors = validatePersonForm({
      value: {
        personalInformation: { firstName: 'Ada', lastName: 'Lovelace', maritalStatus: 'married', spouseFirstName: 'William', spouseLastName: 'King-Noel', spouseEmail: '' },
        address: { addressFirstLine: '12 St James Square', addressSecondLine: '', postCode: 'SW1Y 4LB', city: 'London', country: 'GB' },
        emergencyContacts: emergencyContactsForm,
      },
    })

    expect(errors).toEqual({
      fields: { 'personalInformation.spouseEmail': 'Enter the spouse’s email address.' },
    })
  })

  it('currently strips spouse names instead of rejecting them for an unmarried person', () => {
    const result = PersonUpdate.safeParse({
      personalInformation: { firstName: 'Ada', lastName: 'Lovelace', maritalStatus: 'single', spouseFirstName: 'William' },
      address: { addressFirstLine: '12 St James Square', addressSecondLine: '', postCode: 'SW1Y 4LB', city: 'London', country: 'GB' },
      emergencyContacts,
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.personalInformation).not.toHaveProperty('spouseFirstName')
    }
  })

  it('requires a primary emergency contact structurally', () => {
    const result = PersonUpdate.safeParse({
      personalInformation: { firstName: 'Ada', lastName: 'Lovelace', maritalStatus: 'single' },
      address: { addressFirstLine: '12 St James Square', addressSecondLine: '', postCode: 'SW1Y 4LB', city: 'London', country: 'GB' },
      emergencyContacts: { status: 'provided', alternativeEmergencyContacts: [] },
    })

    expect(result.success).toBe(false)
  })

  it('accepts a person who declines to share emergency contacts', () => {
    const result = PersonUpdate.safeParse({
      personalInformation: { firstName: 'Ada', lastName: 'Lovelace', maritalStatus: 'single' },
      address: { addressFirstLine: '12 St James Square', addressSecondLine: '', postCode: 'SW1Y 4LB', city: 'London', country: 'GB' },
      emergencyContacts: { status: 'declined' },
    })

    expect(result.success).toBe(true)
  })

  it('keeps declined emergency contacts in the form but omits them from the API payload', () => {
    const formEmergencyContacts = {
      status: 'declined' as const,
      primaryEmergencyContact: emergencyContacts.primaryEmergencyContact,
      alternativeEmergencyContacts: [
        {
          name: 'Mary Somerville',
          relationship: 'Friend',
          phoneNumber: '+442079460002',
          email: '',
        },
      ],
    }
    const payload = PersonUpdate.parse({
      personalInformation: { firstName: 'Ada', lastName: 'Lovelace', maritalStatus: 'single' },
      address: { addressFirstLine: '12 St James Square', addressSecondLine: '', postCode: 'SW1Y 4LB', city: 'London', country: 'GB' },
      emergencyContacts: formEmergencyContacts,
    })

    expect(payload.emergencyContacts).toEqual({ status: 'declined' })
    expect(formEmergencyContacts.primaryEmergencyContact.name).toBe('Charles Babbage')
    expect(formEmergencyContacts.alternativeEmergencyContacts).toHaveLength(1)
  })

  it('reports a duplicate phone number on every emergency contact sharing it', () => {
    const errors = validatePersonForm({
      value: {
        personalInformation: { firstName: 'Ada', lastName: 'Lovelace', maritalStatus: 'single' },
        address: { addressFirstLine: '12 St James Square', addressSecondLine: '', postCode: 'SW1Y 4LB', city: 'London', country: 'GB' },
        emergencyContacts: {
          status: 'provided',
          primaryEmergencyContact: emergencyContacts.primaryEmergencyContact,
          alternativeEmergencyContacts: [
            {
              name: 'Mary Somerville',
              relationship: 'Friend',
              phoneNumber: '+442079460001',
              email: '',
            },
            {
              name: 'George Boole',
              relationship: 'Friend',
              phoneNumber: '+442079460001',
              email: '',
            },
          ],
        },
      },
    })

    expect(errors).toEqual({
      fields: {
        'emergencyContacts.primaryEmergencyContact.phoneNumber':
          'Use a different phone number for each emergency contact.',
        'emergencyContacts.alternativeEmergencyContacts[0].phoneNumber':
          'Use a different phone number for each emergency contact.',
        'emergencyContacts.alternativeEmergencyContacts[1].phoneNumber':
          'Use a different phone number for each emergency contact.',
      },
    })
  })

  it('displays a duplicate phone-number error on every emergency contact sharing it', async () => {
    const form = new FormApi({
      defaultValues: {
        personalInformation: { firstName: 'Ada', lastName: 'Lovelace', maritalStatus: 'single' as const },
        address: { addressFirstLine: '12 St James Square', addressSecondLine: '', postCode: 'SW1Y 4LB', city: 'London', country: 'GB' },
        emergencyContacts: {
          status: 'provided' as const,
          primaryEmergencyContact: emergencyContacts.primaryEmergencyContact,
          alternativeEmergencyContacts: [
            { name: 'Mary Somerville', relationship: 'Friend', phoneNumber: '+442079460001', email: '' },
            { name: 'George Boole', relationship: 'Friend', phoneNumber: '+442079460001', email: '' },
          ],
        },
      },
      validationLogic: revalidateLogic(),
      validators: { onDynamic: validatePersonForm },
    })

    await form.handleSubmit()

    expect(
      form.getFieldMeta('emergencyContacts.primaryEmergencyContact.phoneNumber')?.errors,
    ).toEqual(['Use a different phone number for each emergency contact.'])
    expect(
      form.getFieldMeta('emergencyContacts.alternativeEmergencyContacts[0].phoneNumber')?.errors,
    ).toEqual(['Use a different phone number for each emergency contact.'])
    expect(
      form.getFieldMeta('emergencyContacts.alternativeEmergencyContacts[1].phoneNumber')?.errors,
    ).toEqual(['Use a different phone number for each emergency contact.'])
  })

  it('clears duplicate phone-number errors when a contact is corrected after submit', async () => {
    const form = new FormApi({
      defaultValues: {
        personalInformation: { firstName: 'Ada', lastName: 'Lovelace', maritalStatus: 'single' as const },
        address: { addressFirstLine: '12 St James Square', addressSecondLine: '', postCode: 'SW1Y 4LB', city: 'London', country: 'GB' },
        emergencyContacts: {
          status: 'provided' as const,
          primaryEmergencyContact: emergencyContacts.primaryEmergencyContact,
          alternativeEmergencyContacts: [
            { name: 'Mary Somerville', relationship: 'Friend', phoneNumber: '+442079460001', email: '' },
          ],
        },
      },
      validationLogic: revalidateLogic({
        mode: 'submit',
        modeAfterSubmission: 'change',
      }),
      validators: { onDynamic: validatePersonForm },
    })

    await form.handleSubmit()

    expect(
      form.getFieldMeta('emergencyContacts.primaryEmergencyContact.phoneNumber')?.errors,
    ).toEqual(['Use a different phone number for each emergency contact.'])

    form.setFieldValue(
      'emergencyContacts.alternativeEmergencyContacts[0].phoneNumber',
      '+442079460002',
    )

    expect(
      form.getFieldMeta('emergencyContacts.primaryEmergencyContact.phoneNumber')?.errors,
    ).toEqual([])
    expect(
      form.getFieldMeta('emergencyContacts.alternativeEmergencyContacts[0].phoneNumber')?.errors,
    ).toEqual([])
  })
})

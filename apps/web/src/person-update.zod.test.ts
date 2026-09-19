import { describe, expect, it } from 'vitest'
import { Address } from './api/generated/models/address.zod'
import { PersonalInformation } from './api/generated/models/personalInformation.zod'
import { PersonUpdate } from './api/generated/models/personUpdate.zod'
import { validatePersonForm } from './person-form-validation'

describe('generated PersonUpdate Zod schema', () => {
  it('exposes personal information and address as independently usable schemas', () => {
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

    expect(personalInformation.maritalStatus).toBe('single')
    expect(address.city).toBe('London')
  })

  it('rejects an empty spouse name for a married person', () => {
    const result = PersonUpdate.safeParse({
      personalInformation: {
        firstName: 'Ada', lastName: 'Lovelace', maritalStatus: 'married', spouseFirstName: '', spouseLastName: 'King-Noel', spouseEmail: 'william@example.com',
      },
      address: { addressFirstLine: '12 St James Square', addressSecondLine: '', postCode: 'SW1Y 4LB', city: 'London', country: 'GB' },
    })

    expect(result.success).toBe(false)
  })

  it('accepts an unmarried person without spouse names', () => {
    const result = PersonUpdate.safeParse({
      personalInformation: { firstName: 'Ada', lastName: 'Lovelace', maritalStatus: 'single' },
      address: { addressFirstLine: '12 St James Square', addressSecondLine: '', postCode: 'SW1Y 4LB', city: 'London', country: 'GB' },
    })

    expect(result.success).toBe(true)
  })

  it('rejects an invalid spouse email for a married person', () => {
    const result = PersonUpdate.safeParse({
      personalInformation: { firstName: 'Ada', lastName: 'Lovelace', maritalStatus: 'married', spouseFirstName: 'William', spouseLastName: 'King-Noel', spouseEmail: 'not-an-email' },
      address: { addressFirstLine: '12 St James Square', addressSecondLine: '', postCode: 'SW1Y 4LB', city: 'London', country: 'GB' },
    })

    expect(result.success).toBe(false)
  })

  it('translates generated Zod errors for the form', () => {
    const errors = validatePersonForm({
      value: {
        personalInformation: { firstName: 'Ada', lastName: 'Lovelace', maritalStatus: 'married', spouseFirstName: 'William', spouseLastName: 'King-Noel', spouseEmail: 'not-an-email' },
        address: { addressFirstLine: '12 St James Square', addressSecondLine: '', postCode: 'SW1Y 4LB', city: 'London', country: 'GB' },
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
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.personalInformation).not.toHaveProperty('spouseFirstName')
    }
  })
})

import { describe, expect, it } from 'vitest'
import { PersonUpdate } from './api/generated/models/personUpdate.zod'
import { validatePersonForm } from './person-form-validation'

describe('generated PersonUpdate Zod schema', () => {
  it('rejects an empty spouse name for a married person', () => {
    const result = PersonUpdate.safeParse({
      firstName: 'Ada',
      lastName: 'Lovelace',
      maritalStatus: 'married',
      spouseFirstName: '',
      spouseLastName: 'King-Noel',
      spouseEmail: 'william@example.com',
    })

    expect(result.success).toBe(false)
  })

  it('accepts an unmarried person without spouse names', () => {
    const result = PersonUpdate.safeParse({
      firstName: 'Ada',
      lastName: 'Lovelace',
      maritalStatus: 'single',
    })

    expect(result.success).toBe(true)
  })

  it('rejects an invalid spouse email for a married person', () => {
    const result = PersonUpdate.safeParse({
      firstName: 'Ada',
      lastName: 'Lovelace',
      maritalStatus: 'married',
      spouseFirstName: 'William',
      spouseLastName: 'King-Noel',
      spouseEmail: 'not-an-email',
    })

    expect(result.success).toBe(false)
  })

  it('translates generated Zod errors for the form', () => {
    const errors = validatePersonForm({
      value: {
        firstName: 'Ada',
        lastName: 'Lovelace',
        maritalStatus: 'married',
        spouseFirstName: 'William',
        spouseLastName: 'King-Noel',
        spouseEmail: 'not-an-email',
      },
    })

    expect(errors).toEqual({
      fields: { spouseEmail: 'Enter a valid email address for the spouse.' },
    })
  })

  it('reports a missing spouse email before its format', () => {
    const errors = validatePersonForm({
      value: {
        firstName: 'Ada',
        lastName: 'Lovelace',
        maritalStatus: 'married',
        spouseFirstName: 'William',
        spouseLastName: 'King-Noel',
        spouseEmail: '',
      },
    })

    expect(errors).toEqual({
      fields: { spouseEmail: 'Enter the spouse’s email address.' },
    })
  })

  it('currently strips spouse names instead of rejecting them for an unmarried person', () => {
    const result = PersonUpdate.safeParse({
      firstName: 'Ada',
      lastName: 'Lovelace',
      maritalStatus: 'single',
      spouseFirstName: 'William',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).not.toHaveProperty('spouseFirstName')
    }
  })
})

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.js'

let application = buildApp()

beforeEach(() => {
  application = buildApp()
})

afterEach(async () => {
  await application.close()
})

describe('PUT /people/:personId', () => {
  it('saves a married person when spouse names are present', async () => {
    const response = await application.inject({
      method: 'PUT',
      url: '/people/ada',
      payload: {
        firstName: 'Ada',
        lastName: 'Lovelace',
        maritalStatus: 'married',
        spouseFirstName: 'William',
        spouseLastName: 'King-Noel',
        spouseEmail: 'william@example.com',
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({ spouseFirstName: 'William' })
  })

  it('rejects a married person without spouse names', async () => {
    const response = await application.inject({
      method: 'PUT',
      url: '/people/ada',
      payload: { firstName: 'Ada', lastName: 'Lovelace', maritalStatus: 'married' },
    })

    expect(response.statusCode).toBe(400)
  })

  it('rejects a married person with an invalid spouse email', async () => {
    const response = await application.inject({
      method: 'PUT',
      url: '/people/ada',
      payload: {
        firstName: 'Ada',
        lastName: 'Lovelace',
        maritalStatus: 'married',
        spouseFirstName: 'William',
        spouseLastName: 'King-Noel',
        spouseEmail: 'not-an-email',
      },
    })

    expect(response.statusCode).toBe(400)
  })

  it('saves an unmarried person without spouse names', async () => {
    const response = await application.inject({
      method: 'PUT',
      url: '/people/ada',
      payload: { firstName: 'Ada', lastName: 'Lovelace', maritalStatus: 'single' },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({ maritalStatus: 'single' })
  })

  it('rejects spouse names for an unmarried person', async () => {
    const response = await application.inject({
      method: 'PUT',
      url: '/people/ada',
      payload: {
        firstName: 'Ada',
        lastName: 'Lovelace',
        maritalStatus: 'single',
        spouseFirstName: 'William',
      },
    })

    expect(response.statusCode).toBe(400)
  })
})

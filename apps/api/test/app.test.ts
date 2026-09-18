import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.js'
import { createInMemoryEmailGateway } from '../src/email.js'

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

  it('sends an invitation email when a married person is saved', async () => {
    const emailGateway = createInMemoryEmailGateway()
    application = buildApp(emailGateway)

    await application.inject({
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

    expect(emailGateway.sentEmails).toEqual([
      {
        to: 'william@example.com',
        subject: 'Welcome, William King-Noel',
        text: 'You have been invited to the Person API POC.',
      },
    ])
  })

  it('does not send an invitation email for an unmarried person', async () => {
    const emailGateway = createInMemoryEmailGateway()
    application = buildApp(emailGateway)

    await application.inject({
      method: 'PUT',
      url: '/people/ada',
      payload: { firstName: 'Ada', lastName: 'Lovelace', maritalStatus: 'single' },
    })

    expect(emailGateway.sentEmails).toEqual([])
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

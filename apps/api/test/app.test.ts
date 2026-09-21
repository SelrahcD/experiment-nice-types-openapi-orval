import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.js'
import { createInMemoryEmailGateway } from '../src/email.js'

let application = buildApp()

const address = {
  addressFirstLine: '12 St James Square',
  addressSecondLine: '',
  postCode: 'SW1Y 4LB',
  city: 'London',
  country: 'GB',
}

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

const marriedPerson = {
  personalInformation: {
    firstName: 'Ada',
    lastName: 'Lovelace',
    maritalStatus: 'married',
    spouseFirstName: 'William',
    spouseLastName: 'King-Noel',
    spouseEmail: 'william@example.com',
  },
  address,
  emergencyContacts,
}

const unmarriedPerson = {
  personalInformation: {
    firstName: 'Ada',
    lastName: 'Lovelace',
    maritalStatus: 'single',
  },
  address,
  emergencyContacts,
}

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
      payload: marriedPerson,
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      personalInformation: { spouseFirstName: 'William' },
      address,
    })
  })

  it('sends an invitation email when a married person is saved', async () => {
    const emailGateway = createInMemoryEmailGateway()
    application = buildApp(emailGateway)

    await application.inject({
      method: 'PUT',
      url: '/people/ada',
      payload: marriedPerson,
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
      payload: unmarriedPerson,
    })

    expect(emailGateway.sentEmails).toEqual([])
  })

  it('rejects a married person without spouse names', async () => {
    const response = await application.inject({
      method: 'PUT',
      url: '/people/ada',
      payload: {
        personalInformation: {
          firstName: 'Ada',
          lastName: 'Lovelace',
          maritalStatus: 'married',
        },
        address,
        emergencyContacts,
      },
    })

    expect(response.statusCode).toBe(400)
  })

  it('rejects a married person with an invalid spouse email', async () => {
    const response = await application.inject({
      method: 'PUT',
      url: '/people/ada',
      payload: {
        personalInformation: { ...marriedPerson.personalInformation, spouseEmail: 'not-an-email' },
        address,
        emergencyContacts,
      },
    })

    expect(response.statusCode).toBe(400)
  })

  it('saves an unmarried person without spouse names', async () => {
    const response = await application.inject({
      method: 'PUT',
      url: '/people/ada',
      payload: unmarriedPerson,
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      personalInformation: { maritalStatus: 'single' },
    })
  })

  it('saves a person who declines to share emergency contacts', async () => {
    const response = await application.inject({
      method: 'PUT',
      url: '/people/ada',
      payload: {
        ...unmarriedPerson,
        emergencyContacts: { status: 'declined' },
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      emergencyContacts: { status: 'declined' },
    })
  })

  it('rejects spouse names for an unmarried person', async () => {
    const response = await application.inject({
      method: 'PUT',
      url: '/people/ada',
      payload: {
        personalInformation: { ...unmarriedPerson.personalInformation, spouseFirstName: 'William' },
        address,
        emergencyContacts,
      },
    })

    expect(response.statusCode).toBe(400)
  })

  it('rejects emergency contacts without a primary contact', async () => {
    const response = await application.inject({
      method: 'PUT',
      url: '/people/ada',
      payload: {
        ...unmarriedPerson,
        emergencyContacts: {
          status: 'provided',
          alternativeEmergencyContacts: [],
        },
      },
    })

    expect(response.statusCode).toBe(400)
  })

  it('rejects a fourth emergency contact', async () => {
    const response = await application.inject({
      method: 'PUT',
      url: '/people/ada',
      payload: {
        ...unmarriedPerson,
        emergencyContacts: {
          status: 'provided',
          primaryEmergencyContact: emergencyContacts.primaryEmergencyContact,
          alternativeEmergencyContacts: [
            { name: 'Mary Somerville', relationship: 'Friend', phoneNumber: '+442079460002', email: '' },
            { name: 'George Boole', relationship: 'Friend', phoneNumber: '+442079460003', email: '' },
            { name: 'Mary Anning', relationship: 'Friend', phoneNumber: '+442079460004', email: '' },
          ],
        },
      },
    })

    expect(response.statusCode).toBe(400)
  })

  it('rejects an emergency contact with an invalid email address', async () => {
    const response = await application.inject({
      method: 'PUT',
      url: '/people/ada',
      payload: {
        ...unmarriedPerson,
        emergencyContacts: {
          status: 'provided',
          primaryEmergencyContact: {
            ...emergencyContacts.primaryEmergencyContact,
            email: 'not-an-email',
          },
          alternativeEmergencyContacts: [],
        },
      },
    })

    expect(response.statusCode).toBe(400)
  })

  it('rejects duplicate emergency contact phone numbers', async () => {
    const response = await application.inject({
      method: 'PUT',
      url: '/people/ada',
      payload: {
        ...unmarriedPerson,
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
          ],
        },
      },
    })

    expect(response.statusCode).toBe(400)
  })
})

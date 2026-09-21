import type { Person } from './person.js'

const initialPeople: ReadonlyMap<string, Person> = new Map([
  [
    'ada',
    {
      personalInformation: {
        firstName: 'Ada',
        lastName: 'Lovelace',
        maritalStatus: 'married',
        spouseFirstName: 'William',
        spouseLastName: 'King-Noel',
        spouseEmail: 'william@example.com',
      },
      address: {
        addressFirstLine: '12 St James Square',
        addressSecondLine: '',
        postCode: 'SW1Y 4LB',
        city: 'London',
        country: 'GB',
      },
      emergencyContacts: {
        status: 'provided',
        primaryEmergencyContact: {
          name: 'Charles Babbage',
          relationship: 'Friend',
          phoneNumber: '+442079460001',
          email: 'charles@example.com',
        },
        alternativeEmergencyContacts: [],
      },
    },
  ],
])

export type PeopleRepository = {
  replace(personId: string, person: Person): void
  has(personId: string): boolean
  get(personId: string): Person
}

export const createInMemoryPeopleRepository = (): PeopleRepository => {
  const people = new Map(
    [...initialPeople].map(([personId, person]) => [personId, structuredClone(person)]),
  )

  return {
    replace(personId, person) {
      people.set(personId, structuredClone(person))
    },
    has(personId) {
      return people.has(personId)
    },
    get(personId) {
      const person = people.get(personId)
      if (person === undefined) {
        throw new Error(`Person ${personId} is not stored`)
      }

      return structuredClone(person)
    },
  }
}

import type { PersonUpdate } from './api/generated/models/personUpdate.zod'

declare const person: PersonUpdate

if (person.maritalStatus === 'married') {
  const spouseFirstName: string = person.spouseFirstName
  void spouseFirstName
} else {
  // @ts-expect-error The generated union must not expose spouse data for unmarried people.
  person.spouseFirstName
}

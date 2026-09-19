import type { PersonUpdate } from './api/generated/models/personUpdate.zod'

declare const person: PersonUpdate

if (person.personalInformation.maritalStatus === 'married') {
  const spouseFirstName: string = person.personalInformation.spouseFirstName
  void spouseFirstName
} else {
  // @ts-expect-error The generated union must not expose spouse data for unmarried people.
  person.personalInformation.spouseFirstName
}

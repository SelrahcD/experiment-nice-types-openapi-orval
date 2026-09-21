import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { match } from 'ts-pattern'
import './app.css'
import type { PersonUpdate } from './api/generated/models/personUpdate.zod'
import { formatErrors } from './form-errors'
import { usePersonForm } from './person-form'
import type { PersonForm } from './person-form'

const unmarriedStatuses = ['single', 'divorced', 'widowed'] as const

const SpouseFields = ({ form }: { form: PersonForm }) => (
  <fieldset className="spouse-fields">
    <legend>Spouse details</legend>
    <form.Field name="personalInformation.spouseFirstName">
      {(field) => (
        <label className="field">
          Spouse first name
          <input
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
          />
          {field.state.meta.errors.length > 0 && <small>{formatErrors(field.state.meta.errors)}</small>}
        </label>
      )}
    </form.Field>
    <form.Field name="personalInformation.spouseLastName">
      {(field) => (
        <label className="field">
          Spouse last name
          <input
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
          />
          {field.state.meta.errors.length > 0 && <small>{formatErrors(field.state.meta.errors)}</small>}
        </label>
      )}
    </form.Field>
    <form.Field name="personalInformation.spouseEmail">
      {(field) => (
        <label className="field">
          Spouse email
          <input
            type="email"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
          />
          {field.state.meta.errors.length > 0 && <small>{formatErrors(field.state.meta.errors)}</small>}
        </label>
      )}
    </form.Field>
  </fieldset>
)

const createEmptyEmergencyContact = (): PersonUpdate['emergencyContacts']['primaryEmergencyContact'] => ({
  name: '',
  relationship: '',
  phoneNumber: '',
  email: '',
})

type EmergencyContactPath =
  | 'emergencyContacts.primaryEmergencyContact'
  | `emergencyContacts.alternativeEmergencyContacts[${number}]`

const EmergencyContactsFields = ({ form }: { form: PersonForm }) => (
  <form.Subscribe selector={(state) => state.values.emergencyContacts}>
    {(emergencyContacts) => (
      <fieldset>
        <legend>Emergency contacts</legend>
        <EmergencyContactCard
          form={form}
          title="Primary emergency contact"
          path="emergencyContacts.primaryEmergencyContact"
          isPrimary
          canRemove={false}
          onMakePrimary={() => undefined}
          onRemove={() => undefined}
        />
        {emergencyContacts.alternativeEmergencyContacts.map((contact, index) => (
          <EmergencyContactCard
            key={index}
            form={form}
            title={`Emergency contact ${index + 2}`}
            path={`emergencyContacts.alternativeEmergencyContacts[${index}]`}
            isPrimary={false}
            canRemove
            onMakePrimary={() =>
              form.setFieldValue('emergencyContacts', {
                primaryEmergencyContact: contact,
                alternativeEmergencyContacts: [
                  emergencyContacts.primaryEmergencyContact,
                  ...emergencyContacts.alternativeEmergencyContacts.filter(
                    (_, currentIndex) => currentIndex !== index,
                  ),
                ],
              })
            }
            onRemove={() =>
              form.setFieldValue('emergencyContacts.alternativeEmergencyContacts',
                emergencyContacts.alternativeEmergencyContacts.filter(
                  (_, currentIndex) => currentIndex !== index,
                ),
              )
            }
          />
        ))}
        <button
          type="button"
          className="add-contact-button"
          disabled={emergencyContacts.alternativeEmergencyContacts.length === 2}
          onClick={() =>
            form.setFieldValue('emergencyContacts.alternativeEmergencyContacts', [
              ...emergencyContacts.alternativeEmergencyContacts,
              createEmptyEmergencyContact(),
            ])
          }
        >
          Add emergency contact
        </button>
      </fieldset>
    )}
  </form.Subscribe>
)

const EmergencyContactCard = ({
  form,
  title,
  path,
  isPrimary,
  canRemove,
  onMakePrimary,
  onRemove,
}: {
  form: PersonForm
  title: string
  path: EmergencyContactPath
  isPrimary: boolean
  canRemove: boolean
  onMakePrimary: () => void
  onRemove: () => void
}) => (
  <fieldset className="spouse-fields">
    <legend>{title}</legend>
    <form.Field name={`${path}.name` as const}>
      {(field) => (
        <label className="field">
          Name
          <input value={field.state.value} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} />
          {field.state.meta.errors.length > 0 && <small>{formatErrors(field.state.meta.errors)}</small>}
        </label>
      )}
    </form.Field>
    <form.Field name={`${path}.relationship` as const}>
      {(field) => (
        <label className="field">
          Relationship
          <input value={field.state.value} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} />
        </label>
      )}
    </form.Field>
    <form.Field name={`${path}.phoneNumber` as const}>
      {(field) => (
        <label className="field">
          Phone number
          <input type="tel" value={field.state.value} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} />
          {field.state.meta.errors.length > 0 && <small>{formatErrors(field.state.meta.errors)}</small>}
        </label>
      )}
    </form.Field>
    <form.Field name={`${path}.email` as const}>
      {(field) => (
        <label className="field">
          Email
          <input type="email" value={field.state.value} onBlur={field.handleBlur} onChange={(event) => field.handleChange(event.target.value)} />
          {field.state.meta.errors.length > 0 && <small>{formatErrors(field.state.meta.errors)}</small>}
        </label>
      )}
    </form.Field>
    <label className="primary-toggle">
      <input type="checkbox" checked={isPrimary} disabled={isPrimary} onChange={onMakePrimary} />
      Set as primary emergency contact
    </label>
    {canRemove && <button type="button" className="remove-contact-button" onClick={onRemove}>Remove contact</button>}
  </fieldset>
)

const App = () => {
  const [result, setResult] = useState('')
  const form = usePersonForm(setResult)

  return (
    <main className="page">
      <section className="form-card">
        <h1>OpenAPI discriminated union POC</h1>
        <p className="form-introduction">
          Update personal information and address details.
        </p>
        <form
          className="person-form"
          onSubmit={(event) => {
            event.preventDefault()
            event.stopPropagation()
            void form.handleSubmit()
          }}
        >
        <fieldset>
          <legend>Personal information</legend>
          <form.Field name="personalInformation.firstName">
          {(field) => (
            <label className="field">
              First name
              <input
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
              {field.state.meta.errors.length > 0 && <small>{formatErrors(field.state.meta.errors)}</small>}
            </label>
          )}
          </form.Field>
          <form.Field name="personalInformation.lastName">
          {(field) => (
            <label className="field">
              Last name
              <input
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
              {field.state.meta.errors.length > 0 && <small>{formatErrors(field.state.meta.errors)}</small>}
            </label>
          )}
          </form.Field>
          <form.Field name="personalInformation.maritalStatus">
          {(field) => (
            <label className="field">
              Marital status
              <select
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) =>
                  field.handleChange(
                    event.target.value as PersonUpdate['personalInformation']['maritalStatus'],
                  )
                }
              >
                <option value="married">Married</option>
                {unmarriedStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              {field.state.meta.errors.length > 0 && <small>{formatErrors(field.state.meta.errors)}</small>}
            </label>
          )}
          </form.Field>
          <form.Subscribe
            selector={(state) => state.values.personalInformation.maritalStatus}
          >
          {(maritalStatus) =>
            match(maritalStatus)
              .with('married', () => <SpouseFields form={form} />)
              .with('single', 'divorced', 'widowed', () => null)
              .exhaustive()
          }
          </form.Subscribe>
        </fieldset>
        <fieldset>
          <legend>Address</legend>
          <form.Field name="address.addressFirstLine">
            {(field) => (
              <label className="field">
                Address line 1
                <input
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                {field.state.meta.errors.length > 0 && <small>{formatErrors(field.state.meta.errors)}</small>}
              </label>
            )}
          </form.Field>
          <form.Field name="address.addressSecondLine">
            {(field) => (
              <label className="field">
                Address line 2
                <input
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </label>
            )}
          </form.Field>
          <form.Field name="address.postCode">
            {(field) => (
              <label className="field">
                Postcode
                <input
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                {field.state.meta.errors.length > 0 && <small>{formatErrors(field.state.meta.errors)}</small>}
              </label>
            )}
          </form.Field>
          <form.Field name="address.city">
            {(field) => (
              <label className="field">
                City
                <input
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                {field.state.meta.errors.length > 0 && <small>{formatErrors(field.state.meta.errors)}</small>}
              </label>
            )}
          </form.Field>
          <form.Field name="address.country">
            {(field) => (
              <label className="field">
                Country
                <input
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
                {field.state.meta.errors.length > 0 && <small>{formatErrors(field.state.meta.errors)}</small>}
              </label>
            )}
          </form.Field>
        </fieldset>
        <EmergencyContactsFields form={form} />
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <button className="submit-button" type="submit" disabled={isSubmitting}>
              Save
            </button>
          )}
        </form.Subscribe>
      </form>

        <output className="form-result">{result}</output>
      </section>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(<App />)

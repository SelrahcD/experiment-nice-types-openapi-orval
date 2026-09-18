
export type Email = {
  to: string
  subject: string
  text: string
}

export type EmailGateway = {
  send: (email: Email) => void
}

export type Spouse = {
  firstName: string
  lastName: string
  email: string
}

export const createInMemoryEmailGateway = () => {
  const sentEmails: Email[] = []

  return {
    sentEmails,
    send: (email: Email) => {
      sentEmails.push(email)
    },
  }
}

export const sendEmail = (email: Email, emailGateway: EmailGateway) => {
  emailGateway.send(email)
}

export const sendSpouseInvitation = (spouse: Spouse, emailGateway: EmailGateway) =>
  sendEmail(
    {
      to: spouse.email,
      subject: `Welcome, ${spouse.firstName} ${spouse.lastName}`,
      text: 'You have been invited to the Person API POC.',
    },
    emailGateway,
  )

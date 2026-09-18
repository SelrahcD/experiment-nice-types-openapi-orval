export const formatErrors = (errors: unknown[]) =>
  errors
    .map((error) => {
      if (typeof error === 'string') return error
      if (error instanceof Error) return error.message
      return JSON.stringify(error)
    })
    .join(', ')

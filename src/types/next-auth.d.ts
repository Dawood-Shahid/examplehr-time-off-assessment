import type { DefaultSession } from 'next-auth'
import type { Role } from './hcm'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: Role
      locationIds: string[]
      title: string
    } & DefaultSession['user']
  }

  interface User {
    id: string
    role: Role
    locationIds: string[]
    title: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: Role
    locationIds: string[]
    title: string
  }
}

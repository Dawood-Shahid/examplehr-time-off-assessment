import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { MOCK_USERS } from '@/lib/mock-users'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const user = MOCK_USERS.find(
          (u) =>
            u.email === credentials?.email &&
            u.password === credentials?.password
        )
        if (!user) return null
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          locationIds: user.locationIds,
          title: user.title,
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.locationIds = user.locationIds
        token.title = user.title
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        session.user.role = token.role
        session.user.locationIds = token.locationIds
        session.user.title = token.title
      }
      return session
    },
  },
}

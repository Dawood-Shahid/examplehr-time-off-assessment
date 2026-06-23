import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = req.nextUrl

  const isAuthPage = pathname.startsWith('/login')
  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/request-time-off') ||
    pathname.startsWith('/my-requests') ||
    pathname.startsWith('/approvals')

  if (!token && isProtected) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  if (token && pathname.startsWith('/approvals') && token.role !== 'manager') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  if (
    token &&
    (pathname.startsWith('/request-time-off') ||
      pathname.startsWith('/my-requests')) &&
    token.role !== 'employee'
  ) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/request-time-off/:path*',
    '/my-requests/:path*',
    '/approvals/:path*',
    '/login',
  ],
}

'use client'

import { useSession } from 'next-auth/react'

type HeaderProps = {
  title: string
}

export function Header({ title }: HeaderProps) {
  const { data: session } = useSession()

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-5">
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
      {session?.user && (
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
            <p className="text-xs text-gray-500">{session.user.title}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
            {session.user.name?.charAt(0) ?? '?'}
          </div>
        </div>
      )}
    </header>
  )
}

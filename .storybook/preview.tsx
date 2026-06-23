import type { Preview } from '@storybook/react'
import React, { useState } from 'react'
import { initialize, mswLoader } from 'msw-storybook-addon'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '../src/app/globals.css'

initialize({ onUnhandledRequest: 'bypass' })

function StorybookQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, staleTime: 0 },
        },
      })
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

const preview: Preview = {
  loaders: [mswLoader],
  decorators: [
    (Story) => (
      <StorybookQueryProvider>
        <Story />
      </StorybookQueryProvider>
    ),
  ],
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
}

export default preview

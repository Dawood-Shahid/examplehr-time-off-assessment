import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { RequestForm } from '@/components/request/RequestForm'
import { useOptimisticStore } from '@/store/optimistic-store'
import { useReconciliationStore } from '@/store/reconciliation-store'
import { server, slowSubmitHandler } from './msw-server'

function renderForm() {
  useOptimisticStore.getState().clearMutations()
  useReconciliationStore.getState().clearAll()

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(RequestForm, { employeeId: 'emp-1', locationIds: ['NYC'] })
    )
  )
}

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => {
  server.resetHandlers()
  useOptimisticStore.getState().clearMutations()
  useReconciliationStore.getState().clearAll()
})
afterAll(() => server.close())

describe('RequestForm', () => {
  it('shows submitting state while request is in flight', async () => {
    server.use(slowSubmitHandler)
    const user = userEvent.setup()
    renderForm()

    await screen.findAllByText('12.0 Days')

    fireEvent.change(screen.getByLabelText(/start date/i), { target: { value: '2024-08-01' } })
    fireEvent.change(screen.getByLabelText(/end date/i), { target: { value: '2024-08-02' } })

    const submitBtn = screen.getByRole('button', { name: /submit request/i })
    expect(submitBtn).not.toBeDisabled()
    await user.click(submitBtn)

    expect(screen.getByText(/submitting your request/i)).toBeInTheDocument()
  })
})

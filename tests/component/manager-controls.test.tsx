import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { ManagerControls } from '@/components/manager/ManagerControls'
import { hcmClient } from '@/lib/hcm-client'

vi.mock('@/lib/hcm-client', () => ({
  hcmClient: {
    triggerAnniversary: vi.fn().mockResolvedValue({
      daysAvailable: 17,
      version: 2,
      updatedAt: new Date().toISOString(),
      key: 'emp-1:LON',
    }),
    triggerYearReset: vi
      .fn()
      .mockResolvedValue({ allocationDays: 20, updated: [] }),
    triggerReset: vi.fn().mockResolvedValue({ ok: true }),
  },
}))

function renderControls() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(ManagerControls)
    )
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})

describe('ManagerControls', () => {
  it('renders the three admin control sections', () => {
    renderControls()
    expect(screen.getByText('Anniversary Bonus')).toBeInTheDocument()
    expect(screen.getByText('Year-Start Reset')).toBeInTheDocument()
    expect(screen.getByText('Reset to Seed')).toBeInTheDocument()
  })

  it('scopes location options to the selected employee', async () => {
    const user = userEvent.setup()
    renderControls()

    // Default employee emp-1 has LON + NYC, not SYD.
    const locationSelect = screen.getByLabelText('Location')
    expect(within(locationSelect).queryByRole('option', { name: /Sydney/i })).toBeNull()

    // Switch to emp-2 (Bob) → locations become NYC + Sydney.
    await user.selectOptions(screen.getByLabelText('Employee'), 'emp-2')
    expect(
      within(locationSelect).getByRole('option', { name: /Sydney/i })
    ).toBeInTheDocument()
  })

  it('grants an anniversary bonus and shows confirmation', async () => {
    const user = userEvent.setup()
    renderControls()

    await user.click(screen.getByRole('button', { name: /grant bonus/i }))

    expect(hcmClient.triggerAnniversary).toHaveBeenCalledWith('emp-1', 'LON', 5)
    expect(await screen.findByText(/\+5 days granted/i)).toBeInTheDocument()
  })

  it('runs a year-start reset with the entered allocation', async () => {
    const user = userEvent.setup()
    renderControls()

    const allocation = screen.getByLabelText(/allocation days/i)
    await user.clear(allocation)
    await user.type(allocation, '25')
    await user.click(screen.getByRole('button', { name: /reset all to allocation/i }))

    expect(hcmClient.triggerYearReset).toHaveBeenCalledWith(25)
    expect(await screen.findByText(/all balances set to 25 days/i)).toBeInTheDocument()
  })

  it('resets the store to seed data', async () => {
    const user = userEvent.setup()
    renderControls()

    await user.click(screen.getByRole('button', { name: /reset store/i }))

    expect(hcmClient.triggerReset).toHaveBeenCalled()
    expect(await screen.findByText(/store reset to seed data/i)).toBeInTheDocument()
  })

  it('surfaces an error when the trigger is rejected', async () => {
    ;(hcmClient.triggerReset as ReturnType<typeof vi.fn>).mockRejectedValueOnce({
      error: 'not_found',
    })
    const user = userEvent.setup()
    renderControls()

    await user.click(screen.getByRole('button', { name: /reset store/i }))

    expect(await screen.findByText(/hcm rejected the request/i)).toBeInTheDocument()
  })
})

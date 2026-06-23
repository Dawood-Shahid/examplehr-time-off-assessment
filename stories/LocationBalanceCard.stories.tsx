import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within } from '@storybook/test'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import {
  LocationBalanceCard,
  LocationBalanceCardSkeleton,
} from '@/components/balance/LocationBalanceCard'
import { useReconciliationStore } from '@/store/reconciliation-store'
import { useOptimisticStore } from '@/store/optimistic-store'
import type { BalanceCell } from '@/types/hcm'

const baseBalance: BalanceCell = {
  employeeId: 'emp-1',
  locationId: 'NYC',
  locationName: 'New York',
  daysAvailable: 12,
  version: 1,
  updatedAt: new Date().toISOString(),
}

const meta: Meta<typeof LocationBalanceCard> = {
  title: 'Balance/LocationBalanceCard',
  component: LocationBalanceCard,
  decorators: [
    (Story) => {
      useReconciliationStore.getState().clearAll()
      useOptimisticStore.getState().clearMutations()
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })
      return (
        <QueryClientProvider client={queryClient}>
          <Story />
        </QueryClientProvider>
      )
    },
  ],
}

export default meta
type Story = StoryObj<typeof LocationBalanceCard>

export const Default: Story = {
  args: { balance: baseBalance },
}

export const Loading: Story = {
  render: () => <LocationBalanceCardSkeleton />,
}

export const Stale: Story = {
  args: {
    balance: {
      ...baseBalance,
      updatedAt: new Date(Date.now() - 120_000).toISOString(),
    },
  },
}

export const Refreshing: Story = {
  args: { balance: baseBalance, isFetching: true },
}

export const OptimisticPending: Story = {
  args: {
    balance: { ...baseBalance, daysAvailable: 9, reconciliationPending: true },
  },
}

export const OptimisticRolledBack: Story = {
  args: { balance: baseBalance },
}

export const OptimisticConfirmed: Story = {
  render: function ConfirmedStory() {
    useOptimisticStore.getState().addMutation({
      id: 'mut-confirmed',
      employeeId: 'emp-1',
      locationId: 'NYC',
      delta: -3,
      status: 'confirmed',
      submittedAt: Date.now(),
      snapshotVersion: 1,
      serverRequestId: 'req-123',
    })
    return (
      <LocationBalanceCard
        balance={{ ...baseBalance, daysAvailable: 9 }}
      />
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('9.0')).toBeInTheDocument()
    await expect(canvas.getByText('Pending approval')).toBeInTheDocument()
  },
}

export const AnniversaryBonusApplied: Story = {
  render: function AnniversaryStory() {
    useReconciliationStore.getState().setEntry({
      employeeId: 'emp-1',
      locationId: 'NYC',
      previousBalance: { daysAvailable: 12, version: 1, updatedAt: baseBalance.updatedAt },
      incomingBalance: { daysAvailable: 17, version: 2, updatedAt: new Date().toISOString() },
      mode: 'bonus_only',
      acknowledged: false,
    })
    return (
      <LocationBalanceCard
        balance={{ ...baseBalance, daysAvailable: 17, version: 2 }}
      />
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('12.0')).toBeInTheDocument()
    await expect(canvas.getByText('Balance updated')).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Review updated balance' })).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: 'Review updated balance' }))
    await expect(canvas.getByText('17.0')).toBeInTheDocument()
  },
}

export const AnniversaryBonusDuringMutation: Story = {
  render: function MutationStory() {
    useOptimisticStore.getState().addMutation({
      id: 'mut-1',
      employeeId: 'emp-1',
      locationId: 'NYC',
      delta: -2,
      status: 'pending',
      submittedAt: Date.now(),
      snapshotVersion: 1,
    })
    useReconciliationStore.getState().setEntry({
      employeeId: 'emp-1',
      locationId: 'NYC',
      previousBalance: { daysAvailable: 10, version: 1, updatedAt: baseBalance.updatedAt },
      incomingBalance: { daysAvailable: 17, version: 2, updatedAt: new Date().toISOString() },
      mode: 'held_during_mutation',
      acknowledged: false,
    })
    return (
      <LocationBalanceCard
        balance={{ ...baseBalance, daysAvailable: 17, version: 2, reconciliationPending: true }}
      />
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('10.0')).toBeInTheDocument()
    await expect(canvas.getByText('Balance updated — tap to review')).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: 'Review updated balance' }))
    await expect(canvas.getByText('15.0')).toBeInTheDocument()
  },
}

export const ConflictWithPendingMutation: Story = {
  args: {
    balance: { ...baseBalance, daysAvailable: 15, reconciliationPending: true },
  },
}

export const HcmUnavailable: Story = {
  args: { balance: baseBalance, isError: true },
}

export const AnniversaryBonusLiveRefetch: Story = {
  render: () => <LocationBalanceCard balance={baseBalance} />,
  parameters: {
    msw: {
      handlers: [
        http.get('/api/hcm/balance/emp-1/NYC', () =>
          HttpResponse.json({
            daysAvailable: 17,
            version: 2,
            updatedAt: new Date().toISOString(),
          })
        ),
      ],
    },
  },
}

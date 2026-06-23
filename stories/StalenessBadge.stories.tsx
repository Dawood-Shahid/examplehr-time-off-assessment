import type { Meta, StoryObj } from '@storybook/react'
import { StalenessBadge } from '@/components/balance/StalenessBadge'
import { BalanceDisplay } from '@/components/balance/BalanceDisplay'
import type { BalanceDisplayState } from '@/lib/balance-state'

const meta: Meta = {
  title: 'Balance/StalenessBadge',
}

export default meta
type Story = StoryObj

const staleUpdatedAt = new Date(Date.now() - 120_000).toISOString()

export const Fresh: Story = {
  render: () => <StalenessBadge state="fresh" />,
}

export const Stale: Story = {
  render: () => <StalenessBadge state="stale" updatedAt={staleUpdatedAt} />,
}

export const Refreshing: Story = {
  render: () => <StalenessBadge state="refreshing" />,
}

export const OptimisticPending: Story = {
  render: () => <StalenessBadge state="optimistic-pending" />,
}

export const OptimisticConfirmed: Story = {
  render: () => <StalenessBadge state="optimistic-confirmed" />,
}

export const OptimisticRolledBack: Story = {
  render: () => <StalenessBadge state="optimistic-rolled-back" />,
}

export const Unconfirmed: Story = {
  render: () => <StalenessBadge state="unconfirmed" />,
}

export const ReconciliationPending: Story = {
  render: () => <StalenessBadge state="reconciliation-pending" />,
}

export const BalanceRefreshed: Story = {
  render: () => <StalenessBadge state="balance-refreshed" />,
}

export const HcmUnavailable: Story = {
  render: () => <StalenessBadge state="hcm-unavailable" />,
}

export const AllStates: Story = {
  render: () => {
    const states: BalanceDisplayState[] = [
      'fresh',
      'stale',
      'refreshing',
      'optimistic-pending',
      'optimistic-confirmed',
      'optimistic-rolled-back',
      'unconfirmed',
      'reconciliation-pending',
      'balance-refreshed',
      'hcm-unavailable',
    ]
    return (
      <div className="flex flex-wrap gap-2">
        {states.map((state) => (
          <StalenessBadge
            key={state}
            state={state}
            updatedAt={state === 'stale' ? staleUpdatedAt : undefined}
          />
        ))}
      </div>
    )
  },
}

export const BalanceDisplayDefault: Story = {
  render: () => (
    <BalanceDisplay
      daysAvailable={22.5}
      state="fresh"
      updatedAt={new Date().toISOString()}
      label="Annual Leave"
      showProgress
    />
  ),
}

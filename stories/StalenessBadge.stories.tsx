import type { Meta, StoryObj } from '@storybook/react'
import { StalenessBadge } from '@/components/balance/StalenessBadge'
import { BalanceDisplay } from '@/components/balance/BalanceDisplay'

const meta: Meta = {
  title: 'Balance/StalenessBadge',
}

export default meta
type Story = StoryObj

export const Fresh: Story = {
  render: () => <StalenessBadge state="fresh" />,
}

export const Stale: Story = {
  render: () => (
    <StalenessBadge
      state="stale"
      updatedAt={new Date(Date.now() - 120_000).toISOString()}
    />
  ),
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

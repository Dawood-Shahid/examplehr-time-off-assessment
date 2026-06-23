import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within, waitFor } from '@storybook/test'
import { ManagerControls } from '@/components/manager/ManagerControls'
import {
  triggerAnniversaryHandler,
  triggerYearResetHandler,
  triggerResetHandler,
  triggerNotFoundHandler,
} from '@/mocks/handlers'

const successHandlers = [
  triggerAnniversaryHandler,
  triggerYearResetHandler,
  triggerResetHandler,
]

const meta: Meta<typeof ManagerControls> = {
  title: 'Manager/ManagerControls',
  component: ManagerControls,
  parameters: {
    layout: 'padded',
    msw: { handlers: successHandlers },
  },
}

export default meta
type Story = StoryObj<typeof ManagerControls>

export const Default: Story = {}

export const GrantBonus: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /grant bonus/i }))
    await waitFor(() =>
      expect(canvas.getByText(/\+5 days granted/i)).toBeInTheDocument()
    )
  },
}

export const YearReset: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole('button', { name: /reset all to allocation/i })
    )
    await waitFor(() =>
      expect(canvas.getByText(/all balances set to 20 days/i)).toBeInTheDocument()
    )
  },
}

export const ResetStore: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /reset store/i }))
    await waitFor(() =>
      expect(canvas.getByText(/store reset to seed data/i)).toBeInTheDocument()
    )
  },
}

export const TriggerError: Story = {
  parameters: { msw: { handlers: [triggerNotFoundHandler] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /grant bonus/i }))
    await waitFor(() =>
      expect(canvas.getByText(/hcm rejected the request/i)).toBeInTheDocument()
    )
  },
}

import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within, waitFor } from '@storybook/test'
import { RequestForm } from '@/components/request/RequestForm'
import { OptimisticFeedback } from '@/components/request/OptimisticFeedback'
import { balanceHandler, submitSuccessHandler, submitInsufficientHandler } from '@/mocks/handlers'
import { useOptimisticStore } from '@/store/optimistic-store'
import { useReconciliationStore } from '@/store/reconciliation-store'

const meta: Meta<typeof RequestForm> = {
  title: 'Request/RequestForm',
  component: RequestForm,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => {
      useOptimisticStore.getState().clearMutations()
      useReconciliationStore.getState().clearAll()
      return <Story />
    },
  ],
}

export default meta
type Story = StoryObj<typeof RequestForm>

export const Default: Story = {
  args: { employeeId: 'emp-1', locationIds: ['LON', 'NYC'] },
  parameters: { msw: { handlers: [balanceHandler] } },
}

export const Submitting: Story = {
  render: () => <OptimisticFeedback isPending />,
}

export const SubmittedPendingApproval: Story = {
  render: () => <OptimisticFeedback isSuccess />,
}

export const HcmRejectedInsufficientBalance: Story = {
  render: () => <OptimisticFeedback error="insufficient_balance" />,
}

export const HcmRejectedInvalidDimension: Story = {
  render: () => <OptimisticFeedback error="hcm_conflict" />,
}

export const SilentFailureDetected: Story = {
  render: () => <OptimisticFeedback isUnconfirmed />,
}

export const NetworkTimeout: Story = {
  render: () => <OptimisticFeedback isTimeout />,
}

export const FormWithHandlers: Story = {
  args: { employeeId: 'emp-1', locationIds: ['LON', 'NYC'] },
  parameters: {
    msw: { handlers: [balanceHandler, submitSuccessHandler] },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.selectOptions(canvas.getByLabelText(/work location/i), 'NYC')
    await userEvent.type(canvas.getByLabelText(/start date/i), '2024-08-01')
    await userEvent.type(canvas.getByLabelText(/end date/i), '2024-08-02')
    await userEvent.click(canvas.getByRole('button', { name: /submit request/i }))

    await waitFor(
      () =>
        expect(
          canvas.getByText(/submitting your request|pending manager approval/i)
        ).toBeInTheDocument(),
      { timeout: 5000 }
    )
  },
}

export const FormInsufficientBalance: Story = {
  args: { employeeId: 'emp-1', locationIds: ['LON', 'NYC'] },
  parameters: {
    msw: { handlers: [balanceHandler, submitInsufficientHandler] },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.selectOptions(canvas.getByLabelText(/work location/i), 'NYC')
    await userEvent.clear(canvas.getByLabelText(/start date/i))
    await userEvent.type(canvas.getByLabelText(/start date/i), '2024-09-01')
    await userEvent.clear(canvas.getByLabelText(/end date/i))
    await userEvent.type(canvas.getByLabelText(/end date/i), '2024-09-05')
    await userEvent.click(canvas.getByRole('button', { name: /submit request/i }))

    await waitFor(
      () =>
        expect(
          canvas.getByText(/insufficient balance for this request/i)
        ).toBeInTheDocument(),
      { timeout: 5000 }
    )
  },
}
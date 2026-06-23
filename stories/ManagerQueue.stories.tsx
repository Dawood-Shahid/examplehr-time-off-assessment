import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within } from '@storybook/test'
import { ManagerQueue } from '@/components/manager/ManagerQueue'
import { PendingRequestRow } from '@/components/manager/PendingRequestRow'
import { pendingRequestsHandler, emptyPendingHandler, balanceHandler } from '@/mocks/handlers'
import type { HcmRequest } from '@/types/hcm'

const sampleRequest: HcmRequest = {
  id: 'req-1',
  employeeId: 'emp-2',
  employeeName: 'Sarah Palmer',
  employeeTitle: 'Frontend Developer',
  locationId: 'NYC',
  locationName: 'New York',
  leaveType: 'annual',
  daysRequested: 3,
  startDate: '2024-06-12',
  endDate: '2024-06-14',
  status: 'pending',
  createdAt: new Date().toISOString(),
}

const meta: Meta<typeof ManagerQueue> = {
  title: 'Manager/ManagerQueue',
  component: ManagerQueue,
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof ManagerQueue>

export const Empty: Story = {
  parameters: { msw: { handlers: [emptyPendingHandler] } },
}

export const WithPendingRequests: Story = {
  parameters: { msw: { handlers: [pendingRequestsHandler, balanceHandler] } },
}

export const BalanceSnapshotStale: Story = {
  render: () => <PendingRequestRow request={sampleRequest} />,
  parameters: { msw: { handlers: [balanceHandler] } },
}

export const ApprovalInFlight: Story = {
  render: () => <PendingRequestRow request={sampleRequest} />,
  parameters: { msw: { handlers: [balanceHandler] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const approve = canvas.getByRole('button', { name: /approve/i })
    await userEvent.click(approve)
    await expect(
      canvas.getByText(/approving|action failed/i)
    ).toBeInTheDocument()
  },
}

export const DenialInFlight: Story = {
  render: () => <PendingRequestRow request={sampleRequest} />,
  parameters: { msw: { handlers: [balanceHandler] } },
}

export const HcmRejectedOnApproval: Story = {
  render: () => <PendingRequestRow request={sampleRequest} />,
  parameters: { msw: { handlers: [balanceHandler] } },
}
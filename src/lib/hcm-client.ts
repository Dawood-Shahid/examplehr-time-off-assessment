import type {
  Balance,
  BalancesResponse,
  HcmError,
  HcmRequest,
  SubmitRequestInput,
  SubmitRequestResult,
  UpdateRequestInput,
} from '@/types/hcm'

async function parseError(res: Response): Promise<HcmError> {
  try {
    return (await res.json()) as HcmError
  } catch {
    return { error: 'timeout', message: 'Unknown error' }
  }
}

export const hcmClient = {
  async getBalance(employeeId: string, locationId: string): Promise<Balance> {
    const res = await fetch(`/api/hcm/balance/${employeeId}/${locationId}`)
    if (!res.ok) throw await parseError(res)
    return res.json()
  },

  async getBalances(): Promise<BalancesResponse> {
    const res = await fetch('/api/hcm/balances')
    if (!res.ok) throw await parseError(res)
    return res.json()
  },

  async getRequests(employeeId?: string): Promise<HcmRequest[]> {
    const url = employeeId
      ? `/api/hcm/requests?employeeId=${employeeId}`
      : '/api/hcm/requests'
    const res = await fetch(url)
    if (!res.ok) throw await parseError(res)
    return res.json()
  },

  async getPendingRequests(): Promise<HcmRequest[]> {
    const res = await fetch('/api/hcm/requests/pending')
    if (!res.ok) throw await parseError(res)
    return res.json()
  },

  async getApprovalHistory(): Promise<HcmRequest[]> {
    const res = await fetch('/api/hcm/requests/history')
    if (!res.ok) throw await parseError(res)
    return res.json()
  },

  async submitRequest(input: SubmitRequestInput): Promise<SubmitRequestResult> {
    const res = await fetch('/api/hcm/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!res.ok) throw await parseError(res)
    return res.json()
  },

  async updateRequest(input: UpdateRequestInput): Promise<HcmRequest> {
    const res = await fetch(`/api/hcm/request/${input.requestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: input.action }),
    })
    if (!res.ok) throw await parseError(res)
    return res.json()
  },

  async triggerAnniversary(
    employeeId: string,
    locationId: string,
    bonusDays = 5
  ): Promise<Balance & { key: string }> {
    const res = await fetch('/api/hcm/trigger/anniversary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, locationId, bonusDays }),
    })
    if (!res.ok) throw await parseError(res)
    return res.json()
  },

  async triggerYearReset(
    allocationDays = 20
  ): Promise<{ allocationDays: number; updated: Array<{ key: string; daysAvailable: number; version: number }> }> {
    const res = await fetch('/api/hcm/trigger/year-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allocationDays }),
    })
    if (!res.ok) throw await parseError(res)
    return res.json()
  },

  async triggerReset(): Promise<{ ok: boolean }> {
    const res = await fetch('/api/hcm/trigger/reset', { method: 'POST' })
    if (!res.ok) throw await parseError(res)
    return res.json()
  },
}

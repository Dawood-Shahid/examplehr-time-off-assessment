import { http, HttpResponse } from 'msw'

export const mockBalance = {
  daysAvailable: 12,
  version: 1,
  updatedAt: new Date().toISOString(),
}

export const balanceHandler = http.get('/api/hcm/balance/:emp/:loc', () =>
  HttpResponse.json(mockBalance)
)

export const balanceHandlerOptimistic = http.get(
  '/api/hcm/balance/:emp/:loc',
  () => HttpResponse.json({ daysAvailable: 9, version: 2, updatedAt: new Date().toISOString() })
)

export const submitSuccessHandler = http.post('/api/hcm/request', () =>
  HttpResponse.json({ requestId: 'req-1', status: 'created' }, { status: 201 })
)

export const submitInsufficientHandler = http.post('/api/hcm/request', () =>
  HttpResponse.json({ error: 'insufficient_balance' }, { status: 409 })
)

export const submitSilentFailHandler = http.post('/api/hcm/request', () =>
  HttpResponse.json({ requestId: 'req-silent', status: 'created' }, { status: 201 })
)

export const pendingRequestsHandler = http.get('/api/hcm/requests/pending', () =>
  HttpResponse.json([
    {
      id: 'req-1',
      employeeId: 'emp-2',
      employeeName: 'Bob Smith',
      employeeTitle: 'Frontend Developer',
      locationId: 'NYC',
      locationName: 'New York',
      leaveType: 'annual',
      daysRequested: 3,
      startDate: '2024-06-12',
      endDate: '2024-06-14',
      status: 'pending',
      createdAt: new Date().toISOString(),
    },
  ])
)

export const emptyPendingHandler = http.get('/api/hcm/requests/pending', () =>
  HttpResponse.json([])
)

export const triggerAnniversaryHandler = http.post(
  '/api/hcm/trigger/anniversary',
  async ({ request }) => {
    const body = (await request.json()) as {
      employeeId: string
      locationId: string
      bonusDays?: number
    }
    return HttpResponse.json({
      daysAvailable: 12 + (body.bonusDays ?? 5),
      version: 2,
      updatedAt: new Date().toISOString(),
      key: `${body.employeeId}:${body.locationId}`,
    })
  }
)

export const triggerYearResetHandler = http.post(
  '/api/hcm/trigger/year-reset',
  async ({ request }) => {
    const body = (await request.json()) as { allocationDays?: number }
    return HttpResponse.json({
      allocationDays: body.allocationDays ?? 20,
      updated: [],
    })
  }
)

export const triggerResetHandler = http.post('/api/hcm/trigger/reset', () =>
  HttpResponse.json({ ok: true })
)

export const triggerNotFoundHandler = http.post(
  '/api/hcm/trigger/anniversary',
  () => HttpResponse.json({ error: 'not_found' }, { status: 404 })
)

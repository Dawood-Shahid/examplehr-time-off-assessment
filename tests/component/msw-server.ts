import { setupServer } from 'msw/node'
import {
  balanceHandler,
  submitInsufficientHandler,
  submitSuccessHandler,
} from '@/mocks/handlers'
import { http, HttpResponse, delay } from 'msw'

export const server = setupServer(balanceHandler, submitSuccessHandler)

export const slowSubmitHandler = http.post('/api/hcm/request', async () => {
  await delay(500)
  return HttpResponse.json({ requestId: 'req-slow', status: 'created' }, { status: 201 })
})

export { submitInsufficientHandler }

import { http, HttpResponse, delay } from 'msw'
import { mockEvents, MOCK_ACCESS_TOKEN } from '../data'
import { lockedInventory, reservationsDb, sessionOrders } from '../data/store'
import type { CompleteOrderPayload } from '~/types'

function isAuthorized(request: Request): boolean {
  return request.headers.get('Authorization') === `Bearer ${MOCK_ACCESS_TOKEN}`
}

const MOCK_DELAY = 800

export const ordersHandlers = [
  http.get('/api/orders', async ({ request }) => {
    await delay(MOCK_DELAY)
    if (!isAuthorized(request)) {
      return HttpResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }
    return HttpResponse.json({ success: true, data: sessionOrders })
  }),

  http.get('/api/orders/:id', async ({ request, params }) => {
    await delay(MOCK_DELAY)
    if (!isAuthorized(request)) {
      return HttpResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }
    const order = sessionOrders.find(o => o.id === params.id)
    if (!order) {
      return HttpResponse.json({ success: false, message: '找不到訂單' }, { status: 404 })
    }
    return HttpResponse.json({ success: true, data: order })
  }),

  http.post('/api/orders', async ({ request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as CompleteOrderPayload
    const reservation = reservationsDb.get(body.reservationId)

    if (!reservation) {
      return HttpResponse.json({ success: false, message: '找不到預約' }, { status: 404 })
    }

    if (reservation.status !== 'pending_payment') {
      return HttpResponse.json({ success: false, message: '預約狀態不允許結帳' }, { status: 409 })
    }

    if (new Date() > new Date(reservation.expiresAt)) {
      reservation.status = 'expired'
      const expiredOrder = sessionOrders.find(o => o.reservationId === reservation.id)
      if (expiredOrder) expiredOrder.status = 'cancelled'
      return HttpResponse.json({ success: false, message: '預約已逾時' }, { status: 410 })
    }

    // Convert inventory lock to permanent sale
    const event = mockEvents.find(e => e.id === reservation.eventId)
    const ticket = event?.tickets.find(t => t.id === reservation.ticketId)
    if (ticket) {
      ticket.available = Math.max(0, ticket.available - reservation.quantity)
    }
    const locked = lockedInventory.get(reservation.ticketId) ?? 0
    lockedInventory.set(reservation.ticketId, Math.max(0, locked - reservation.quantity))

    const order = sessionOrders.find(o => o.reservationId === reservation.id)
    if (!order) {
      return HttpResponse.json({ success: false, message: '找不到訂單' }, { status: 404 })
    }

    order.status = 'confirmed'
    reservationsDb.delete(body.reservationId)

    return HttpResponse.json({ success: true, data: order })
  }),
]

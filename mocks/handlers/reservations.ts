import { http, HttpResponse } from 'msw'
import { mockEvents, MOCK_ACCESS_TOKEN } from '../data'
import { reservationsDb, lockedInventory, sessionOrders } from '../data/store'
import type { CreateReservationPayload, Reservation, UpdateReservationSeatsPayload } from '~/types'

function isAuthorized(request: Request): boolean {
  return request.headers.get('Authorization') === `Bearer ${MOCK_ACCESS_TOKEN}`
}

export function releaseInventoryLock(ticketId: string, quantity: number): void {
  const current = lockedInventory.get(ticketId) ?? 0
  lockedInventory.set(ticketId, Math.max(0, current - quantity))
}

// Returns true if the reservation was just expired
export function checkAndAutoExpire(reservation: Reservation): boolean {
  if (
    (reservation.status === 'pending_seats' || reservation.status === 'pending_payment') &&
    new Date() > new Date(reservation.expiresAt)
  ) {
    reservation.status = 'expired'
    releaseInventoryLock(reservation.ticketId, reservation.quantity)
    const order = sessionOrders.find(o => o.reservationId === reservation.id)
    if (order) order.status = 'cancelled'
    return true
  }
  return false
}

export const reservationsHandlers = [
  http.post('/api/reservations', async ({ request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as CreateReservationPayload
    const event = mockEvents.find(e => e.id === body.eventId)
    if (!event) {
      return HttpResponse.json({ success: false, message: '找不到活動' }, { status: 404 })
    }

    const ticket = event.tickets.find(t => t.id === body.ticketId)
    if (!ticket) {
      return HttpResponse.json({ success: false, message: '找不到票種' }, { status: 404 })
    }

    const locked = lockedInventory.get(body.ticketId) ?? 0
    if (ticket.available - locked < body.quantity) {
      return HttpResponse.json({ success: false, message: 'sold_out' }, { status: 409 })
    }

    lockedInventory.set(body.ticketId, locked + body.quantity)

    const now = new Date()
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString()
    const reservationId = `rsv-${now.getTime()}`
    const orderId = `order-${now.getTime()}`

    const reservation: Reservation = {
      id: reservationId,
      userId: 'user-1',
      eventId: body.eventId,
      ticketId: body.ticketId,
      quantity: body.quantity,
      status: 'pending_seats',
      expiresAt,
      selectedSeats: [],
      createdAt: now.toISOString(),
    }

    reservationsDb.set(reservationId, reservation)

    sessionOrders.push({
      id: orderId,
      userId: 'user-1',
      eventId: body.eventId,
      event: {
        id: event.id,
        title: event.title,
        date: event.date,
        venue: event.venue,
        city: event.city,
        coverImage: event.coverImage,
      },
      items: [
        {
          ticketId: body.ticketId,
          ticketType: ticket.type,
          quantity: body.quantity,
          unitPrice: ticket.price,
        },
      ],
      total: ticket.price * body.quantity,
      status: 'pending_seats',
      reservationId,
      createdAt: now.toISOString(),
    })

    return HttpResponse.json(
      { success: true, data: { reservation, eventSlug: event.slug } },
      { status: 201 },
    )
  }),

  http.get('/api/reservations/:id', ({ request, params }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const reservation = reservationsDb.get(params.id as string)
    if (!reservation) {
      return HttpResponse.json({ success: false, message: '找不到預約' }, { status: 404 })
    }

    checkAndAutoExpire(reservation)

    const remainingSeconds = Math.max(
      0,
      Math.floor((new Date(reservation.expiresAt).getTime() - Date.now()) / 1000),
    )

    return HttpResponse.json({ success: true, data: { ...reservation, remainingSeconds } })
  }),

  http.patch('/api/reservations/:id/seats', async ({ request, params }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const reservation = reservationsDb.get(params.id as string)
    if (!reservation) {
      return HttpResponse.json({ success: false, message: '找不到預約' }, { status: 404 })
    }

    if (checkAndAutoExpire(reservation)) {
      return HttpResponse.json({ success: false, message: '預約已逾時' }, { status: 410 })
    }

    if (reservation.status !== 'pending_seats') {
      return HttpResponse.json({ success: false, message: '預約狀態不允許此操作' }, { status: 409 })
    }

    const body = (await request.json()) as UpdateReservationSeatsPayload
    reservation.selectedSeats = body.selectedSeats
    reservation.status = 'pending_payment'

    const order = sessionOrders.find(o => o.reservationId === reservation.id)
    if (order) order.status = 'pending_payment'

    return HttpResponse.json({ success: true, data: reservation })
  }),

  http.delete('/api/reservations/:id', ({ request, params }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const reservation = reservationsDb.get(params.id as string)
    if (!reservation) {
      return HttpResponse.json({ success: false, message: '找不到預約' }, { status: 404 })
    }

    if (reservation.status === 'pending_seats' || reservation.status === 'pending_payment') {
      releaseInventoryLock(reservation.ticketId, reservation.quantity)
    }

    reservation.status = 'cancelled'

    const order = sessionOrders.find(o => o.reservationId === reservation.id)
    if (order) order.status = 'cancelled'

    return HttpResponse.json({ success: true, data: null })
  }),
]

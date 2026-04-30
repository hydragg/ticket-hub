import { http, HttpResponse } from 'msw'
import { mockOrders, mockEvents, MOCK_ACCESS_TOKEN } from '../data'
import type { Order, CreateOrderPayload } from '~/types'

function isAuthorized(request: Request): boolean {
  return request.headers.get('Authorization') === `Bearer ${MOCK_ACCESS_TOKEN}`
}

// In-memory store for orders created during the session
const sessionOrders: Order[] = [...mockOrders]

export const ordersHandlers = [
  http.get('/api/orders', ({ request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }
    return HttpResponse.json({ success: true, data: sessionOrders })
  }),

  http.get('/api/orders/:id', ({ request, params }) => {
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

    const body = await request.json() as CreateOrderPayload
    const event = mockEvents.find(e => e.id === body.eventId)
    if (!event) {
      return HttpResponse.json({ success: false, message: '找不到活動' }, { status: 404 })
    }

    const items = body.items.map((item) => {
      const ticket = event.tickets.find(t => t.id === item.ticketId)
      return {
        ticketId: item.ticketId,
        ticketType: ticket?.type ?? '',
        quantity: item.quantity,
        unitPrice: ticket?.price ?? 0,
      }
    })

    const total = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)

    const newOrder: Order = {
      id: `order-${Date.now()}`,
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
      items,
      total,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    }

    sessionOrders.push(newOrder)
    return HttpResponse.json({ success: true, data: newOrder }, { status: 201 })
  }),
]

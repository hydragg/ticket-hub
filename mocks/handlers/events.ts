import { http, HttpResponse } from 'msw'
import { mockEvents } from '../data'
import type { EventCategory } from '~/types'

export const eventsHandlers = [
  http.get('/api/events', ({ request }) => {
    const url = new URL(request.url)
    const category = url.searchParams.get('category') as EventCategory | null
    const city = url.searchParams.get('city')
    const page = Number(url.searchParams.get('page') ?? '1')
    const pageSize = Number(url.searchParams.get('pageSize') ?? '6')

    let filtered = [...mockEvents]

    if (category) {
      filtered = filtered.filter(e => e.category === category)
    }
    if (city) {
      filtered = filtered.filter(e => e.city === city)
    }

    const total = filtered.length
    const start = (page - 1) * pageSize
    const data = filtered.slice(start, start + pageSize)

    return HttpResponse.json({
      success: true,
      data,
      total,
      page,
      pageSize,
    })
  }),

  http.get('/api/events/:slug', ({ params }) => {
    const event = mockEvents.find(e => e.slug === params.slug)
    if (!event) {
      return HttpResponse.json(
        { success: false, message: '找不到活動' },
        { status: 404 },
      )
    }
    return HttpResponse.json({ success: true, data: event })
  }),
]

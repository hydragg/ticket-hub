import type { ApiResponse, PaginatedResponse, Event, EventsFilter } from '~/types'

export function useEvents() {
  const api = useApi()

  async function fetchEvents(filter?: EventsFilter) {
    const { data } = await api.get<PaginatedResponse<Event>>('/events', {
      params: filter,
    })
    return data
  }

  async function fetchEvent(slug: string) {
    const { data } = await api.get<ApiResponse<Event>>(`/events/${slug}`)
    return data
  }

  return { fetchEvents, fetchEvent }
}

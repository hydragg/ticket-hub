export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  createdAt: string
}

export type EventCategory = 'concert' | 'comedy' | 'theater' | 'other'

export interface Ticket {
  id: string
  type: string
  price: number
  available: number
  total: number
}

export interface Event {
  id: string
  slug: string
  title: string
  description: string
  date: string
  endDate?: string
  venue: string
  city: string
  category: EventCategory
  coverImage: string
  images?: string[]
  tickets: Ticket[]
  isFeatured?: boolean
}

export interface OrderItem {
  ticketId: string
  ticketType: string
  quantity: number
  unitPrice: number
}

export type OrderStatus =
  | 'pending_seats'
  | 'pending_payment'
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'refunded'

export interface Order {
  id: string
  userId: string
  eventId: string
  event?: Pick<Event, 'id' | 'title' | 'date' | 'venue' | 'city' | 'coverImage'>
  items: OrderItem[]
  total: number
  status: OrderStatus
  reservationId?: string
  createdAt: string
}

export type ReservationStatus = 'pending_seats' | 'pending_payment' | 'expired' | 'cancelled'

export interface Reservation {
  id: string
  userId: string
  eventId: string
  ticketId: string
  quantity: number
  status: ReservationStatus
  expiresAt: string
  selectedSeats: string[]
  createdAt: string
}

export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  success: boolean
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthResponse {
  user: User
  tokens: AuthTokens
}

export interface CartItem {
  eventId: string
  eventSlug: string
  ticketId: string
  ticketType: string
  quantity: number
  unitPrice: number
}

export interface EventsFilter {
  category?: EventCategory
  city?: string
  dateFrom?: string
  dateTo?: string
  priceMin?: number
  priceMax?: number
  page?: number
  pageSize?: number
}

export interface CreateOrderPayload {
  eventId: string
  items: Array<{
    ticketId: string
    quantity: number
  }>
}

export interface CreateReservationPayload {
  eventId: string
  ticketId: string
  quantity: number
}

export interface UpdateReservationSeatsPayload {
  selectedSeats: string[]
}

export interface CompleteOrderPayload {
  reservationId: string
  paymentInfo: {
    cardHolder: string
    cardNumber: string
    expiry: string
    cvv: string
  }
}

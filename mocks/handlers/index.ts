import { authHandlers } from './auth'
import { eventsHandlers } from './events'
import { ordersHandlers } from './orders'
import { reservationsHandlers } from './reservations'
import { userHandlers } from './user'

export const handlers = [
  ...authHandlers,
  ...eventsHandlers,
  ...reservationsHandlers,
  ...ordersHandlers,
  ...userHandlers,
]

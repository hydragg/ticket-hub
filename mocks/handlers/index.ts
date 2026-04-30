import { authHandlers } from './auth'
import { eventsHandlers } from './events'
import { ordersHandlers } from './orders'
import { userHandlers } from './user'

export const handlers = [
  ...authHandlers,
  ...eventsHandlers,
  ...ordersHandlers,
  ...userHandlers,
]

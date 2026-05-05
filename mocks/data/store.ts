import type { Order, Reservation } from '~/types'
import { mockOrders } from './index'

// Shared mutable runtime state across all handlers

export const reservationsDb = new Map<string, Reservation>()

// ticketId → currently locked quantity (reserved but not yet purchased)
export const lockedInventory = new Map<string, number>()

// All orders including pending ones; initialized from seed data
export const sessionOrders: Order[] = [...mockOrders]

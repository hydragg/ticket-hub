import { defineStore } from 'pinia'
import type { CartItem } from '~/types'

const CART_EXPIRY_MS = 20 * 60 * 1000 // 20 minutes

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[],
    expiresAt: null as number | null,
  }),

  getters: {
    totalItems: (state): number =>
      state.items.reduce((sum, item) => sum + item.quantity, 0),

    totalPrice: (state): number =>
      state.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),

    isExpired: (state): boolean =>
      state.expiresAt !== null && Date.now() > state.expiresAt,

    isEmpty: (state): boolean => state.items.length === 0,
  },

  actions: {
    addItem(item: CartItem) {
      const existing = this.items.find(
        i => i.eventId === item.eventId && i.ticketId === item.ticketId,
      )
      if (existing) {
        existing.quantity += item.quantity
      }
      else {
        this.items.push({ ...item })
      }
      this.expiresAt = Date.now() + CART_EXPIRY_MS
    },

    removeItem(eventId: string, ticketId: string) {
      this.items = this.items.filter(
        i => !(i.eventId === eventId && i.ticketId === ticketId),
      )
      if (this.items.length === 0) this.expiresAt = null
    },

    updateQuantity(eventId: string, ticketId: string, quantity: number) {
      if (quantity <= 0) {
        this.removeItem(eventId, ticketId)
        return
      }
      const item = this.items.find(
        i => i.eventId === eventId && i.ticketId === ticketId,
      )
      if (item) item.quantity = quantity
    },

    clearCart() {
      this.items = []
      this.expiresAt = null
    },
  },
})

import type { ApiResponse, Order, CreateOrderPayload } from '~/types'

export function useOrders() {
  const api = useApi()

  async function fetchOrders() {
    const { data } = await api.get<ApiResponse<Order[]>>('/orders')
    return data
  }

  async function fetchOrder(id: string) {
    const { data } = await api.get<ApiResponse<Order>>(`/orders/${id}`)
    return data
  }

  async function createOrder(payload: CreateOrderPayload) {
    const { data } = await api.post<ApiResponse<Order>>('/orders', payload)
    return data
  }

  return { fetchOrders, fetchOrder, createOrder }
}

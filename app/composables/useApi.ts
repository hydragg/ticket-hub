import axios from 'axios'
import type { AxiosInstance } from 'axios'

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Interceptors are only meaningful on the client (MSW runs in the browser)
if (import.meta.client) {
  api.interceptors.request.use((config) => {
    const authStore = useAuthStore()
    if (authStore.accessToken) {
      config.headers.Authorization = `Bearer ${authStore.accessToken}`
    }
    return config
  })

  api.interceptors.response.use(
    response => response,
    async (error) => {
      const originalRequest = error.config as typeof error.config & { _retry?: boolean }
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true
        try {
          const authStore = useAuthStore()
          await authStore.refreshTokens()
          if (authStore.accessToken) {
            originalRequest.headers.Authorization = `Bearer ${authStore.accessToken}`
          }
          return api(originalRequest)
        }
        catch {
          useAuthStore().logout()
        }
      }
      return Promise.reject(error)
    },
  )
}

export function useApi(): AxiosInstance {
  return api
}

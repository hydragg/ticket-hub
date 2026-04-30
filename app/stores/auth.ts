import axios from 'axios'
import { defineStore } from 'pinia'
import type { User, ApiResponse, AuthTokens } from '~/types'

function getRefreshTokenFromCookie(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)refresh_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

function setRefreshTokenCookie(token: string) {
  document.cookie = `refresh_token=${encodeURIComponent(token)}; path=/; SameSite=Strict`
}

function clearRefreshTokenCookie() {
  document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    accessToken: null as string | null,
  }),

  getters: {
    isAuthenticated: (state): boolean => !!state.accessToken && !!state.user,
  },

  actions: {
    setTokens(tokens: AuthTokens) {
      this.accessToken = tokens.accessToken
      if (import.meta.client) {
        localStorage.setItem('access_token', tokens.accessToken)
        setRefreshTokenCookie(tokens.refreshToken)
      }
    },

    setUser(user: User) {
      this.user = user
    },

    // Uses raw axios to avoid interceptor loop
    async refreshTokens(): Promise<void> {
      if (!import.meta.client) throw new Error('Client only')
      const refreshToken = getRefreshTokenFromCookie()
      if (!refreshToken) throw new Error('No refresh token')

      const { data } = await axios.post<ApiResponse<AuthTokens>>('/api/auth/refresh', {
        refreshToken,
      })
      this.setTokens(data.data)
    },

    logout() {
      this.user = null
      this.accessToken = null
      if (import.meta.client) {
        localStorage.removeItem('access_token')
        clearRefreshTokenCookie()
      }
      navigateTo('/auth/login')
    },

    async init(): Promise<void> {
      if (!import.meta.client) return
      const token = localStorage.getItem('access_token')
      if (!token) return

      this.accessToken = token
      try {
        // Lazy import to avoid circular dependency at module load time
        const { useApi } = await import('~/composables/useApi')
        const { data } = await useApi().get<ApiResponse<User>>('/auth/me')
        this.user = data.data
      }
      catch {
        this.logout()
      }
    },
  },
})

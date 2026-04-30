import type { LoginPayload, RegisterPayload, ApiResponse, AuthResponse } from '~/types'

export function useAuth() {
  const authStore = useAuthStore()
  const api = useApi()

  async function login(payload: LoginPayload) {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', payload)
    authStore.setUser(data.data.user)
    authStore.setTokens(data.data.tokens)
    return data.data
  }

  async function register(payload: RegisterPayload) {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/register', payload)
    authStore.setUser(data.data.user)
    authStore.setTokens(data.data.tokens)
    return data.data
  }

  async function logout() {
    try {
      await api.post('/auth/logout')
    }
    finally {
      authStore.logout()
    }
  }

  return {
    isAuthenticated: computed(() => authStore.isAuthenticated),
    user: computed(() => authStore.user),
    login,
    register,
    logout,
  }
}

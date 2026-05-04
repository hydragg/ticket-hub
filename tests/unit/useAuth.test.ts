import type { LoginPayload, RegisterPayload } from '~/types'

// --- mocks ---

const mockStore = {
  isAuthenticated: false as boolean,
  user: null as null | object,
  setUser: vi.fn(),
  setTokens: vi.fn(),
  logout: vi.fn(),
}

const mockPost = vi.fn()

vi.mock('~/stores/auth', () => ({
  useAuthStore: () => mockStore,
}))

vi.mock('~/composables/useApi', () => ({
  useApi: () => ({ post: mockPost }),
}))

// Import composable AFTER mocks are registered
const { useAuth } = await import('~/composables/useAuth')

// --- fixtures ---

const mockUser = { id: '1', email: 'demo@example.com', name: 'Demo User', createdAt: '2024-01-01' }
const mockTokens = { accessToken: 'access-abc', refreshToken: 'refresh-xyz' }

function makeAuthResponse() {
  return {
    data: {
      data: { user: mockUser, tokens: mockTokens },
      message: 'OK',
      success: true,
    },
  }
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPost.mockResolvedValue(makeAuthResponse())
  })

  describe('login()', () => {
    const payload: LoginPayload = { email: 'demo@example.com', password: 'password123' }

    it('calls POST /auth/login with the payload', async () => {
      await useAuth().login(payload)
      expect(mockPost).toHaveBeenCalledWith('/auth/login', payload)
    })

    it('calls store.setUser with the returned user', async () => {
      await useAuth().login(payload)
      expect(mockStore.setUser).toHaveBeenCalledWith(mockUser)
    })

    it('calls store.setTokens with the returned tokens', async () => {
      await useAuth().login(payload)
      expect(mockStore.setTokens).toHaveBeenCalledWith(mockTokens)
    })

    it('returns the auth data', async () => {
      const result = await useAuth().login(payload)
      expect(result).toEqual({ user: mockUser, tokens: mockTokens })
    })

    it('propagates API errors to the caller', async () => {
      mockPost.mockRejectedValueOnce(new Error('401'))
      await expect(useAuth().login(payload)).rejects.toThrow('401')
    })
  })

  describe('register()', () => {
    const payload: RegisterPayload = {
      name: 'New User',
      email: 'new@example.com',
      password: 'Password1',
    }

    it('calls POST /auth/register with the payload', async () => {
      await useAuth().register(payload)
      expect(mockPost).toHaveBeenCalledWith('/auth/register', payload)
    })

    it('calls store.setUser and store.setTokens on success', async () => {
      await useAuth().register(payload)
      expect(mockStore.setUser).toHaveBeenCalledWith(mockUser)
      expect(mockStore.setTokens).toHaveBeenCalledWith(mockTokens)
    })

    it('returns the auth data', async () => {
      const result = await useAuth().register(payload)
      expect(result).toEqual({ user: mockUser, tokens: mockTokens })
    })
  })

  describe('logout()', () => {
    it('calls POST /auth/logout', async () => {
      await useAuth().logout()
      expect(mockPost).toHaveBeenCalledWith('/auth/logout')
    })

    it('calls store.logout after a successful API call', async () => {
      await useAuth().logout()
      expect(mockStore.logout).toHaveBeenCalledOnce()
    })

    it('calls store.logout even when the API call fails', async () => {
      mockPost.mockRejectedValueOnce(new Error('network error'))
      // try/finally in logout() always calls store.logout, but the error still propagates
      await expect(useAuth().logout()).rejects.toThrow('network error')
      expect(mockStore.logout).toHaveBeenCalledOnce()
    })
  })
})

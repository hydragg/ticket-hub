import { http, HttpResponse } from 'msw'
import { mockUser, MOCK_ACCESS_TOKEN, MOCK_REFRESH_TOKEN } from '../data'

function isAuthorized(request: Request): boolean {
  const auth = request.headers.get('Authorization')
  return auth === `Bearer ${MOCK_ACCESS_TOKEN}`
}

export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { email: string; password: string }

    if (body.email === 'demo@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        success: true,
        data: {
          user: mockUser,
          tokens: {
            accessToken: MOCK_ACCESS_TOKEN,
            refreshToken: MOCK_REFRESH_TOKEN,
          },
        },
      })
    }

    return HttpResponse.json(
      { success: false, message: '電子郵件或密碼錯誤' },
      { status: 401 },
    )
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const body = await request.json() as { name: string; email: string; password: string }

    if (!body.email || !body.password || !body.name) {
      return HttpResponse.json(
        { success: false, message: '請填寫所有欄位' },
        { status: 400 },
      )
    }

    const newUser = { ...mockUser, name: body.name, email: body.email }
    return HttpResponse.json({
      success: true,
      data: {
        user: newUser,
        tokens: {
          accessToken: MOCK_ACCESS_TOKEN,
          refreshToken: MOCK_REFRESH_TOKEN,
        },
      },
    })
  }),

  http.post('/api/auth/refresh', async ({ request }) => {
    const body = await request.json() as { refreshToken: string }

    if (body.refreshToken !== MOCK_REFRESH_TOKEN) {
      return HttpResponse.json(
        { success: false, message: 'Invalid refresh token' },
        { status: 401 },
      )
    }

    return HttpResponse.json({
      success: true,
      data: {
        accessToken: MOCK_ACCESS_TOKEN,
        refreshToken: MOCK_REFRESH_TOKEN,
      },
    })
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ success: true, data: null })
  }),

  http.get('/api/auth/me', ({ request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 },
      )
    }
    return HttpResponse.json({ success: true, data: mockUser })
  }),
]

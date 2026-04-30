import { http, HttpResponse } from 'msw'
import { mockUser, MOCK_ACCESS_TOKEN } from '../data'
import type { User } from '~/types'

function isAuthorized(request: Request): boolean {
  return request.headers.get('Authorization') === `Bearer ${MOCK_ACCESS_TOKEN}`
}

let currentUser = { ...mockUser }

export const userHandlers = [
  http.get('/api/user/profile', ({ request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }
    return HttpResponse.json({ success: true, data: currentUser })
  }),

  http.put('/api/user/profile', async ({ request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json() as Partial<User>
    currentUser = { ...currentUser, ...body, id: currentUser.id }
    return HttpResponse.json({ success: true, data: currentUser })
  }),

  http.put('/api/user/password', async ({ request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json() as { currentPassword: string; newPassword: string }

    if (body.currentPassword !== 'password123') {
      return HttpResponse.json(
        { success: false, message: '目前密碼不正確' },
        { status: 400 },
      )
    }
    return HttpResponse.json({ success: true, data: null })
  }),
]

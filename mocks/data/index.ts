import type { User, Event, Order } from '~/types'

export const MOCK_ACCESS_TOKEN = 'mock-access-token-v1'
export const MOCK_REFRESH_TOKEN = 'mock-refresh-token-v1'

export const mockUser: User = {
  id: 'user-1',
  email: 'demo@example.com',
  name: '測試用戶',
  createdAt: '2024-01-01T00:00:00.000Z',
}

export const mockEvents: Event[] = [
  {
    id: 'evt-1',
    slug: 'mayday-no-sleep-2025',
    title: '五月天 諾亞方舟 世界巡迴演唱會 台北站',
    description:
      '五月天 2025 年度大型演唱會，以「諾亞方舟」為主題，攜帶全新舞台設計與視覺特效，帶來超過 40 首金曲的絕美演出。',
    date: '2025-08-15T19:00:00+08:00',
    endDate: '2025-08-15T22:30:00+08:00',
    venue: '台北小巨蛋',
    city: '台北',
    category: 'concert',
    coverImage: 'https://picsum.photos/seed/mayday2025/800/450',
    images: [
      'https://picsum.photos/seed/mayday2025a/1200/675',
      'https://picsum.photos/seed/mayday2025b/1200/675',
    ],
    tickets: [
      { id: 'evt-1-vip', type: 'VIP 搖滾區', price: 5800, available: 80, total: 150 },
      { id: 'evt-1-a', type: 'A 區', price: 3800, available: 250, total: 500 },
      { id: 'evt-1-b', type: 'B 區', price: 2800, available: 480, total: 800 },
      { id: 'evt-1-c', type: 'C 區', price: 1800, available: 620, total: 1000 },
    ],
    isFeatured: true,
  },
  {
    id: 'evt-2',
    slug: 'joker-xue-taipei-2025',
    title: '薛之謙「天外來物」巡迴演唱會 台北場',
    description:
      '薛之謙全新概念巡演，以宇宙星際為舞台設計靈感，帶來全新創作及經典金曲。',
    date: '2025-09-06T19:30:00+08:00',
    venue: '台北流行音樂中心',
    city: '台北',
    category: 'concert',
    coverImage: 'https://picsum.photos/seed/joker2025/800/450',
    tickets: [
      { id: 'evt-2-vip', type: 'VIP', price: 4800, available: 60, total: 100 },
      { id: 'evt-2-a', type: 'A 區', price: 3200, available: 300, total: 600 },
      { id: 'evt-2-b', type: 'B 區', price: 2200, available: 500, total: 900 },
    ],
    isFeatured: true,
  },
  {
    id: 'evt-3',
    slug: 'stand-up-comedy-night-taichung',
    title: '台中喜劇之夜 — 脫口秀大爆炸',
    description:
      '集結兩岸三地最火熱的脫口秀演員，帶來笑到停不下來的一夜！',
    date: '2025-07-20T20:00:00+08:00',
    venue: '台中國家歌劇院',
    city: '台中',
    category: 'comedy',
    coverImage: 'https://picsum.photos/seed/comedy2025/800/450',
    tickets: [
      { id: 'evt-3-front', type: '前排座位', price: 2200, available: 100, total: 200 },
      { id: 'evt-3-std', type: '一般座位', price: 1400, available: 400, total: 800 },
    ],
    isFeatured: false,
  },
  {
    id: 'evt-4',
    slug: 'phantom-of-opera-kaohsiung',
    title: '歌劇魅影 — 經典音樂劇 高雄場',
    description:
      '百老匯經典音樂劇《歌劇魅影》亞洲巡演高雄站，震撼人心的歌聲與絢爛舞台。',
    date: '2025-10-03T19:30:00+08:00',
    endDate: '2025-10-05T21:30:00+08:00',
    venue: '高雄市立文化中心至德堂',
    city: '高雄',
    category: 'theater',
    coverImage: 'https://picsum.photos/seed/phantom2025/800/450',
    tickets: [
      { id: 'evt-4-premium', type: 'Premium', price: 3600, available: 80, total: 150 },
      { id: 'evt-4-a', type: 'A 區', price: 2600, available: 200, total: 400 },
      { id: 'evt-4-b', type: 'B 區', price: 1600, available: 350, total: 600 },
    ],
    isFeatured: true,
  },
  {
    id: 'evt-5',
    slug: 'eason-chan-concert-taipei',
    title: '陳奕迅 FEAR AND DREAMS 演唱會 台北',
    description:
      '陳奕迅最新世界巡演正式登台！以「恐懼與夢想」為主題，帶來震撼心靈的音樂旅程。',
    date: '2025-11-22T19:00:00+08:00',
    venue: '台北小巨蛋',
    city: '台北',
    category: 'concert',
    coverImage: 'https://picsum.photos/seed/eason2025/800/450',
    tickets: [
      { id: 'evt-5-vip', type: 'VIP', price: 6800, available: 50, total: 100 },
      { id: 'evt-5-a', type: 'A 區', price: 4200, available: 200, total: 500 },
      { id: 'evt-5-b', type: 'B 區', price: 2800, available: 400, total: 800 },
      { id: 'evt-5-c', type: 'C 區', price: 1800, available: 500, total: 1000 },
    ],
    isFeatured: false,
  },
  {
    id: 'evt-6',
    slug: 'comedy-show-taipei',
    title: '呱吉 × 博恩 聯合脫口秀',
    description:
      '人氣脫口秀演員呱吉與博恩首度聯合演出，笑料不斷，一票難求！',
    date: '2025-08-30T20:00:00+08:00',
    venue: '台北 Legacy',
    city: '台北',
    category: 'comedy',
    coverImage: 'https://picsum.photos/seed/comedy2025b/800/450',
    tickets: [
      { id: 'evt-6-front', type: '前排', price: 1800, available: 80, total: 150 },
      { id: 'evt-6-std', type: '一般', price: 1200, available: 250, total: 450 },
    ],
    isFeatured: false,
  },
]

export const mockOrders: Order[] = [
  {
    id: 'order-1',
    userId: 'user-1',
    eventId: 'evt-1',
    event: {
      id: 'evt-1',
      title: '五月天 諾亞方舟 世界巡迴演唱會 台北站',
      date: '2025-08-15T19:00:00+08:00',
      venue: '台北小巨蛋',
      city: '台北',
      coverImage: 'https://picsum.photos/seed/mayday2025/800/450',
    },
    items: [{ ticketId: 'evt-1-a', ticketType: 'A 區', quantity: 2, unitPrice: 3800 }],
    total: 7600,
    status: 'confirmed',
    createdAt: '2025-06-01T10:00:00.000Z',
  },
]

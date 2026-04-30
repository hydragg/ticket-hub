export default defineNuxtPlugin(async () => {
  if (!import.meta.dev) return

  const { setupWorker } = await import('msw/browser')
  const { handlers } = await import('../../mocks/handlers')

  const worker = setupWorker(...handlers)
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: '/mockServiceWorker.js' },
  })
})

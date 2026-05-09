export default defineNuxtPlugin(async () => {
  const { app } = useRuntimeConfig()
  const { setupWorker } = await import('msw/browser')
  const { handlers } = await import('../../mocks/handlers')

  const worker = setupWorker(...handlers)
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: `${app.baseURL}mockServiceWorker.js` },
  })
})

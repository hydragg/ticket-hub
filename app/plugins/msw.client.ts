export default defineNuxtPlugin(async () => {
  const { setupWorker } = await import('msw/browser')
  const { handlers } = await import('../../mocks/handlers')

  const worker = setupWorker(...handlers)
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  })
})

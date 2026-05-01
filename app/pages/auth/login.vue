<script setup lang="ts">
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { toast } from 'vue-sonner'
import { EyeIcon, EyeOffIcon } from 'lucide-vue-next'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { loginSchema } from '~/utils/auth-schemas'

definePageMeta({ layout: 'auth', middleware: 'guest' })

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { login } = useAuth()

const redirectTo = computed(() => {
  const r = route.query.redirect
  return typeof r === 'string' && r.startsWith('/') ? r : '/'
})

const showPassword = ref(false)
const serverError = ref('')

const { handleSubmit, isSubmitting } = useForm({
  validationSchema: toTypedSchema(loginSchema),
})

const onSubmit = handleSubmit(async (values) => {
  serverError.value = ''
  try {
    await login(values)
    toast.success(t('auth.login.success'))
    await navigateTo(redirectTo.value)
  }
  catch {
    serverError.value = t('auth.login.error')
    toast.error(t('auth.login.error'))
  }
})

useSeoMeta({ title: t('auth.login.title') })
</script>

<template>
  <div>
    <div class="mb-6 text-center">
      <NuxtLink :to="localePath('/')" class="inline-flex items-center gap-2 font-bold text-xl">
        <TicketIcon class="h-6 w-6 text-primary" aria-hidden="true" />
        TicketHub
      </NuxtLink>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>{{ t('auth.login.title') }}</CardTitle>
        <CardDescription>{{ t('auth.login.description') }}</CardDescription>
      </CardHeader>

      <CardContent>
        <form class="space-y-4" novalidate @submit="onSubmit">
          <!-- Server error -->
          <div
            v-if="serverError"
            role="alert"
            class="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {{ serverError }}
          </div>

          <!-- Email -->
          <FormField v-slot="{ componentField }" name="email">
            <FormItem>
              <FormLabel>{{ t('auth.login.email') }}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  autocomplete="email"
                  v-bind="componentField"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <!-- Password -->
          <FormField v-slot="{ componentField }" name="password">
            <FormItem>
              <div class="flex items-center justify-between">
                <FormLabel>{{ t('auth.login.password') }}</FormLabel>
                <NuxtLink
                  :to="localePath('/auth/forgot-password')"
                  class="text-xs text-muted-foreground underline-offset-4 hover:underline"
                >
                  {{ t('auth.login.forgotPassword') }}
                </NuxtLink>
              </div>
              <FormControl>
                <div class="relative">
                  <Input
                    :type="showPassword ? 'text' : 'password'"
                    autocomplete="current-password"
                    v-bind="componentField"
                  />
                  <button
                    type="button"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    :aria-label="showPassword ? '隱藏密碼' : '顯示密碼'"
                    tabindex="-1"
                    @click="showPassword = !showPassword"
                  >
                    <EyeOffIcon v-if="showPassword" class="h-4 w-4" aria-hidden="true" />
                    <EyeIcon v-else class="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <Button type="submit" class="w-full" :disabled="isSubmitting">
            {{ isSubmitting ? t('common.loading') : t('auth.login.submit') }}
          </Button>
        </form>
      </CardContent>

      <CardFooter class="justify-center text-sm text-muted-foreground">
        {{ t('auth.login.noAccount') }}
        <NuxtLink
          :to="localePath('/auth/register')"
          class="ml-1 font-medium text-primary underline-offset-4 hover:underline"
        >
          {{ t('auth.login.registerLink') }}
        </NuxtLink>
      </CardFooter>
    </Card>
  </div>
</template>

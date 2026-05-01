<script setup lang="ts">
import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { toast } from 'vue-sonner'
import { EyeIcon, EyeOffIcon } from 'lucide-vue-next'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { registerSchema } from '~/utils/auth-schemas'

definePageMeta({ layout: 'auth', middleware: 'guest' })

const { t } = useI18n()
const localePath = useLocalePath()
const { register } = useAuth()

const showPassword = ref(false)
const showConfirm = ref(false)
const serverError = ref('')

const { handleSubmit, isSubmitting } = useForm({
  validationSchema: toTypedSchema(registerSchema),
})

const { value: passwordValue } = useField<string>('password')

const onSubmit = handleSubmit(async (values) => {
  serverError.value = ''
  try {
    await register({ name: values.name, email: values.email, password: values.password })
    toast.success(t('auth.register.success'))
    await navigateTo(localePath('/'))
  }
  catch (err: unknown) {
    const msg = err instanceof Error ? err.message : t('common.error')
    serverError.value = msg
    toast.error(msg)
  }
})

useSeoMeta({ title: t('auth.register.title') })
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
        <CardTitle>{{ t('auth.register.title') }}</CardTitle>
        <CardDescription>{{ t('auth.register.description') }}</CardDescription>
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

          <!-- Name -->
          <FormField v-slot="{ componentField }" name="name">
            <FormItem>
              <FormLabel>{{ t('auth.register.name') }}</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="John Doe"
                  autocomplete="name"
                  v-bind="componentField"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <!-- Email -->
          <FormField v-slot="{ componentField }" name="email">
            <FormItem>
              <FormLabel>{{ t('auth.register.email') }}</FormLabel>
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
              <FormLabel>{{ t('auth.register.password') }}</FormLabel>
              <FormControl>
                <div class="relative">
                  <Input
                    :type="showPassword ? 'text' : 'password'"
                    autocomplete="new-password"
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
              <PasswordStrength :password="passwordValue ?? ''" />
              <FormMessage />
            </FormItem>
          </FormField>

          <!-- Confirm Password -->
          <FormField v-slot="{ componentField }" name="confirmPassword">
            <FormItem>
              <FormLabel>{{ t('auth.register.confirmPassword') }}</FormLabel>
              <FormControl>
                <div class="relative">
                  <Input
                    :type="showConfirm ? 'text' : 'password'"
                    autocomplete="new-password"
                    v-bind="componentField"
                  />
                  <button
                    type="button"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    :aria-label="showConfirm ? '隱藏密碼' : '顯示密碼'"
                    tabindex="-1"
                    @click="showConfirm = !showConfirm"
                  >
                    <EyeOffIcon v-if="showConfirm" class="h-4 w-4" aria-hidden="true" />
                    <EyeIcon v-else class="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <Button type="submit" class="w-full" :disabled="isSubmitting">
            {{ isSubmitting ? t('common.loading') : t('auth.register.submit') }}
          </Button>
        </form>
      </CardContent>

      <CardFooter class="justify-center text-sm text-muted-foreground">
        {{ t('auth.register.hasAccount') }}
        <NuxtLink
          :to="localePath('/auth/login')"
          class="ml-1 font-medium text-primary underline-offset-4 hover:underline"
        >
          {{ t('auth.register.loginLink') }}
        </NuxtLink>
      </CardFooter>
    </Card>
  </div>
</template>

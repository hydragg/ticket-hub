<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { toast } from 'vue-sonner'
import { ArrowLeftIcon } from 'lucide-vue-next'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { forgotPasswordSchema } from '~/utils/auth-schemas'

definePageMeta({ layout: 'auth', middleware: 'guest' })

const { t } = useI18n()
const localePath = useLocalePath()

const submitted = ref(false)

const { handleSubmit, isSubmitting } = useForm({
  validationSchema: toTypedSchema(forgotPasswordSchema),
})

const onSubmit = handleSubmit(async (_values) => {
  // Mock: always succeed after brief delay
  await new Promise(resolve => setTimeout(resolve, 800))
  submitted.value = true
  toast.success(t('auth.forgotPassword.success'))
})

useSeoMeta({ title: t('auth.forgotPassword.title') })
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
        <CardTitle>{{ t('auth.forgotPassword.title') }}</CardTitle>
        <CardDescription>{{ t('auth.forgotPassword.description') }}</CardDescription>
      </CardHeader>

      <CardContent>
        <!-- Success state -->
        <div
          v-if="submitted"
          role="status"
          class="rounded-md bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400"
        >
          {{ t('auth.forgotPassword.success') }}
        </div>

        <!-- Form -->
        <form v-else class="space-y-4" novalidate @submit="onSubmit">
          <FormField v-slot="{ componentField }" name="email">
            <FormItem>
              <FormLabel>{{ t('auth.forgotPassword.email') }}</FormLabel>
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

          <Button type="submit" class="w-full" :disabled="isSubmitting">
            {{ isSubmitting ? t('common.loading') : t('auth.forgotPassword.submit') }}
          </Button>
        </form>
      </CardContent>

      <CardFooter class="justify-center">
        <NuxtLink
          :to="localePath('/auth/login')"
          class="inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          <ArrowLeftIcon class="h-3.5 w-3.5" aria-hidden="true" />
          {{ t('auth.forgotPassword.backToLogin') }}
        </NuxtLink>
      </CardFooter>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { toast } from 'vue-sonner'

definePageMeta({ middleware: 'auth' })

const { t } = useI18n()
const api = useApi()

useSeoMeta({ title: () => `${t('dashboard.passwordPage.title')} | TicketHub` })

const passwordSchema = toTypedSchema(
  z
    .object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: z.string().min(8, 'At least 8 characters'),
      confirmPassword: z.string(),
    })
    .refine(data => data.newPassword === data.confirmPassword, {
      message: "Passwords don't match",
      path: ['confirmPassword'],
    }),
)

const { handleSubmit, defineField, errors, resetForm } = useForm({
  validationSchema: passwordSchema,
})

const [currentPassword] = defineField('currentPassword')
const [newPassword] = defineField('newPassword')
const [confirmPassword] = defineField('confirmPassword')

const isSaving = ref(false)

const onSubmit = handleSubmit(async (values) => {
  isSaving.value = true
  try {
    await api.put('/user/password', {
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    })
    toast.success(t('dashboard.passwordPage.success'))
    resetForm()
  }
  catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 400) {
      toast.error(t('dashboard.passwordPage.wrongCurrent'))
    }
    else {
      toast.error(t('common.error'))
    }
  }
  finally {
    isSaving.value = false
  }
})
</script>

<template>
  <DashboardShell>
    <div>
      <h1 class="mb-6 text-2xl font-bold">{{ $t('dashboard.passwordPage.title') }}</h1>

      <form class="max-w-md space-y-5" novalidate @submit.prevent="onSubmit">
        <!-- Current password -->
        <div class="space-y-1.5">
          <UiLabel for="current-password">{{ $t('dashboard.passwordPage.current') }}</UiLabel>
          <UiInput
            id="current-password"
            v-model="currentPassword"
            type="password"
            autocomplete="current-password"
          />
          <p v-if="errors.currentPassword" class="text-sm text-destructive" role="alert">
            {{ errors.currentPassword }}
          </p>
        </div>

        <!-- New password -->
        <div class="space-y-1.5">
          <UiLabel for="new-password">{{ $t('dashboard.passwordPage.new') }}</UiLabel>
          <UiInput
            id="new-password"
            v-model="newPassword"
            type="password"
            autocomplete="new-password"
          />
          <p v-if="errors.newPassword" class="text-sm text-destructive" role="alert">
            {{ errors.newPassword }}
          </p>
        </div>

        <!-- Confirm new password -->
        <div class="space-y-1.5">
          <UiLabel for="confirm-password">{{ $t('dashboard.passwordPage.confirm') }}</UiLabel>
          <UiInput
            id="confirm-password"
            v-model="confirmPassword"
            type="password"
            autocomplete="new-password"
          />
          <p v-if="errors.confirmPassword" class="text-sm text-destructive" role="alert">
            {{ errors.confirmPassword }}
          </p>
        </div>

        <UiButton type="submit" :disabled="isSaving">
          {{ isSaving ? $t('common.loading') : $t('dashboard.passwordPage.submit') }}
        </UiButton>
      </form>
    </div>
  </DashboardShell>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { toast } from 'vue-sonner'
import type { ApiResponse, User } from '~/types'

definePageMeta({ middleware: 'auth' })

const { t } = useI18n()
const api = useApi()
const authStore = useAuthStore()
const { user } = useAuth()

useSeoMeta({ title: () => `${t('dashboard.profilePage.title')} | TicketHub` })

const profileSchema = toTypedSchema(
  z.object({
    name: z.string().min(1, 'Name is required').max(50, 'Name is too long'),
  }),
)

const { handleSubmit, defineField, errors } = useForm({
  validationSchema: profileSchema,
  initialValues: { name: user.value?.name ?? '' },
})

const [name] = defineField('name')

const isSaving = ref(false)

const onSubmit = handleSubmit(async (values) => {
  isSaving.value = true
  try {
    const res = await api.put<ApiResponse<User>>('/user/profile', { name: values.name })
    authStore.setUser(res.data.data)
    toast.success(t('dashboard.profilePage.saved'))
  }
  catch {
    toast.error(t('common.error'))
  }
  finally {
    isSaving.value = false
  }
})
</script>

<template>
  <DashboardShell>
    <div>
      <h1 class="mb-6 text-2xl font-bold">{{ $t('dashboard.profilePage.title') }}</h1>

      <form class="max-w-md space-y-5" novalidate @submit.prevent="onSubmit">
        <!-- Name -->
        <div class="space-y-1.5">
          <UiLabel for="profile-name">{{ $t('dashboard.profilePage.name') }}</UiLabel>
          <UiInput id="profile-name" v-model="name" autocomplete="name" />
          <p v-if="errors.name" class="text-sm text-destructive" role="alert">
            {{ errors.name }}
          </p>
        </div>

        <!-- Email (read-only) -->
        <div class="space-y-1.5">
          <UiLabel for="profile-email">{{ $t('dashboard.profilePage.email') }}</UiLabel>
          <UiInput
            id="profile-email"
            :value="user?.email"
            readonly
            class="bg-muted/50 text-muted-foreground"
            aria-describedby="email-hint"
          />
          <p id="email-hint" class="text-xs text-muted-foreground">
            {{ $t('dashboard.profilePage.emailHint') }}
          </p>
        </div>

        <UiButton type="submit" :disabled="isSaving">
          {{ isSaving ? $t('common.loading') : $t('dashboard.profilePage.save') }}
        </UiButton>
      </form>
    </div>
  </DashboardShell>
</template>

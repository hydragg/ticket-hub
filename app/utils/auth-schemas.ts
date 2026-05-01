import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: '請輸入電子郵件' })
    .email({ message: '請輸入有效的電子郵件格式' }),
  password: z.string().min(1, { message: '請輸入密碼' }),
})

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: '姓名至少需要 2 個字元' })
      .max(50, { message: '姓名不能超過 50 個字元' }),
    email: z
      .string()
      .min(1, { message: '請輸入電子郵件' })
      .email({ message: '請輸入有效的電子郵件格式' }),
    password: z
      .string()
      .min(8, { message: '密碼至少需要 8 個字元' })
      .regex(/[A-Z]/, { message: '密碼需包含至少一個大寫字母' })
      .regex(/[0-9]/, { message: '密碼需包含至少一個數字' }),
    confirmPassword: z.string().min(1, { message: '請確認密碼' }),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: '兩次密碼輸入不一致',
    path: ['confirmPassword'],
  })

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, { message: '請輸入電子郵件' })
    .email({ message: '請輸入有效的電子郵件格式' }),
})

export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

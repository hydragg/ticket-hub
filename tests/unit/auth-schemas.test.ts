import { loginSchema, registerSchema, forgotPasswordSchema } from '~/utils/auth-schemas'

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: 'password123' })
    expect(result.success).toBe(true)
  })

  it('rejects empty email', () => {
    const result = loginSchema.safeParse({ email: '', password: 'password123' })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email format', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'password123' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('請輸入有效的電子郵件格式')
  })

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: '' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('請輸入密碼')
  })
})

describe('registerSchema', () => {
  const validData = {
    name: '王小明',
    email: 'test@example.com',
    password: 'Password1',
    confirmPassword: 'Password1',
  }

  it('accepts valid registration data', () => {
    const result = registerSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects name shorter than 2 characters', () => {
    const result = registerSchema.safeParse({ ...validData, name: 'A' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('姓名至少需要 2 個字元')
  })

  it('rejects password shorter than 8 characters', () => {
    const result = registerSchema.safeParse({ ...validData, password: 'Pass1', confirmPassword: 'Pass1' })
    expect(result.success).toBe(false)
    const messages = result.error?.issues.map(i => i.message)
    expect(messages).toContain('密碼至少需要 8 個字元')
  })

  it('rejects password without uppercase letter', () => {
    const result = registerSchema.safeParse({ ...validData, password: 'password1', confirmPassword: 'password1' })
    expect(result.success).toBe(false)
    const messages = result.error?.issues.map(i => i.message)
    expect(messages).toContain('密碼需包含至少一個大寫字母')
  })

  it('rejects password without number', () => {
    const result = registerSchema.safeParse({ ...validData, password: 'PasswordABC', confirmPassword: 'PasswordABC' })
    expect(result.success).toBe(false)
    const messages = result.error?.issues.map(i => i.message)
    expect(messages).toContain('密碼需包含至少一個數字')
  })

  it('rejects mismatched passwords', () => {
    const result = registerSchema.safeParse({ ...validData, confirmPassword: 'DifferentPass1' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('兩次密碼輸入不一致')
  })

  it('rejects invalid email format', () => {
    const result = registerSchema.safeParse({ ...validData, email: 'bad-email' })
    expect(result.success).toBe(false)
  })
})

describe('forgotPasswordSchema', () => {
  it('accepts valid email', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'test@example.com' })
    expect(result.success).toBe(true)
  })

  it('rejects empty email', () => {
    const result = forgotPasswordSchema.safeParse({ email: '' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('請輸入電子郵件')
  })

  it('rejects invalid email format', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'not-valid' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe('請輸入有效的電子郵件格式')
  })
})

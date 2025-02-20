import { z } from 'zod'

const TokenSchema = z.string().min(1)

export const AuthService = {
  getToken: (): string => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem('didToken') || ''
  },

  setToken: (token: string): void => {
    if (!TokenSchema.safeParse(token).success) return
    localStorage.setItem('didToken', token)
  },

  removeToken: (): void => {
    localStorage.removeItem('didToken')
  },

  getAuthHeaders: (): HeadersInit => ({
    'Authorization': `Bearer ${AuthService.getToken()}`,
    'Content-Type': 'application/json'
  })
} 
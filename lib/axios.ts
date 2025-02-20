import axios from 'axios'
import { AuthService } from '@/services/auth-service'

export const api = axios.create()

api.interceptors.request.use((config) => {
  config.headers = {
    ...config.headers,
    ...AuthService.getAuthHeaders()
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      AuthService.removeToken()
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
) 
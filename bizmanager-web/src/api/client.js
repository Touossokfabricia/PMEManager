import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let refreshQueue = []

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status

    if (status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/')) {
      originalRequest._retry = true
      const refresh = localStorage.getItem('refresh_token')

      if (!refresh) {
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      isRefreshing = true
      try {
        const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh/`, { refresh })
        localStorage.setItem('access_token', data.access)
        refreshQueue.forEach((p) => p.resolve(data.access))
        refreshQueue = []
        originalRequest.headers.Authorization = `Bearer ${data.access}`
        return api(originalRequest)
      } catch (refreshError) {
        refreshQueue.forEach((p) => p.reject(refreshError))
        refreshQueue = []
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

/**
 * Extrait un message d'erreur lisible depuis une réponse d'erreur Axios/DRF,
 * quelle que soit la forme (string, {detail}, {field: [...]}, {non_field_errors}).
 */
export function getErrorMessage(error, fallback = "Une erreur est survenue. Veuillez réessayer.") {
  const data = error?.response?.data
  if (!data) return fallback
  if (typeof data === 'string') return data
  if (data.detail) return data.detail
  if (data.non_field_errors?.[0]) return data.non_field_errors[0]
  const firstKey = Object.keys(data)[0]
  if (firstKey && Array.isArray(data[firstKey])) return data[firstKey][0]
  if (firstKey && typeof data[firstKey] === 'string') return data[firstKey]
  return fallback
}

export default api

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { MessagePlugin } from 'tdesign-vue-next'
import { useUserStore } from '@/stores/user'
import router from '@/router'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  code?: number
}

class ApiClient {
  private instance: AxiosInstance

  constructor() {
    this.instance = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    this.instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    this.instance.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        const { data } = response
        
        if (data.success) {
          return data as any
        }
        
        const error = new Error(data.message || '请求失败') as any
        error.code = data.code
        error.data = data.data
        return Promise.reject(error)
      },
      (error) => {
        if (error.response) {
          const { status, data } = error.response
          
          if (status === 401) {
            const userStore = useUserStore()
            userStore.logout()
            MessagePlugin.warning('登录已过期，请重新登录')
            router.push('/login')
            return Promise.reject(new Error('登录已过期'))
          }
          
          if (status === 403) {
            return Promise.reject(new Error('无权访问该资源'))
          }
          
          if (status === 404) {
            return Promise.reject(new Error('请求的资源不存在'))
          }
          
          if (status === 429) {
            return Promise.reject(new Error('请求过于频繁，请稍后再试'))
          }
          
          const err = new Error(data?.message || `服务器错误 (${status})`) as any
          err.code = data?.code
          err.data = data?.data
          return Promise.reject(err)
        }
        
        if (error.code === 'ECONNABORTED') {
          return Promise.reject(new Error('请求超时，请检查网络'))
        }
        
        return Promise.reject(new Error('网络请求失败'))
      }
    )
  }

  async get<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.instance.get(url, { params, ...config })
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.instance.post(url, data, config)
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.instance.put(url, data, config)
  }

  async delete<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.instance.delete(url, { data, ...config })
  }

  async upload<T = any>(url: string, file: File, formData?: Record<string, any>): Promise<ApiResponse<T>> {
    const form = new FormData()
    form.append('file', file)
    
    if (formData) {
      Object.entries(formData).forEach(([key, value]) => {
        form.append(key, value)
      })
    }
    
    return this.instance.post(url, form, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}

const api = new ApiClient()

export const authAPI = {
  login: (code: string, userInfo?: any) => api.post('/auth/login', { code, userInfo }),
  testLogin: (account: string, password: string) => api.post('/auth/test-login', { account, password }),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  refreshToken: () => api.post('/auth/refresh')
}

export const libraryAPI = {
  getList: (params?: any) => api.get('/libraries', params),
  getDetail: (id: number) => api.get(`/libraries/${id}`),
  create: (data: any) => api.post('/libraries', data),
  update: (id: number, data: any) => api.put(`/libraries/${id}`, data),
  delete: (id: number) => api.delete(`/libraries/${id}`),
  getMyLibraries: (params?: any) => api.get('/libraries/my', params),
  getRecommended: (limit?: number) => api.get('/libraries/recommended', { limit }),
  getCategories: () => api.get('/libraries/categories'),
  search: (keyword: string, params?: any) => api.get('/libraries/search', { keyword, ...params }),
  toggleFavorite: (id: number) => api.post(`/libraries/${id}/favorite`),
  like: (id: number) => api.post(`/libraries/${id}/like`),
  unlike: (id: number) => api.post(`/libraries/${id}/unlike`)
}

export const cardAPI = {
  getList: (params?: any) => api.get('/cards', params),
  getDetail: (id: number) => api.get(`/cards/${id}`),
  create: (data: any) => api.post('/cards', data),
  update: (id: number, data: any) => api.put(`/cards/${id}`, data),
  delete: (id: number) => api.delete(`/cards/${id}`),
  getHotCards: (limit?: number, page?: number, pageSize?: number) => {
    const params: any = { limit }
    if (page) params.page = page
    if (pageSize) params.pageSize = pageSize
    return api.get('/cards/hot', params)
  },
  search: (keyword: string, params?: any) => api.get('/cards/search', { keyword, ...params }),
  recordStudy: (id: number, data?: any) => api.post(`/cards/${id}/study`, data),
  addWrong: (id: number) => api.post(`/cards/${id}/wrong`),
  markAsMastered: (id: number) => api.post(`/cards/${id}/master`),
  setMastery: (id: number, mastered: boolean, feedback?: string) => api.post(`/cards/${id}/mastery`, { mastered, feedback }),
  toggleMastery: (id: number, feedback?: string) => api.post(`/cards/${id}/mastery/toggle`, { feedback }),
  like: (id: number) => api.post(`/cards/${id}/like`),
  unlike: (id: number) => api.post(`/cards/${id}/unlike`),
  toggleLike: (id: number) => api.post(`/cards/${id}/like`),
  getNext: (id: number) => api.get(`/cards/${id}/next`),
  getPrev: (id: number) => api.get(`/cards/${id}/prev`),
  getRandom: (libraryId: number) => api.get(`/libraries/${libraryId}/cards/random`),
  getReviewCards: () => api.get('/cards/review/list'),
  getReviewCount: () => api.get('/cards/review/count'),
  getDifficultyStats: () => api.get('/cards/difficulty/stats'),
  getDifficultyCards: (level: string) => api.get('/cards/difficulty/cards', { level }),
  batchImport: (file: File, formData?: any) => api.upload('/cards/batch-import', file, formData),
  batchMove: (cardIds: number[], chapterId: number | null, libraryId?: number) => api.post('/cards/batch-move', { cardIds, chapterId, libraryId }),
  batchCopy: (cardIds: number[], libraryId: number, chapterId?: number) => api.post('/cards/batch-copy', { cardIds, libraryId, chapterId }),
  getRelated: (id: number, limit?: number) => api.get(`/cards/${id}/related`, { limit }),
  updateMastery: (id: number, level: number) => api.post(`/cards/${id}/mastery`, { level }),
  getMyCards: (params?: any) => api.get('/cards/my', params),
  rateDifficulty: (id: number, rating: number) => api.post(`/cards/${id}/difficulty`, { rating }),
  linkCards: (cardId: number, linkedCardIds: number[]) => api.post(`/cards/${cardId}/link`, { linkedCardIds }),
  unlinkCard: (cardId: number, linkedCardId: number) => api.delete(`/cards/${cardId}/link/${linkedCardId}`),
  getLinkedCards: (cardId: number) => api.get(`/cards/${cardId}/linked`)
}

export const chapterAPI = {
  getList: (libraryId: number) => api.get(`/libraries/${libraryId}/chapters`),
  create: (libraryId: number, data: any) => api.post(`/libraries/${libraryId}/chapters`, data),
  batchCreate: (libraryId: number, chapters: any[]) => api.post('/chapters/batch', { libraryId, chapters }),
  batchUpdate: (libraryId: number, chapters: any[]) => api.post('/chapters/batch-update', { libraryId, chapters }),
  update: (id: number, data: any) => api.put(`/chapters/${id}`, data),
  delete: (id: number) => api.delete(`/chapters/${id}`),
  getCards: (id: number) => api.get(`/chapters/${id}/cards`)
}

export const studyAPI = {
  getStats: () => api.get('/study/stats'),
  getTodayRecords: () => api.get('/study/today'),
  getCalendar: (params?: any) => api.get('/study/calendar', params),
  getLibraryProgress: (libraryId: number) => api.get(`/study/progress/${libraryId}`),
  getRecentCards: (limit?: number) => api.get('/study/recent', { limit }),
  getTrend: (days?: number) => api.get('/study/trend', { days }),
  getHeatmap: (year?: number) => api.get('/study/heatmap', { year }),
  getMonthlyStats: (year: number, month: number) => api.get('/study/monthly-stats', { year, month }),
  getMonthlyAvgStats: (year: number, month: number) => api.get('/study/monthly-avg-stats', { year, month }),
  recordStudyTime: (libraryId: number | null, duration: number) => api.post('/study/time', { libraryId, duration }),
  getStudyTime: () => api.get('/study/time'),
  getTodayStudyTime: () => api.get('/study/today-time'),
  updateDailyGoal: (goal: number) => api.put('/study/daily-goal', { goal }),
  saveProgress: (data: any) => api.post('/study/progress', data),
  getLastProgress: () => api.get('/study/progress/last'),
  resetLibraryProgress: (libraryId: number) => api.post(`/study/reset/${libraryId}`)
}

export const commentAPI = {
  getList: (cardId: number, params?: any) => api.get(`/cards/${cardId}/comments`, params),
  create: (cardId: number, data: any) => api.post(`/cards/${cardId}/comments`, data),
  delete: (id: number) => api.delete(`/comments/${id}`),
  like: (id: number) => api.post(`/comments/${id}/like`)
}

export const favoriteAPI = {
  getList: (params?: any) => api.get('/favorites', params),
  getLibraries: (params?: any) => api.get('/favorites/libraries', params),
  getCards: (params?: any) => api.get('/favorites/cards', params),
  add: (targetType: string, targetId: number) => api.post('/favorites', { targetType, targetId }),
  remove: (targetType: string, targetId: number) => api.delete('/favorites', { targetType, targetId }),
  check: (targetType: string, targetId: number) => api.get('/favorites/check', { targetType, targetId }),
  toggle: (targetType: string, targetId: number) => api.post('/favorites/toggle', { targetType, targetId }),
  addCard: (cardId: number) => api.post('/favorites', { targetType: 'card', targetId: cardId }),
  removeCard: (cardId: number) => api.delete('/favorites', { targetType: 'card', targetId: cardId })
}

export const examAPI = {
  generate: (params?: any) => api.post('/exam/generate', params),
  submit: (data?: any) => api.post('/exam/submit', data)
}

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getLibraries: (params?: any) => api.get('/admin/libraries', params),
  createLibrary: (data: any) => api.post('/admin/libraries', data),
  updateLibrary: (id: number, data: any) => api.put(`/admin/libraries/${id}`, data),
  deleteLibrary: (id: number) => api.delete(`/admin/libraries/${id}`),
  getCards: (params?: any) => api.get('/admin/cards', params),
  createCard: (data: any) => api.post('/admin/cards', data),
  updateCard: (id: number, data: any) => api.put(`/admin/cards/${id}`, data),
  deleteCard: (id: number) => api.delete(`/admin/cards/${id}`),
  getComments: (params?: any) => api.get('/admin/comments', params),
  deleteComment: (id: number) => api.delete(`/admin/comments/${id}`),
  getBlockedWords: (params?: any) => api.get('/admin/blocked-words', params),
  createBlockedWord: (data: { word: string; category?: string }) => api.post('/admin/blocked-words', data),
  updateBlockedWord: (id: number, data: { word?: string; category?: string; is_enabled?: number }) => api.put(`/admin/blocked-words/${id}`, data),
  deleteBlockedWord: (id: number) => api.delete(`/admin/blocked-words/${id}`),
  batchCreateBlockedWords: (data: { words: string[]; category?: string }) => api.post('/admin/blocked-words/batch', data),
  checkSensitive: (text: string) => api.post('/admin/check-sensitive', { text }),
  getFeedbackList: (params?: any) => api.get('/feedback/list', params),
  updateFeedbackStatus: (id: number, data: { status: number; reply?: string }) => api.put(`/feedback/${id}/status`, data)
}

export const messageAPI = {
  getList: (params?: any) => api.get('/messages', params),
  getUnreadCount: () => api.get('/messages/unread-count'),
  markAsRead: (id: number) => api.put(`/messages/${id}/read`),
  markAllAsRead: () => api.put('/messages/read-all'),
  delete: (id: number) => api.delete(`/messages/${id}`),
  broadcast: (data: any) => api.post('/messages/broadcast', data),
  getBroadcastList: (params?: any) => api.get('/messages/broadcast', params),
  revokeBroadcast: (data: { title: string; content: string; created_at: string }) => api.delete('/messages/broadcast', data)
}

export const feedbackAPI = {
  submit: (data: { content: string; contact?: string }) => api.post('/feedback', data),
  getMyList: (params?: any) => api.get('/feedback/my', params)
}

export const isLoggedIn = () => {
  const token = localStorage.getItem('access_token')
  if (!token) return false
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 > Date.now()
  } catch (e) {
    return false
  }
}

export default api

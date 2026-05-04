import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface UserInfo {
  id: number
  userId?: string
  nickName: string
  avatarUrl: string
  email?: string
  bio?: string
  role?: string
  isVip?: boolean
  vipExpireAt?: string | null
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('access_token') || '')
  const userInfo = ref<UserInfo | null>(null)
  const isGuest = ref<boolean>(localStorage.getItem('isGuest') === 'true')

  const isLoggedIn = computed(() => !!token.value)
  const displayName = computed(() => userInfo.value?.nickName || '法硕考生')
  const avatarUrl = computed(() => userInfo.value?.avatarUrl || '/assets/images/default-avatar.svg')
  const userRole = computed(() => userInfo.value?.role || 'user')
  const userIdCode = computed(() => userInfo.value?.userId || '')
  
  const isVip = computed(() => {
    if (!userInfo.value?.isVip) return false
    if (userInfo.value.vipExpireAt) {
      const expireDate = new Date(userInfo.value.vipExpireAt)
      if (expireDate < new Date()) return false
    }
    return true
  })

  const vipExpireAt = computed(() => userInfo.value?.vipExpireAt || null)

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('access_token', newToken)
  }

  function setUserInfo(info: UserInfo) {
    userInfo.value = info
    localStorage.setItem('userInfo', JSON.stringify(info))
  }

  function loadUserInfo() {
    const stored = localStorage.getItem('userInfo')
    if (stored) {
      try {
        userInfo.value = JSON.parse(stored)
      } catch (e) {
        console.error('Failed to parse userInfo:', e)
      }
    }
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    isGuest.value = false
    localStorage.removeItem('access_token')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('isGuest')
  }

  function setGuest(value: boolean) {
    isGuest.value = value
    if (value) {
      localStorage.setItem('isGuest', 'true')
    } else {
      localStorage.removeItem('isGuest')
    }
  }

  function updateDisplayName(name: string) {
    if (userInfo.value) {
      userInfo.value.nickName = name
      localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
    }
  }

  function updateAvatar(url: string) {
    if (userInfo.value) {
      userInfo.value.avatarUrl = url
      localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
    }
  }

  function setVipStatus(status: { isVip: boolean; vipExpireAt?: string | null }) {
    if (userInfo.value) {
      userInfo.value.isVip = status.isVip
      userInfo.value.vipExpireAt = status.vipExpireAt || null
      localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
    }
  }

  loadUserInfo()

  return {
    token,
    userInfo,
    isGuest,
    isLoggedIn,
    displayName,
    avatarUrl,
    userRole,
    userIdCode,
    isVip,
    vipExpireAt,
    setToken,
    setUserInfo,
    loadUserInfo,
    logout,
    setGuest,
    updateDisplayName,
    updateAvatar,
    setVipStatus
  }
})

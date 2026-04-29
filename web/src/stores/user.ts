import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface UserInfo {
  id: number
  nickName: string
  avatarUrl: string
  email?: string
  bio?: string
  role?: string
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('access_token') || '')
  const userInfo = ref<UserInfo | null>(null)
  const isGuest = ref<boolean>(localStorage.getItem('isGuest') === 'true')

  const isLoggedIn = computed(() => !!token.value)
  const displayName = computed(() => userInfo.value?.nickName || '法硕考生')
  const avatarUrl = computed(() => userInfo.value?.avatarUrl || '/assets/images/default-avatar.svg')
  const userRole = computed(() => userInfo.value?.role || 'user')

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

  loadUserInfo()

  return {
    token,
    userInfo,
    isGuest,
    isLoggedIn,
    displayName,
    avatarUrl,
    userRole,
    setToken,
    setUserInfo,
    loadUserInfo,
    logout,
    setGuest,
    updateDisplayName
  }
})

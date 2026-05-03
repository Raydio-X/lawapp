import { defineStore } from 'pinia'
import { ref } from 'vue'
import { messageAPI } from '@/utils/api'

export const useMessageStore = defineStore('message', () => {
  const unreadCount = ref(0)
  let syncInterval: ReturnType<typeof setInterval> | null = null

  async function fetchUnreadCount() {
    try {
      const res = await messageAPI.getUnreadCount()
      if (res.success && res.data) {
        unreadCount.value = res.data.count || 0
      }
    } catch (error) {
      console.error('获取未读消息数失败:', error)
    }
  }

  function setUnreadCount(count: number) {
    unreadCount.value = count
  }

  function decrementUnreadCount() {
    if (unreadCount.value > 0) {
      unreadCount.value--
    }
  }

  function clearUnreadCount() {
    unreadCount.value = 0
  }

  function startSync() {
    if (syncInterval) return
    
    fetchUnreadCount()
    
    syncInterval = setInterval(() => {
      fetchUnreadCount()
    }, 30000)
  }

  function stopSync() {
    if (syncInterval) {
      clearInterval(syncInterval)
      syncInterval = null
    }
  }

  function handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      fetchUnreadCount()
      startSync()
    } else {
      stopSync()
    }
  }

  return {
    unreadCount,
    fetchUnreadCount,
    setUnreadCount,
    decrementUnreadCount,
    clearUnreadCount,
    startSync,
    stopSync,
    handleVisibilityChange
  }
})

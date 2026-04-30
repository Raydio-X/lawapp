import { ref } from 'vue'
import { studyAPI } from '@/utils/api'

const isStudying = ref(false)
const studyStartTime = ref<number | null>(null)
const studyTimer = ref<number | null>(null)
const totalStudyTime = ref(0)

const SYNC_INTERVAL = 30000
const MIN_SYNC_DURATION = 5

export function useStudyTimer() {
  const startStudyTimer = () => {
    if (studyTimer.value) {
      clearInterval(studyTimer.value)
      studyTimer.value = null
    }
    
    isStudying.value = true
    studyStartTime.value = Date.now()
    
    studyTimer.value = window.setInterval(() => {
      syncStudyTime()
    }, SYNC_INTERVAL)
  }

  const pauseStudyTimer = async () => {
    await syncStudyTime()
    
    if (studyTimer.value) {
      clearInterval(studyTimer.value)
      studyTimer.value = null
    }
    
    isStudying.value = false
  }

  const stopStudyTimer = async () => {
    await syncStudyTime()
    
    if (studyTimer.value) {
      clearInterval(studyTimer.value)
      studyTimer.value = null
    }
    
    isStudying.value = false
    studyStartTime.value = null
  }

  const syncStudyTime = async () => {
    if (!studyStartTime.value) return
    
    const duration = Math.floor((Date.now() - studyStartTime.value) / 1000)
    if (duration < MIN_SYNC_DURATION) return
    
    const token = localStorage.getItem('access_token')
    if (!token) return
    
    try {
      const res = await studyAPI.recordStudyTime(null, duration)
      if (res.success) {
        studyStartTime.value = Date.now()
        totalStudyTime.value += duration
      }
    } catch (error) {
      console.error('同步学习时间失败:', error)
    }
  }

  const getStudyStatus = () => {
    return isStudying.value
  }

  const getStudyDuration = () => {
    if (!studyStartTime.value) return 0
    return Math.floor((Date.now() - studyStartTime.value) / 1000)
  }

  return {
    isStudying,
    totalStudyTime,
    startStudyTimer,
    pauseStudyTimer,
    stopStudyTimer,
    getStudyStatus,
    getStudyDuration
  }
}

let globalStudyTimer: ReturnType<typeof useStudyTimer> | null = null

export function useGlobalStudyTimer() {
  if (!globalStudyTimer) {
    globalStudyTimer = useStudyTimer()
  }
  return globalStudyTimer
}

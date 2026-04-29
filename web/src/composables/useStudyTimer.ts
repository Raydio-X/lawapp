import { ref, onMounted, onUnmounted } from 'vue'
import { studyAPI } from '@/utils/api'

const isStudying = ref(false)
const studyStartTime = ref<number | null>(null)
const studyTimer = ref<number | null>(null)
const totalStudyTime = ref(0)

const SYNC_INTERVAL = 30000
const MIN_SYNC_DURATION = 5

export function useStudyTimer() {
  const startStudyTimer = () => {
    if (isStudying.value) return
    
    isStudying.value = true
    studyStartTime.value = Date.now()
    
    if (studyTimer.value) {
      clearInterval(studyTimer.value)
    }
    
    studyTimer.value = window.setInterval(() => {
      syncStudyTime()
    }, SYNC_INTERVAL)
    
    console.log('学习计时开始')
  }

  const pauseStudyTimer = () => {
    if (!isStudying.value) return
    
    syncStudyTime()
    
    if (studyTimer.value) {
      clearInterval(studyTimer.value)
      studyTimer.value = null
    }
    
    isStudying.value = false
    console.log('学习计时暂停')
  }

  const stopStudyTimer = () => {
    if (!isStudying.value) return
    
    syncStudyTime()
    
    if (studyTimer.value) {
      clearInterval(studyTimer.value)
      studyTimer.value = null
    }
    
    isStudying.value = false
    studyStartTime.value = null
    console.log('学习计时停止')
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
        console.log(`同步学习时长: ${duration}秒`)
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

  onUnmounted(() => {
    if (studyTimer.value) {
      clearInterval(studyTimer.value)
    }
  })

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
    const { isStudying, totalStudyTime, startStudyTimer, pauseStudyTimer, stopStudyTimer, getStudyStatus, getStudyDuration } = useStudyTimer()
    globalStudyTimer = {
      isStudying,
      totalStudyTime,
      startStudyTimer,
      pauseStudyTimer,
      stopStudyTimer,
      getStudyStatus,
      getStudyDuration
    }
  }
  return globalStudyTimer
}

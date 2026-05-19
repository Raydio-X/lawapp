import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next'
import { useUserStore } from '@/stores/user'
import { activationAPI, studyAPI } from '@/utils/api'

export interface PermissionLimit {
  maxCards: number
  maxLibraries: number
  canCommentToCard: boolean
  canDerivativeLearning: boolean
  batchImportPerDay: number
  canViewStudyDetail: boolean
}

export const FREE_USER_LIMITS: PermissionLimit = {
  maxCards: 300,
  maxLibraries: 5,
  canCommentToCard: false,
  canDerivativeLearning: false,
  batchImportPerDay: 3,
  canViewStudyDetail: false
}

export const VIP_USER_LIMITS: PermissionLimit = {
  maxCards: Infinity,
  maxLibraries: Infinity,
  canCommentToCard: true,
  canDerivativeLearning: true,
  batchImportPerDay: Infinity,
  canViewStudyDetail: true
}

export function usePermission() {
  const router = useRouter()
  const userStore = useUserStore()
  
  const batchImportUsedToday = ref(false)
  const loading = ref(false)

  const isVip = computed(() => userStore.isVip)
  const vipExpireAt = computed(() => userStore.vipExpireAt)
  
  const limits = computed<PermissionLimit>(() => {
    return isVip.value ? VIP_USER_LIMITS : FREE_USER_LIMITS
  })

  const getTodayKey = () => {
    const today = new Date()
    return `batch_import_${today.getFullYear()}_${today.getMonth() + 1}_${today.getDate()}`
  }

  const checkBatchImportStatus = async () => {
    if (isVip.value) {
      batchImportUsedToday.value = false
      return false
    }
    
    const todayKey = getTodayKey()
    const usedToday = localStorage.getItem(todayKey) === 'true'
    batchImportUsedToday.value = usedToday
    
    try {
      const res = await activationAPI.checkBatchImport()
      if (res.success && res.data) {
        batchImportUsedToday.value = res.data.usedToday || usedToday
        return res.data.usedToday || usedToday
      }
    } catch (error) {
      console.error('检查批量导入状态失败:', error)
    }
    return usedToday
  }

  const recordBatchImportUsage = () => {
    if (isVip.value) return
    const todayKey = getTodayKey()
    localStorage.setItem(todayKey, 'true')
    batchImportUsedToday.value = true
  }

  const showVipRequiredDialog = (feature: string, onConfirm?: () => void) => {
    const dialog = DialogPlugin.confirm({
      header: 'VIP专属功能',
      body: `${feature}是VIP专属功能，开通VIP后即可解锁使用。是否前往激活中心？`,
      confirmBtn: '去激活',
      cancelBtn: '取消',
      onConfirm: () => {
        dialog.hide()
        if (onConfirm) {
          onConfirm()
        } else {
          router.push('/profile/activation')
        }
      }
    })
    return dialog
  }

  const showLimitReachedDialog = (feature: string, limit: number, current: number, onConfirm?: () => void) => {
    const dialog = DialogPlugin.confirm({
      header: '已达上限',
      body: `您已创建${current}个${feature}，普通用户最多只能创建${limit}个${feature}。开通VIP后可解除限制。是否前往激活中心？`,
      confirmBtn: '去激活',
      cancelBtn: '取消',
      onConfirm: () => {
        dialog.hide()
        if (onConfirm) {
          onConfirm()
        } else {
          router.push('/profile/activation')
        }
      }
    })
    return dialog
  }

  const canCreateCard = async (currentCount: number): Promise<boolean> => {
    if (isVip.value) return true
    
    if (currentCount >= limits.value.maxCards) {
      showLimitReachedDialog('卡片', limits.value.maxCards, currentCount)
      return false
    }
    return true
  }

  const canCreateLibrary = async (currentCount: number): Promise<boolean> => {
    if (isVip.value) return true
    
    if (currentCount >= limits.value.maxLibraries) {
      showLimitReachedDialog('知识库', limits.value.maxLibraries, currentCount)
      return false
    }
    return true
  }

  const canUseBatchImport = async (): Promise<boolean> => {
    if (isVip.value) return true
    
    try {
      const res = await activationAPI.checkBatchImport()
      if (res.success && res.data) {
        const remaining = res.data.remaining || 0
        if (remaining <= 0) {
          const dialog = DialogPlugin.confirm({
            header: '今日次数已用完',
            body: '普通用户每天只能使用3次批量导入功能，请明天再试或开通VIP解除限制。是否前往激活中心？',
            confirmBtn: '去激活',
            cancelBtn: '取消',
            onConfirm: () => {
              dialog.hide()
              router.push('/profile/activation')
            }
          })
          return false
        }
        return true
      }
    } catch (error) {
      console.error('检查批量导入状态失败:', error)
    }
    return false
  }

  const canViewStudyDetail = (): boolean => {
    if (isVip.value) return true
    showVipRequiredDialog('查看学习详情')
    return false
  }

  const canUseCommentToCard = (): boolean => {
    if (isVip.value) return true
    showVipRequiredDialog('笔记转换为卡片')
    return false
  }

  const canUseDerivativeLearning = (): boolean => {
    if (isVip.value) return true
    showVipRequiredDialog('关联学习')
    return false
  }

  const refreshVipStatus = async () => {
    loading.value = true
    try {
      const res = await activationAPI.getStatus()
      if (res.success && res.data) {
        userStore.setVipStatus({
          isVip: res.data.is_vip || res.data.isVip || false,
          vipExpireAt: res.data.vip_expires_at || res.data.vipExpireAt || null
        })
      }
    } catch (error) {
      console.error('刷新VIP状态失败:', error)
    } finally {
      loading.value = false
    }
  }

  return {
    isVip,
    vipExpireAt,
    limits,
    batchImportUsedToday,
    loading,
    checkBatchImportStatus,
    showVipRequiredDialog,
    showLimitReachedDialog,
    canCreateCard,
    canCreateLibrary,
    canUseBatchImport,
    canViewStudyDetail,
    canUseCommentToCard,
    canUseDerivativeLearning,
    recordBatchImportUsage,
    refreshVipStatus
  }
}

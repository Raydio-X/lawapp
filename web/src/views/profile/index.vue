<template>
  <div class="container">
    <div class="user-section" :class="{ 'vip-theme': userStore.isVip }">
      <div class="glow glow-1"></div>
      <div class="glow glow-2"></div>
      <div class="glow glow-3"></div>
      
      <div class="star star-1">✦</div>
      <div class="star star-2">✧</div>
      <div class="star star-3">✦</div>
      <div class="star star-4">✧</div>
      
      <div class="vip-bg-text" v-if="userStore.isVip">VIP</div>
      
      <div class="user-card">
        <div class="user-info">
          <t-avatar 
            class="user-avatar"
            :image="userStore.avatarUrl" 
            size="60px"
            shape="circle"
          />
          <div class="user-detail">
            <span class="user-name">
              {{ userStore.displayName }}
              <span class="vip-badge" v-if="userStore.isVip">VIP</span>
              <span class="normal-badge" v-else>普通用户</span>
            </span>
            <span class="user-id" v-if="userStore.userIdCode">ID: {{ userStore.userIdCode }}</span>
          </div>
        </div>
        <div class="user-edit" @click="onEditProfile">
          <t-icon name="edit" size="16px" color="#fff" />
        </div>
      </div>

      <div class="stats-section">
        <div class="stat-item" @click="onStatTap('library')">
          <span class="stat-number">{{ stats.libraryCount }}</span>
          <span class="stat-label">知识库</span>
        </div>
        <div class="stat-item" @click="onStatTap('card')">
          <span class="stat-number">{{ stats.cardCount }}</span>
          <span class="stat-label">卡片</span>
        </div>
        <div class="stat-item" @click="onStatTap('favorite')">
          <span class="stat-number">{{ stats.favoriteCount }}</span>
          <span class="stat-label">收藏</span>
        </div>
      </div>
    </div>

    <div class="today-section">
      <div class="section-header">
        <span class="section-title">今日学习</span>
        <span class="section-more" @click="onViewDetail">查看详情</span>
      </div>
      
      <div class="core-stats">
        <div class="core-stat-item">
          <div class="core-stat-icon time-icon">
            <t-icon name="time" size="20px" color="#3B82F6" />
          </div>
          <div class="core-stat-content">
            <span class="core-stat-value">{{ studyProgress.totalTime }}</span>
            <span class="core-stat-label">学习时长</span>
          </div>
        </div>
        <div class="core-stat-divider"></div>
        <div class="core-stat-item">
          <div class="core-stat-icon streak-icon">
            <t-icon name="calendar" size="20px" color="#FF6B35" />
          </div>
          <div class="core-stat-content">
            <span class="core-stat-value">{{ studyProgress.streak }}天</span>
            <span class="core-stat-label">累计打卡</span>
          </div>
        </div>
      </div>

      <div class="goal-card">
        <div class="goal-header">
          <span class="goal-title">今日目标</span>
          <span class="goal-progress">{{ studyProgress.todayCards }}/{{ studyProgress.dailyGoal }}张</span>
        </div>
        <div class="goal-bar">
          <div class="goal-bar-fill" :style="{ width: goalPercent + '%' }"></div>
        </div>
        <span class="goal-hint" v-if="studyProgress.todayCards >= studyProgress.dailyGoal">🎉 今日目标已达成！</span>
        <span class="goal-hint" v-else>还差{{ studyProgress.dailyGoal - studyProgress.todayCards }}张完成目标</span>
      </div>

      <div class="stats-grid">
        <div class="grid-item">
          <span class="grid-value">{{ studyProgress.todayNew }}</span>
          <span class="grid-label">今日新学</span>
        </div>
        <div class="grid-item">
          <span class="grid-value">{{ studyProgress.weekTime }}</span>
          <span class="grid-label">本周累计</span>
          <div class="grid-trend up" v-if="studyProgress.weekTrend > 0">↑{{ studyProgress.weekTrend }}%</div>
          <div class="grid-trend down" v-else-if="studyProgress.weekTrend < 0">↓{{ -studyProgress.weekTrend }}%</div>
        </div>
        <div class="grid-item">
          <span class="grid-value">{{ studyProgress.toReview }}</span>
          <span class="grid-label">待复习</span>
          <div class="grid-tag review" v-if="studyProgress.toReview > 0">需复习</div>
        </div>
        <div class="grid-item">
          <span class="grid-value">{{ studyProgress.totalCards }}</span>
          <span class="grid-label">累计背诵</span>
        </div>
      </div>
    </div>

    <div class="menu-section">
      <div class="menu-list">
        <div class="menu-item" @click="onMenuTap('plan')">
          <div class="menu-left">
            <t-icon name="calendar" size="22px" color="#00A870" />
            <span class="menu-title">学习计划</span>
          </div>
          <div class="menu-right">
            <t-icon name="chevron-right" size="16px" color="#ccc" />
          </div>
        </div>
        <div class="menu-item" @click="onMenuTap('message')">
          <div class="menu-left">
            <t-icon name="notification" size="22px" color="#3B82F6" />
            <span class="menu-title">消息中心</span>
          </div>
          <div class="menu-right">
            <span class="badge-number" v-if="messageStore.unreadCount > 0">{{ messageStore.unreadCount > 99 ? '99+' : messageStore.unreadCount }}</span>
            <t-icon name="chevron-right" size="16px" color="#ccc" />
          </div>
        </div>
      </div>
    </div>

    <div class="menu-section">
      <div class="menu-list">
        <div class="menu-item" @click="onMenuTap('achievement')">
          <div class="menu-left">
            <t-icon name="certificate" size="22px" color="#E37324" />
            <span class="menu-title">我的成就</span>
          </div>
          <div class="menu-right">
            <t-icon name="chevron-right" size="16px" color="#ccc" />
          </div>
        </div>
        <div class="menu-item" @click="onMenuTap('activation')">
          <div class="menu-left">
            <t-icon name="link" size="22px" color="#7B61FF" />
            <span class="menu-title">激活中心</span>
          </div>
          <div class="menu-right">
            <span class="vip-status-tag" v-if="userStore.isVip">已激活</span>
            <span class="activate-tag" v-else>去激活</span>
            <t-icon name="chevron-right" size="16px" color="#ccc" />
          </div>
        </div>
        <div class="menu-item" @click="onMenuTap('feedback')">
          <div class="menu-left">
            <t-icon name="chat" size="22px" color="#0594FA" />
            <span class="menu-title">意见反馈</span>
          </div>
          <div class="menu-right">
            <t-icon name="chevron-right" size="16px" color="#ccc" />
          </div>
        </div>
      </div>
    </div>

    <div class="menu-section logout-section">
      <div class="menu-list">
        <div class="menu-item logout" @click="onLogout">
          <div class="menu-left">
            <t-icon name="logout" size="22px" color="#E34D59" />
            <span class="menu-title logout-title">退出登录</span>
          </div>
        </div>
      </div>
    </div>

    <div class="version-info">
      <span>律卡 v1.0.0</span>
      <a class="icp" href="http://beian.miit.gov.cn/" target="_blank">浙ICP备2026028213号</a>
      <a class="police-record" href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=33032802000186" target="_blank">
        <img src="/assets/images/police-badge.png" alt="公安备案" class="police-icon" />
        <span>浙公网安备33032802000186号</span>
      </a>
    </div>

    <div class="bottom-placeholder"></div>

    <div class="nickname-popup" v-if="showNicknamePopup" @click.self="showNicknamePopup = false">
      <div class="nickname-popup-container" @click.stop>
        <div class="nickname-popup-header">
          <template v-if="editStep === 'menu'">
            <span class="nickname-popup-title">编辑资料</span>
            <div class="nickname-popup-close" @click="showNicknamePopup = false">
              <t-icon name="close" size="16px" color="#999" />
            </div>
          </template>
          <template v-else>
            <div class="back-btn" @click="editStep = 'menu'">
              <t-icon name="chevron-left" size="18px" color="#666" />
            </div>
            <span class="nickname-popup-title">{{ editStep === 'avatar' ? '编辑头像' : '编辑昵称' }}</span>
            <div class="placeholder"></div>
          </template>
        </div>
        
        <div class="nickname-popup-body" v-if="editStep === 'menu'">
          <div class="menu-item" @click="editStep = 'avatar'">
            <div class="menu-left">
              <t-icon name="user-avatar" size="20px" color="#333" />
              <span class="menu-text">编辑头像</span>
            </div>
            <t-icon name="chevron-right" size="16px" color="#999" />
          </div>
          <div class="menu-item" @click="editStep = 'nickname'">
            <div class="menu-left">
              <t-icon name="edit-1" size="20px" color="#333" />
              <span class="menu-text">编辑昵称</span>
            </div>
            <t-icon name="chevron-right" size="16px" color="#999" />
          </div>
        </div>
        
        <div class="nickname-popup-body" v-else-if="editStep === 'avatar'">
          <div class="avatar-section">
            <div class="avatar-list">
              <div 
                v-for="avatar in avatarList" 
                :key="avatar.id"
                class="avatar-item"
                :class="{ selected: selectedAvatar === avatar.url }"
                @click="selectedAvatar = avatar.url"
              >
                <img :src="avatar.url" :alt="avatar.name" class="avatar-img" />
              </div>
            </div>
          </div>
        </div>
        
        <div class="nickname-popup-body" v-else-if="editStep === 'nickname'">
          <div class="nickname-section">
            <div class="nickname-input-wrapper">
              <input 
                class="nickname-input" 
                placeholder="请输入昵称" 
                v-model="nicknameInput"
                maxlength="10"
              />
              <span class="nickname-count">{{ nicknameInput.length }}/10</span>
            </div>
            <div class="nickname-tip warning" v-if="!nicknameCheckResult.canUpdate">
              <t-icon name="info-circle" size="14px" color="#ff9800" />
              <span>昵称修改需间隔30天，还需等待{{ nicknameCheckResult.remainingDays }}天</span>
            </div>
            <div class="nickname-tip" v-else>
              <t-icon name="info-circle" size="14px" color="#94A3B8" />
              <span>每30天仅允许修改一次昵称</span>
            </div>
          </div>
        </div>
        
        <div class="nickname-popup-footer" v-if="editStep !== 'menu'">
          <div class="nickname-popup-btn cancel" @click="editStep = 'menu'">取消</div>
          <div class="nickname-popup-btn confirm" @click="onConfirmProfile">确定</div>
        </div>
      </div>
    </div>

    <Picker
      v-model:visible="showPlanPicker"
      title="设置每日学习目标"
      :options="planOptions"
      :value="[tempCardCount]"
      @confirm="onPlanConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next'
import { useUserStore } from '@/stores/user'
import { useMessageStore } from '@/stores/message'
import { studyAPI, authAPI } from '@/utils/api'
import { usePermission } from '@/composables/usePermission'
import Picker from '@/components/Picker.vue'

const router = useRouter()
const userStore = useUserStore()
const messageStore = useMessageStore()
const { refreshVipStatus } = usePermission()

const stats = ref({
  libraryCount: 0,
  cardCount: 0,
  favoriteCount: 0
})

const studyProgress = ref({
  totalTime: '0分钟',
  streak: 0,
  todayCards: 0,
  dailyGoal: 20,
  todayNew: 0,
  weekTime: '0小时',
  weekTrend: 0,
  toReview: 0,
  totalCards: 0
})

const showPlanPicker = ref(false)
const tempCardCount = ref(20)

const planOptions = computed(() => {
  return [10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(count => ({
    label: `${count} 张`,
    value: count
  }))
})

const showNicknamePopup = ref(false)
const editStep = ref<'menu' | 'avatar' | 'nickname'>('menu')
const nicknameInput = ref('')
const selectedAvatar = ref('')
const nicknameCheckResult = ref<{ canUpdate: boolean; remainingDays: number }>({ canUpdate: true, remainingDays: 0 })

const avatarList = [
  { id: 1, name: '头像1', url: '/assets/images/avatars/avatar-1.png' },
  { id: 2, name: '头像2', url: '/assets/images/avatars/avatar-2.png' },
  { id: 3, name: '头像3', url: '/assets/images/avatars/avatar-3.png' },
  { id: 4, name: '头像4', url: '/assets/images/avatars/avatar-4.png' },
  { id: 5, name: '头像5', url: '/assets/images/avatars/avatar-5.png' },
  { id: 6, name: '头像6', url: '/assets/images/avatars/avatar-6.png' }
]

const goalPercent = computed(() => {
  const percent = (studyProgress.value.todayCards / studyProgress.value.dailyGoal) * 100
  return Math.min(percent, 100)
})

onMounted(() => {
  loadData()
  refreshVipStatus()
  
  document.addEventListener('visibilitychange', onVisibilityChange)
})

const onVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    loadData()
    refreshVipStatus()
  }
}

onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange)
})

const loadData = async () => {
  try {
    const [statsRes, studyRes] = await Promise.all([
      studyAPI.getStats(),
      studyAPI.getTodayStudyTime()
    ])
    
    if (statsRes.success && statsRes.data) {
      stats.value.libraryCount = statsRes.data.libraryCount || 0
      stats.value.cardCount = statsRes.data.cardCount || 0
      stats.value.favoriteCount = statsRes.data.favoriteCount || 0
      studyProgress.value.streak = statsRes.data.streak || 0
      studyProgress.value.todayCards = statsRes.data.todayCards || 0
      studyProgress.value.todayNew = statsRes.data.todayNew || 0
      studyProgress.value.toReview = statsRes.data.toReview || 0
      studyProgress.value.totalCards = statsRes.data.totalCards || 0
      studyProgress.value.dailyGoal = statsRes.data.dailyGoal || 20
      tempCardCount.value = statsRes.data.dailyGoal || 20
      
      const weekSeconds = statsRes.data.weekTime || 0
      const weekMinutes = Math.floor(weekSeconds / 60)
      studyProgress.value.weekTime = weekMinutes >= 60 
        ? `${(weekMinutes / 60).toFixed(1)}小时` 
        : `${weekMinutes}分钟`
      studyProgress.value.weekTrend = statsRes.data.weekTrend || 0
    }
    
    if (studyRes.success && studyRes.data) {
      const minutes = studyRes.data.minutes || 0
      studyProgress.value.totalTime = minutes >= 60 
        ? `${Math.floor(minutes / 60)}小时${minutes % 60}分钟` 
        : `${minutes}分钟`
    }
    
    messageStore.fetchUnreadCount()
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

const onEditProfile = async () => {
  nicknameInput.value = userStore.displayName
  selectedAvatar.value = userStore.avatarUrl
  editStep.value = 'menu'
  showNicknamePopup.value = true
  
  try {
    const res = await authAPI.checkNicknameUpdate()
    if (res.success && res.data) {
      nicknameCheckResult.value = res.data
    }
  } catch (error) {
    console.error('检查昵称修改状态失败:', error)
  }
}

const onConfirmProfile = async () => {
  const updateData: any = {}
  let hasChange = false
  
  if (editStep.value === 'avatar') {
    if (selectedAvatar.value && selectedAvatar.value !== userStore.avatarUrl) {
      updateData.avatar = selectedAvatar.value
      hasChange = true
    }
  } else if (editStep.value === 'nickname') {
    if (nicknameInput.value !== userStore.displayName) {
      if (!nicknameCheckResult.value.canUpdate) {
        MessagePlugin.warning(`昵称修改需要间隔30天，还需等待${nicknameCheckResult.value.remainingDays}天`)
        return
      }
      updateData.nickname = nicknameInput.value
      hasChange = true
    }
  }
  
  if (!hasChange) {
    showNicknamePopup.value = false
    return
  }
  
  try {
    const res = await authAPI.updateProfile(updateData)
    if (res.success) {
      if (updateData.nickname) {
        userStore.updateDisplayName(updateData.nickname)
        nicknameCheckResult.value = { canUpdate: false, remainingDays: 30 }
      }
      if (updateData.avatar) {
        userStore.updateAvatar(updateData.avatar)
      }
      MessagePlugin.success('资料更新成功')
      showNicknamePopup.value = false
    } else {
      MessagePlugin.error(res.message || '资料更新失败')
    }
  } catch (error) {
    console.error('更新资料失败:', error)
    MessagePlugin.error('资料更新失败')
  }
}

const onStatTap = (type: string) => {
  if (type === 'library') {
    router.push('/profile/libraries')
  } else if (type === 'card') {
    router.push('/profile/cards')
  } else if (type === 'favorite') {
    router.push('/profile/favorites')
  }
}

const onViewDetail = () => {
  router.push('/profile/study-stats')
}

const onMenuTap = (menu: string) => {
  switch (menu) {
    case 'favorite':
      router.push('/profile/favorites')
      break
    case 'message':
      router.push('/profile/messages')
      break
    case 'achievement':
      MessagePlugin.info('成就功能开发中')
      break
    case 'plan':
      tempCardCount.value = studyProgress.value.dailyGoal
      showPlanPicker.value = true
      break
    case 'activation':
      router.push('/profile/activation')
      break
    case 'feedback':
      router.push('/profile/feedback')
      break
  }
}

const onPlanConfirm = async (value: (string | number)[]) => {
  try {
    const count = value[0] as number
    
    const res = await studyAPI.updateDailyGoal(count)
    
    if (res.success) {
      studyProgress.value.dailyGoal = count
      tempCardCount.value = count
      MessagePlugin.success('设置成功')
    } else {
      MessagePlugin.error(res.message || '设置失败')
    }
  } catch (error: any) {
    console.error('设置学习计划失败:', error)
    MessagePlugin.error(error.message || '设置失败')
  }
}

const onConfirmNickname = async () => {
  if (!nicknameInput.value.trim()) {
    MessagePlugin.warning('请输入昵称')
    return
  }
  
  try {
    userStore.updateDisplayName(nicknameInput.value.trim())
    showNicknamePopup.value = false
    MessagePlugin.success('修改成功')
  } catch (error) {
    console.error('修改昵称失败:', error)
    MessagePlugin.error('修改失败')
  }
}

const onLogout = () => {
  const confirmDialog = DialogPlugin.confirm({
    header: '提示',
    body: '确定要退出登录吗？',
    onConfirm: () => {
      userStore.logout()
      MessagePlugin.success('已退出登录')
      router.push('/login')
      confirmDialog.hide()
    }
  })
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #FFFFFF;
  padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px));
}

.user-section {
  position: relative;
  background: linear-gradient(180deg, #3B82F6 0%, #60A5FA 40%, #FFFFFF 100%);
  padding: 24px 16px 16px;
  border-radius: 0 0 20px 20px;
  margin-bottom: 12px;
  overflow: hidden;
  
  &.vip-theme {
    background: linear-gradient(180deg, #f8c648 30%, #FFFFFF 100%);
  }
}

.glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(30px);
  opacity: 0.4;
  pointer-events: none;
}

.glow-1 {
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.6);
  top: -30px;
  right: 30px;
  
  .vip-theme & {
    background: rgba(255, 215, 0, 0.5);
  }
}

.glow-2 {
  width: 75px;
  height: 75px;
  background: rgba(59, 130, 246, 0.3);
  bottom: 20px;
  left: -15px;
  
  .vip-theme & {
    background: rgba(184, 134, 11, 0.4);
  }
}

.glow-3 {
  width: 60px;
  height: 60px;
  background: rgba(96, 165, 250, 0.4);
  top: 40px;
  left: 50px;
  
  .vip-theme & {
    background: rgba(218, 165, 32, 0.5);
  }
}

.star {
  position: absolute;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  pointer-events: none;
  animation: twinkle 2s ease-in-out infinite;
  
  .vip-theme & {
    color: rgba(255, 255, 255, 0.9);
    text-shadow: 0 0 6px rgba(255, 215, 0, 0.8);
  }
}

.star-1 { top: 15px; right: 40px; animation-delay: 0s; }
.star-2 { top: 50px; right: 100px; animation-delay: 0.5s; font-size: 10px; }
.star-3 { bottom: 40px; right: 20px; animation-delay: 1s; }
.star-4 { top: 30px; left: 30px; animation-delay: 1.5s; font-size: 9px; }

@keyframes twinkle {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}

.vip-bg-text {
  position: absolute;
  top: 48%;
  right: 5px;
  transform: translateY(-50%);
  font-size: 80px;
  font-weight: 900;
  color: rgba(255, 255, 255, 0.2);
  letter-spacing: -5px;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
  white-space: nowrap;
}

.user-card {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  border: 2px solid rgba(255, 255, 255, 0.5);
}

.user-detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-name {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 6px;
}

.vip-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
  color: #fff4d5;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  margin-left: 3px;
  border: 1px solid rgba(245, 200, 66, 0.3);
}

.normal-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
  margin-left: 6px;
}

.user-id {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 2px;
}

.user-edit {
  width: 32px;
  height: 32px;
  background-color: rgba(255, 255, 255, 0.25);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(5px);
  border: 0.5px solid rgba(255, 255, 255, 0.4);
  cursor: pointer;
  
  &:active {
    background-color: rgba(255, 255, 255, 0.4);
  }
}

.stats-section {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 10px;
  padding: 16px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 0 12px;
  cursor: pointer;
  
  &:active {
    opacity: 0.9;
  }
  
  &:not(:last-child) {
    border-right: 1px solid #E2E8F0;
  }
}

.stat-number {
  font-size: 20px;
  font-weight: 700;
  color: #1E293B;
}

.stat-label {
  font-size: 12px;
  color: #64748B;
}

.today-section {
  background-color: #fff;
  margin: 12px 16px;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1E293B;
}

.section-more {
  font-size: 13px;
  color: #3B82F6;
  cursor: pointer;
}

.core-stats {
  display: flex;
  background: linear-gradient(135deg, #f8faff 0%, #f0f5ff 100%);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.core-stat-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 15px;
}

.core-stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.time-icon {
  background: linear-gradient(135deg, #e8f0ff 0%, #d4e4ff 100%);
}

.streak-icon {
  background: linear-gradient(135deg, #fff3e8 0%, #ffe4d4 100%);
}

.core-stat-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.core-stat-value {
  font-size: 15px;
  font-weight: 700;
  color: #1E293B;
}

.core-stat-label {
  font-size: 12px;
  color: #64748B;
}

.core-stat-divider {
  width: 1px;
  height: 30px;
  background-color: rgba(0, 0, 0, 0.08);
  margin: 0 8px;
}

.goal-card {
  background: linear-gradient(135deg, #f0f7ff 0%, #e8f4ff 100%);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.goal-title {
  font-size: 14px;
  font-weight: 600;
  color: #1E293B;
}

.goal-progress {
  font-size: 14px;
  font-weight: 600;
  color: #3B82F6;
}

.goal-bar {
  height: 8px;
  background-color: rgba(59, 130, 246, 0.15);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 6px;
}

.goal-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #3B82F6 0%, #60A5FA 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.goal-hint {
  font-size: 12px;
  color: #64748B;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.grid-item {
  background-color: #F8FAFC;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.grid-value {
  font-size: 16px;
  font-weight: 700;
  color: #1E293B;
}

.grid-label {
  font-size: 12px;
  color: #64748B;
}

.grid-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  margin-top: 2px;
  
  &.review {
    background-color: #f0e8ff;
    color: #8B5CF6;
  }
}

.grid-trend {
  font-size: 11px;
  font-weight: 500;
  margin-top: 2px;
  
  &.up { color: #10B981; }
  &.down { color: #EF4444; }
}

.menu-section {
  margin: 12px 16px;
  background-color: #fff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.menu-list {
  display: flex;
  flex-direction: column;
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:not(:last-child) {
    border-bottom: 1px solid #f0f0f0;
  }

  &:active {
    background-color: #f5f5f5;
  }

  &.logout {
    justify-content: center;
  }
}

.menu-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.vip-status-tag {
  font-size: 12px;
  font-weight: 500;
  color: #FFD700;
  background: rgba(255, 215, 0, 0.15);
  padding: 2px 8px;
  border-radius: 10px;
}

.activate-tag {
  font-size: 12px;
  font-weight: 500;
  color: #7B61FF;
  background: rgba(123, 97, 255, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
}

.menu-title {
  font-size: 15px;
  color: #1E293B;
  font-weight: 500;

  &.logout-title {
    color: #E34D59;
  }
}

.menu-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.custom-badge {
  font-size: 14px;
  font-weight: 500;
  color: #64748B;
  margin-right: 4px;
}

.badge-number {
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  background-color: #EF4444;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  line-height: 1;
}

.logout-section {
  margin-top: 24px;
}

.version-info {
  text-align: center;
  padding: 24px 0;
  font-size: 12px;
  color: #94A3B8;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.version-info .icp {
  font-size: 11px;
  color: #CBD5E1;
  text-decoration: none;
  
  &:hover {
    color: #94A3B8;
  }
}

.police-record {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 11px;
  color: #CBD5E1;
  text-decoration: none;
  
  &:hover {
    color: #94A3B8;
  }
}

.police-icon {
  width: 14px;
  height: 15px;
  vertical-align: middle;
}

.bottom-placeholder {
  height: 24px;
}

.nickname-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 10001;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.nickname-popup-container {
  width: 300px;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  animation: scaleIn 0.2s ease;
}

@keyframes scaleIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.nickname-popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #E2E8F0;
}

.nickname-popup-header .back-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.nickname-popup-header .placeholder {
  width: 28px;
}

.nickname-popup-title {
  font-size: 16px;
  font-weight: 600;
  color: #1E293B;
}

.nickname-popup-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F8FAFC;
  border-radius: 50%;
  cursor: pointer;
}

.nickname-popup-body {
  padding: 20px 16px 30px;
}

.nickname-popup-body .menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 12px;
  background: #F8FAFC;
  border-radius: 10px;
  margin-bottom: 12px;
  cursor: pointer;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &:active {
    background: #F1F5F9;
  }
}

.nickname-popup-body .menu-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.nickname-popup-body .menu-text {
  font-size: 15px;
  color: #333;
}

.section-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 12px;
  display: block;
}

.avatar-section {
  margin-bottom: 24px;
}

.avatar-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.avatar-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 0 0 2px transparent;
  transition: all 0.2s ease;
  
  &:active {
    transform: scale(0.95);
  }
  
  &.selected {
    box-shadow: 0 0 0 2px #00B578;
  }
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nickname-section {
  margin-bottom: 0;
}

.nickname-input-wrapper {
  display: flex;
  align-items: center;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 0 12px;
  background: #F8FAFC;
}

.nickname-input-wrapper:focus-within {
  border-color: #3B82F6;
  background: #fff;
}

.nickname-input {
  flex: 1;
  height: 40px;
  font-size: 14px;
  color: #1E293B;
  border: none;
  outline: none;
  background: transparent;
}

.nickname-count {
  font-size: 12px;
  color: #94A3B8;
  margin-left: 8px;
}

.nickname-tip {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  font-size: 12px;
  color: #94A3B8;
}

.nickname-tip.warning {
  padding: 8px 12px;
  background: #FFF8E1;
  border-radius: 6px;
  color: #F57C00;
}

.nickname-popup-footer {
  display: flex;
  border-top: 1px solid #E2E8F0;
}

.nickname-popup-btn {
  flex: 1;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.nickname-popup-btn.cancel {
  color: #64748B;
  border-right: 1px solid #E2E8F0;
}

.nickname-popup-btn.confirm {
  color: #3B82F6;
}
</style>

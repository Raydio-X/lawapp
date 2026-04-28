<template>
  <div class="container">
    <div class="user-section">
      <div class="glow glow-1"></div>
      <div class="glow glow-2"></div>
      <div class="glow glow-3"></div>
      
      <div class="star star-1">✦</div>
      <div class="star star-2">✧</div>
      <div class="star star-3">✦</div>
      <div class="star star-4">✧</div>
      
      <div class="user-card">
        <div class="user-info">
          <t-avatar 
            class="user-avatar"
            :image="userStore.avatarUrl" 
            size="large"
            shape="circle"
          />
          <div class="user-detail">
            <span class="user-name">{{ userStore.displayName }}</span>
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
            <span class="core-stat-label">连续打卡</span>
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
        <div class="menu-item" @click="onMenuTap('favorite')">
          <div class="menu-left">
            <t-icon name="star" size="22px" color="#FFAD1F" />
            <span class="menu-title">我的收藏</span>
          </div>
          <div class="menu-right">
            <span class="custom-badge" v-if="stats.favoriteCount > 0">{{ stats.favoriteCount }}</span>
            <t-icon name="chevron-right" size="16px" color="#ccc" />
          </div>
        </div>
        <div class="menu-item" @click="onMenuTap('message')">
          <div class="menu-left">
            <t-icon name="notification" size="22px" color="#3B82F6" />
            <span class="menu-title">消息中心</span>
          </div>
          <div class="menu-right">
            <span class="badge-number" v-if="unreadCount > 0">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
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
        <div class="menu-item" @click="onMenuTap('plan')">
          <div class="menu-left">
            <t-icon name="calendar" size="22px" color="#00A870" />
            <span class="menu-title">学习计划</span>
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
      <span>法硕背诵助手 v1.0.0</span>
    </div>

    <div class="bottom-placeholder"></div>

    <div class="plan-popup" v-if="showPlanPicker" @click.self="showPlanPicker = false">
      <div class="plan-picker-container" @click.stop>
        <div class="plan-picker-header">
          <span class="plan-picker-title">设置每日学习目标</span>
          <div class="plan-picker-close" @click="showPlanPicker = false">
            <t-icon name="close" size="16px" color="#999" />
          </div>
        </div>
        
        <div class="plan-picker-body">
          <div class="plan-options">
            <div 
              class="plan-option" 
              :class="{ selected: tempCardCount === count }"
              v-for="count in cardCountOptions" 
              :key="count"
              @click="tempCardCount = count"
            >
              <span>{{ count }} 张</span>
              <div class="plan-radio" v-if="tempCardCount === count">
                <div class="plan-radio-dot"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="plan-picker-footer">
          <div class="plan-picker-btn confirm" @click="onConfirmPlan">确定</div>
        </div>
      </div>
    </div>

    <div class="nickname-popup" v-if="showNicknamePopup" @click.self="showNicknamePopup = false">
      <div class="nickname-popup-container" @click.stop>
        <div class="nickname-popup-header">
          <span class="nickname-popup-title">修改昵称</span>
          <div class="nickname-popup-close" @click="showNicknamePopup = false">
            <t-icon name="close" size="16px" color="#999" />
          </div>
        </div>
        
        <div class="nickname-popup-body">
          <div class="nickname-input-wrapper">
            <input 
              class="nickname-input" 
              placeholder="请输入昵称" 
              v-model="nicknameInput"
              maxlength="20"
            />
            <span class="nickname-count">{{ nicknameInput.length }}/20</span>
          </div>
        </div>
        
        <div class="nickname-popup-footer">
          <div class="nickname-popup-btn cancel" @click="showNicknamePopup = false">取消</div>
          <div class="nickname-popup-btn confirm" @click="onConfirmNickname">确定</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next'
import { useUserStore } from '@/stores/user'
import { studyAPI, messageAPI, favoriteAPI } from '@/utils/api'

const router = useRouter()
const userStore = useUserStore()

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

const unreadCount = ref(0)

const showPlanPicker = ref(false)
const cardCountOptions = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
const tempCardCount = ref(50)

const showNicknamePopup = ref(false)
const nicknameInput = ref('')

const goalPercent = computed(() => {
  const percent = (studyProgress.value.todayCards / studyProgress.value.dailyGoal) * 100
  return Math.min(percent, 100)
})

onMounted(() => {
  loadData()
})

const loadData = async () => {
  try {
    const [statsRes, studyRes, msgRes, favRes] = await Promise.all([
      studyAPI.getStats(),
      studyAPI.getTodayStudyTime(),
      messageAPI.getUnreadCount(),
      favoriteAPI.getList({ pageSize: 1 })
    ])
    
    if (statsRes.success && statsRes.data) {
      stats.value.libraryCount = statsRes.data.libraryCount || 0
      stats.value.cardCount = statsRes.data.cardCount || 0
      studyProgress.value.streak = statsRes.data.streak || 0
      studyProgress.value.todayCards = statsRes.data.todayCards || 0
      studyProgress.value.todayNew = statsRes.data.todayNew || 0
      studyProgress.value.toReview = statsRes.data.toReview || 0
      studyProgress.value.totalCards = statsRes.data.totalCards || 0
    }
    
    if (studyRes.success && studyRes.data) {
      const minutes = studyRes.data.minutes || 0
      studyProgress.value.totalTime = minutes >= 60 
        ? `${Math.floor(minutes / 60)}小时${minutes % 60}分钟` 
        : `${minutes}分钟`
    }
    
    if (msgRes.success && msgRes.data) {
      unreadCount.value = msgRes.data.count || 0
    }
    
    if (favRes.success && favRes.data) {
      stats.value.favoriteCount = favRes.data.total || 0
    }
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

const onEditProfile = () => {
  nicknameInput.value = userStore.displayName
  showNicknamePopup.value = true
}

const onStatTap = (type: string) => {
  if (type === 'favorite') {
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
      MessagePlugin.info('激活中心功能开发中')
      break
  }
}

const onConfirmPlan = async () => {
  try {
    studyProgress.value.dailyGoal = tempCardCount.value
    showPlanPicker.value = false
    MessagePlugin.success('设置成功')
  } catch (error) {
    console.error('设置学习计划失败:', error)
    MessagePlugin.error('设置失败')
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
}

.glow-2 {
  width: 75px;
  height: 75px;
  background: rgba(59, 130, 246, 0.3);
  bottom: 20px;
  left: -15px;
}

.glow-3 {
  width: 60px;
  height: 60px;
  background: rgba(96, 165, 250, 0.4);
  top: 40px;
  left: 50px;
}

.star {
  position: absolute;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  pointer-events: none;
  animation: twinkle 2s ease-in-out infinite;
}

.star-1 { top: 15px; right: 40px; animation-delay: 0s; }
.star-2 { top: 50px; right: 100px; animation-delay: 0.5s; font-size: 10px; }
.star-3 { bottom: 40px; right: 20px; animation-delay: 1s; }
.star-4 { top: 30px; left: 30px; animation-delay: 1.5s; font-size: 9px; }

@keyframes twinkle {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
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
}

.bottom-placeholder {
  height: 24px;
}

.plan-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 10001;
  display: flex;
  align-items: flex-end;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.plan-picker-container {
  width: 100%;
  background: #fff;
  border-radius: 16px 16px 0 0;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.plan-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #E2E8F0;
}

.plan-picker-title {
  font-size: 16px;
  font-weight: 600;
  color: #1E293B;
}

.plan-picker-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F8FAFC;
  border-radius: 50%;
  cursor: pointer;
}

.plan-picker-body {
  padding: 12px 16px;
  max-height: 300px;
  overflow-y: auto;
}

.plan-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.plan-option {
  width: calc(50% - 5px);
  padding: 12px 16px;
  background: #F8FAFC;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;

  span {
    font-size: 14px;
    color: #1E293B;
  }

  &.selected {
    background: #E6F7FF;
    border-color: #3B82F6;
  }
}

.plan-radio {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3B82F6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.plan-radio-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #fff;
}

.plan-picker-footer {
  display: flex;
  justify-content: center;
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
}

.plan-picker-btn {
  width: 100%;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.plan-picker-btn.confirm {
  background: #3B82F6;
  color: #fff;
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

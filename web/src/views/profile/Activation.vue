<template>
  <div class="container">
    <div class="custom-nav">
      <div class="nav-content">
        <div class="nav-left">
          <div class="back-btn" @click="router.back()">
            <t-icon name="chevron-left" size="20px" color="#333" />
          </div>
        </div>
        <div class="nav-title">激活中心</div>
        <div class="nav-right"></div>
      </div>
    </div>

    <div class="content">
      <div class="vip-status-card" :class="{ active: isVip }">
        <div class="vip-bg-pattern"></div>
        <div class="vip-content">
          <div class="vip-icon">
            <t-icon name="user" size="32px" :color="isVip ? '#5D4E37' : '#666'" />
          </div>
          <div class="vip-info">
            <span class="vip-title">{{ isVip ? 'VIP会员' : '普通用户' }}</span>
            <span class="vip-desc" v-if="isVip && vipExpireAt">
              有效期至 {{ formatDate(vipExpireAt) }}
            </span>
            <span class="vip-desc" v-else-if="isVip">
              永久VIP会员
            </span>
            <span class="vip-desc" v-else>
              激活码升级VIP，解锁全部功能
            </span>
          </div>
        </div>
        <div class="vip-badge" v-if="isVip">
          <t-icon name="check-circle" size="16px" color="#5D4E37" />
          <span>已激活</span>
        </div>
      </div>

      <div class="activation-section">
        <div class="section-title">输入激活码</div>
        <div class="activation-form">
          <div class="input-wrapper">
            <input 
              class="activation-input"
              v-model="activationCode"
              placeholder="请输入激活码"
              maxlength="32"
              :disabled="activating"
            />
          </div>
          <div 
            class="activate-btn" 
            :class="{ disabled: !activationCode.trim() || activating }"
            @click="onActivate"
          >
            <t-icon v-if="activating" name="loading" size="18px" color="#fff" />
            <span v-else>立即激活</span>
          </div>
        </div>
      </div>

      <div class="privilege-section">
        <div class="section-header">
          <span class="section-title">会员权益说明</span>
        </div>
        
        <div class="privilege-table">
          <div class="privilege-header">
            <div class="privilege-col col-feature">权益介绍</div>
            <div class="privilege-col col-normal">普通用户</div>
            <div class="privilege-col col-vip">会员用户</div>
          </div>
          
          <div class="privilege-body">
            <div class="privilege-row">
              <div class="privilege-col col-feature">
                <span class="row-title">卡片数量限制</span>
                <span class="row-desc">单个知识库的卡片数量上限</span>
              </div>
              <div class="privilege-col col-normal">
                <span class="col-value">300张</span>
              </div>
              <div class="privilege-col col-vip">
                <span class="col-value vip-text">无限制</span>
              </div>
            </div>
            
            <div class="privilege-row">
              <div class="privilege-col col-feature">
                <span class="row-title">知识库数量限制</span>
                <span class="row-desc">创建个人知识库上限</span>
              </div>
              <div class="privilege-col col-normal">
                <span class="col-value">5个</span>
              </div>
              <div class="privilege-col col-vip">
                <span class="col-value vip-text">无限制</span>
              </div>
            </div>
            
            <div class="privilege-row">
              <div class="privilege-col col-feature">
                <span class="row-title">批量导入功能</span>
                <span class="row-desc">每日批量导入次数</span>
              </div>
              <div class="privilege-col col-normal">
                <span class="col-value">1次</span>
              </div>
              <div class="privilege-col col-vip">
                <span class="col-value vip-text">无限制</span>
              </div>
            </div>
            
            <div class="privilege-row">
              <div class="privilege-col col-feature">
                <span class="row-title">关联学习功能</span>
                <span class="row-desc">智能关联推荐相关知识点</span>
              </div>
              <div class="privilege-col col-normal">
                <span class="col-icon close">×</span>
              </div>
              <div class="privilege-col col-vip">
                <span class="col-icon check">✓</span>
              </div>
            </div>
            
            <div class="privilege-row">
              <div class="privilege-col col-feature">
                <span class="row-title">笔记一键转存</span>
                <span class="row-desc">一键将学习笔记保存为自己的卡片</span>
              </div>
              <div class="privilege-col col-normal">
                <span class="col-icon close">×</span>
              </div>
              <div class="privilege-col col-vip">
                <span class="col-icon check">✓</span>
              </div>
            </div>

            <div class="privilege-row">
              <div class="privilege-col col-feature">
                <span class="row-title">收藏知识库一键转存</span>
                <span class="row-desc">将收藏的知识库卡片保存为自己的卡片</span>
              </div>
              <div class="privilege-col col-normal">
                <span class="col-icon close">×</span>
              </div>
              <div class="privilege-col col-vip">
                <span class="col-icon check">✓</span>
              </div>
            </div>
            
            <div class="privilege-row">
              <div class="privilege-col col-feature">
                <span class="row-title">学习详情统计</span>
                <span class="row-desc">查看完整学习数据分析</span>
              </div>
              <div class="privilege-col col-normal">
                <span class="col-icon close">×</span>
              </div>
              <div class="privilege-col col-vip">
                <span class="col-icon check">✓</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="history-section" v-if="activationHistory.length > 0">
        <div class="section-header">
          <span class="section-title">激活记录</span>
        </div>
        
        <div class="history-list">
          <div class="history-item" v-for="item in activationHistory" :key="item.id">
            <div class="history-info">
              <span class="history-code">{{ maskCode(item.code) }}</span>
              <span class="history-time">{{ formatDateTime(item.createdAt) }}</span>
            </div>
            <div class="history-status" :class="{ success: item.status === 'success' }">
              {{ item.status === 'success' ? '激活成功' : '激活失败' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { useUserStore } from '@/stores/user'
import { activationAPI } from '@/utils/api'
import { usePermission } from '@/composables/usePermission'

const router = useRouter()
const userStore = useUserStore()
const { isVip, vipExpireAt, refreshVipStatus } = usePermission()

const activationCode = ref('')
const activating = ref(false)

interface ActivationHistory {
  id: number
  code: string
  status: string
  createdAt: string
  used_at: string
}

const activationHistory = ref<ActivationHistory[]>([])

onMounted(() => {
  loadActivationHistory()
  refreshVipStatus()
})

const loadActivationHistory = async () => {
  try {
    const res = await activationAPI.getHistory()
    if (res.success && res.data) {
      activationHistory.value = (res.data.list || res.data || []).map((item: any) => ({
        ...item,
        createdAt: item.used_at || item.createdAt || item.created_at
      }))
    }
  } catch (error) {
    console.error('加载激活历史失败:', error)
  }
}

const onActivate = async () => {
  if (!activationCode.value.trim() || activating.value) return
  
  activating.value = true
  
  try {
    const res = await activationAPI.activate(activationCode.value.trim())
    
    if (res.success) {
      MessagePlugin.success('激活成功！您已成为VIP会员')
      activationCode.value = ''
      
      await refreshVipStatus()
      await loadActivationHistory()
    } else {
      MessagePlugin.error(res.message || '激活失败，请检查激活码是否正确')
    }
  } catch (error: any) {
    console.error('激活失败:', error)
    MessagePlugin.error(error.message || '激活失败，请稍后重试')
  } finally {
    activating.value = false
  }
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const maskCode = (code: string) => {
  if (code.length <= 8) return code
  return code.substring(0, 4) + '****' + code.substring(code.length - 4)
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #f5f7fa;
  padding-top: 44px;
}

.custom-nav {
  background: #fff;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.nav-content {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}

.nav-left, .nav-right {
  width: 40px;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  
  &:active {
    background: #f5f6fa;
  }
}

.nav-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.content {
  padding: 12px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
}

.vip-status-card {
  background: linear-gradient(135deg, #e8e8e8 0%, #f5f5f5 100%);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 12px;
  position: relative;
  overflow: hidden;
  
  &.active {
    background: linear-gradient(to right, #F0C14B 100%, #FFEC8B 75%);
  }
}

.vip-bg-pattern {
  position: absolute;
  top: -20px;
  right: -20px;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
  border-radius: 50%;
}

.vip-content {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.vip-icon {
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.vip-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vip-title {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  
  .vip-status-card.active & {
    color: #5D4E37;
  }
}

.vip-desc {
  font-size: 13px;
  color: #666;
  
  .vip-status-card.active & {
    color: rgba(93, 78, 55, 0.8);
  }
}

.vip-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(93, 78, 55, 0.15);
  padding: 4px 10px;
  border-radius: 12px;
  
  span {
    font-size: 12px;
    color: #5D4E37;
    font-weight: 500;
  }
}

.activation-section {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.section-header {
  margin-bottom: 12px;
}

.activation-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-wrapper {
  position: relative;
}

.activation-input {
  width: 100%;
  height: 48px;
  background: #f5f7fa;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 0 16px;
  font-size: 15px;
  color: #333;
  box-sizing: border-box;
  outline: none;
  transition: all 0.2s ease;
  
  &:focus {
    border-color: #3B82F6;
    background: #fff;
  }
  
  &::placeholder {
    color: #999;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.activate-btn {
  height: 48px;
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:active {
    transform: scale(0.98);
  }
  
  &.disabled {
    background: #ccc;
    cursor: not-allowed;
  }
}

.privilege-section {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 2px solid #E6A23C;
  
  .section-title {
    color: #E6A23C;
  }
}

.privilege-table {
  margin-top: 12px;
}

.privilege-header {
  display: flex;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid #f0f0f0;
  
  .privilege-col {
    font-size: 14px;
    font-weight: 600;
    color: #666;
    
    &.col-vip {
      color: #E6A23C;
    }
  }
}

.privilege-body {
  display: flex;
  flex-direction: column;
}

.privilege-row {
  display: flex;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f5f5f5;
  
  &:last-child {
    border-bottom: none;
  }
}

.privilege-col {
  display: flex;
  flex-direction: column;
  
  &.col-feature {
    flex: 2;
    text-align: left;
    gap: 4px;
  }
  
  &.col-normal,
  &.col-vip {
    flex: 1;
    justify-content: center;
    align-items: center;
  }
}

.row-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.row-desc {
  font-size: 12px;
  color: #999;
  line-height: 1.4;
}

.col-value {
  font-size: 14px;
  font-weight: 500;
  color: #666;
  
  &.vip-text {
    color: #E6A23C;
    font-weight: 600;
  }
}

.col-icon {
  font-size: 20px;
  font-weight: 300;
  
  &.close {
    color: #999;
    font-weight: 700;
  }
  
  &.check {
    color: #E6A23C;
    font-weight: 700;
  }
}

.history-section {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.history-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.history-code {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  font-family: monospace;
}

.history-time {
  font-size: 12px;
  color: #999;
}

.history-status {
  font-size: 12px;
  font-weight: 500;
  color: #E34D59;
  padding: 4px 10px;
  background: rgba(227, 77, 89, 0.1);
  border-radius: 12px;
  
  &.success {
    color: #10B981;
    background: rgba(16, 185, 129, 0.1);
  }
}
</style>

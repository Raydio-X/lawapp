<template>
  <div class="admin-feedback-container">
    <div class="custom-nav">
      <div class="nav-left" @click="router.back()">
        <t-icon name="chevron-left" size="20px" color="#fff" />
      </div>
      <div class="nav-title">用户反馈</div>
      <div class="nav-right"></div>
    </div>

    <div class="filter-section">
      <div class="filter-tabs">
        <div 
          class="filter-tab" 
          :class="{ active: currentStatus === null }"
          @click="onStatusChange(null)"
        >全部</div>
        <div 
          class="filter-tab" 
          :class="{ active: currentStatus === 0 }"
          @click="onStatusChange(0)"
        >待处理</div>
        <div 
          class="filter-tab" 
          :class="{ active: currentStatus === 1 }"
          @click="onStatusChange(1)"
        >处理中</div>
        <div 
          class="filter-tab" 
          :class="{ active: currentStatus === 2 }"
          @click="onStatusChange(2)"
        >已回复</div>
      </div>
    </div>

    <div class="loading-container" v-if="loading">
      <t-icon name="loading" size="40px" color="#3B82F6" />
      <span class="loading-text">加载中...</span>
    </div>

    <div class="feedback-list" v-else-if="feedbackList.length > 0">
      <div class="feedback-item" v-for="item in feedbackList" :key="item.id" @click="onViewDetail(item)">
        <div class="item-header">
          <div class="user-info">
            <t-avatar size="36px" shape="circle">
              {{ (item.nickname || item.username || '用户').charAt(0) }}
            </t-avatar>
            <div class="user-detail">
              <span class="user-name">{{ item.nickname || item.username || '用户' }}</span>
              <span class="feedback-time">{{ formatDate(item.created_at) }}</span>
            </div>
          </div>
          <span class="item-status" :class="getStatusClass(item.status)">{{ getStatusText(item.status) }}</span>
        </div>
        <div class="item-content">{{ item.content }}</div>
        <div class="item-contact" v-if="item.contact">
          <t-icon name="user" size="14px" color="#999" />
          <span>联系方式：{{ item.contact }}</span>
        </div>
      </div>
    </div>

    <div class="empty-container" v-else>
      <t-icon name="chat" size="60px" color="#ccc" />
      <span class="empty-text">暂无反馈</span>
    </div>

    <div class="detail-popup" v-if="showDetailPopup" @click.self="showDetailPopup = false">
      <div class="detail-popup-container">
        <div class="detail-popup-header">
          <span class="detail-popup-title">反馈详情</span>
          <t-icon name="close" size="20px" color="#999" class="close-btn" @click="showDetailPopup = false" />
        </div>
        <div class="detail-popup-body">
          <div class="detail-user">
            <t-avatar size="40px" shape="circle">
              {{ (currentFeedback?.nickname || currentFeedback?.username || '用户').charAt(0) }}
            </t-avatar>
            <div class="detail-user-info">
              <span class="detail-user-name">{{ currentFeedback?.nickname || currentFeedback?.username || '用户' }}</span>
              <span class="detail-time">{{ formatDate(currentFeedback?.created_at) }}</span>
            </div>
          </div>

          <div class="detail-section">
            <div class="detail-label">反馈内容</div>
            <div class="detail-content">{{ currentFeedback?.content }}</div>
          </div>

          <div class="detail-section" v-if="currentFeedback?.contact">
            <div class="detail-label">联系方式</div>
            <div class="detail-content">{{ currentFeedback?.contact }}</div>
          </div>

          <div class="detail-section" v-if="currentFeedback?.reply">
            <div class="detail-label">官方回复</div>
            <div class="detail-content reply">{{ currentFeedback?.reply }}</div>
          </div>

          <div class="detail-section">
            <div class="detail-label">处理状态</div>
            <div class="status-select">
              <div 
                class="status-option" 
                :class="{ active: editStatus === 0 }"
                @click="editStatus = 0"
              >待处理</div>
              <div 
                class="status-option" 
                :class="{ active: editStatus === 1 }"
                @click="editStatus = 1"
              >处理中</div>
              <div 
                class="status-option" 
                :class="{ active: editStatus === 2 }"
                @click="editStatus = 2"
              >已回复</div>
            </div>
          </div>

          <div class="detail-section">
            <div class="detail-label">回复内容</div>
            <textarea 
              class="reply-textarea" 
              v-model="replyContent"
              placeholder="输入回复内容..."
              maxlength="500"
            ></textarea>
          </div>
        </div>
        <div class="detail-popup-footer">
          <div class="detail-btn cancel" @click="showDetailPopup = false">取消</div>
          <div class="detail-btn confirm" @click="onUpdateStatus">保存</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { adminAPI } from '@/utils/api'

const router = useRouter()

const loading = ref(true)
const feedbackList = ref<any[]>([])
const currentStatus = ref<number | null>(null)
const showDetailPopup = ref(false)
const currentFeedback = ref<any>(null)
const editStatus = ref(0)
const replyContent = ref('')

onMounted(() => {
  loadFeedbackList()
})

const loadFeedbackList = async () => {
  loading.value = true
  try {
    const params: any = { page: 1, pageSize: 50 }
    if (currentStatus.value !== null) {
      params.status = currentStatus.value
    }
    const res = await adminAPI.getFeedbackList(params)
    if (res.success && res.data) {
      feedbackList.value = res.data.list || []
    }
  } catch (error) {
    console.error('加载反馈列表失败:', error)
    MessagePlugin.error('加载失败')
  } finally {
    loading.value = false
  }
}

const onStatusChange = (status: number | null) => {
  currentStatus.value = status
  loadFeedbackList()
}

const onViewDetail = (item: any) => {
  currentFeedback.value = item
  editStatus.value = item.status
  replyContent.value = item.reply || ''
  showDetailPopup.value = true
}

const onUpdateStatus = async () => {
  if (!currentFeedback.value) return

  try {
    const res = await adminAPI.updateFeedbackStatus(currentFeedback.value.id, {
      status: editStatus.value,
      reply: replyContent.value.trim() || undefined
    })

    if (res.success) {
      MessagePlugin.success('更新成功')
      showDetailPopup.value = false
      loadFeedbackList()
    }
  } catch (error: any) {
    console.error('更新状态失败:', error)
    MessagePlugin.error(error.message || '更新失败')
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const getStatusClass = (status: number) => {
  switch (status) {
    case 0: return 'pending'
    case 1: return 'processing'
    case 2: return 'resolved'
    default: return 'pending'
  }
}

const getStatusText = (status: number) => {
  switch (status) {
    case 0: return '待处理'
    case 1: return '处理中'
    case 2: return '已回复'
    default: return '待处理'
  }
}
</script>

<style lang="scss" scoped>
.admin-feedback-container {
  min-height: 100vh;
  background: #f5f6fa;
  padding-top: 56px;
}

.custom-nav {
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}

.nav-left, .nav-right {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.nav-title {
  font-size: 17px;
  font-weight: 600;
  color: #fff;
}

.filter-section {
  background: #fff;
  padding: 12px 16px;
  position: sticky;
  top: 56px;
  z-index: 50;
}

.filter-tabs {
  display: flex;
  gap: 8px;
}

.filter-tab {
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  color: #666;
  background: #f5f6fa;
  cursor: pointer;

  &.active {
    background: #3B82F6;
    color: #fff;
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
}

.loading-text {
  margin-top: 12px;
  font-size: 14px;
  color: #999;
}

.feedback-list {
  padding: 12px 16px;
}

.feedback-item {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.item-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.feedback-time {
  font-size: 12px;
  color: #999;
}

.item-status {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 12px;

  &.pending {
    background: #FEF3C7;
    color: #D97706;
  }

  &.processing {
    background: #DBEAFE;
    color: #2563EB;
  }

  &.resolved {
    background: #D1FAE5;
    color: #059669;
  }
}

.item-content {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-contact {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;

  span {
    font-size: 12px;
    color: #999;
  }
}

.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
}

.empty-text {
  margin-top: 16px;
  font-size: 14px;
  color: #999;
}

.detail-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 200;
}

.detail-popup-container {
  width: 100%;
  max-height: 85vh;
  background: #fff;
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
}

.detail-popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #E7E7E7;
}

.detail-popup-title {
  font-size: 17px;
  font-weight: 600;
  color: #1E293B;
}

.close-btn {
  cursor: pointer;
}

.detail-popup-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.detail-user {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.detail-user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-user-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.detail-time {
  font-size: 12px;
  color: #999;
}

.detail-section {
  margin-bottom: 16px;
}

.detail-label {
  font-size: 13px;
  font-weight: 500;
  color: #666;
  margin-bottom: 8px;
}

.detail-content {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;

  &.reply {
    background: #EFF6FF;
    border-left: 3px solid #3B82F6;
  }
}

.status-select {
  display: flex;
  gap: 8px;
}

.status-option {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  color: #666;
  background: #f5f6fa;
  cursor: pointer;

  &.active {
    background: #3B82F6;
    color: #fff;
  }
}

.reply-textarea {
  width: 100%;
  min-height: 100px;
  padding: 12px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
  resize: none;
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: #3B82F6;
  }

  &::placeholder {
    color: #999;
  }
}

.detail-popup-footer {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid #E7E7E7;
}

.detail-btn {
  flex: 1;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 22px;
  font-size: 15px;
  cursor: pointer;

  &.cancel {
    background: #f5f6fa;
    color: #666;
  }

  &.confirm {
    background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
    color: #fff;
  }
}
</style>

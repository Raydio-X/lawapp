<template>
  <div class="feedback-container">
    <div class="custom-nav">
      <div class="nav-left" @click="router.back()">
        <t-icon name="chevron-left" size="20px" color="#fff" />
      </div>
      <div class="nav-title">意见反馈</div>
      <div class="nav-right"></div>
    </div>

    <div class="feedback-content">
      <div class="feedback-form">
        <div class="form-label">您的建议</div>
        <div class="form-textarea-wrapper">
          <textarea 
            class="form-textarea" 
            v-model="feedbackContent"
            placeholder="请输入您的建议或反馈，帮助我们改进产品..."
            maxlength="1000"
          ></textarea>
          <span class="textarea-count">{{ feedbackContent.length }}/1000</span>
        </div>

        <div class="form-label" style="margin-top: 16px;">联系方式（选填）</div>
        <input 
          class="form-input" 
          v-model="contactInfo"
          placeholder="请输入您的邮箱或手机号，方便我们回复您"
          maxlength="100"
        />

        <div class="submit-btn" :class="{ disabled: !feedbackContent.trim() }" @click="onSubmit">
          <t-icon name="send" size="18px" color="#fff" />
          <span>提交反馈</span>
        </div>
      </div>

      <div class="feedback-history" v-if="feedbackList.length > 0">
        <div class="history-header">
          <span class="history-title">我的反馈记录</span>
        </div>
        <div class="history-list">
          <div class="history-item" v-for="item in feedbackList" :key="item.id">
            <div class="item-header">
              <span class="item-time">{{ formatDate(item.created_at) }}</span>
              <span class="item-status" :class="getStatusClass(item.status)">{{ getStatusText(item.status) }}</span>
            </div>
            <div class="item-content">{{ item.content }}</div>
            <div class="item-reply" v-if="item.reply">
              <div class="reply-label">
                <t-icon name="chat" size="14px" color="#3B82F6" />
                <span>官方回复</span>
              </div>
              <div class="reply-content">{{ item.reply }}</div>
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
import { feedbackAPI, isLoggedIn } from '@/utils/api'

const router = useRouter()

const feedbackContent = ref('')
const contactInfo = ref('')
const feedbackList = ref<any[]>([])

onMounted(() => {
  if (!isLoggedIn()) {
    MessagePlugin.warning('请先登录')
    router.push('/login')
    return
  }
  loadFeedbackList()
})

const loadFeedbackList = async () => {
  try {
    const res = await feedbackAPI.getMyList({ page: 1, pageSize: 20 })
    if (res.success && res.data) {
      feedbackList.value = res.data.list || []
    }
  } catch (error) {
    console.error('加载反馈列表失败:', error)
  }
}

const onSubmit = async () => {
  if (!feedbackContent.value.trim()) {
    MessagePlugin.warning('请输入反馈内容')
    return
  }

  try {
    const res = await feedbackAPI.submit({
      content: feedbackContent.value.trim(),
      contact: contactInfo.value.trim() || undefined
    })

    if (res.success) {
      MessagePlugin.success('提交成功，感谢您的反馈')
      feedbackContent.value = ''
      contactInfo.value = ''
      loadFeedbackList()
    }
  } catch (error: any) {
    console.error('提交反馈失败:', error)
    MessagePlugin.error(error.message || '提交失败')
  }
}

const formatDate = (dateStr: string) => {
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
.feedback-container {
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

.feedback-content {
  padding: 16px;
}

.feedback-form {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.form-textarea-wrapper {
  position: relative;
}

.form-textarea {
  width: 100%;
  min-height: 120px;
  padding: 12px;
  padding-bottom: 30px;
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

.textarea-count {
  position: absolute;
  right: 12px;
  bottom: 8px;
  font-size: 12px;
  color: #999;
}

.form-input {
  width: 100%;
  height: 44px;
  padding: 0 12px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: #3B82F6;
  }

  &::placeholder {
    color: #999;
  }
}

.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 48px;
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  border-radius: 24px;
  margin-top: 20px;
  cursor: pointer;

  span {
    font-size: 16px;
    font-weight: 500;
    color: #fff;
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.feedback-history {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
}

.history-header {
  margin-bottom: 12px;
}

.history-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.item-time {
  font-size: 12px;
  color: #999;
}

.item-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;

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
}

.item-reply {
  margin-top: 12px;
  padding: 12px;
  background: #EFF6FF;
  border-radius: 8px;
  border-left: 3px solid #3B82F6;
}

.reply-label {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 6px;

  span {
    font-size: 12px;
    font-weight: 500;
    color: #3B82F6;
  }
}

.reply-content {
  font-size: 13px;
  color: #333;
  line-height: 1.5;
}
</style>

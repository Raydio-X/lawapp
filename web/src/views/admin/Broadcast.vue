<template>
  <div class="broadcast-container">
    <div class="custom-nav">
      <div class="nav-content">
        <div class="nav-back" @click="onCancel">
          <t-icon name="chevron-left" size="20px" color="#333" />
        </div>
        <span class="nav-title">发布通知</span>
        <div class="nav-placeholder"></div>
      </div>
    </div>

    <div class="tabs">
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'send' }" 
        @click="activeTab = 'send'"
      >
        发送通知
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'history' }" 
        @click="activeTab = 'history'; loadBroadcastHistory()"
      >
        发送记录
      </div>
    </div>

    <div class="send-section" v-if="activeTab === 'send'">
      <div class="form-section">
        <div class="form-header">
          <t-icon name="notification" size="24px" color="#3B82F6" />
          <span class="form-title">发布通知</span>
        </div>
        <span class="form-desc">向所有用户发送消息通知</span>
      </div>

      <div class="form-card">
        <div class="form-field">
          <span class="field-label">通知标题</span>
          <input 
            class="field-input" 
            placeholder="请输入通知标题" 
            v-model="title"
            maxlength="50"
          />
          <span class="field-count">{{ title.length }}/50</span>
        </div>

        <div class="form-field">
          <span class="field-label">通知内容</span>
          <textarea 
            class="field-textarea" 
            placeholder="请输入通知内容" 
            v-model="content"
            maxlength="500"
          ></textarea>
          <span class="field-count">{{ content.length }}/500</span>
        </div>
      </div>

      <div class="form-tips">
        <t-icon name="info-circle" size="14px" color="#fa8c16" />
        <span>通知将发送给所有注册用户</span>
      </div>

      <div class="form-actions">
        <div class="action-btn cancel" @click="onCancel">取消</div>
        <div class="action-btn confirm" @click="onSend">发送通知</div>
      </div>
    </div>

    <div class="history-section" v-else>
      <div class="history-list" v-if="broadcastList.length > 0">
        <div class="history-item" v-for="item in broadcastList" :key="item.created_at">
          <div class="history-header">
            <div class="history-title">{{ item.title }}</div>
            <div class="history-time">{{ formatTime(item.created_at) }}</div>
          </div>
          <div class="history-content">{{ item.content }}</div>
          <div class="history-footer">
            <div class="history-meta">
              <t-icon name="user" size="14px" color="#999" />
              <span>已发送给 {{ item.recipient_count }} 位用户</span>
            </div>
          </div>
        </div>
      </div>

      <div class="empty-state" v-else-if="!loading">
        <t-icon name="folder-open" size="48px" color="#ccc" />
        <span class="empty-text">暂无发送记录</span>
      </div>

      <div class="loading-state" v-if="loading">
        <t-icon name="loading" size="24px" color="#3B82F6" />
        <span class="loading-text">加载中...</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import api from '@/utils/api'

const router = useRouter()

const activeTab = ref('send')
const title = ref('')
const content = ref('')
const broadcastList = ref<any[]>([])
const loading = ref(false)

onMounted(() => {
  loadBroadcastHistory()
})

const loadBroadcastHistory = async () => {
  loading.value = true
  try {
    const res = await api.get('/messages/broadcast', {
      page: 1,
      pageSize: 50
    })
    if (res.success && res.data) {
      broadcastList.value = res.data.list || []
    }
  } catch (error) {
    console.error('加载发送记录失败:', error)
  } finally {
    loading.value = false
  }
}

const formatTime = (time: string) => {
  const date = new Date(time)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

const onCancel = () => {
  router.push('/admin')
}

const onSend = async () => {
  if (!title.value.trim()) {
    MessagePlugin.warning('请输入通知标题')
    return
  }
  if (!content.value.trim()) {
    MessagePlugin.warning('请输入通知内容')
    return
  }

  try {
    const res = await api.post('/admin/broadcast', {
      title: title.value,
      content: content.value
    })
    if (res.success) {
      MessagePlugin.success('通知发送成功')
      title.value = ''
      content.value = ''
      loadBroadcastHistory()
    } else {
      MessagePlugin.error(res.message || '发送失败')
    }
  } catch (error) {
    MessagePlugin.error('发送失败，请重试')
  }
}
</script>

<style lang="scss" scoped>
.broadcast-container {
  min-height: 100vh;
  background-color: #f5f6fa;
  padding: 16px;
  padding-top: 60px;
}

.custom-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  z-index: 999;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
}

.nav-content {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}

.nav-back {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.nav-title {
  font-size: 17px;
  font-weight: 600;
  color: #000;
}

.nav-placeholder {
  width: 32px;
}

.tabs {
  display: flex;
  background-color: #fff;
  border-radius: 8px;
  padding: 4px;
  margin-bottom: 16px;
}

.tab-item {
  flex: 1;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #666;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &.active {
    background-color: #3B82F6;
    color: #fff;
    font-weight: 500;
  }
}

.send-section {
  padding-bottom: 24px;
}

.form-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0;
}

.form-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.form-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.form-desc {
  font-size: 14px;
  color: #999;
}

.form-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
}

.form-field {
  margin-bottom: 24px;
  position: relative;

  &:last-child {
    margin-bottom: 0;
  }
}

.field-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.field-input {
  width: 100%;
  height: 44px;
  padding: 0 12px;
  font-size: 15px;
  color: #333;
  background-color: #f5f6fa;
  border-radius: 6px;
  box-sizing: border-box;
  border: none;
  outline: none;

  &::placeholder {
    color: #bbb;
  }
}

.field-textarea {
  width: 100%;
  min-height: 120px;
  padding: 12px;
  font-size: 15px;
  color: #333;
  background-color: #f5f6fa;
  border-radius: 6px;
  box-sizing: border-box;
  line-height: 1.6;
  border: none;
  outline: none;
  resize: none;

  &::placeholder {
    color: #bbb;
  }
}

.field-count {
  position: absolute;
  right: 0;
  bottom: -16px;
  font-size: 12px;
  color: #bbb;
}

.form-tips {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px;
  background-color: #fff7e6;
  border-radius: 6px;
  margin-bottom: 24px;

  span {
    font-size: 13px;
    color: #fa8c16;
  }
}

.form-actions {
  display: flex;
  gap: 12px;
  padding: 0 8px;
}

.action-btn {
  flex: 1;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  border-radius: 22px;
  cursor: pointer;
  transition: opacity 0.2s;

  &.cancel {
    background-color: #f5f6fa;
    color: #666;
  }

  &.confirm {
    background-color: #3B82F6;
    color: #fff;

    &:active {
      opacity: 0.8;
    }
  }
}

.history-section {
  padding-bottom: 24px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
}

.history-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 8px;
}

.history-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  flex: 1;
  margin-right: 12px;
}

.history-time {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
}

.history-content {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 12px;
}

.history-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.history-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #999;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
}

.empty-text {
  font-size: 14px;
  color: #999;
  margin-top: 12px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.loading-text {
  font-size: 14px;
  color: #999;
  margin-top: 8px;
}

@media (max-width: 768px) {
  .broadcast-container {
    padding: 16px;
    padding-top: 60px;
  }

  .form-card {
    padding: 16px;
  }
}
</style>

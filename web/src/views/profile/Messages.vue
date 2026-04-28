<template>
  <div class="messages-container">
    <div class="custom-nav">
      <div class="nav-content">
        <div class="nav-left">
          <div class="back-btn" @click="router.back()">
            <t-icon name="chevron-left" size="20px" color="#333" />
          </div>
        </div>
        <div class="nav-title">消息中心</div>
        <div class="nav-right">
          <div class="header-action" v-if="messages.length > 0" @click="onMarkAllRead">
            <t-icon name="check-circle" size="16px" color="#3B82F6" />
            <span class="header-action-text">全部已读</span>
          </div>
        </div>
      </div>
    </div>

    <div class="message-list">
      <div 
        class="message-item"
        :class="{ unread: !item.is_read }"
        v-for="(item, index) in messages"
        :key="item.id"
        @click="onMessageTap(item, index)"
      >
        <div class="message-icon-wrap">
          <div 
            class="message-icon"
            :class="item.type"
            v-if="item.type !== 'violation'"
          >
            <t-icon 
              :name="item.type === 'announcement' ? 'notification' : 'info-circle'" 
              size="20px" 
              color="#fff" 
            />
          </div>
          <t-icon 
            v-if="item.type === 'violation'" 
            name="error-circle" 
            size="24px" 
            color="#f5222d" 
          />
          <div class="unread-dot" v-if="!item.is_read"></div>
        </div>
        <div class="message-content">
          <div class="message-header">
            <span class="message-title">{{ item.title }}</span>
            <span class="message-time">{{ item.created_at }}</span>
          </div>
          <span class="message-text">{{ item.content }}</span>
          <div class="message-type-tag">
            <span class="type-tag" :class="item.type">
              {{ item.type === 'violation' ? '违规通知' : item.type === 'announcement' ? '系统公告' : '系统消息' }}
            </span>
          </div>
        </div>
        <div class="message-delete" @click.stop="onDeleteMessage(item.id, index)">
          <t-icon name="delete" size="14px" color="#ccc" />
        </div>
      </div>

      <div class="load-more" v-if="hasMore" @click="loadMore">
        <span>加载更多</span>
      </div>

      <div class="empty-state" v-if="messages.length === 0 && !loading">
        <t-icon name="notification" size="48px" color="#ddd" />
        <span class="empty-text">暂无消息</span>
        <span class="empty-subtext">您的消息列表为空</span>
      </div>
    </div>

    <t-popup v-model="showDetail" placement="bottom">
      <div class="detail-popup" v-if="currentMessage">
        <div class="detail-header">
          <div 
            class="detail-icon"
            :class="currentMessage.type"
            v-if="currentMessage.type !== 'violation'"
          >
            <t-icon 
              :name="currentMessage.type === 'announcement' ? 'notification' : 'info-circle'" 
              size="24px" 
              color="#fff" 
            />
          </div>
          <t-icon 
            v-if="currentMessage.type === 'violation'" 
            name="error-circle" 
            size="32px" 
            color="#f5222d" 
          />
          <span class="detail-title">{{ currentMessage.title }}</span>
          <div class="detail-meta">
            <span class="detail-type">
              {{ currentMessage.type === 'violation' ? '违规通知' : currentMessage.type === 'announcement' ? '系统公告' : '系统消息' }}
            </span>
            <span class="detail-time">{{ currentMessage.created_at }}</span>
          </div>
        </div>
        <div class="detail-content">
          <span class="detail-text">{{ currentMessage.content }}</span>
        </div>
        <div class="detail-footer">
          <div class="detail-btn" @click="onDetailClose">关闭</div>
        </div>
      </div>
    </t-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next'
import { messageAPI } from '@/utils/api'

const router = useRouter()

interface Message {
  id: number
  title: string
  content: string
  type: string
  is_read: number
  created_at: string
}

const messages = ref<Message[]>([])
const page = ref(1)
const hasMore = ref(true)
const loading = ref(false)
const showDetail = ref(false)
const currentMessage = ref<Message | null>(null)

onMounted(() => {
  loadMessages()
})

const loadMessages = async (callback?: () => void) => {
  if (loading.value) {
    if (callback) callback()
    return
  }

  loading.value = true

  try {
    const res = await messageAPI.getList({
      page: page.value,
      pageSize: 20
    })

    if (res.success && res.data) {
      const list = (res.data.list || []).map((item: any) => {
        let formattedTime = ''
        if (item.created_at) {
          const date = new Date(item.created_at)
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          const hours = String(date.getHours()).padStart(2, '0')
          const minutes = String(date.getMinutes()).padStart(2, '0')
          formattedTime = `${year}-${month}-${day} ${hours}:${minutes}`
        }
        return {
          ...item,
          created_at: formattedTime
        }
      })

      messages.value = page.value === 1 ? list : [...messages.value, ...list]
      hasMore.value = list.length >= 20
    }
  } catch (error) {
    console.error('加载消息失败:', error)
  } finally {
    loading.value = false
    if (callback) callback()
  }
}

const onMessageTap = async (message: Message, index: number) => {
  currentMessage.value = message
  showDetail.value = true

  if (!message.is_read) {
    try {
      await messageAPI.markAsRead(message.id)
      messages.value[index].is_read = 1
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }
}

const onDetailClose = () => {
  showDetail.value = false
  currentMessage.value = null
}

const onMarkAllRead = async () => {
  try {
    const res = await messageAPI.markAllAsRead()
    if (res.success) {
      messages.value = messages.value.map(m => ({ ...m, is_read: 1 }))
      MessagePlugin.success('已全部标记为已读')
    }
  } catch (error) {
    console.error('全部标记已读失败:', error)
    MessagePlugin.error('操作失败')
  }
}

const onDeleteMessage = (id: number, index: number) => {
  const confirmDialog = DialogPlugin.confirm({
    header: '删除消息',
    body: '确定要删除这条消息吗？',
    onConfirm: async () => {
      try {
        const res = await messageAPI.delete(id)
        if (res.success) {
          messages.value.splice(index, 1)
          MessagePlugin.success('已删除')
        }
      } catch (error) {
        console.error('删除消息失败:', error)
        MessagePlugin.error('删除失败')
      }
      confirmDialog.hide()
    }
  })
}

const loadMore = () => {
  if (!hasMore.value) return
  page.value++
  loadMessages()
}
</script>

<style lang="scss" scoped>
.messages-container {
  min-height: 100vh;
  background-color: #f5f6fa;
  padding-top: 44px;
}

.custom-nav {
  background: #fff;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.nav-content {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}

.nav-left {
  width: 40px;
}

.back-btn {
  padding: 8px;
}

.nav-title {
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.nav-right {
  width: 80px;
  display: flex;
  justify-content: flex-end;
}

.header-action {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.header-action-text {
  font-size: 13px;
  color: #3B82F6;
}

.message-list {
  padding: 0 16px;
}

.message-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background-color: #fff;
  border-radius: 8px;
  padding: 14px;
  margin-top: 8px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
  transition: all 0.2s;
  cursor: pointer;
}

.message-item.unread {
  background-color: #f8faff;
  border-left: 3px solid #3B82F6;
}

.message-icon-wrap {
  position: relative;
  flex-shrink: 0;
}

.message-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-icon.system {
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
}

.message-icon.violation {
  background: linear-gradient(135deg, #f5222d 0%, #ff4d4f 100%);
}

.message-icon.announcement {
  background: linear-gradient(135deg, #fa8c16 0%, #ffa940 100%);
}

.unread-dot {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background-color: #f5222d;
  border: 1px solid #fff;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.message-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-time {
  font-size: 11px;
  color: #bbb;
  flex-shrink: 0;
  margin-left: 8px;
}

.message-text {
  font-size: 13px;
  color: #666;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.message-type-tag {
  margin-top: 6px;
}

.type-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
}

.type-tag.system {
  background-color: #e8f0ff;
  color: #3B82F6;
}

.type-tag.violation {
  background-color: #fff1f0;
  color: #f5222d;
}

.type-tag.announcement {
  background-color: #fff7e6;
  color: #fa8c16;
}

.message-delete {
  flex-shrink: 0;
  padding: 6px;
  margin-top: 4px;
  cursor: pointer;
  
  &:active {
    opacity: 0.6;
  }
}

.load-more {
  text-align: center;
  padding: 12px;
  color: #3B82F6;
  font-size: 14px;
  cursor: pointer;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 16px;
}

.empty-text {
  font-size: 16px;
  color: #999;
  margin-top: 12px;
}

.empty-subtext {
  font-size: 13px;
  color: #ccc;
  margin-top: 6px;
}

.detail-popup {
  background-color: #fff;
  border-radius: 16px 16px 0 0;
  padding: 20px 16px;
  padding-bottom: calc(20px + env(safe-area-inset-bottom));
}

.detail-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.detail-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.detail-icon.system {
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
}

.detail-icon.violation {
  background: linear-gradient(135deg, #f5222d 0%, #ff4d4f 100%);
}

.detail-icon.announcement {
  background: linear-gradient(135deg, #fa8c16 0%, #ffa940 100%);
}

.detail-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  text-align: center;
  margin-bottom: 8px;
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-type {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 6px;
  background-color: #f5f6fa;
  color: #666;
}

.detail-time {
  font-size: 12px;
  color: #bbb;
}

.detail-content {
  padding: 16px 0;
  min-height: 100px;
}

.detail-text {
  font-size: 15px;
  color: #333;
  line-height: 1.8;
  word-break: break-all;
}

.detail-footer {
  padding-top: 12px;
}

.detail-btn {
  width: 100%;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #3B82F6;
  color: #fff;
  font-size: 16px;
  border-radius: 22px;
  cursor: pointer;
  
  &:active {
    opacity: 0.8;
  }
}
</style>

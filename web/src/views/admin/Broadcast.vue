<template>
  <div class="broadcast-container">
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
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import api from '@/utils/api'

const router = useRouter()

const title = ref('')
const content = ref('')

const onCancel = () => {
  router.back()
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
    if (res.data.code === 0) {
      MessagePlugin.success('通知发送成功')
      router.back()
    } else {
      MessagePlugin.error(res.data.message || '发送失败')
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
}

.form-field {
  margin-bottom: 16px;
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
</style>

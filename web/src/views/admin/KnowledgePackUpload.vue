<template>
  <div class="container">
    <div class="custom-nav">
      <div class="nav-back" @click="router.back()">
        <t-icon name="chevron-left" size="24px" color="#333" />
      </div>
      <div class="nav-content">
        <span class="nav-title">上传知识包</span>
      </div>
      <div class="nav-right"></div>
    </div>

    <div class="content">
      <div class="form-section">
        <div class="form-item">
          <label class="form-label required">标题</label>
          <input 
            class="form-input" 
            v-model="form.title"
            placeholder="请输入知识包标题"
            maxlength="100"
          />
        </div>

        <div class="form-item">
          <label class="form-label">简介</label>
          <textarea 
            class="form-textarea" 
            v-model="form.description"
            placeholder="请输入知识包简介（选填）"
            maxlength="500"
            rows="4"
          ></textarea>
        </div>

        <div class="form-item">
          <label class="form-label required">PDF文件</label>
          <div class="file-upload-area" @click="triggerFileSelect">
            <input 
              ref="fileInputRef"
              type="file" 
              accept=".pdf"
              @change="onFileChange"
              style="display: none;"
            />
            <template v-if="selectedFile">
              <div class="file-info">
                <t-icon name="file-pdf" size="32px" color="#3B82F6" />
                <div class="file-details">
                  <div class="file-name">{{ selectedFile.name }}</div>
                  <div class="file-size">{{ formatFileSize(selectedFile.size) }}</div>
                </div>
                <div class="file-remove" @click.stop="removeFile">
                  <t-icon name="close" size="20px" color="#EF4444" />
                </div>
              </div>
            </template>
            <template v-else>
              <t-icon name="upload" size="40px" color="#CBD5E1" />
              <div class="upload-text">
                <span class="upload-hint">点击选择PDF文件</span>
                <span class="upload-tip">支持.pdf格式，最大50MB</span>
              </div>
            </template>
          </div>
        </div>
      </div>

      <div class="upload-progress" v-if="uploading">
        <t-progress 
          :percentage="uploadProgress" 
          :status="uploadProgress === 100 ? 'success' : 'active'"
        />
        <span class="progress-text">{{ uploadProgressText }}</span>
      </div>

      <div class="form-actions">
        <t-button 
          theme="primary" 
          size="large" 
          block
          :loading="uploading"
          :disabled="!canSubmit"
          @click="onSubmit"
        >
          {{ uploading ? '上传中...' : '上传知识包' }}
        </t-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { knowledgePackAPI } from '@/utils/api'

const router = useRouter()

const form = ref({
  title: '',
  description: ''
})

const selectedFile = ref<File | null>(null)
const fileInputRef = ref()
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadProgressText = ref('')

const canSubmit = computed(() => {
  return form.value.title.trim() && selectedFile.value
})

const triggerFileSelect = () => {
  fileInputRef.value?.click()
}

const onFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  
  if (file.type !== 'application/pdf') {
    MessagePlugin.error('只支持PDF格式文件')
    target.value = ''
    return
  }
  
  if (file.size > 50 * 1024 * 1024) {
    MessagePlugin.error('文件大小不能超过50MB')
    target.value = ''
    return
  }
  
  selectedFile.value = file
}

const removeFile = () => {
  selectedFile.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const onSubmit = async () => {
  if (!canSubmit.value) {
    MessagePlugin.warning('请填写标题并选择PDF文件')
    return
  }

  uploading.value = true
  uploadProgress.value = 0
  uploadProgressText.value = '准备上传...'

  try {
    uploadProgress.value = 30
    uploadProgressText.value = '上传文件中...'

    const res = await knowledgePackAPI.upload(selectedFile.value!, {
      title: form.value.title.trim(),
      description: form.value.description.trim()
    })

    uploadProgress.value = 100
    uploadProgressText.value = '上传成功'

    if (res.success) {
      MessagePlugin.success('知识包上传成功')
      router.back()
    }
  } catch (err: any) {
    uploadProgress.value = 0
    uploadProgressText.value = ''
    MessagePlugin.error(err.message || '上传失败')
  } finally {
    uploading.value = false
  }
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #F8FAFC;
}

.custom-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: #fff;
  border-bottom: 1px solid #E2E8F0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-back {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 8px;
  
  &:active {
    background-color: #F1F5F9;
  }
}

.nav-content {
  flex: 1;
  text-align: center;
}

.nav-title {
  font-size: 17px;
  font-weight: 600;
  color: #1E293B;
}

.nav-right {
  width: 40px;
}

.content {
  padding: 16px;
}

.form-section {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.form-item {
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #1E293B;
  margin-bottom: 8px;
  
  &.required::after {
    content: '*';
    color: #EF4444;
    margin-left: 4px;
  }
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 14px;
  color: #1E293B;
  background: #F8FAFC;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #3B82F6;
    background: #fff;
  }
  
  &::placeholder {
    color: #94A3B8;
  }
}

.form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 14px;
  color: #1E293B;
  background: #F8FAFC;
  resize: none;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #3B82F6;
    background: #fff;
  }
  
  &::placeholder {
    color: #94A3B8;
  }
}

.file-upload-area {
  border: 2px dashed #E2E8F0;
  border-radius: 12px;
  padding: 30px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #F8FAFC;
  
  &:active {
    background: #F1F5F9;
    border-color: #3B82F6;
  }
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.file-details {
  flex: 1;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #1E293B;
  margin-bottom: 4px;
}

.file-size {
  font-size: 12px;
  color: #64748B;
}

.file-remove {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  
  &:active {
    background: rgba(239, 68, 68, 0.1);
  }
}

.upload-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.upload-hint {
  font-size: 14px;
  font-weight: 500;
  color: #3B82F6;
}

.upload-tip {
  font-size: 12px;
  color: #94A3B8;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 14px;
  color: #1E293B;
}

.upload-progress {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.progress-text {
  display: block;
  text-align: center;
  margin-top: 10px;
  font-size: 13px;
  color: #64748B;
}

.form-actions {
  margin-top: 20px;
}
</style>

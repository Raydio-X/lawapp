<template>
  <div class="container">
    <div class="custom-nav">
      <div class="nav-back" @click="router.back()">
        <t-icon name="chevron-left" size="24px" color="#333" />
      </div>
      <div class="nav-content">
        <span class="nav-title">{{ pack?.title || '知识包详情' }}</span>
      </div>
      <div class="nav-right"></div>
    </div>

    <div class="content" v-if="pack">
      <div class="pack-header">
        <div class="pack-icon">
          <t-icon name="file-pdf" size="48px" color="#3B82F6" />
        </div>
        <div class="pack-info">
          <h1 class="pack-title">{{ pack.title }}</h1>
          <div class="pack-meta">
            <span class="meta-item">
              <t-icon name="calendar" size="14px" color="#94A3B8" />
              {{ formatDate(pack.created_at) }}
            </span>
            <span class="meta-item">
              <t-icon name="file" size="14px" color="#94A3B8" />
              {{ pack.file_size_formatted }}
            </span>
            <span class="meta-item">
              <t-icon name="download" size="14px" color="#94A3B8" />
              {{ pack.download_count }}次下载
            </span>
          </div>
        </div>
      </div>

      <div class="pack-section">
        <div class="section-title">简介</div>
        <div class="pack-description">
          {{ pack.description || '暂无简介' }}
        </div>
      </div>

      <div class="pack-section preview-section">
        <div class="section-header">
          <div class="section-title">PDF预览</div>
          <div class="preview-controls">
            <div 
              class="control-btn" 
              :class="{ active: previewMode === 'iframe' }"
              @click="previewMode = 'iframe'"
            >
              <t-icon name="view-list" size="16px" />
              <span>文档</span>
            </div>
            <div 
              class="control-btn" 
              :class="{ active: showFullscreen }"
              @click="openFullscreen"
            >
              <t-icon name="fullscreen" size="16px" />
              <span>全屏</span>
            </div>
          </div>
        </div>
        <div class="preview-container">
          <iframe 
            v-if="previewMode === 'iframe'"
            :src="pdfUrl" 
            class="pdf-iframe"
            frameborder="0"
          ></iframe>
          <div class="preview-placeholder" v-else>
            <t-icon name="file-pdf" size="48px" color="#CBD5E1" />
            <span>点击全屏查看PDF</span>
          </div>
        </div>
      </div>

      <div class="pack-actions">
        <div class="action-btn download" @click="onDownload">
          <t-icon name="download" size="20px" color="#fff" />
          <span>下载PDF</span>
        </div>
      </div>
    </div>

    <div class="loading-state" v-if="loading">
      <t-loading text="加载中..." />
    </div>

    <div class="error-state" v-if="error">
      <t-icon name="error-circle" size="48px" color="#EF4444" />
      <span class="error-text">{{ error }}</span>
      <t-button theme="primary" @click="loadPack">重试</t-button>
    </div>

    <div class="fullscreen-modal" v-if="showFullscreen" @click.self="closeFullscreen">
      <div class="modal-header">
        <div class="modal-title">{{ pack?.title }}</div>
        <div class="modal-close" @click="closeFullscreen">
          <t-icon name="close" size="24px" color="#fff" />
        </div>
      </div>
      <iframe 
        :src="pdfUrl" 
        class="fullscreen-iframe"
        frameborder="0"
      ></iframe>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { knowledgePackAPI } from '@/utils/api'

interface KnowledgePack {
  id: number
  title: string
  description: string
  file_path: string
  file_name: string
  file_size: number
  file_size_formatted: string
  category: string
  tags: string[]
  created_at: string
  download_count: number
  view_count: number
  creator_name: string
}

const router = useRouter()
const route = useRoute()
const pack = ref<KnowledgePack | null>(null)
const loading = ref(false)
const error = ref('')
const previewMode = ref<'iframe' | 'placeholder'>('iframe')
const showFullscreen = ref(false)

const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api'

const pdfUrl = computed(() => {
  if (!pack.value) return ''
  return `${baseUrl}/knowledge-packs/${pack.value.id}/preview`
})

onMounted(() => {
  loadPack()
})

const loadPack = async () => {
  const id = parseInt(route.params.id as string)
  if (!id) {
    error.value = '知识包ID无效'
    return
  }

  loading.value = true
  error.value = ''
  
  try {
    const res = await knowledgePackAPI.getDetail(id)
    if (res.success && res.data) {
      pack.value = res.data
    } else {
      error.value = '知识包不存在'
    }
  } catch (err: any) {
    error.value = err.message || '加载失败'
  } finally {
    loading.value = false
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const onDownload = () => {
  if (!pack.value) return
  
  const downloadUrl = `${baseUrl}/knowledge-packs/${pack.value.id}/download`
  
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = pack.value.file_name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  MessagePlugin.success('开始下载')
}

const openFullscreen = () => {
  showFullscreen.value = true
  document.body.style.overflow = 'hidden'
}

const closeFullscreen = () => {
  showFullscreen.value = false
  document.body.style.overflow = ''
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

.pack-header {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(145deg, #FFFFFF 0%, #F0F9FF 100%);
  border-radius: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(59, 130, 246, 0.06);
}

.pack-icon {
  width: 80px;
  height: 80px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pack-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.pack-title {
  font-size: 20px;
  font-weight: 700;
  color: #1E293B;
  margin: 0 0 12px 0;
  line-height: 1.3;
}

.pack-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #64748B;
}

.pack-section {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1E293B;
  margin-bottom: 10px;
}

.pack-description {
  font-size: 14px;
  color: #64748B;
  line-height: 1.6;
}

.preview-section {
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  
  .section-title {
    margin-bottom: 0;
  }
}

.preview-controls {
  display: flex;
  gap: 8px;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  color: #64748B;
  cursor: pointer;
  background: #F1F5F9;
  
  &.active {
    background: rgba(59, 130, 246, 0.1);
    color: #3B82F6;
  }
}

.preview-container {
  width: 100%;
  height: 500px;
  border-radius: 8px;
  overflow: hidden;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
}

.pdf-iframe {
  width: 100%;
  height: 100%;
}

.preview-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #94A3B8;
  font-size: 14px;
}

.pack-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &.download {
    background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
    color: #fff;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    
    &:active {
      transform: scale(0.97);
    }
  }
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 16px;
}

.error-text {
  font-size: 14px;
  color: #64748B;
}

.fullscreen-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.5);
}

.modal-title {
  font-size: 16px;
  font-weight: 500;
  color: #fff;
}

.modal-close {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 8px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

.fullscreen-iframe {
  flex: 1;
  width: 100%;
}
</style>

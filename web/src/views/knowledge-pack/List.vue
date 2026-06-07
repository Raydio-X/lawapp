<template>
  <div class="container">
    <div class="custom-nav">
      <div class="nav-back" @click="onBack">
        <t-icon name="chevron-left" size="24px" color="#333" />
      </div>
      <div class="nav-content">
        <span class="nav-title">{{ currentFolderName }}</span>
      </div>
      <div class="nav-right"></div>
    </div>

    <div class="search-section" v-if="showPackList">
      <div class="search-bar">
        <t-icon name="search" size="18px" color="#94A3B8" />
        <input 
          class="search-input" 
          placeholder="搜索知识包" 
          v-model="keyword"
          @keyup.enter="onSearch"
        />
        <div class="search-btn" v-if="keyword" @click="clearSearch">
          <t-icon name="close-circle-filled" size="18px" color="#94A3B8" />
        </div>
      </div>
    </div>

    <div class="content">
      <!-- 文件夹列表 -->
      <div class="folder-section" v-if="!showPackList && folders.length > 0">
        <div class="folder-list">
          <!-- 自定义文件夹 -->
          <div 
            v-for="folder in folders" 
            :key="folder.id"
            class="folder-card" 
            @click="onSelectFolder(String(folder.id))"
          >
            <div class="folder-icon">
              <t-icon name="folder" size="32px" color="#fff" />
            </div>
            <div class="folder-info">
              <div class="folder-name">{{ folder.name }}</div>
              <div class="folder-count">{{ folder.pack_count || 0 }}个知识包</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 知识包列表 -->
      <div class="pack-section" v-if="showPackList && packs.length > 0">
        <div class="pack-list">
          <div 
            class="pack-card" 
            v-for="pack in packs" 
            :key="pack.id"
            @click="onPackTap(pack)"
          >
            <div class="pack-icon">
              <t-icon name="file-pdf" size="28px" color="#3B82F6" />
            </div>
            <div class="pack-content">
              <div class="pack-title">{{ pack.title }}</div>
              <div class="pack-desc">{{ pack.description || '暂无简介' }}</div>
              <div class="pack-meta">
                <span class="meta-item">
                  <t-icon name="calendar" size="12px" color="#94A3B8" />
                  {{ formatDate(pack.created_at) }}
                </span>
                <span class="meta-item">
                  <t-icon name="download" size="12px" color="#94A3B8" />
                  {{ pack.download_count }}次下载
                </span>
              </div>
            </div>
            <div class="pack-arrow">
              <t-icon name="chevron-right" size="20px" color="#CBD5E1" />
            </div>
          </div>
        </div>

        <div class="load-more" v-if="hasMore" @click="loadMore">
          <t-loading v-if="loadingMore" size="small" />
          <span v-else>加载更多</span>
        </div>
      </div>

      <div class="empty-state" v-if="showPackList && packs.length === 0 && !loading">
        <t-icon name="folder-open" size="48px" color="#CBD5E1" />
        <span class="empty-text">{{ keyword ? '未找到相关知识包' : '该文件夹暂无知识包' }}</span>
      </div>

      <div class="empty-state" v-if="!showPackList && folders.length === 0 && !loading">
        <t-icon name="folder-open" size="48px" color="#CBD5E1" />
        <span class="empty-text">暂无文件夹</span>
      </div>
    </div>

    <div class="loading-state" v-if="loading">
      <t-loading text="加载中..." />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { knowledgePackAPI, knowledgePackFolderAPI } from '@/utils/api'

interface KnowledgePack {
  id: number
  title: string
  description: string
  file_size_formatted: string
  created_at: string
  download_count: number
}

interface Folder {
  id: number
  name: string
  description: string
  pack_count: number
}

const router = useRouter()
const packs = ref<KnowledgePack[]>([])
const folders = ref<Folder[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const hasMore = ref(false)
const keyword = ref('')
const currentPage = ref(1)
const pageSize = 10
const currentFolderId = ref<string | null>(null)

const currentFolderName = computed(() => {
  if (keyword.value) return '搜索结果'
  if (!showPackList.value) return '知识包列表'
  const folder = folders.value.find(f => String(f.id) === currentFolderId.value)
  return folder ? folder.name : '知识包列表'
})

const showPackList = computed(() => {
  return currentFolderId.value !== null
})

onMounted(() => {
  loadFolders()
})

const loadFolders = async () => {
  try {
    const res = await knowledgePackFolderAPI.getList()
    if (res.success && res.data) {
      folders.value = res.data.flat || []
    }
  } catch (error) {
    console.error('加载文件夹列表失败:', error)
  }
}

const loadPacks = async (isLoadMore = false) => {
  if (!currentFolderId.value) return
  
  if (isLoadMore) {
    loadingMore.value = true
  } else {
    loading.value = true
    currentPage.value = 1
  }

  try {
    const params: any = {
      page: currentPage.value,
      pageSize,
      folderId: currentFolderId.value
    }
    
    if (keyword.value.trim()) {
      params.keyword = keyword.value.trim()
    }

    const res = await knowledgePackAPI.getList(params)
    if (res.success && res.data) {
      const list = res.data.list || []
      
      if (isLoadMore) {
        packs.value = [...packs.value, ...list]
      } else {
        packs.value = list
      }
      
      hasMore.value = list.length === pageSize
    }
  } catch (error) {
    console.error('加载知识包列表失败:', error)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const onSelectFolder = (folderId: string) => {
  currentFolderId.value = folderId
  loadPacks()
}

const onBack = () => {
  if (showPackList.value) {
    currentFolderId.value = null
    keyword.value = ''
    packs.value = []
  } else {
    router.back()
  }
}

const loadMore = () => {
  currentPage.value++
  loadPacks(true)
}

const onSearch = () => {
  loadPacks()
}

const clearSearch = () => {
  keyword.value = ''
  loadPacks()
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const onPackTap = (pack: KnowledgePack) => {
  router.push(`/knowledge-pack/${pack.id}`)
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

.search-section {
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #E2E8F0;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: #F8FAFC;
  border-radius: 10px;
  border: 1px solid #E2E8F0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  color: #1E293B;
  
  &:focus {
    outline: none;
  }
  
  &::placeholder {
    color: #94A3B8;
  }
}

.search-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:active {
    opacity: 0.7;
  }
}

.content {
  padding: 16px;
}

.folder-section {
  margin-bottom: 16px;
}

.folder-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.folder-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  background: #fff;
  border-radius: 16px;
  padding: 20px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &.active {
    background: #EFF6FF;
    border: 1px solid #BFDBFE;
  }
  
  &:active {
    transform: scale(0.97);
  }
}

.folder-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
}

.folder-info {
  text-align: center;
  width: 100%;
}

.folder-name {
  font-size: 14px;
  font-weight: 600;
  color: #1E293B;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.folder-count {
  font-size: 12px;
  color: #94A3B8;
}

.pack-section {
  margin-top: 8px;
}

.pack-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pack-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  border-radius: 12px;
  padding: 14px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:active {
    transform: scale(0.99);
  }
}

.pack-icon {
  width: 48px;
  height: 48px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pack-content {
  flex: 1;
  min-width: 0;
}

.pack-title {
  font-size: 15px;
  font-weight: 500;
  color: #1E293B;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pack-desc {
  font-size: 13px;
  color: #64748B;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-all;
}

.pack-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #94A3B8;
}

.pack-arrow {
  flex-shrink: 0;
}

.load-more {
  display: flex;
  justify-content: center;
  padding: 20px;
  font-size: 14px;
  color: #3B82F6;
  cursor: pointer;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  gap: 12px;
}

.empty-text {
  font-size: 14px;
  color: #94A3B8;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}
</style>

<template>
  <div class="container">
    <div class="custom-nav">
      <div class="nav-back" @click="router.back()">
        <t-icon name="chevron-left" size="24px" color="#333" />
      </div>
      <div class="nav-content">
        <span class="nav-title">知识包列表</span>
      </div>
      <div class="nav-right"></div>
    </div>

    <div class="search-section">
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
      <div class="pack-list">
        <div 
          class="pack-card" 
          v-for="pack in packs" 
          :key="pack.id"
          @click="onPackTap(pack)"
        >
          <div class="pack-icon">
            <t-icon name="file-pdf" size="32px" color="#3B82F6" />
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
                {{ pack.file_size_formatted }}
              </span>
              <span class="meta-item">
                <t-icon name="chart-bar" size="12px" color="#94A3B8" />
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

      <div class="empty-state" v-if="packs.length === 0 && !loading">
        <t-icon name="folder-open" size="48px" color="#CBD5E1" />
        <span class="empty-text">{{ keyword ? '未找到相关知识包' : '暂无知识包' }}</span>
      </div>
    </div>

    <div class="loading-state" v-if="loading">
      <t-loading text="加载中..." />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { knowledgePackAPI } from '@/utils/api'

interface KnowledgePack {
  id: number
  title: string
  description: string
  file_size_formatted: string
  created_at: string
  download_count: number
}

const router = useRouter()
const packs = ref<KnowledgePack[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const hasMore = ref(false)
const keyword = ref('')
const currentPage = ref(1)
const pageSize = 10

onMounted(() => {
  loadPacks()
})

const loadPacks = async (isLoadMore = false) => {
  if (isLoadMore) {
    loadingMore.value = true
  } else {
    loading.value = true
    currentPage.value = 1
  }

  try {
    const params: any = {
      page: currentPage.value,
      pageSize
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

.pack-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pack-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:active {
    transform: scale(0.99);
  }
}

.pack-icon {
  width: 56px;
  height: 56px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 12px;
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
  font-weight: 600;
  color: #1E293B;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pack-desc {
  font-size: 13px;
  color: #64748B;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.pack-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
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

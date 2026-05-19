<template>
  <div class="container">
    <div class="custom-nav">
      <div class="nav-back" @click="router.back()">
        <t-icon name="chevron-left" size="24px" color="#333" />
      </div>
      <div class="nav-content">
        <span class="nav-title">卡片变更审核</span>
      </div>
      <div class="nav-right"></div>
    </div>

    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-value">{{ changePendingCount }}</span>
        <span class="stat-label">知识库有变更待审核</span>
      </div>
    </div>

    <div class="content">
      <div class="library-list">
        <div 
          class="library-item" 
          v-for="library in librariesWithChanges" 
          :key="library.id"
          @click="onViewLibraryChanges(library)"
        >
          <div class="library-main">
            <div class="library-icon">
              <t-icon name="edit" size="24px" color="#8B5CF6" />
            </div>
            <div class="library-content">
              <div class="library-title">{{ library.name }}</div>
              <div class="library-desc">{{ library.description || '暂无简介' }}</div>
              <div class="library-meta">
                <span class="meta-item">
                  <t-icon name="user" size="12px" color="#94A3B8" />
                  {{ library.creator_name || '未知' }}
                </span>
                <span class="meta-divider">·</span>
                <span class="meta-item highlight">{{ library.pending_change_count }}个变更待审核</span>
              </div>
            </div>
          </div>
          <div class="library-arrow">
            <t-icon name="chevron-right" size="20px" color="#CBD5E1" />
          </div>
        </div>
      </div>

      <div class="load-more" v-if="hasMore" @click="loadMoreChanges">
        <t-loading v-if="loadingMore" size="small" />
        <span v-else>加载更多</span>
      </div>

      <div class="empty-state" v-if="librariesWithChanges.length === 0 && !loading">
        <t-icon name="check-circle" size="48px" color="#10B981" />
        <span class="empty-text">暂无卡片变更待审核</span>
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
import { MessagePlugin } from 'tdesign-vue-next'
import { cardChangeReviewAPI } from '@/utils/api'

interface Library {
  id: number
  name: string
  subject: string
  description: string
  created_at: string
  creator_name: string
  pending_change_count?: number
}

const router = useRouter()

const librariesWithChanges = ref<Library[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const page = ref(1)
const pageSize = 10
const pagination = ref({
  total: 0,
  totalPages: 0
})

const changePendingCount = computed(() => pagination.value.total)
const hasMore = computed(() => page.value < pagination.value.totalPages)

onMounted(() => {
  loadLibrariesWithChanges()
})

const loadLibrariesWithChanges = async () => {
  loading.value = true
  try {
    const res = await cardChangeReviewAPI.getLibrariesWithChanges({
      page: page.value,
      pageSize: pageSize
    })
    if (res && res.success && res.data) {
      librariesWithChanges.value = res.data.list
      pagination.value = res.data.pagination
    }
  } catch (error) {
    console.error('加载有变更的知识库失败:', error)
    MessagePlugin.error('加载失败')
  } finally {
    loading.value = false
  }
}

const loadMoreChanges = async () => {
  if (loadingMore.value) return
  loadingMore.value = true
  try {
    page.value++
    const res = await cardChangeReviewAPI.getLibrariesWithChanges({
      page: page.value,
      pageSize: pageSize
    })
    if (res && res.success && res.data) {
      librariesWithChanges.value.push(...res.data.list)
      pagination.value = res.data.pagination
    }
  } catch (error) {
    console.error('加载更多失败:', error)
    page.value--
  } finally {
    loadingMore.value = false
  }
}

const onViewLibraryChanges = (library: Library) => {
  router.push(`/admin/library-review/${library.id}`)
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #F8FAFC;
}

.custom-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #FFFFFF;
  border-bottom: 1px solid #E2E8F0;
}

.nav-back {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  
  &:active {
    background: #F1F5F9;
  }
}

.nav-title {
  font-size: 18px;
  font-weight: 600;
  color: #1E293B;
}

.nav-right {
  width: 40px;
}

.stats-bar {
  display: flex;
  padding: 16px;
  background: #FFFFFF;
  border-bottom: 1px solid #E2E8F0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 24px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #3B82F6;
}

.stat-label {
  font-size: 12px;
  color: #64748B;
  margin-top: 4px;
}

.content {
  padding: 16px;
}

.library-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.library-item {
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #E2E8F0;
  cursor: pointer;
  transition: all 0.2s;
  
  &:active {
    background: #F8FAFC;
  }
}

.library-main {
  flex: 1;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.library-icon {
  width: 48px;
  height: 48px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.library-content {
  flex: 1;
  min-width: 0;
}

.library-title {
  font-size: 16px;
  font-weight: 600;
  color: #1E293B;
  margin-bottom: 4px;
}

.library-desc {
  font-size: 13px;
  color: #64748B;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.library-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #94A3B8;
  
  &.highlight {
    color: #8B5CF6;
    font-weight: 500;
  }
}

.meta-divider {
  color: #CBD5E1;
}

.library-arrow {
  margin-left: 12px;
}

.load-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  color: #3B82F6;
  font-size: 14px;
  cursor: pointer;
  
  &:active {
    opacity: 0.7;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  gap: 16px;
}

.empty-text {
  font-size: 16px;
  color: #64748B;
}

.loading-state {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  z-index: 1000;
}
</style>

<template>
  <div class="container">
    <div class="custom-nav">
      <div class="nav-back" @click="router.back()">
        <t-icon name="chevron-left" size="24px" color="#333" />
      </div>
      <div class="nav-content">
        <span class="nav-title">知识包管理</span>
      </div>
      <div class="nav-right">
        <div class="add-btn" @click="router.push('/admin/knowledge-pack-upload')">
          <t-icon name="add" size="18px" color="#fff" />
        </div>
      </div>
    </div>

    <div class="search-bar">
      <input 
        class="search-input" 
        placeholder="搜索知识包" 
        v-model="keyword"
        @keyup.enter="onSearch"
      />
    </div>

    <div class="content">
      <div class="pack-list">
        <div 
          class="pack-item" 
          v-for="pack in packs" 
          :key="pack.id"
        >
          <div class="pack-main" @click="onViewPack(pack)">
            <div class="pack-icon">
              <t-icon name="file-pdf" size="24px" color="#3B82F6" />
            </div>
            <div class="pack-content">
              <div class="pack-title">{{ pack.title }}</div>
              <div class="pack-meta">
                <span class="meta-item">{{ pack.file_size_formatted }}</span>
                <span class="meta-divider">·</span>
                <span class="meta-item">{{ pack.download_count }}次下载</span>
                <span class="meta-divider">·</span>
                <span class="meta-item">{{ formatDate(pack.created_at) }}</span>
              </div>
            </div>
          </div>
          <div class="pack-actions">
            <div class="action-btn delete" @click="onDeletePack(pack)">
              <t-icon name="delete" size="18px" color="#EF4444" />
            </div>
          </div>
        </div>
      </div>

      <div class="load-more" v-if="hasMore" @click="loadMore">
        <t-loading v-if="loadingMore" size="small" />
        <span v-else>加载更多</span>
      </div>

      <div class="empty-state" v-if="packs.length === 0 && !loading">
        <t-icon name="folder-open" size="48px" color="#CBD5E1" />
        <span class="empty-text">暂无知识包</span>
        <t-button theme="primary" @click="router.push('/admin/knowledge-pack-upload')">
          上传知识包
        </t-button>
      </div>
    </div>

    <div class="loading-state" v-if="loading">
      <t-loading text="加载中..." />
    </div>

    <t-dialog
      v-model:visible="deleteDialogVisible"
      header="确认删除"
      body="确定要删除该知识包吗？此操作不可恢复。"
      :confirm-btn="{ content: '删除', theme: 'danger' }"
      :cancel-btn="{ content: '取消' }"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
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
const pageSize = 20
const deleteDialogVisible = ref(false)
const packToDelete = ref<KnowledgePack | null>(null)

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
    const res = await knowledgePackAPI.getAdminList({
      page: currentPage.value,
      pageSize,
      keyword: keyword.value
    })
    
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

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const onViewPack = (pack: KnowledgePack) => {
  router.push(`/knowledge-pack/${pack.id}`)
}

const onDeletePack = (pack: KnowledgePack) => {
  packToDelete.value = pack
  deleteDialogVisible.value = true
}

const confirmDelete = async () => {
  if (!packToDelete.value) return
  
  try {
    const res = await knowledgePackAPI.delete(packToDelete.value.id)
    if (res.success) {
      MessagePlugin.success('删除成功')
      packs.value = packs.value.filter(p => p.id !== packToDelete.value!.id)
    }
  } catch (err: any) {
    MessagePlugin.error(err.message || '删除失败')
  } finally {
    deleteDialogVisible.value = false
    packToDelete.value = null
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
  display: flex;
  justify-content: flex-end;
}

.add-btn {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:active {
    transform: scale(0.95);
  }
}

.search-bar {
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #E2E8F0;
}

.search-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 14px;
  background: #F8FAFC;
  
  &:focus {
    outline: none;
    border-color: #3B82F6;
  }
  
  &::placeholder {
    color: #94A3B8;
  }
}

.content {
  padding: 16px;
}

.pack-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pack-item {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.pack-main {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  min-width: 0;
}

.pack-icon {
  width: 44px;
  height: 44px;
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
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pack-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.meta-item {
  font-size: 12px;
  color: #64748B;
}

.meta-divider {
  color: #CBD5E1;
}

.pack-actions {
  display: flex;
  gap: 8px;
  margin-left: 12px;
}

.action-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  
  &.delete {
    background: rgba(239, 68, 68, 0.1);
    
    &:active {
      background: rgba(239, 68, 68, 0.2);
    }
  }
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
  gap: 16px;
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

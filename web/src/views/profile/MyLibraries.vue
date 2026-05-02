<template>
  <div class="container">
    <div class="custom-nav">
      <div class="nav-content">
        <div class="nav-left">
          <div class="back-btn" @click="router.back()">
            <t-icon name="chevron-left" size="20px" color="#333" />
          </div>
        </div>
        <div class="nav-title">我的知识库</div>
        <div class="nav-right"></div>
      </div>
    </div>

    <div class="search-section">
      <div class="search-box">
        <t-icon name="search" size="18px" color="#999" />
        <input 
          class="search-input" 
          placeholder="搜索知识库"
          v-model="keyword"
          @input="onSearch"
        />
        <t-icon v-if="keyword" name="close-circle-filled" size="18px" color="#ccc" @click="clearKeyword" />
      </div>
    </div>

    <div class="loading-container" v-if="loading">
      <t-icon name="loading" size="40px" color="#3B82F6" />
      <span class="loading-text">加载中...</span>
    </div>

    <template v-else>
      <div class="result-info" v-if="keyword && libraries.length > 0">
        找到 {{ filteredLibraries.length }} 个知识库
      </div>

      <div class="library-list" v-if="filteredLibraries.length > 0">
        <div 
          class="library-item" 
          v-for="library in filteredLibraries" 
          :key="library.id"
          @click="onLibraryTap(library)"
        >
          <div class="library-icon">
            <t-icon name="folder" size="28px" color="#3B82F6" />
          </div>
          <div class="library-info">
            <span class="library-name" v-html="highlightText(library.name, keyword)"></span>
            <div class="library-meta">
              <span class="meta-subject" v-if="library.subject">{{ library.subject }}</span>
              <span class="meta-count">{{ library.card_count || 0 }}张卡片</span>
            </div>
          </div>
          <div class="library-arrow">
            <t-icon name="chevron-right" size="18px" color="#ccc" />
          </div>
        </div>
      </div>

      <div class="empty-container" v-else>
        <t-icon name="folder" size="48px" color="#ddd" />
        <span class="empty-text" v-if="keyword">未找到匹配的知识库</span>
        <span class="empty-text" v-else>暂无知识库</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { libraryAPI } from '@/utils/api'

const router = useRouter()

interface Library {
  id: number
  name: string
  subject?: string
  card_count: number
}

const libraries = ref<Library[]>([])
const loading = ref(true)
const keyword = ref('')

const filteredLibraries = computed(() => {
  if (!keyword.value.trim()) {
    return libraries.value
  }
  const kw = keyword.value.toLowerCase()
  return libraries.value.filter(lib => 
    lib.name.toLowerCase().includes(kw) ||
    (lib.subject && lib.subject.toLowerCase().includes(kw))
  )
})

const loadLibraries = async () => {
  loading.value = true
  try {
    const res = await libraryAPI.getMyLibraries()
    if (res.success && res.data) {
      libraries.value = res.data.list || res.data || []
    }
  } catch (error) {
    console.error('加载知识库失败:', error)
  } finally {
    loading.value = false
  }
}

const onSearch = () => {
}

const clearKeyword = () => {
  keyword.value = ''
}

const highlightText = (text: string, kw: string) => {
  if (!text || !kw) return text
  const escapedKw = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedKw})`, 'gi')
  return text.replace(regex, '<span class="highlight">$1</span>')
}

const onLibraryTap = (library: Library) => {
  router.push(`/library/${library.id}`)
}

onMounted(() => {
  loadLibraries()
})
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #F5F7FA;
  padding-top: 44px;
}

.custom-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 44px;
  background: #fff;
  z-index: 100;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.nav-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 16px;
}

.nav-left, .nav-right {
  width: 40px;
}

.back-btn {
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
  color: #1E293B;
}

.search-section {
  padding: 12px 16px;
  background: #fff;
  position: sticky;
  top: 44px;
  z-index: 50;
}

.search-box {
  display: flex;
  align-items: center;
  background: #F1F5F9;
  border-radius: 20px;
  padding: 8px 14px;
  gap: 8px;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  color: #1E293B;
  outline: none;
  
  &::placeholder {
    color: #94A3B8;
  }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  gap: 12px;
}

.loading-text {
  font-size: 14px;
  color: #64748B;
}

.result-info {
  padding: 12px 16px;
  font-size: 13px;
  color: #64748B;
}

.library-list {
  padding: 0 16px;
}

.library-item {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:active {
    transform: scale(0.98);
    background: #F8FAFC;
  }
}

.library-icon {
  width: 48px;
  height: 48px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.library-info {
  flex: 1;
  margin-left: 12px;
  overflow: hidden;
}

.library-name {
  font-size: 15px;
  font-weight: 500;
  color: #1E293B;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  
  :deep(.highlight) {
    color: #3B82F6;
    font-weight: 600;
  }
}

.library-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.meta-subject {
  font-size: 12px;
  color: #3B82F6;
  background: rgba(59, 130, 246, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.meta-count {
  font-size: 12px;
  color: #94A3B8;
}

.library-arrow {
  flex-shrink: 0;
  margin-left: 8px;
}

.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  gap: 12px;
}

.empty-text {
  font-size: 14px;
  color: #94A3B8;
}
</style>

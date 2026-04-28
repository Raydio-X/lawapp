<template>
  <div class="search-container">
    <div class="search-header">
      <div class="search-box">
        <t-icon name="search" size="20px" color="#999" />
        <input 
          class="search-input" 
          placeholder="搜索知识卡片 / 知识库"
          v-model="keyword"
          @keyup.enter="onSearch"
          focus
        />
        <t-icon v-if="keyword" name="close-circle-filled" size="20px" color="#ccc" @click="clearKeyword" />
      </div>
      <div class="cancel-btn" @click="router.back()">取消</div>
    </div>

    <div class="search-body" v-if="keyword">
      <div class="search-tabs">
        <div 
          class="tab-item" 
          :class="{ active: activeTab === 'cards' }"
          @click="activeTab = 'cards'"
        >
          卡片
        </div>
        <div 
          class="tab-item" 
          :class="{ active: activeTab === 'libraries' }"
          @click="activeTab = 'libraries'"
        >
          知识库
        </div>
      </div>

      <div class="search-result" v-if="activeTab === 'cards'">
        <div v-if="cardsLoading" class="loading-wrap">
          <t-icon name="loading" size="40px" color="#3B82F6" />
          <span class="loading-text">搜索中...</span>
        </div>
        <template v-else-if="cards.length > 0">
          <div class="result-count">找到 {{ cardsTotal }} 张相关卡片</div>
          <div 
            class="card-item" 
            v-for="(card, index) in cards" 
            :key="card.id"
            @click="onCardTap(card)"
          >
            <div class="card-main">
              <div class="card-question">
                <span class="highlight-tag">问</span>
                <span class="card-text" v-html="highlightText(card.question, keyword)"></span>
              </div>
              <div class="card-answer">
                <span class="highlight-tag answer-tag">答</span>
                <span class="card-text answer-text" v-html="highlightText(card.answer, keyword)"></span>
              </div>
            </div>
            <div class="card-footer">
              <div class="card-meta">
                <span class="meta-item" v-if="card.library_name">{{ card.library_name }}</span>
                <span class="meta-divider" v-if="card.library_name && card.study_count">·</span>
                <span class="meta-item" v-if="card.study_count">{{ card.study_count }}人学习</span>
              </div>
              <div class="card-tags" v-if="card.tags && card.tags.length > 0">
                <t-tag 
                  v-for="tag in card.tags.slice(0, 2)" 
                  :key="tag" 
                  theme="primary" 
                  variant="light"
                  size="small"
                >{{ tag }}</t-tag>
              </div>
            </div>
          </div>
          <div class="load-more" v-if="cardsHasMore" @click="loadMoreCards">
            <span>加载更多</span>
          </div>
          <div class="no-more" v-else-if="cards.length > 0 && !cardsHasMore">
            <span>没有更多了</span>
          </div>
        </template>
        <div v-else class="empty-wrap">
          <t-icon name="search" size="48px" color="#ddd" />
          <span class="empty-text">未找到相关卡片</span>
        </div>
      </div>

      <div class="search-result" v-if="activeTab === 'libraries'">
        <div v-if="libsLoading" class="loading-wrap">
          <t-icon name="loading" size="40px" color="#3B82F6" />
          <span class="loading-text">搜索中...</span>
        </div>
        <template v-else-if="libraries.length > 0">
          <div class="result-count">找到 {{ libsTotal }} 个相关知识库</div>
          <div 
            class="lib-item" 
            v-for="library in libraries" 
            :key="library.id"
            @click="onLibraryTap(library)"
          >
            <div class="lib-icon">
              <t-icon name="folder" size="24px" color="#3B82F6" />
            </div>
            <div class="lib-info">
              <span class="lib-name" v-html="highlightText(library.name, keyword)"></span>
              <div class="lib-meta">
                <span v-if="library.subject" class="lib-subject">{{ library.subject }}</span>
                <span class="lib-count">{{ library.card_count || 0 }}张卡片</span>
              </div>
            </div>
            <div class="lib-arrow">
              <t-icon name="chevron-right" size="18px" color="#ccc" />
            </div>
          </div>
          <div class="load-more" v-if="libsHasMore" @click="loadMoreLibraries">
            <span>加载更多</span>
          </div>
          <div class="no-more" v-else-if="libraries.length > 0 && !libsHasMore">
            <span>没有更多了</span>
          </div>
        </template>
        <div v-else class="empty-wrap">
          <t-icon name="search" size="48px" color="#ddd" />
          <span class="empty-text">未找到相关知识库</span>
        </div>
      </div>
    </div>

    <div class="search-empty" v-if="!keyword">
      <t-icon name="search" size="48px" color="#ddd" />
      <span class="empty-hint">输入关键词开始搜索</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { cardAPI, libraryAPI } from '@/utils/api'

const router = useRouter()

interface Card {
  id: number
  question: string
  answer: string
  tags: string[]
  library_id: number
  library_name: string
  study_count?: number
}

interface Library {
  id: number
  name: string
  subject?: string
  card_count: number
}

const keyword = ref('')
const activeTab = ref('cards')
const cards = ref<Card[]>([])
const libraries = ref<Library[]>([])
const cardsLoading = ref(false)
const libsLoading = ref(false)
const cardsTotal = ref(0)
const libsTotal = ref(0)
const cardsHasMore = ref(false)
const libsHasMore = ref(false)
const cardsPage = ref(1)
const libsPage = ref(1)

const pageSize = 20

onMounted(() => {
  const q = router.currentRoute.value.query.q as string
  if (q) {
    keyword.value = q
    onSearch()
  }
})

const clearKeyword = () => {
  keyword.value = ''
  cards.value = []
  libraries.value = []
  cardsTotal.value = 0
  libsTotal.value = 0
}

const onSearch = async () => {
  if (!keyword.value.trim()) return
  
  cardsPage.value = 1
  libsPage.value = 1
  cards.value = []
  libraries.value = []
  
  searchCards()
  searchLibraries()
}

const searchCards = async () => {
  if (!keyword.value.trim()) return
  
  cardsLoading.value = true
  try {
    const res = await cardAPI.search({ 
      keyword: keyword.value.trim(), 
      page: cardsPage.value, 
      pageSize 
    })
    if (res.success && res.data) {
      const list = res.data.list || res.data || []
      if (cardsPage.value === 1) {
        cards.value = list
      } else {
        cards.value.push(...list)
      }
      cardsTotal.value = res.data.total || list.length
      cardsHasMore.value = cards.value.length < cardsTotal.value
    }
  } catch (error) {
    console.error('搜索卡片失败:', error)
  } finally {
    cardsLoading.value = false
  }
}

const searchLibraries = async () => {
  if (!keyword.value.trim()) return
  
  libsLoading.value = true
  try {
    const res = await libraryAPI.search({ 
      keyword: keyword.value.trim(), 
      page: libsPage.value, 
      pageSize 
    })
    if (res.success && res.data) {
      const list = res.data.list || res.data || []
      if (libsPage.value === 1) {
        libraries.value = list
      } else {
        libraries.value.push(...list)
      }
      libsTotal.value = res.data.total || list.length
      libsHasMore.value = libraries.value.length < libsTotal.value
    }
  } catch (error) {
    console.error('搜索知识库失败:', error)
  } finally {
    libsLoading.value = false
  }
}

const loadMoreCards = () => {
  cardsPage.value++
  searchCards()
}

const loadMoreLibraries = () => {
  libsPage.value++
  searchLibraries()
}

const highlightText = (text: string, kw: string) => {
  if (!text || !kw) return text
  const escapedKw = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedKw})`, 'gi')
  return text.replace(regex, '<span class="highlight-text">$1</span>')
}

const onCardTap = (card: Card) => {
  router.push({
    path: '/card/study',
    query: {
      cardId: card.id,
      libraryId: card.library_id,
      singleCard: true
    }
  })
}

const onLibraryTap = (library: Library) => {
  router.push({
    path: `/library/${library.id}`,
    query: { name: library.name }
  })
}
</script>

<style lang="scss" scoped>
.search-container {
  min-height: 100vh;
  background-color: #f5f6fa;
}

.search-header {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: #fff;
  gap: 8px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: #f5f6fa;
  border-radius: 20px;
  padding: 7px 12px;
  gap: 6px;
}

.search-input {
  flex: 1;
  font-size: 14px;
  color: #333;
  height: 22px;
  border: none;
  outline: none;
  background: transparent;
  
  &::placeholder {
    color: #999;
  }
}

.cancel-btn {
  font-size: 14px;
  color: #3B82F6;
  white-space: nowrap;
  padding: 4px 2px;
  cursor: pointer;
}

.search-body {
  padding-bottom: env(safe-area-inset-bottom);
}

.search-tabs {
  display: flex;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  font-size: 15px;
  color: #666;
  position: relative;
  cursor: pointer;
  
  &.active {
    color: #3B82F6;
    font-weight: 500;
    
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 24px;
      height: 2px;
      background-color: #3B82F6;
      border-radius: 1px;
    }
  }
}

.result-count {
  font-size: 12px;
  color: #999;
  padding: 8px 16px;
}

.card-item {
  background-color: #fff;
  margin: 0 12px 8px;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  
  &:active {
    background-color: #fafafa;
  }
}

.card-main {
  margin-bottom: 8px;
}

.card-question {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-bottom: 6px;
}

.card-answer {
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.highlight-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
  background-color: #e8f4ff;
  color: #3B82F6;
  flex-shrink: 0;
  padding: 0 4px;
  margin-top: 2px;
}

.answer-tag {
  background-color: #e8f8e8;
  color: #2ba471;
}

.card-text {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  flex: 1;
}

.answer-text {
  color: #666;
  font-size: 13px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-item {
  font-size: 11px;
  color: #999;
}

.meta-divider {
  font-size: 11px;
  color: #ddd;
}

.card-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.lib-item {
  display: flex;
  align-items: center;
  background-color: #fff;
  margin: 0 12px 6px;
  border-radius: 8px;
  padding: 12px;
  gap: 10px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  
  &:active {
    background-color: #fafafa;
  }
}

.lib-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e8f4ff;
  border-radius: 8px;
  flex-shrink: 0;
}

.lib-info {
  flex: 1;
  min-width: 0;
}

.lib-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lib-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}

.lib-subject {
  font-size: 11px;
  color: #3B82F6;
  background-color: #e8f4ff;
  padding: 1px 6px;
  border-radius: 3px;
}

.lib-count {
  font-size: 11px;
  color: #999;
}

.lib-arrow {
  flex-shrink: 0;
}

.loading-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.loading-text {
  margin-top: 8px;
  font-size: 14px;
  color: #999;
}

.empty-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
}

.empty-text {
  margin-top: 8px;
  font-size: 14px;
  color: #999;
}

.load-more {
  text-align: center;
  padding: 12px;
  font-size: 13px;
  color: #3B82F6;
  cursor: pointer;
}

.no-more {
  text-align: center;
  padding: 12px;
  font-size: 12px;
  color: #ccc;
}

.search-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 100px;
  gap: 12px;
}

.empty-hint {
  font-size: 14px;
  color: #999;
}

:deep(.highlight-text) {
  background-color: #ffef66;
  border-radius: 2px;
  padding: 0 2px;
}
</style>

<template>
  <div class="container">
    <div class="custom-nav">
      <div class="nav-content">
        <div class="nav-left">
          <div class="back-btn" @click="router.back()">
            <t-icon name="chevron-left" size="20px" color="#333" />
          </div>
        </div>
        <div class="nav-title">我的卡片</div>
        <div class="nav-right"></div>
      </div>
    </div>

    <div class="search-section">
      <div class="search-box">
        <t-icon name="search" size="18px" color="#999" />
        <input 
          class="search-input" 
          placeholder="搜索卡片"
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
      <div class="result-info" v-if="keyword && filteredCards.length > 0">
        找到 {{ filteredCards.length }} 张卡片
      </div>

      <div class="card-list" v-if="filteredCards.length > 0">
        <div 
          class="card-item" 
          v-for="card in filteredCards" 
          :key="card.id"
          @click="onCardTap(card)"
        >
          <div class="card-main">
            <div class="card-question">
              <span class="label-tag">问</span>
              <span class="card-text" v-html="highlightText(card.question, keyword)"></span>
            </div>
            <div class="card-answer">
              <span class="label-tag answer-tag">答</span>
              <span class="card-text answer-text" v-html="card.answer"></span>
            </div>
          </div>
          <div class="card-footer">
            <div class="card-meta">
              <span class="meta-item" v-if="card.library_name">{{ card.library_name }}</span>
              <span class="meta-divider" v-if="card.library_name && card.study_count">·</span>
              <span class="meta-item" v-if="card.study_count">{{ card.study_count }}人学习</span>
            </div>
          </div>
        </div>
      </div>

      <div class="empty-container" v-else>
        <t-icon name="file-text" size="48px" color="#ddd" />
        <span class="empty-text" v-if="keyword">未找到匹配的卡片</span>
        <span class="empty-text" v-else>暂无卡片</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { cardAPI } from '@/utils/api'

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

const cards = ref<Card[]>([])
const loading = ref(true)
const keyword = ref('')

const filteredCards = computed(() => {
  if (!keyword.value.trim()) {
    return cards.value
  }
  const kw = keyword.value.toLowerCase()
  return cards.value.filter(card => 
    card.question.toLowerCase().includes(kw) ||
    card.answer.toLowerCase().includes(kw)
  )
})

const loadCards = async () => {
  loading.value = true
  try {
    const res = await cardAPI.getMyCards()
    if (res.success && res.data) {
      cards.value = res.data.list || res.data || []
    }
  } catch (error) {
    console.error('加载卡片失败:', error)
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

const onCardTap = (card: Card) => {
  router.push(`/card/study?cardId=${card.id}&single=true&mode=preview`)
}

onMounted(() => {
  loadCards()
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

.card-list {
  padding: 0 16px;
}

.card-item {
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

.card-main {
  margin-bottom: 10px;
}

.card-question {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}

.label-tag {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  background: #3B82F6;
  border-radius: 4px;
  font-size: 11px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  
  &.answer-tag {
    background: #10B981;
  }
}

.card-text {
  font-size: 14px;
  color: #1E293B;
  line-height: 1.5;
  flex: 1;
  
  :deep(.highlight) {
    color: #3B82F6;
    font-weight: 600;
  }
}

.card-answer {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.answer-text {
  font-size: 13px;
  color: #64748B;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  
  :deep(ol), :deep(ul) {
    padding-left: 16px;
    margin: 4px 0;
    
    li {
      margin: 2px 0;
    }
  }
  
  :deep(table) {
    border-collapse: collapse;
    margin: 4px 0;
    
    td, th {
      border: 1px solid #E2E8F0;
      padding: 4px 8px;
      font-size: 12px;
    }
  }
  
  :deep(p) {
    margin: 4px 0;
  }
  
  :deep(strong) {
    font-weight: 600;
  }
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-item {
  font-size: 12px;
  color: #94A3B8;
}

.meta-divider {
  color: #CBD5E1;
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

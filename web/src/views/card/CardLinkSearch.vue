<template>
  <div class="link-search-container">
    <div class="custom-nav">
      <div class="nav-left" @click="router.back()">
        <t-icon name="chevron-left" size="20px" color="#fff" />
      </div>
      <div class="nav-title">关联卡片</div>
      <div class="nav-right"></div>
    </div>

    <div class="search-header">
      <div class="search-box">
        <t-icon name="search" size="20px" color="#999" />
        <input 
          class="search-input" 
          placeholder="搜索卡片进行关联"
          v-model="keyword"
          @keyup.enter="onSearch"
        />
        <t-icon v-if="keyword" name="close-circle-filled" size="20px" color="#ccc" @click="clearKeyword" />
      </div>
    </div>

    <div class="search-body">
      <div class="recommend-section">
        <div class="section-header">
          <div class="section-title">
            <t-icon name="star" size="16px" color="#D4AF37" />
            <span>智能推荐</span>
          </div>
          <span class="section-tip">基于当前卡片内容推荐</span>
        </div>

        <div class="recommend-loading" v-if="recommendLoading">
          <t-icon name="loading" size="20px" color="#D4AF37" />
          <span>加载中...</span>
        </div>

        <div class="recommend-empty" v-else-if="recommendCards.length === 0">
          <span>暂无推荐卡片</span>
        </div>

        <div class="recommend-scroll" v-else>
          <div class="recommend-list">
            <div 
              class="recommend-item"
              v-for="card in recommendCards" 
              :key="card.id"
              :class="{ selected: selectedCards.includes(card.id) }"
              @click="toggleSelect(card)"
            >
              <div class="recommend-card">
                <div class="recommend-card-question">
                  <span>{{ card.question }}</span>
                </div>
                <div class="recommend-card-library" v-if="card.library_name">{{ card.library_name }}</div>
                <div class="recommend-card-check" v-if="selectedCards.includes(card.id)">
                  <t-icon name="check" size="14px" color="#fff" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="search-result-section" v-if="keyword">
        <div class="section-header">
          <div class="section-title">
            <t-icon name="search" size="16px" color="#3B82F6" />
            <span>搜索结果</span>
          </div>
          <span class="result-count" v-if="searchCards.length > 0">找到 {{ searchTotal }} 张卡片</span>
        </div>

        <div class="loading-wrap" v-if="searchLoading">
          <t-icon name="loading" size="24px" color="#3B82F6" />
          <span class="loading-text">搜索中...</span>
        </div>

        <div class="empty-wrap" v-else-if="searchCards.length === 0">
          <t-icon name="search" size="32px" color="#ccc" />
          <span class="empty-text">未找到相关卡片</span>
        </div>

        <div class="card-list" v-else>
          <div 
            class="card-item" 
            v-for="card in searchCards" 
            :key="card.id"
            :class="{ selected: selectedCards.includes(card.id) }"
            @click="toggleSelect(card)"
          >
            <div class="card-checkbox">
              <t-icon 
                :name="selectedCards.includes(card.id) ? 'check-circle-filled' : 'circle'" 
                size="22px" 
                :color="selectedCards.includes(card.id) ? '#3B82F6' : '#ccc'" 
              />
            </div>
            <div class="card-content">
              <div class="card-question">
                <span class="question-text" v-html="highlightText(card.question, keyword)"></span>
              </div>
              <div class="card-answer">
                <span class="answer-text" v-html="card.answer"></span>
              </div>
              <div class="card-meta">
                <span class="meta-item" v-if="card.library_name">{{ card.library_name }}</span>
              </div>
            </div>
          </div>
          <div class="load-more" v-if="hasMore" @click="loadMore">
            <span>加载更多</span>
          </div>
        </div>
      </div>

      <div class="tip-section" v-if="selectedCards.length > 0">
        <t-icon name="info-circle" size="14px" color="#3B82F6" />
        <span>已选择 {{ selectedCards.length }} 张卡片，点击底部按钮确认关联</span>
      </div>
    </div>

    <div class="bottom-bar">
      <div class="selected-info">
        <span>已选择 {{ selectedCards.length }} 张卡片</span>
      </div>
      <div class="action-btns">
        <div class="cancel-btn" @click="router.back()">取消</div>
        <div class="confirm-btn" :class="{ active: selectedCards.length > 0 }" @click="confirmLink">
          <t-icon name="link" size="16px" :color="selectedCards.length > 0 ? '#fff' : '#999'" />
          <span>确认关联</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { cardAPI } from '@/utils/api'

const router = useRouter()
const route = useRoute()

interface Card {
  id: number
  question: string
  answer: string
  tags?: string[]
  library_id?: number
  library_name?: string
}

const currentCardId = ref<number>(0)
const keyword = ref('')
const recommendLoading = ref(false)
const searchLoading = ref(false)
const recommendCards = ref<Card[]>([])
const searchCards = ref<Card[]>([])
const searchTotal = ref(0)
const hasMore = ref(false)
const page = ref(1)
const pageSize = 20
const selectedCards = ref<number[]>([])

let debounceTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  const cardId = route.query.cardId as string
  if (cardId) {
    currentCardId.value = parseInt(cardId)
    loadRecommendCards()
  }
})

watch(keyword, (newVal) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  
  if (!newVal.trim()) {
    searchCards.value = []
    searchTotal.value = 0
    return
  }
  
  debounceTimer = setTimeout(() => {
    onSearch()
  }, 400)
})

const clearKeyword = () => {
  keyword.value = ''
  searchCards.value = []
  searchTotal.value = 0
}

const loadRecommendCards = async () => {
  if (!currentCardId.value) return
  
  recommendLoading.value = true
  try {
    const res = await cardAPI.getRelated(currentCardId.value, 10)
    if (res.success && res.data) {
      recommendCards.value = res.data.filter((card: Card) => card.id !== currentCardId.value)
    }
  } catch (error) {
    console.error('加载推荐卡片失败:', error)
  } finally {
    recommendLoading.value = false
  }
}

const onSearch = async () => {
  if (!keyword.value.trim()) return
  
  page.value = 1
  searchCards.value = []
  await doSearch()
}

const doSearch = async () => {
  if (!keyword.value.trim()) return
  
  searchLoading.value = true
  try {
    const res = await cardAPI.search(keyword.value.trim(), { 
      page: page.value, 
      pageSize 
    })
    
    if (res.success && res.data) {
      const list = (res.data.list || res.data || []).filter((card: Card) => card.id !== currentCardId.value)
      if (page.value === 1) {
        searchCards.value = list
      } else {
        searchCards.value.push(...list)
      }
      searchTotal.value = res.data.total || list.length
      hasMore.value = searchCards.value.length < searchTotal.value
    }
  } catch (error) {
    console.error('搜索卡片失败:', error)
  } finally {
    searchLoading.value = false
  }
}

const loadMore = () => {
  page.value++
  doSearch()
}

const highlightText = (text: string, kw: string) => {
  if (!text || !kw) return text
  const escapedKw = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedKw})`, 'gi')
  return text.replace(regex, '<span class="highlight-text">$1</span>')
}

const toggleSelect = (card: Card) => {
  const index = selectedCards.value.indexOf(card.id)
  if (index > -1) {
    selectedCards.value.splice(index, 1)
  } else {
    selectedCards.value.push(card.id)
  }
}

const confirmLink = async () => {
  if (selectedCards.value.length === 0) {
    MessagePlugin.warning('请选择要关联的卡片')
    return
  }
  
  if (!currentCardId.value) {
    MessagePlugin.error('当前卡片ID不存在')
    return
  }
  
  console.log('Confirm link:', { currentCardId: currentCardId.value, selectedCards: selectedCards.value })
  
  try {
    const res = await cardAPI.linkCards(currentCardId.value, selectedCards.value)
    console.log('Link response:', res)
    if (res.success) {
      MessagePlugin.success(res.message || '关联成功')
      router.back()
    } else {
      MessagePlugin.error(res.message || '关联失败')
    }
  } catch (error: any) {
    console.error('关联卡片失败:', error)
    MessagePlugin.error(error.message || '关联失败')
  }
}
</script>

<style lang="scss" scoped>
.link-search-container {
  min-height: 100vh;
  background-color: #F5F7FA;
  padding-top: 44px;
  padding-bottom: 80px;
}

.custom-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 44px;
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  z-index: 100;
}

.nav-left {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:active {
    opacity: 0.8;
  }
}

.nav-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.nav-right {
  width: 40px;
}

.search-header {
  position: sticky;
  top: 44px;
  z-index: 99;
  padding: 12px;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.search-box {
  display: flex;
  align-items: center;
  background-color: #f5f6fa;
  border-radius: 20px;
  padding: 8px 12px;
  gap: 8px;
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

.search-body {
  padding: 12px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #1E293B;
}

.section-tip {
  font-size: 12px;
  color: #94A3B8;
}

.result-count {
  font-size: 12px;
  color: #64748B;
}

.recommend-section {
  background: linear-gradient(135deg, #FFF8DC 0%, #FFFACD 50%, #FAFAD2 100%);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid #D4AF37;
  
  .section-header {
    margin-bottom: 10px;
  }
  
  .section-title {
    color: #B8860B;
  }
}

.recommend-loading,
.recommend-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 0;
  gap: 6px;
  
  span {
    font-size: 13px;
    color: #C9A227;
  }
}

.recommend-scroll {
  overflow-x: auto;
  margin: 0 -4px;
  padding: 0 4px;
  
  &::-webkit-scrollbar {
    display: none;
  }
}

.recommend-list {
  display: flex;
  gap: 8px;
  white-space: nowrap;
}

.recommend-item {
  display: inline-block;
  cursor: pointer;
}

.recommend-card {
  width: 200px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  padding: 10px 12px;
  border: 2px solid transparent;
  white-space: normal;
  position: relative;
  transition: all 0.2s ease;
  
  &.selected {
    border-color: #3B82F6;
    background: #EFF6FF;
  }
}

.recommend-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.recommend-card-question {
  min-height: 40px;
  margin-bottom: 6px;
  
  span {
    font-size: 13px;
    color: #1E293B;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
  }
}

.recommend-card-library {
  font-size: 11px;
  color: #C9A227;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recommend-card-check {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #3B82F6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-result-section {
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.loading-wrap,
.empty-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  gap: 8px;
}

.loading-text,
.empty-text {
  font-size: 14px;
  color: #94A3B8;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-item {
  display: flex;
  gap: 12px;
  background-color: #fff;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  
  &:active {
    background-color: #fafafa;
  }
  
  &.selected {
    border-color: #3B82F6;
    background-color: #EFF6FF;
  }
}

.card-checkbox {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  padding-top: 2px;
}

.card-content {
  flex: 1;
  min-width: 0;
}

.card-question {
  margin-bottom: 6px;
}

.question-text {
  font-size: 14px;
  color: #1E293B;
  line-height: 1.6;
  font-weight: 500;
}

.card-answer {
  margin-bottom: 8px;
}

.answer-text {
  font-size: 13px;
  color: #64748B;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.meta-item {
  font-size: 12px;
  color: #94A3B8;
}

.tip-section {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px;
  background-color: #EFF6FF;
  border-radius: 8px;
  margin-top: 12px;
  
  span {
    font-size: 13px;
    color: #3B82F6;
  }
}

.load-more {
  text-align: center;
  padding: 12px;
  color: #3B82F6;
  font-size: 14px;
  cursor: pointer;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 100;
}

.selected-info {
  font-size: 14px;
  color: #64748B;
}

.action-btns {
  display: flex;
  gap: 12px;
}

.cancel-btn {
  padding: 10px 20px;
  border-radius: 20px;
  background-color: #F1F5F9;
  font-size: 14px;
  color: #64748B;
  cursor: pointer;
  
  &:active {
    opacity: 0.8;
  }
}

.confirm-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 20px;
  background-color: #E2E8F0;
  font-size: 14px;
  color: #94A3B8;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &.active {
    background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
    color: #fff;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }
  
  &:active {
    transform: scale(0.98);
  }
}

:deep(.highlight-text) {
  color: #3B82F6;
  font-weight: 500;
}
</style>

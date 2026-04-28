<template>
  <div class="container">
    <div class="custom-nav">
      <div class="nav-content">
        <div class="nav-left">
          <div class="back-btn" @click="router.back()">
            <t-icon name="chevron-left" size="20px" color="#333" />
          </div>
        </div>
        <div class="nav-title">{{ libraryName }}</div>
        <div class="nav-right"></div>
      </div>
    </div>

    <div class="loading-container" v-if="loading">
      <t-icon name="loading" size="40px" color="#3B82F6" />
      <span class="loading-text">加载中...</span>
    </div>

    <template v-else>
      <div class="library-overview-card">
        <div class="library-header">
          <div class="library-icon-large">
            <t-icon name="book" size="32px" color="#fff" />
          </div>
          <div class="library-info">
            <span class="library-name">{{ libraryName }}</span>
            <div class="library-meta">
              <t-tag theme="primary" variant="light" size="small">{{ librarySubject }}</t-tag>
              <span class="card-total">共 {{ totalCards }} 张卡片</span>
            </div>
          </div>
        </div>
        
        <div class="progress-section">
          <div class="progress-header">
            <span class="progress-label">学习进度</span>
            <span class="progress-percent">{{ progress }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: progress + '%' }"></div>
            </div>
          </div>
          <div class="progress-stats">
            <span>已学 {{ learnedCards }} / {{ totalCards }} 张</span>
          </div>
        </div>
      </div>

      <div class="catalog-section">
        <div class="catalog-header">
          <div class="catalog-title-row">
            <div class="catalog-title-icon">
              <t-icon name="view-list" size="18px" color="#3B82F6" />
            </div>
            <span class="catalog-title">章节目录</span>
          </div>
        </div>

        <div class="tree-list">
          <div 
            class="tree-node level-1" 
            :class="{ active: selectedChapterIndex === chapterIndex && selectedChildIndex === -1 }"
            v-for="(chapter, chapterIndex) in chapters" 
            :key="chapter.id"
          >
            <div class="tree-item" @click="onChapterTap(chapterIndex)">
              <div class="tree-expand-icon" v-if="chapter.children && chapter.children.length > 0">
                <t-icon 
                  :name="chapter.expanded ? 'caret-down-small' : 'caret-right-small'" 
                  size="14px" 
                  color="#64748B" 
                />
              </div>
              <div class="tree-expand-placeholder" v-else></div>
              <div class="tree-content">
                <span class="tree-title">第{{ getChapterNum(chapterIndex) }}章 {{ chapter.title }}</span>
                <div class="tree-meta">
                  <div class="tree-progress-bar">
                    <div 
                      class="tree-progress-fill" 
                      :style="{ width: chapter.cards.length > 0 ? (chapter.learnedCount / chapter.cards.length * 100) + '%' : '0%' }"
                    ></div>
                  </div>
                  <span class="tree-count">{{ chapter.learnedCount }}/{{ chapter.cards.length }}</span>
                </div>
              </div>
            </div>

            <div class="tree-children" v-if="chapter.expanded && chapter.children && chapter.children.length > 0">
              <div 
                class="tree-node level-2"
                :class="{ active: selectedChapterIndex === chapterIndex && selectedChildIndex === childIndex }"
                v-for="(childChapter, childIndex) in chapter.children" 
                :key="childChapter.id"
              >
                <div class="tree-item" @click="onChildChapterTap(chapterIndex, childIndex)">
                  <div class="tree-expand-icon small" v-if="childChapter.children && childChapter.children.length > 0">
                    <t-icon 
                      :name="childChapter.expanded ? 'caret-down-small' : 'caret-right-small'" 
                      size="12px" 
                      color="#94A3B8" 
                    />
                  </div>
                  <div class="tree-expand-placeholder small" v-else></div>
                  <div class="tree-content">
                    <span class="tree-title sub">{{ getSectionNum(chapterIndex, childIndex) }} {{ childChapter.title }}</span>
                    <span class="tree-count sub">{{ childChapter.cards.length }}张</span>
                  </div>
                </div>

                <div class="tree-children level-3" v-if="childChapter.expanded && childChapter.children && childChapter.children.length > 0">
                  <div 
                    class="tree-node level-3"
                    :class="{ active: selectedChapterIndex === chapterIndex && selectedChildIndex === childIndex && selectedGrandChildIndex === grandChildIndex }"
                    v-for="(grandChildChapter, grandChildIndex) in childChapter.children" 
                    :key="grandChildChapter.id"
                  >
                    <div class="tree-item" @click="onGrandChildChapterTap(chapterIndex, childIndex, grandChildIndex)">
                      <div class="tree-expand-placeholder small"></div>
                      <div class="tree-content">
                        <span class="tree-title sub-2">{{ getItemNum(chapterIndex, childIndex, grandChildIndex) }} {{ grandChildChapter.title }}</span>
                        <span class="tree-count sub-2">{{ grandChildChapter.cards.length }}张</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="cards-section" v-if="selectedChapter">
        <div class="cards-header">
          <span class="cards-title">{{ selectedChapter.title }}</span>
          <span class="cards-subtitle">共 {{ selectedChapter.cards.length }} 张卡片</span>
        </div>

        <div class="card-list-vertical">
          <div 
            class="card-item-large"
            v-for="(card, cardIndex) in selectedChapter.cards" 
            :key="card.id"
            @click="onCardTap(card, cardIndex)"
          >
            <div class="card-header">
              <div class="card-number-large">{{ cardIndex + 1 }}</div>
            </div>
            <div class="card-content-large">
              <span class="card-title-large">{{ card.title }}</span>
              <div class="card-tags-large" v-if="card.tags && card.tags.length > 0">
                <t-tag 
                  v-for="tag in card.tags.slice(0, 3)" 
                  :key="tag"
                  theme="primary" 
                  variant="light"
                  size="small"
                >{{ tag }}</t-tag>
              </div>
            </div>
            <div class="card-arrow">
              <t-icon name="chevron-right" size="20px" color="#ccc" />
            </div>
          </div>
        </div>
      </div>

      <div class="empty-tip" v-if="!selectedChapter">
        <t-icon name="tips" size="40px" color="#ddd" />
        <span class="empty-text">请点击上方章节查看卡片</span>
      </div>

      <div class="bottom-placeholder"></div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { libraryAPI, cardAPI } from '@/utils/api'

const router = useRouter()
const route = useRoute()

const chineseNum = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', 
                    '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十']

const getChapterNum = (index: number) => chineseNum[index] || (index + 1)
const getSectionNum = (chapterIndex: number, sectionIndex: number) => (chapterIndex + 1) + '-' + (sectionIndex + 1)
const getItemNum = (chapterIndex: number, sectionIndex: number, itemIndex: number) => 
  (chapterIndex + 1) + '-' + (sectionIndex + 1) + '-' + (itemIndex + 1)

interface Card {
  id: number
  title: string
  question: string
  answer: string
  tags: string[]
  learned: boolean
  chapterId: number
}

interface Chapter {
  id: number
  title: string
  level: number
  expanded: boolean
  learnedCount: number
  cards: Card[]
  children: Chapter[]
}

const libraryId = ref(0)
const libraryName = ref('')
const librarySubject = ref('未分类')
const loading = ref(true)
const chapters = ref<Chapter[]>([])
const allCards = ref<Card[]>([])
const totalCards = ref(0)
const learnedCards = ref(0)
const progress = ref(0)

const selectedChapterIndex = ref(-1)
const selectedChildIndex = ref(-1)
const selectedGrandChildIndex = ref(-1)
const selectedChapter = ref<Chapter | null>(null)

onMounted(() => {
  libraryId.value = parseInt(route.params.id as string) || 0
  libraryName.value = (route.query.name as string) || '知识库详情'
  loadLibraryData()
})

const loadLibraryData = async () => {
  loading.value = true
  try {
    const [libRes, cardsRes] = await Promise.all([
      libraryAPI.getDetail(libraryId.value),
      cardAPI.getList({ library_id: libraryId.value, page: 1, pageSize: 1000 })
    ])

    if (libRes.success && libRes.data) {
      const lib = libRes.data
      libraryName.value = lib.name || libraryName.value
      librarySubject.value = lib.subject || '未分类'
      
      if (lib.chapters && lib.chapters.length > 0) {
        processChapters(lib.chapters)
      }
    }

    if (cardsRes.success && cardsRes.data) {
      const cards = cardsRes.data.list || cardsRes.data || []
      processCards(cards)
    }

    calculateProgress()

    if (chapters.value.length > 0) {
      expandAndSelectChapter(0)
    }
  } catch (error) {
    console.error('加载知识库失败:', error)
    MessagePlugin.error('加载知识库失败')
  } finally {
    loading.value = false
  }
}

const processChapters = (chapterList: any[]) => {
  const processChapter = (chapter: any, level: number = 1): Chapter => {
    const result: Chapter = {
      id: chapter.id,
      title: chapter.name,
      level: level,
      expanded: false,
      learnedCount: 0,
      cards: [],
      children: []
    }
    
    if (chapter.children && chapter.children.length > 0) {
      result.children = chapter.children.map((child: any) => processChapter(child, level + 1))
    }
    
    return result
  }
  
  chapters.value = chapterList.map(chapter => processChapter(chapter))
}

const processCards = (cards: any[]) => {
  cards.forEach(card => {
    const chapterId = card.chapter_id
    const cardItem: Card = {
      id: card.id,
      title: card.question,
      question: card.question,
      answer: card.answer,
      tags: card.tags || [],
      learned: card.is_learned || false,
      chapterId: chapterId
    }
    allCards.value.push(cardItem)

    const findChapter = (chapterList: Chapter[]): Chapter | null => {
      for (const chapter of chapterList) {
        if (chapter.id === chapterId) {
          return chapter
        }
        if (chapter.children && chapter.children.length > 0) {
          const found = findChapter(chapter.children)
          if (found) return found
        }
      }
      return null
    }

    const chapter = findChapter(chapters.value)
    if (chapter) {
      chapter.cards.push({
        id: card.id,
        title: card.question,
        tags: card.tags || [],
        learned: card.is_learned || false,
        question: card.question,
        answer: card.answer,
        chapterId: chapterId
      })
      if (card.is_learned) {
        chapter.learnedCount++
      }
    }
  })
}

const calculateProgress = () => {
  const countChapterCards = (chapter: Chapter): { total: number; learned: number } => {
    let count = { total: chapter.cards.length, learned: chapter.learnedCount }
    
    if (chapter.children && chapter.children.length > 0) {
      chapter.children.forEach(child => {
        const childCount = countChapterCards(child)
        count.total += childCount.total
        count.learned += childCount.learned
      })
    }
    
    return count
  }

  let total = 0
  let learned = 0

  chapters.value.forEach(chapter => {
    const count = countChapterCards(chapter)
    total += count.total
    learned += count.learned
  })

  totalCards.value = total
  learnedCards.value = learned
  progress.value = total > 0 ? Math.round((learned / total) * 100) : 0
}

const expandAndSelectChapter = (index: number) => {
  chapters.value.forEach((chapter, i) => {
    chapter.expanded = i === index
  })
  
  selectedChapterIndex.value = index
  selectedChildIndex.value = -1
  selectedGrandChildIndex.value = -1
  selectedChapter.value = chapters.value[index]
}

const onChapterTap = (index: number) => {
  const chapter = chapters.value[index]
  const isExpanding = !chapter.expanded
  
  chapters.value.forEach((ch, i) => {
    ch.expanded = i === index ? isExpanding : false
  })
  
  selectedChapterIndex.value = index
  selectedChildIndex.value = -1
  selectedGrandChildIndex.value = -1
  selectedChapter.value = chapters.value[index]
}

const onChildChapterTap = (chapterIndex: number, childIndex: number) => {
  const childChapter = chapters.value[chapterIndex].children[childIndex]
  
  if (childChapter.children && childChapter.children.length > 0) {
    childChapter.expanded = !childChapter.expanded
  }
  
  selectedChapterIndex.value = chapterIndex
  selectedChildIndex.value = childIndex
  selectedGrandChildIndex.value = -1
  selectedChapter.value = childChapter
}

const onGrandChildChapterTap = (chapterIndex: number, childIndex: number, grandChildIndex: number) => {
  const grandChildChapter = chapters.value[chapterIndex].children[childIndex].children[grandChildIndex]
  
  selectedChapterIndex.value = chapterIndex
  selectedChildIndex.value = childIndex
  selectedGrandChildIndex.value = grandChildIndex
  selectedChapter.value = grandChildChapter
}

const onCardTap = (card: Card, cardIndex: number) => {
  const allCardsFlat: any[] = []
  chapters.value.forEach(chapter => {
    chapter.cards.forEach(c => {
      allCardsFlat.push({
        id: c.id,
        question: c.title,
        answer: allCards.value.find(ac => ac.id === c.id)?.answer || '',
        tags: c.tags,
        learned: c.learned
      })
    })
  })
  
  localStorage.setItem('libraryCardsData', JSON.stringify({
    cardList: allCardsFlat,
    libraryId: libraryId.value,
    libraryName: libraryName.value
  }))
  
  let globalIndex = 0
  for (let i = 0; i < selectedChapterIndex.value; i++) {
    globalIndex += chapters.value[i].cards.length
  }
  globalIndex += cardIndex
  
  router.push({
    path: '/card/study',
    query: {
      cardId: card.id,
      libraryId: libraryId.value,
      index: globalIndex
    }
  })
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #FFFFFF;
  padding: 12px 14px;
  padding-top: 56px;
  padding-bottom: 90px;
}

.custom-nav {
  background: #fff;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.04);
}

.nav-content {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
}

.nav-left {
  width: 40px;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  
  &:active {
    background: #f5f6fa;
  }
}

.nav-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-right {
  width: 40px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
}

.loading-text {
  margin-top: 12px;
  font-size: 14px;
  color: #999;
}

.library-overview-card {
  background: linear-gradient(135deg, #fff 0%, #f8faff 100%);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.08);
}

.library-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.library-icon-large {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 14px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.library-info {
  flex: 1;
}

.library-name {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #1E293B;
  margin-bottom: 8px;
}

.library-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-total {
  font-size: 13px;
  color: #64748B;
}

.progress-section {
  background-color: rgba(59, 130, 246, 0.04);
  border-radius: 8px;
  padding: 12px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 14px;
  color: #64748B;
}

.progress-percent {
  font-size: 16px;
  font-weight: 700;
  color: #3B82F6;
}

.progress-bar {
  margin-bottom: 8px;
}

.progress-track {
  height: 6px;
  background-color: #E2E8F0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3B82F6 0%, #60A5FA 100%);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-stats {
  font-size: 13px;
  color: #64748B;
}

.catalog-section {
  background-color: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.catalog-header {
  margin-bottom: 14px;
}

.catalog-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.catalog-title-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e8f4ff 0%, #d6e8ff 100%);
  border-radius: 7px;
}

.catalog-title {
  font-size: 16px;
  font-weight: 600;
  color: #1E293B;
}

.tree-list {
  display: flex;
  flex-direction: column;
}

.tree-node {
  display: flex;
  flex-direction: column;
}

.tree-item {
  display: flex;
  align-items: center;
  padding: 10px 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
  gap: 6px;
  cursor: pointer;
}

.tree-item:active {
  background-color: #F8FAFC;
}

.tree-node.active > .tree-item {
  background-color: rgba(59, 130, 246, 0.08);
}

.tree-expand-icon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tree-expand-icon.small {
  width: 14px;
  height: 14px;
}

.tree-expand-placeholder {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.tree-expand-placeholder.small {
  width: 14px;
  height: 14px;
}

.tree-content {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.tree-title {
  font-size: 15px;
  font-weight: 600;
  color: #1E293B;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-title.sub {
  font-size: 14px;
  font-weight: 500;
  color: #475569;
}

.tree-title.sub-2 {
  font-size: 13px;
  font-weight: 400;
  color: #64748B;
}

.tree-node.active .tree-title {
  color: #3B82F6;
}

.tree-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.tree-progress-bar {
  width: 30px;
  height: 3px;
  background-color: #E2E8F0;
  border-radius: 2px;
  overflow: hidden;
}

.tree-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3B82F6, #60A5FA);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.tree-count {
  font-size: 12px;
  color: #64748B;
  min-width: 30px;
  text-align: right;
}

.tree-count.sub {
  font-size: 11px;
  color: #94A3B8;
}

.tree-count.sub-2 {
  font-size: 10px;
  color: #94A3B8;
}

.tree-node.active .tree-count {
  color: #3B82F6;
}

.tree-children {
  padding-left: 16px;
}

.tree-children.level-3 {
  padding-left: 16px;
}

.tree-node.level-2 .tree-item {
  padding: 8px 6px;
}

.tree-node.level-3 .tree-item {
  padding: 6px 5px;
}

.cards-section {
  background-color: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.cards-header {
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #E2E8F0;
}

.cards-title {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #1E293B;
  margin-bottom: 4px;
}

.cards-subtitle {
  font-size: 13px;
  color: #64748B;
}

.card-list-vertical {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card-item-large {
  display: flex;
  align-items: center;
  background-color: #F8FAFC;
  border-radius: 10px;
  padding: 14px;
  border: 1px solid transparent;
  cursor: pointer;
}

.card-item-large:active {
  background-color: #e8e9ea;
  transform: scale(0.99);
}

.card-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 12px;
}

.card-number-large {
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #fff;
  font-weight: 600;
}

.card-content-large {
  flex: 1;
  min-width: 0;
}

.card-title-large {
  display: block;
  font-size: 15px;
  color: #1E293B;
  margin-bottom: 6px;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.card-tags-large {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.card-arrow {
  margin-left: 10px;
  flex-shrink: 0;
}

.empty-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 16px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.empty-text {
  font-size: 14px;
  color: #64748B;
  margin-top: 12px;
}

.bottom-placeholder {
  height: 24px;
}
</style>

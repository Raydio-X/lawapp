<template>
  <div class="select-container">
    <div class="custom-nav">
      <div class="nav-content">
        <div class="nav-left">
          <div class="back-btn" @click="router.back()">
            <t-icon name="chevron-left" size="20px" color="#333" />
          </div>
        </div>
        <div class="nav-title">选择知识库</div>
        <div class="nav-right"></div>
      </div>
    </div>

    <div class="tips-bar">
      <t-icon name="info-circle" size="16px" color="#3B82F6" />
      <span class="tips-text">请选择要学习的知识库，可多选</span>
    </div>

    <div class="loading-container" v-if="loading">
      <t-icon name="loading" size="40px" color="#3B82F6" />
      <span class="loading-text">加载中...</span>
    </div>

    <div class="library-list" v-else>
      <div class="library-item" 
        v-for="library in libraries" 
        :key="library.id"
        :class="{ selected: library.selected }"
        @click="onToggleLibrary(library.id)"
      >
        <div class="library-checkbox">
          <div class="checkbox-inner" v-if="library.selected">
            <t-icon name="check" size="14px" color="#fff" />
          </div>
        </div>
        <div class="library-info">
          <div class="library-header">
            <span class="library-name">{{ library.name }}</span>
            <div class="source-tag" :class="library.source">
              <span>{{ library.source === 'my' ? '我的' : '收藏' }}</span>
            </div>
            <div class="library-badge" v-if="library.unlearned > 0">
              <span>{{ library.unlearned }}张待学</span>
            </div>
          </div>
          <div class="library-meta">
            <span class="meta-item">{{ library.totalCards }}张卡片</span>
            <span class="meta-divider">|</span>
            <span class="meta-item">已学{{ library.learnedCards }}张</span>
          </div>
          <div class="progress-bar">
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: library.progress + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="empty-state" v-if="libraries.length === 0">
        <t-icon name="folder-open" size="50px" color="#ddd" />
        <span class="empty-text">还没有可学习的知识库</span>
        <span class="empty-hint">请先创建或收藏知识库</span>
      </div>
    </div>

    <div class="bottom-placeholder"></div>
  </div>

  <div class="bottom-bar" v-if="!loading">
    <div class="select-all" @click="onToggleAll">
      <div class="checkbox-inner" :class="{ checked: isAllSelected }">
        <t-icon v-if="isAllSelected" name="check" size="12px" color="#fff" />
      </div>
      <span>全选</span>
    </div>
    <div class="action-buttons">
      <div class="random-btn" :class="{ active: selectedCount > 0 }" @click="onRandomStudy">
        <t-icon name="swap" size="16px" :color="selectedCount > 0 ? '#fff' : '#999'" />
        <span>随机抽题</span>
      </div>
      <div class="start-btn" :class="{ active: selectedCount > 0 }" @click="onStartStudy">
        <span>开始学习</span>
        <span class="selected-count" v-if="selectedCount > 0">({{ selectedCount }}个)</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { libraryAPI, cardAPI, favoriteAPI } from '@/utils/api'

const router = useRouter()

interface Library {
  id: number
  name: string
  totalCards: number
  learnedCards: number
  unlearned: number
  progress: number
  selected: boolean
  source: string
}

const libraries = ref<Library[]>([])
const loading = ref(true)

const selectedCount = computed(() => {
  return libraries.value.filter(lib => lib.selected).length
})

const isAllSelected = computed(() => {
  return libraries.value.length > 0 && libraries.value.every(lib => lib.selected)
})

const totalUnlearned = computed(() => {
  return libraries.value
    .filter(lib => lib.selected)
    .reduce((sum, lib) => sum + lib.unlearned, 0)
})

onMounted(() => {
  loadLibraries()
})

const loadLibraries = async () => {
  loading.value = true
  try {
    const [myRes, favRes] = await Promise.all([
      libraryAPI.getMyLibraries({ page: 1, pageSize: 100 }),
      favoriteAPI.getLibraries({ page: 1, pageSize: 100 })
    ])

    const myLibraries = (myRes.success ? (myRes.data.list || myRes.data.libraries || myRes.data || []) : []).map((lib: any) => {
      const totalCards = lib.totalCards || lib.card_count || 0
      const learnedCards = lib.learnedCards || lib.learned_cards || 0
      return {
        id: lib.id,
        name: lib.name,
        totalCards,
        learnedCards,
        unlearned: totalCards - learnedCards,
        progress: totalCards > 0 ? Math.round((learnedCards / totalCards) * 100) : 0,
        selected: false,
        source: 'my'
      }
    })

    const favLibraries = (favRes.success ? (favRes.data.libraries || favRes.data.list || []) : []).map((lib: any) => {
      const totalCards = lib.totalCards || lib.total_cards || 0
      const learnedCards = lib.learnedCards || lib.learned_cards || 0
      return {
        id: lib.id,
        name: lib.name,
        totalCards,
        learnedCards,
        unlearned: totalCards - learnedCards,
        progress: totalCards > 0 ? Math.round((learnedCards / totalCards) * 100) : 0,
        selected: false,
        source: 'favorite'
      }
    })

    const myIds = new Set(myLibraries.map((lib: Library) => lib.id))
    const uniqueFavLibraries = favLibraries.filter((lib: Library) => !myIds.has(lib.id))
    
    const allLibraries = [...myLibraries, ...uniqueFavLibraries]
    
    libraries.value = allLibraries
  } catch (error) {
    console.error('加载知识库失败:', error)
    MessagePlugin.error('加载知识库失败')
  } finally {
    loading.value = false
  }
}

const onToggleAll = () => {
  const newState = !isAllSelected.value
  libraries.value.forEach(lib => {
    lib.selected = newState
  })
}

const onToggleLibrary = (id: number) => {
  const library = libraries.value.find(lib => lib.id === id)
  if (library) {
    library.selected = !library.selected
  }
}

const onStartStudy = async () => {
  if (selectedCount.value === 0) {
    MessagePlugin.warning('请选择知识库')
    return
  }

  if (totalUnlearned.value === 0) {
    MessagePlugin.warning('所选知识库已全部掌握')
    return
  }

  const selectedLibraries = libraries.value.filter(lib => lib.selected)
  
  MessagePlugin.loading({ content: '准备中...', duration: 0 })

  try {
    const unlearnedCards: any[] = []

    for (const lib of selectedLibraries) {
      const cardsRes = await cardAPI.getList({ library_id: lib.id, page: 1, pageSize: 1000 })
      
      if (cardsRes.success && cardsRes.data) {
        const cards = cardsRes.data.list || cardsRes.data || []
        
        cards.forEach((card: any) => {
          if (!card.is_learned) {
            unlearnedCards.push({
              id: card.id,
              question: card.question,
              answer: card.answer || '',
              tags: card.tags || [],
              learned: false,
              libraryId: lib.id,
              libraryName: lib.name
            })
          }
        })
      }
    }

    MessagePlugin.closeAll()

    if (unlearnedCards.length === 0) {
      MessagePlugin.warning('没有待学习的卡片')
      return
    }

    const libraryNames = selectedLibraries.map(lib => lib.name).join('、')
    
    localStorage.setItem('studyCardsData', JSON.stringify({
      cardList: unlearnedCards,
      libraryNames: libraryNames,
      totalCards: unlearnedCards.length
    }))

    router.push({
      path: '/study/cards',
      query: { index: 0, total: unlearnedCards.length }
    })
  } catch (error) {
    MessagePlugin.closeAll()
    console.error('开始学习失败:', error)
    MessagePlugin.error('加载失败，请重试')
  }
}

const onRandomStudy = async () => {
  if (selectedCount.value === 0) {
    MessagePlugin.warning('请选择知识库')
    return
  }

  const selectedLibraries = libraries.value.filter(lib => lib.selected)
  
  MessagePlugin.loading({ content: '准备中...', duration: 0 })

  try {
    const allCards: any[] = []

    for (const lib of selectedLibraries) {
      const cardsRes = await cardAPI.getList({ library_id: lib.id, page: 1, pageSize: 1000 })
      
      if (cardsRes.success && cardsRes.data) {
        const cards = cardsRes.data.list || cardsRes.data || []
        
        cards.forEach((card: any) => {
          allCards.push({
            id: card.id,
            question: card.question,
            answer: card.answer || '',
            tags: card.tags || [],
            learned: card.is_learned || false,
            libraryId: lib.id,
            libraryName: lib.name
          })
        })
      }
    }

    MessagePlugin.closeAll()

    if (allCards.length === 0) {
      MessagePlugin.warning('所选知识库没有卡片')
      return
    }

    const randomIndex = Math.floor(Math.random() * allCards.length)
    const libraryNames = selectedLibraries.map(lib => lib.name).join('、')
    
    localStorage.setItem('studyCardsData', JSON.stringify({
      cardList: allCards,
      libraryNames: libraryNames,
      totalCards: allCards.length
    }))

    router.push({
      path: '/study/cards',
      query: { index: randomIndex, total: allCards.length }
    })
  } catch (error) {
    MessagePlugin.closeAll()
    console.error('随机抽题失败:', error)
    MessagePlugin.error('加载失败，请重试')
  }
}
</script>

<style lang="scss" scoped>
.select-container {
  min-height: 100vh;
  background: #f5f6fa;
  padding-top: 44px;
  padding-bottom: 70px;
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
}

.nav-right {
  width: 40px;
}

.tips-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  background: #e8f0ff;
}

.tips-text {
  font-size: 13px;
  color: #3B82F6;
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

.library-list {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.library-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
  transition: all 0.2s;
  border: 1px solid transparent;
  cursor: pointer;
  
  &.selected {
    border-color: #3B82F6;
    background: #f8faff;
  }
}

.library-checkbox {
  width: 22px;
  height: 22px;
  border: 1px solid #ddd;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
  transition: all 0.2s;
}

.library-item.selected .library-checkbox {
  border-color: #3B82F6;
  background: #3B82F6;
}

.checkbox-inner {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.library-info {
  flex: 1;
  min-width: 0;
}

.library-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 5px;
}

.library-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.library-badge {
  background: #fff0f0;
  padding: 2px 6px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 18px;
  
  span {
    font-size: 10px;
    color: #E34D59;
    line-height: 1;
  }
}

.source-tag {
  padding: 2px 6px;
  border-radius: 6px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 18px;
  
  span {
    font-size: 10px;
    line-height: 1;
  }
  
  &.my {
    background: #e8f0ff;
    span { color: #3B82F6; }
  }
  
  &.favorite {
    background: #fff7e6;
    span { color: #FF9500; }
  }
}

.library-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 7px;
}

.meta-item {
  font-size: 12px;
  color: #999;
}

.meta-divider {
  color: #ddd;
}

.progress-bar {
  width: 100%;
}

.progress-track {
  height: 4px;
  background: #f0f0f0;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3B82F6 0%, #60A5FA 100%);
  border-radius: 2px;
  transition: width 0.3s;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 0;
}

.empty-text {
  font-size: 15px;
  color: #999;
  margin-top: 12px;
}

.empty-hint {
  font-size: 13px;
  color: #ccc;
  margin-top: 6px;
}

.bottom-placeholder {
  height: 20px;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 10px 16px;
  padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px));
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.06);
  z-index: 100;
}

.select-all {
  display: flex;
  align-items: center;
  gap: 6px;
  
  .checkbox-inner {
    width: 20px;
    height: 20px;
    border: 1px solid #ddd;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &.checked {
      border-color: #3B82F6;
      background: #3B82F6;
    }
  }
  
  span {
    font-size: 14px;
    color: #666;
  }
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.random-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0 16px;
  height: 40px;
  border-radius: 20px;
  background: #f5f6fa;
  border: 1px solid #e8e8e8;
  transition: all 0.2s;
  cursor: pointer;
  
  &.active {
    background: linear-gradient(135deg, #FAAD14 0%, #FFB800 100%);
    border-color: transparent;
    box-shadow: 0 3px 10px rgba(250, 173, 20, 0.3);
  }
  
  span {
    font-size: 14px;
    font-weight: 600;
    color: #999;
    line-height: 1;
  }
  
  &.active span {
    color: #fff;
  }
}

.start-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0 24px;
  height: 40px;
  border-radius: 20px;
  background: #ccc;
  transition: all 0.2s;
  cursor: pointer;
  
  &.active {
    background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
    box-shadow: 0 4px 12px rgba(0, 82, 217, 0.3);
  }
  
  span {
    font-size: 15px;
    font-weight: 600;
    color: #fff;
    line-height: 1;
  }
  
  .selected-count {
    font-size: 12px !important;
    font-weight: 400 !important;
    opacity: 0.9;
  }
}
</style>

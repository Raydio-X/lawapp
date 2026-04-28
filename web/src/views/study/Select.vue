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

    <div class="loading-container" v-if="loading">
      <t-icon name="loading" size="40px" color="#3B82F6" />
      <span class="loading-text">加载中...</span>
    </div>

    <div class="library-list" v-else>
      <div class="select-all" @click="onToggleAll">
        <div class="checkbox" :class="{ checked: isAllSelected }">
          <t-icon v-if="isAllSelected" name="check" size="14px" color="#fff" />
        </div>
        <span class="select-all-text">全选</span>
        <span class="selected-count">已选 {{ selectedCount }} 个</span>
      </div>

      <div class="library-item" 
        v-for="library in libraries" 
        :key="library.id"
        :class="{ selected: library.selected }"
        @click="onToggleLibrary(library.id)"
      >
        <div class="library-info">
          <div class="library-icon">
            <t-icon name="folder" size="20px" color="#3B82F6" />
          </div>
          <div class="library-content">
            <div class="library-name">{{ library.name }}</div>
            <div class="library-meta">
              <span class="meta-item">
                <t-icon name="view-module" size="12px" color="#999" />
                {{ library.totalCards }} 张卡片
              </span>
              <span class="meta-item" v-if="library.unlearned > 0">
                <t-icon name="book" size="12px" color="#00B578" />
                {{ library.unlearned }} 张待学
              </span>
              <span class="meta-item learned" v-else>
                <t-icon name="check-circle" size="12px" color="#00B578" />
                已全部掌握
              </span>
            </div>
          </div>
        </div>
        <div class="checkbox" :class="{ checked: library.selected }">
          <t-icon v-if="library.selected" name="check" size="14px" color="#fff" />
        </div>
      </div>

      <div class="empty-state" v-if="libraries.length === 0">
        <t-icon name="folder" size="48px" color="#ddd" />
        <span class="empty-text">暂无知识库</span>
        <span class="empty-subtext">请先创建知识库</span>
      </div>
    </div>

    <div class="bottom-bar" v-if="!loading">
      <div class="stats-info">
        <span class="stats-text">共 {{ totalUnlearned }} 张待学习卡片</span>
      </div>
      <div class="start-btn" :class="{ disabled: selectedCount === 0 || totalUnlearned === 0 }" @click="onStartStudy">
        <span>开始学习</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { libraryAPI, cardAPI } from '@/utils/api'

const router = useRouter()

interface Library {
  id: number
  name: string
  totalCards: number
  unlearned: number
  selected: boolean
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
    const res = await libraryAPI.getList({ page: 1, pageSize: 100 })
    if (res.success && res.data) {
      const list = res.data.list || res.data || []
      libraries.value = list.map((lib: any) => ({
        id: lib.id,
        name: lib.name,
        totalCards: lib.card_count || 0,
        unlearned: lib.unlearned_count || 0,
        selected: false
      }))
    }
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
</script>

<style lang="scss" scoped>
.select-container {
  min-height: 100vh;
  background-color: #f5f6fa;
  padding-top: 44px;
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
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
  padding: 12px;
}

.select-all {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border-radius: 12px;
  margin-bottom: 12px;
  cursor: pointer;
  
  &:active {
    background: #f5f6fa;
  }
}

.select-all-text {
  flex: 1;
  margin-left: 12px;
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.selected-count {
  font-size: 13px;
  color: #3B82F6;
}

.checkbox {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  
  &.checked {
    background: #3B82F6;
    border-color: #3B82F6;
  }
}

.library-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:active {
    background: #f5f6fa;
  }
  
  &.selected {
    background: rgba(0, 82, 217, 0.05);
    border: 1px solid rgba(0, 82, 217, 0.2);
  }
}

.library-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.library-icon {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #EBF3FF 0%, #E1E8F7 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.library-content {
  flex: 1;
}

.library-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}

.library-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #999;
  
  &.learned {
    color: #00B578;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
}

.empty-text {
  margin-top: 12px;
  font-size: 16px;
  color: #999;
}

.empty-subtext {
  margin-top: 4px;
  font-size: 13px;
  color: #ccc;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stats-info {
  flex: 1;
}

.stats-text {
  font-size: 14px;
  color: #666;
}

.start-btn {
  min-width: 120px;
  height: 44px;
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  span {
    font-size: 16px;
    color: #fff;
    font-weight: 600;
  }
  
  &:active {
    transform: scale(0.98);
  }
  
  &.disabled {
    background: #ccc;
    pointer-events: none;
  }
}
</style>

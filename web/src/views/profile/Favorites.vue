<template>
  <div class="container">
    <div class="custom-nav">
      <div class="nav-content">
        <div class="nav-left">
          <div class="back-btn" @click="router.back()">
            <t-icon name="chevron-left" size="20px" color="#333" />
          </div>
        </div>
        <div class="nav-title">我的收藏</div>
        <div class="nav-right"></div>
      </div>
    </div>

    <div class="header">
      <div class="tabs">
        <div 
          class="tab" 
          :class="{ active: type === 'card' }" 
          @click="onTypeChange('card')"
        >卡片</div>
        <div 
          class="tab" 
          :class="{ active: type === 'library' }" 
          @click="onTypeChange('library')"
        >知识库</div>
      </div>
    </div>

    <div class="loading" v-if="loading">
      <t-icon name="loading" size="20px" color="#3B82F6" />
      <span>加载中...</span>
    </div>

    <div class="list" v-else-if="favorites.length > 0">
      <div 
        class="item" 
        :class="{ pressed: item.pressed }"
        v-for="(item, index) in favorites" 
        :key="item.id"
        @click="onItemTap(item)"
        @mousedown="onItemTouchStart(index)"
        @mouseup="onItemTouchEnd(index)"
        @mouseleave="onItemTouchEnd(index)"
      >
        <div class="item-content">
          <div class="item-icon">
            <t-icon :name="item.type === 'library' ? 'folder' : 'file'" size="24px" color="#3B82F6" />
          </div>
          <div class="item-info">
            <span class="item-name">{{ item.name }}</span>
            <span class="item-time">{{ item.time }} 收藏</span>
          </div>
        </div>
        <div class="item-actions">
          <div class="action-btn copy-btn" v-if="item.type === 'library'" @click.stop="onBatchCopy(item)">
            <t-icon name="file-copy" size="18px" color="#3B82F6" />
          </div>
          <div class="action-btn" @click.stop="onRemoveFavorite(index)">
            <t-icon name="close" size="18px" color="#999" />
          </div>
        </div>
      </div>
    </div>

    <div class="empty" v-else>
      <t-icon name="star" size="48px" color="#ccc" />
      <span>暂无收藏</span>
    </div>

    <div class="card-select-modal" v-if="showCardSelect">
      <div class="modal-mask" @click="showCardSelect = false"></div>
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-title">选择要复制的卡片</div>
          <div class="modal-close" @click="showCardSelect = false">
            <t-icon name="close" size="20px" color="#999" />
          </div>
        </div>
        <div class="modal-subtitle">{{ selectedLibrary?.name }} · 共 {{ libraryCards.length }} 张卡片</div>
        
        <div class="select-actions">
          <div class="select-all-btn" @click="onSelectAll">
            <t-icon :name="isAllSelected ? 'check-circle-filled' : 'circle'" size="18px" :color="isAllSelected ? '#3B82F6' : '#999'" />
            <span>全选</span>
          </div>
          <div class="selected-count">已选 {{ selectedCardIds.length }} 张</div>
        </div>

        <div class="card-list" v-if="!cardsLoading">
          <div 
            class="card-item" 
            :class="{ selected: selectedCardIds.includes(card.id) }"
            v-for="card in libraryCards" 
            :key="card.id"
            @click="onToggleCard(card.id)"
          >
            <div class="card-checkbox">
              <t-icon :name="selectedCardIds.includes(card.id) ? 'check-circle-filled' : 'circle'" size="20px" :color="selectedCardIds.includes(card.id) ? '#3B82F6' : '#ccc'" />
            </div>
            <div class="card-content">
              <div class="card-question">{{ card.question }}</div>
              <div class="card-answer" v-html="card.answer"></div>
            </div>
          </div>
        </div>

        <div class="cards-loading" v-else>
          <t-icon name="loading" size="20px" color="#3B82F6" />
          <span>加载卡片中...</span>
        </div>

        <div class="modal-footer">
          <div class="select-row">
            <t-select 
              v-model="targetLibraryId" 
              :options="myLibraryOptions"
              placeholder="选择目标知识库"
              style="flex: 1"
              @change="onLibraryChange"
            />
          </div>
          <div class="select-row" v-if="targetLibraryId">
            <t-select 
              v-model="targetChapterId" 
              :options="chapterOptions"
              placeholder="选择目录（可选）"
              style="flex: 1"
              clearable
            />
          </div>
          <t-button 
            theme="primary" 
            :loading="copyLoading"
            :disabled="selectedCardIds.length === 0 || !targetLibraryId"
            @click="onConfirmCopy"
          >
            复制 {{ selectedCardIds.length }} 张
          </t-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next'
import { favoriteAPI, cardAPI, libraryAPI, chapterAPI } from '@/utils/api'

const router = useRouter()

interface Favorite {
  id: number
  name: string
  type: string
  time: string
  pressed: boolean
}

interface LibraryCard {
  id: number
  question: string
  answer: string
}

const favorites = ref<Favorite[]>([])
const loading = ref(true)
const type = ref('card')

const showCardSelect = ref(false)
const cardsLoading = ref(false)
const copyLoading = ref(false)
const selectedLibrary = ref<Favorite | null>(null)
const libraryCards = ref<LibraryCard[]>([])
const selectedCardIds = ref<number[]>([])
const targetLibraryId = ref<number | null>(null)
const targetChapterId = ref<number | null>(null)
const myLibraryOptions = ref<{ label: string; value: number }[]>([])
const chapterOptions = ref<{ label: string; value: number }[]>([])

const isAllSelected = computed(() => {
  return libraryCards.value.length > 0 && selectedCardIds.value.length === libraryCards.value.length
})

onMounted(() => {
  loadFavorites()
  loadMyLibraries()
})

const loadFavorites = async () => {
  loading.value = true
  try {
    const res = await favoriteAPI.getList({ type: type.value, page: 1, pageSize: 100 })
    if (res.success && res.data) {
      favorites.value = (res.data.list || []).map((item: any) => ({
        id: item.target_id,
        name: item.target_name,
        type: item.target_type,
        time: formatTime(item.created_at),
        pressed: false
      }))
    }
  } catch (error) {
    console.error('加载收藏失败:', error)
    MessagePlugin.error('加载失败')
  } finally {
    loading.value = false
  }
}

const loadMyLibraries = async () => {
  try {
    const res = await libraryAPI.getMyLibraries({ page: 1, pageSize: 100 })
    if (res.success && res.data) {
      const libraries = res.data.list || res.data.libraries || res.data || []
      myLibraryOptions.value = libraries.map((lib: any) => ({
        label: lib.name,
        value: lib.id
      }))
    }
  } catch (error) {
    console.error('加载知识库失败:', error)
  }
}

const formatTime = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const onTypeChange = (newType: string) => {
  type.value = newType
  loadFavorites()
}

const onItemTouchStart = (index: number) => {
  if (favorites.value[index]) {
    favorites.value[index].pressed = true
  }
}

const onItemTouchEnd = (index: number) => {
  if (favorites.value[index]) {
    favorites.value[index].pressed = false
  }
}

const onItemTap = (item: Favorite) => {
  if (item.type === 'library') {
    router.push({
      path: '/library/detail',
      query: {
        id: item.id,
        name: item.name
      }
    })
  } else if (item.type === 'card') {
    router.push({
      path: '/card/study',
      query: {
        cardId: item.id,
        libraryId: 'hot_cards',
        index: 0
      }
    })
  }
}

const onRemoveFavorite = (index: number) => {
  const item = favorites.value[index]
  
  const confirmDialog = DialogPlugin.confirm({
    header: '提示',
    body: '确定取消收藏吗？',
    onConfirm: async () => {
      try {
        await favoriteAPI.remove(item.type, item.id)
        favorites.value = favorites.value.filter((_, i) => i !== index)
        MessagePlugin.success('已取消收藏')
      } catch (error: any) {
        console.error('取消收藏失败:', error)
        MessagePlugin.error(error.message || '操作失败')
      }
      confirmDialog.hide()
    }
  })
}

const onBatchCopy = async (item: Favorite) => {
  selectedLibrary.value = item
  targetLibraryId.value = null
  targetChapterId.value = null
  chapterOptions.value = []
  selectedCardIds.value = []
  libraryCards.value = []
  showCardSelect.value = true
  cardsLoading.value = true
  
  try {
    const res = await cardAPI.getList({ library_id: item.id, page: 1, pageSize: 1000 })
    if (res.success && res.data) {
      const cards = res.data.list || res.data || []
      libraryCards.value = cards.map((card: any) => ({
        id: card.id,
        question: card.question,
        answer: card.answer || ''
      }))
    }
  } catch (error) {
    console.error('获取卡片失败:', error)
    MessagePlugin.error('获取卡片失败')
    showCardSelect.value = false
  } finally {
    cardsLoading.value = false
  }
}

const onLibraryChange = async (value: number) => {
  targetChapterId.value = null
  chapterOptions.value = []
  
  if (value) {
    try {
      const res = await chapterAPI.getList(value)
      if (res.success && res.data) {
        const chapters = res.data.chapters || res.data || []
        chapterOptions.value = chapters.map((ch: any) => ({
          label: ch.name,
          value: ch.id
        }))
      }
    } catch (error) {
      console.error('加载章节失败:', error)
    }
  }
}

const onToggleCard = (cardId: number) => {
  const index = selectedCardIds.value.indexOf(cardId)
  if (index > -1) {
    selectedCardIds.value.splice(index, 1)
  } else {
    selectedCardIds.value.push(cardId)
  }
}

const onSelectAll = () => {
  if (isAllSelected.value) {
    selectedCardIds.value = []
  } else {
    selectedCardIds.value = libraryCards.value.map(card => card.id)
  }
}

const onConfirmCopy = async () => {
  if (!targetLibraryId.value) {
    MessagePlugin.warning('请选择目标知识库')
    return
  }
  
  if (selectedCardIds.value.length === 0) {
    MessagePlugin.warning('请选择要复制的卡片')
    return
  }
  
  copyLoading.value = true
  
  try {
    const copyRes = await cardAPI.batchCopy(selectedCardIds.value, targetLibraryId.value, targetChapterId.value || undefined)
    if (copyRes.success) {
      MessagePlugin.success(`成功复制 ${copyRes.data.count} 张卡片`)
      showCardSelect.value = false
    }
  } catch (error: any) {
    console.error('批量复制失败:', error)
    MessagePlugin.error(error.message || '复制失败')
  } finally {
    copyLoading.value = false
  }
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #f5f6fa;
  padding-top: 44px;
  padding-bottom: env(safe-area-inset-bottom);
}

.custom-nav {
  background: #fff;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
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

.header {
  background-color: #fff;
  padding: 12px 16px;
  position: sticky;
  top: 44px;
  z-index: 10;
}

.tabs {
  display: flex;
  background-color: #f5f6fa;
  border-radius: 20px;
  padding: 3px;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 8px 0;
  font-size: 14px;
  color: #666;
  border-radius: 18px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.tab.active {
  background-color: #3B82F6;
  color: #fff;
  font-weight: 600;
}

.list {
  padding: 12px;
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.item.pressed {
  background-color: #f5f6fa;
  transform: scale(0.98);
}

.item-content {
  display: flex;
  align-items: center;
  flex: 1;
}

.item-icon {
  width: 40px;
  height: 40px;
  background-color: rgba(59, 130, 246, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
}

.item-info {
  flex: 1;
}

.item-name {
  display: block;
  font-size: 15px;
  color: #333;
  font-weight: 500;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-time {
  font-size: 12px;
  color: #999;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-btn {
  padding: 8px;
  cursor: pointer;
  
  &:active {
    opacity: 0.7;
  }
}

.copy-btn {
  &:hover {
    background: rgba(59, 130, 246, 0.1);
    border-radius: 50%;
  }
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #999;
}

.empty span {
  margin-top: 12px;
  font-size: 14px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #999;
}

.loading span {
  margin-top: 12px;
  font-size: 14px;
}

.card-select-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
}

.modal-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: relative;
  width: 100%;
  max-height: 80vh;
  background: #fff;
  border-radius: 16px 16px 0 0;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.modal-close {
  padding: 4px;
  cursor: pointer;
  
  &:active {
    opacity: 0.7;
  }
}

.modal-subtitle {
  padding: 12px 16px;
  font-size: 13px;
  color: #999;
  background: #fafafa;
}

.select-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.select-all-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  
  span {
    font-size: 14px;
    color: #333;
  }
  
  &:active {
    opacity: 0.7;
  }
}

.selected-count {
  font-size: 13px;
  color: #3B82F6;
  font-weight: 500;
}

.card-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.card-item {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 8px;
  border: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &.selected {
    border-color: #3B82F6;
    background: rgba(59, 130, 246, 0.05);
  }
  
  &:active {
    transform: scale(0.98);
  }
}

.card-checkbox {
  margin-right: 12px;
  padding-top: 2px;
}

.card-content {
  flex: 1;
  min-width: 0;
}

.card-question {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.card-answer {
  font-size: 12px;
  color: #999;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  
  :deep(ol), :deep(ul) {
    padding-left: 16px;
    margin: 0;
  }
  
  :deep(table) {
    font-size: 11px;
  }
}

.cards-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #999;
  
  span {
    margin-top: 8px;
    font-size: 13px;
  }
}

.modal-footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  background: #fff;
}

.select-row {
  width: 100%;
}
</style>

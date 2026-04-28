<template>
  <div class="hot-container">
    <div class="custom-nav">
      <div class="nav-left" @click="router.back()">
        <t-icon name="chevron-left" size="20px" color="#333" />
      </div>
      <div class="nav-title">热门卡片</div>
      <div class="nav-right"></div>
    </div>

    <div class="page-header">
      <div class="header-title">热门卡片</div>
      <div class="header-desc">精选高频考点，助力高效备考</div>
    </div>

    <div class="loading-container" v-if="loading">
      <t-icon name="loading" size="40px" color="#3B82F6" />
      <span class="loading-text">加载中...</span>
    </div>

    <div class="cards-list" v-else>
      <div 
        class="card-item" 
        :class="{ pressed: pressedIndex === index }"
        v-for="(card, index) in cards" 
        :key="card.id"
        @click="onCardTap(card)"
        @mousedown="pressedIndex = index"
        @mouseup="pressedIndex = -1"
        @mouseleave="pressedIndex = -1"
      >
        <div class="card-header">
          <div class="card-number">NO.{{ index + 1 }}</div>
          <div class="card-tags">
            <t-tag 
              v-for="tag in card.tags.slice(0, 2)" 
              :key="tag"
              theme="primary" 
              variant="light"
              size="small"
            >{{ tag }}</t-tag>
          </div>
        </div>

        <div class="card-content">
          <span class="card-question">{{ card.question }}</span>
        </div>

        <div class="card-footer">
          <div class="card-stats">
            <div 
              class="stat-item like-btn" 
              :class="{ liked: card.liked }"
              @click.stop="onLikeCard(card, index)"
            >
              <t-icon :name="card.liked ? 'thumb-up-filled' : 'thumb-up'" size="15px" :color="card.liked ? '#3B82F6' : '#999'" />
              <span>{{ card.likes }}</span>
            </div>
          </div>
          <div class="study-btn">
            <t-icon name="chevron-right" size="16px" color="#3B82F6" />
          </div>
        </div>
      </div>

      <div class="empty-state" v-if="cards.length === 0">
        <t-icon name="fire" size="48px" color="#ddd" />
        <span class="empty-text">暂无热门卡片</span>
      </div>
    </div>

    <div class="bottom-placeholder"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { cardAPI } from '@/utils/api'

const router = useRouter()

interface Card {
  id: number
  question: string
  answer: string
  tags: string[]
  libraryId: number
  libraryName: string
  likes: number
  liked: boolean
  learned: boolean
}

const cards = ref<Card[]>([])
const loading = ref(true)
const pressedIndex = ref(-1)

onMounted(() => {
  loadHotCards()
})

const loadHotCards = async () => {
  loading.value = true
  try {
    const res = await cardAPI.getHotCards(50)
    if (res.success && res.data) {
      cards.value = (res.data || []).map((card: any) => ({
        id: card.id,
        question: card.question,
        answer: card.answer,
        tags: card.tags || [],
        libraryId: card.library_id,
        libraryName: card.library_name || '未知知识库',
        likes: card.like_count || 0,
        liked: card.is_liked || false,
        learned: card.is_learned || false
      }))
    }
  } catch (error) {
    console.error('加载热门卡片失败:', error)
    MessagePlugin.error('加载失败')
  } finally {
    loading.value = false
  }
}

const onLikeCard = async (card: Card, index: number) => {
  try {
    const res = await cardAPI.toggleLike(card.id)
    if (res.success) {
      cards.value[index].liked = !cards.value[index].liked
      cards.value[index].likes += cards.value[index].liked ? 1 : -1
    }
  } catch (error) {
    console.error('点赞失败:', error)
  }
}

const onCardTap = (card: Card) => {
  localStorage.setItem('hotCardsData', JSON.stringify({
    cardList: cards.value
  }))
  
  const cardIndex = cards.value.findIndex(c => c.id === card.id)
  router.push({
    path: '/card/study',
    query: {
      cardId: card.id,
      libraryId: 'hot_cards',
      index: cardIndex
    }
  })
}
</script>

<style lang="scss" scoped>
.custom-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 44px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  z-index: 100;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
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
  color: #333;
}

.nav-right {
  width: 40px;
}

.hot-container {
  min-height: 100vh;
  background-color: #f5f6fa;
  padding: 60px 16px 16px;
  box-sizing: border-box;
}

.page-header {
  margin-bottom: 20px;
  padding: 0 8px;
}

.header-title {
  font-size: 24px;
  font-weight: 700;
  color: #333;
  margin-bottom: 6px;
}

.header-desc {
  font-size: 14px;
  color: #999;
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

.cards-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-item {
  background-color: #fff;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease;
  cursor: pointer;
  
  &.pressed {
    transform: scale(0.98);
    opacity: 0.9;
  }
  
  &:active {
    transform: scale(0.98);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.card-number {
  font-size: 12px;
  font-weight: 600;
  color: #3B82F6;
  background: rgba(0, 82, 217, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
}

.card-tags {
  display: flex;
  gap: 6px;
}

.card-content {
  margin-bottom: 12px;
}

.card-question {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.card-stats {
  display: flex;
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #999;
}

.stat-item.like-btn {
  padding: 4px 8px;
  border-radius: 12px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.stat-item.like-btn.liked {
  color: #3B82F6;
  background-color: rgba(0, 82, 217, 0.1);
}

.stat-item.like-btn:not(.liked):active {
  transform: scale(0.95);
}

.study-btn {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background-color: rgba(0, 82, 217, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
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

.bottom-placeholder {
  height: 24px;
}
</style>

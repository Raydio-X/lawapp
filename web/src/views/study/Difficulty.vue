<template>
  <div class="container">
    <div class="custom-nav">
      <div class="nav-content">
        <div class="nav-left">
          <div class="back-btn" @click="onBack">
            <t-icon name="chevron-left" size="20px" color="#333" />
          </div>
        </div>
        <div class="nav-title">难度挑战</div>
        <div class="nav-right"></div>
      </div>
    </div>

    <div class="page-content">
      <div class="intro-section">
        <div class="intro-icon">
          <t-icon name="chart" size="32px" color="#3B82F6" />
        </div>
        <div class="intro-text">
          <span class="intro-title">挑战自我，突破极限</span>
          <span class="intro-desc">根据所有用户的评分，选择适合你的难度等级</span>
        </div>
      </div>

      <div class="stats-overview" v-if="stats.total > 0">
        <span class="stats-text">共 {{ stats.total }} 张卡片已获得难度评分</span>
      </div>

      <div class="difficulty-list">
        <div class="difficulty-card hell" @click="onSelectDifficulty('hell')">
          <div class="difficulty-header">
            <div class="difficulty-icon">
              <span class="fire-emoji">🔥</span>
            </div>
            <div class="difficulty-info">
              <span class="difficulty-title">地狱模式</span>
              <span class="difficulty-desc">难度 4.5+ 的卡片</span>
            </div>
          </div>
          <div class="difficulty-body">
            <div class="difficulty-left">
              <div class="difficulty-stars">
                <t-icon name="star-filled" size="16px" color="#F59E0B" />
                <t-icon name="star-filled" size="16px" color="#F59E0B" />
                <t-icon name="star-filled" size="16px" color="#F59E0B" />
                <t-icon name="star-filled" size="16px" color="#F59E0B" />
                <t-icon name="star-filled" size="16px" color="#F59E0B" />
              </div>
              <div class="raters-text">基于 {{ stats.hellRaters }} 位用户的评价</div>
            </div>
            <div class="difficulty-count">
              <span class="count-number">{{ stats.hell }}</span>
              <span class="count-text">张卡片</span>
            </div>
          </div>
          <div class="difficulty-footer">
            <span class="footer-text">适合学霸挑战</span>
            <t-icon name="chevron-right" size="18px" color="#E34D59" />
          </div>
        </div>

        <div class="difficulty-card hard" @click="onSelectDifficulty('hard')">
          <div class="difficulty-header">
            <div class="difficulty-icon">
              <span class="hard-emoji">💪</span>
            </div>
            <div class="difficulty-info">
              <span class="difficulty-title">困难模式</span>
              <span class="difficulty-desc">难度 3.5-4.5 的卡片</span>
            </div>
          </div>
          <div class="difficulty-body">
            <div class="difficulty-left">
              <div class="difficulty-stars">
                <t-icon name="star-filled" size="16px" color="#F59E0B" />
                <t-icon name="star-filled" size="16px" color="#F59E0B" />
                <t-icon name="star-filled" size="16px" color="#F59E0B" />
                <t-icon name="star-filled" size="16px" color="#F59E0B" />
                <t-icon name="star" size="16px" color="#CBD5E1" />
              </div>
              <div class="raters-text">基于 {{ stats.hardRaters }} 位用户的评价</div>
            </div>
            <div class="difficulty-count">
              <span class="count-number">{{ stats.hard }}</span>
              <span class="count-text">张卡片</span>
            </div>
          </div>
          <div class="difficulty-footer">
            <span class="footer-text">进阶挑战</span>
            <t-icon name="chevron-right" size="18px" color="#F59E0B" />
          </div>
        </div>

        <div class="difficulty-card medium" @click="onSelectDifficulty('medium')">
          <div class="difficulty-header">
            <div class="difficulty-icon">
              <span class="medium-emoji">📚</span>
            </div>
            <div class="difficulty-info">
              <span class="difficulty-title">中等模式</span>
              <span class="difficulty-desc">难度 2.5-3.5 的卡片</span>
            </div>
          </div>
          <div class="difficulty-body">
            <div class="difficulty-left">
              <div class="difficulty-stars">
                <t-icon name="star-filled" size="16px" color="#F59E0B" />
                <t-icon name="star-filled" size="16px" color="#F59E0B" />
                <t-icon name="star-filled" size="16px" color="#F59E0B" />
                <t-icon name="star" size="16px" color="#CBD5E1" />
                <t-icon name="star" size="16px" color="#CBD5E1" />
              </div>
              <div class="raters-text">基于 {{ stats.mediumRaters }} 位用户的评价</div>
            </div>
            <div class="difficulty-count">
              <span class="count-number">{{ stats.medium }}</span>
              <span class="count-text">张卡片</span>
            </div>
          </div>
          <div class="difficulty-footer">
            <span class="footer-text">稳步提升</span>
            <t-icon name="chevron-right" size="18px" color="#3B82F6" />
          </div>
        </div>

        <div class="difficulty-card easy" @click="onSelectDifficulty('easy')">
          <div class="difficulty-header">
            <div class="difficulty-icon">
              <span class="easy-emoji">🌱</span>
            </div>
            <div class="difficulty-info">
              <span class="difficulty-title">简单模式</span>
              <span class="difficulty-desc">难度 1-2.5 的卡片</span>
            </div>
          </div>
          <div class="difficulty-body">
            <div class="difficulty-left">
              <div class="difficulty-stars">
                <t-icon name="star-filled" size="16px" color="#F59E0B" />
                <t-icon name="star" size="16px" color="#CBD5E1" />
                <t-icon name="star" size="16px" color="#CBD5E1" />
                <t-icon name="star" size="16px" color="#CBD5E1" />
                <t-icon name="star" size="16px" color="#CBD5E1" />
              </div>
              <div class="raters-text">基于 {{ stats.easyRaters }} 位用户的评价</div>
            </div>
            <div class="difficulty-count">
              <span class="count-number">{{ stats.easy }}</span>
              <span class="count-text">张卡片</span>
            </div>
          </div>
          <div class="difficulty-footer">
            <span class="footer-text">入门练习</span>
            <t-icon name="chevron-right" size="18px" color="#00A870" />
          </div>
        </div>
      </div>

      <div class="empty-section" v-if="stats.total === 0 && !loading">
        <div class="empty-icon">
          <t-icon name="info-circle" size="48px" color="#CBD5E1" />
        </div>
        <span class="empty-text">暂无难度评分数据</span>
        <span class="empty-desc">学习卡片后为它们评分吧</span>
      </div>
    </div>

    <div class="loading-container" v-if="loading">
      <t-icon name="loading" size="40px" color="#3B82F6" />
      <span class="loading-text">加载中...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { cardAPI } from '@/utils/api'

const router = useRouter()

interface DifficultyStats {
  hell: number
  hard: number
  medium: number
  easy: number
  total: number
  hellRaters: number
  hardRaters: number
  mediumRaters: number
  easyRaters: number
}

const loading = ref(true)
const stats = ref<DifficultyStats>({
  hell: 0,
  hard: 0,
  medium: 0,
  easy: 0,
  total: 0,
  hellRaters: 0,
  hardRaters: 0,
  mediumRaters: 0,
  easyRaters: 0
})

onMounted(() => {
  loadStats()
})

const loadStats = async () => {
  try {
    const res = await cardAPI.getDifficultyStats()
    if (res.success && res.data) {
      stats.value = res.data
    }
  } catch (error) {
    console.error('加载难度统计失败:', error)
    MessagePlugin.error('加载失败')
  } finally {
    loading.value = false
  }
}

const onBack = () => {
  router.push('/study')
}

const onSelectDifficulty = async (level: string) => {
  const levelNames: Record<string, string> = {
    hell: '地狱模式',
    hard: '困难模式',
    medium: '中等模式',
    easy: '简单模式'
  }
  
  const count = stats.value[level as keyof DifficultyStats] as number
  
  if (count === 0) {
    MessagePlugin.warning('该难度等级暂无卡片')
    return
  }

  MessagePlugin.loading({ content: '准备中...', duration: 0 })

  try {
    const res = await cardAPI.getDifficultyCards(level)
    MessagePlugin.closeAll()

    if (!res.success || !res.data || res.data.length === 0) {
      MessagePlugin.warning('该难度等级暂无卡片')
      return
    }

    const cards = res.data.map((card: any) => ({
      id: card.id,
      question: card.question,
      answer: card.answer || '',
      keywords: card.keywords || '',
      tags: card.tags || [],
      learned: false,
      libraryId: card.libraryId || card.library_id,
      libraryName: card.libraryName || card.library_name,
      difficultyRating: card.difficultyRating || card.difficulty_rating
    }))

    localStorage.setItem('difficultyCardsData', JSON.stringify({
      cardList: cards,
      difficultyLevel: level,
      difficultyName: levelNames[level],
      totalCards: cards.length,
      isDifficultyMode: true
    }))

    router.push({
      path: '/study/cards',
      query: { index: 0, total: cards.length, mode: 'difficulty' }
    })
  } catch (error) {
    MessagePlugin.closeAll()
    console.error('加载难度卡片失败:', error)
    MessagePlugin.error('加载失败，请重试')
  }
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f5f7ff 0%, #ffffff 30%);
  padding-bottom: 30px;
}

.custom-nav {
  background: #fff;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
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

.page-content {
  padding: 56px 16px 20px;
}

.intro-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%);
  border-radius: 12px;
  margin-bottom: 16px;
}

.intro-icon {
  width: 48px;
  height: 48px;
  background: #fff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

.intro-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.intro-title {
  font-size: 16px;
  font-weight: 600;
  color: #1E293B;
}

.intro-desc {
  font-size: 12px;
  color: #64748B;
}

.stats-overview {
  text-align: center;
  margin-bottom: 16px;
}

.stats-text {
  font-size: 13px;
  color: #94A3B8;
}

.difficulty-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.difficulty-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  
  &:active {
    transform: scale(0.98);
  }
  
  &.hell {
    border-color: rgba(227, 77, 89, 0.2);
    
    &:hover {
      border-color: rgba(227, 77, 89, 0.4);
      box-shadow: 0 4px 12px rgba(227, 77, 89, 0.15);
    }
  }
  
  &.hard {
    border-color: rgba(245, 158, 11, 0.2);
    
    &:hover {
      border-color: rgba(245, 158, 11, 0.4);
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
    }
  }
  
  &.medium {
    border-color: rgba(59, 130, 246, 0.2);
    
    &:hover {
      border-color: rgba(59, 130, 246, 0.4);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
    }
  }
  
  &.easy {
    border-color: rgba(0, 168, 112, 0.2);
    
    &:hover {
      border-color: rgba(0, 168, 112, 0.4);
      box-shadow: 0 4px 12px rgba(0, 168, 112, 0.15);
    }
  }
}

.difficulty-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.difficulty-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  
  .hell & {
    background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%);
  }
  
  .hard & {
    background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
  }
  
  .medium & {
    background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%);
  }
  
  .easy & {
    background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%);
  }
}

.difficulty-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.difficulty-title {
  font-size: 16px;
  font-weight: 600;
  color: #1E293B;
}

.difficulty-desc {
  font-size: 12px;
  color: #94A3B8;
}

.difficulty-body {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.difficulty-left {
  display: flex;
  flex-direction: column;
}

.difficulty-stars {
  display: flex;
  gap: 2px;
}

.raters-text {
  font-size: 12px;
  color: #94A3B8;
  margin-top: 6px;
}

.difficulty-count {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.count-number {
  font-size: 24px;
  font-weight: 700;
  
  .hell & {
    color: #E34D59;
  }
  
  .hard & {
    color: #F59E0B;
  }
  
  .medium & {
    color: #3B82F6;
  }
  
  .easy & {
    color: #00A870;
  }
}

.count-text {
  font-size: 13px;
  color: #94A3B8;
}

.difficulty-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid #F1F5F9;
}

.footer-text {
  font-size: 13px;
  color: #64748B;
}

.empty-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.empty-icon {
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  font-weight: 500;
  color: #64748B;
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 13px;
  color: #94A3B8;
}

.loading-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.loading-text {
  font-size: 14px;
  color: #64748B;
}
</style>

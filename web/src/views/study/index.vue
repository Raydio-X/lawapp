<template>
  <div class="container">
    <div class="greeting-section">
      <div class="greeting-left">
        <span class="greeting-text">{{ greeting }}</span>
        <span class="greeting-sub">今天也要加油学习哦~</span>
      </div>
      <div class="streak-badge" v-if="streak > 0">
        <t-icon name="fire" size="14px" color="#FF9500" />
        <span>{{ streak }}天</span>
      </div>
    </div>

    <div class="main-actions">
      <div class="action-card primary" @click="onStartStudy">
        <div class="action-decor">
          <t-icon name="book" size="60px" color="rgba(255, 255, 255, 0.15)" />
        </div>
        <div class="action-content">
          <div class="action-main">
            <div class="action-text-wrap">
              <span class="action-title">开始学习</span>
              <span class="action-desc">学习未掌握的卡片</span>
            </div>
            <div class="action-icon-wrap">
              <t-icon name="play-circle" size="24px" color="#fff" />
            </div>
          </div>
          <div class="action-badge" v-if="unlearnedCount > 0">
            <span>{{ unlearnedCount }}张待学</span>
          </div>
        </div>
      </div>

      <div class="action-row">
        <div class="action-card small smart" @click="onSmartExam">
          <div class="action-icon-wrap">
            <t-icon name="file-add" size="20px" color="#7C3AED" />
          </div>
          <span class="action-title">模拟组卷</span>
          <span class="action-desc">自定义模拟考试</span>
        </div>

        <div class="action-card small review" @click="onReview">
          <div class="action-icon-wrap">
            <t-icon name="history" size="20px" color="#FF9500" />
          </div>
          <span class="action-title">复习回顾</span>
          <span class="action-desc">{{ reviewCount }}张待复习</span>
        </div>
      </div>
    </div>

    <div class="module-section">
      <div class="module-card" @click="onFavorites">
        <div class="module-icon fav-icon">
          <t-icon name="star" size="22px" color="#FFB800" />
        </div>
        <div class="module-info">
          <span class="module-title">我的收藏</span>
          <span class="module-desc">{{ favoriteCount }}张收藏卡片</span>
        </div>
        <t-icon name="chevron-right" size="18px" color="#ccc" />
      </div>

      <div class="module-card" @click="onDifficulty">
        <div class="module-icon diff-icon">
          <t-icon name="chart" size="22px" color="#3B82F6" />
        </div>
        <div class="module-info">
          <span class="module-title">难度挑战</span>
          <span class="module-desc">挑战高难度卡片</span>
        </div>
        <t-icon name="chevron-right" size="18px" color="#ccc" />
      </div>
    </div>

    <div class="tips-section" v-if="unlearnedCount === 0">
      <div class="tips-card">
        <t-icon name="check-circle" size="20px" color="#00B578" />
        <span class="tips-text">太棒了！所有卡片都已掌握</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { studyAPI, cardAPI, favoriteAPI } from '@/utils/api'

const router = useRouter()

const streak = ref(0)
const unlearnedCount = ref(0)
const reviewCount = ref(0)
const favoriteCount = ref(0)

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  if (hour < 22) return '晚上好'
  return '夜深了'
})

onMounted(() => {
  loadStats()
})

const loadStats = async () => {
  try {
    const [statsRes, reviewRes, favRes] = await Promise.all([
      studyAPI.getStats(),
      cardAPI.getReviewCount(),
      favoriteAPI.getList({ pageSize: 1 })
    ])
    
    if (statsRes.success && statsRes.data) {
      streak.value = statsRes.data.streak || 0
      unlearnedCount.value = statsRes.data.unlearnedCount || 0
    }
    
    if (reviewRes.success && reviewRes.data) {
      reviewCount.value = reviewRes.data.count || 0
    }
    
    if (favRes.success && favRes.data) {
      favoriteCount.value = favRes.data.total || 0
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const onStartStudy = () => {
  router.push('/study/select')
}

const onSmartExam = () => {
  router.push('/study/exam/setup')
}

const onReview = () => {
  router.push('/study/cards?mode=review')
}

const onFavorites = () => {
  router.push('/profile/favorites')
}

const onDifficulty = () => {
  router.push('/study/cards?mode=difficulty')
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f5f7ff 0%, #ffffff 30%);
  padding: 0 14px 70px;
}

.greeting-section {
  padding: 20px 0 14px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.greeting-left {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.greeting-text {
  font-size: 21px;
  font-weight: 700;
  color: #1a1a1a;
}

.greeting-sub {
  font-size: 12px;
  color: #999;
}

.streak-badge {
  display: flex;
  align-items: center;
  gap: 3px;
  background: linear-gradient(135deg, #FFF7E6 0%, #FFEDD0 100%);
  padding: 5px 10px;
  border-radius: 12px;
  
  span {
    font-size: 12px;
    font-weight: 600;
    color: #FF9500;
  }
}

.main-actions {
  margin-bottom: 12px;
}

.action-card.primary {
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  border-radius: 10px;
  padding: 20px 18px;
  margin-bottom: 8px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.25);
  cursor: pointer;
}

.action-decor {
  position: absolute;
  right: 45px;
  bottom: -5px;
  z-index: 0;
}

.action-content {
  position: relative;
  z-index: 1;
}

.action-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-text-wrap {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.action-icon-wrap {
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-badge {
  background: rgba(255, 255, 255, 0.25);
  padding: 4px 10px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
  
  span {
    font-size: 12px;
    font-weight: 500;
    color: #fff;
  }
}

.action-card.primary .action-title {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

.action-card.primary .action-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.action-row {
  display: flex;
  gap: 8px;
}

.action-card.small {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  
  .action-icon-wrap {
    width: 36px;
    height: 36px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  &.smart .action-icon-wrap {
    background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
  }
  
  &.review .action-icon-wrap {
    background: linear-gradient(135deg, #fff3e8 0%, #ffe8d0 100%);
  }
  
  .action-title {
    font-size: 14px;
    font-weight: 600;
    color: #333;
  }
  
  .action-desc {
    font-size: 11px;
    color: #999;
  }
}

.module-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.module-card {
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.03);
  cursor: pointer;
}

.module-icon {
  width: 38px;
  height: 38px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.fav-icon {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.diff-icon {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
}

.module-info {
  flex: 1;
  min-width: 0;
}

.module-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 3px;
}

.module-desc {
  font-size: 12px;
  color: #999;
}

.tips-section {
  margin-top: 16px;
}

.tips-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  background: #f0fdf4;
  border-radius: 7px;
}

.tips-text {
  font-size: 13px;
  color: #00B578;
  font-weight: 500;
}
</style>

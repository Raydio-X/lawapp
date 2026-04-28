<template>
  <div class="setup-container">
    <div class="custom-nav">
      <div class="nav-content">
        <div class="nav-left">
          <div class="back-btn" @click="router.back()">
            <t-icon name="chevron-left" size="20px" color="#333" />
          </div>
        </div>
        <div class="nav-title">模拟考试</div>
        <div class="nav-right"></div>
      </div>
    </div>

    <div class="content">
      <div class="section">
        <div class="section-header">
          <span class="section-title">选择知识库</span>
          <span class="section-desc">从以下知识库中选择题目来源</span>
        </div>

        <div class="tabs">
          <div 
            class="tab" 
            :class="{ active: activeTab === 'my' }"
            @click="onTabChange('my')"
          >我的知识库</div>
          <div 
            class="tab" 
            :class="{ active: activeTab === 'favorite' }"
            @click="onTabChange('favorite')"
          >收藏知识库</div>
        </div>

        <div class="library-list" v-if="libraries.length > 0">
          <div 
            class="library-item"
            :class="{ selected: selectedLibraries.includes(item.id) }"
            v-for="item in libraries"
            :key="item.id"
            @click="onLibraryToggle(item.id)"
          >
            <div class="library-info">
              <span class="library-name">{{ item.name }}</span>
              <span class="library-count">{{ item.card_count || item.totalCards }}张卡片</span>
            </div>
          </div>
        </div>

        <div class="empty-tip" v-else>
          <span>{{ activeTab === 'my' ? '暂无知识库' : '暂无收藏的知识库' }}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <span class="section-title">题目数量</span>
          <span class="section-value">{{ questionCount }}题</span>
        </div>
        <div class="count-options">
          <div 
            class="count-option"
            :class="{ active: questionCount === 10 }"
            @click="questionCount = 10"
          >10题</div>
          <div 
            class="count-option"
            :class="{ active: questionCount === 20 }"
            @click="questionCount = 20"
          >20题</div>
          <div 
            class="count-option"
            :class="{ active: questionCount === 30 }"
            @click="questionCount = 30"
          >30题</div>
          <div 
            class="count-option"
            :class="{ active: questionCount === 50 }"
            @click="questionCount = 50"
          >50题</div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <span class="section-title">考试时长</span>
          <span class="section-value">{{ duration }}分钟</span>
        </div>
        <div class="duration-slider">
          <input 
            type="range" 
            min="5" 
            max="120" 
            step="5" 
            v-model="duration"
            class="slider"
          />
          <div class="duration-labels">
            <span>5分钟</span>
            <span>120分钟</span>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <span class="section-title">出题方式</span>
        </div>
        <div class="mode-options">
          <div 
            class="mode-option"
            :class="{ active: examMode === 'random' }"
            @click="examMode = 'random'"
          >
            <t-icon name="shuffle" size="20px" :color="examMode === 'random' ? '#3B82F6' : '#999'" />
            <span class="mode-name">随机出题</span>
            <span class="mode-desc">从选中知识库随机抽题</span>
          </div>
          <div 
            class="mode-option"
            :class="{ active: examMode === 'sequential' }"
            @click="examMode = 'sequential'"
          >
            <t-icon name="order" size="20px" :color="examMode === 'sequential' ? '#3B82F6' : '#999'" />
            <span class="mode-name">顺序出题</span>
            <span class="mode-desc">按知识库顺序出题</span>
          </div>
        </div>
      </div>

      <div class="summary-card">
        <div class="summary-row">
          <span class="summary-label">已选知识库</span>
          <span class="summary-value">{{ selectedLibraries.length }}个</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">可用卡片</span>
          <span class="summary-value">{{ availableCards }}张</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">预计用时</span>
          <span class="summary-value">{{ duration }}分钟</span>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <button 
        class="start-btn"
        :class="{ disabled: selectedLibraries.length === 0 }"
        @click="onStartExam"
      >开始考试</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { libraryAPI, favoriteAPI } from '@/utils/api'

const router = useRouter()

const activeTab = ref('my')
const libraries = ref<any[]>([])
const myLibraries = ref<any[]>([])
const favoriteLibraries = ref<any[]>([])
const selectedLibraries = ref<number[]>([])
const questionCount = ref(20)
const duration = ref(30)
const examMode = ref('random')

const availableCards = computed(() => {
  const allLibraries = [...myLibraries.value, ...favoriteLibraries.value]
  let total = 0
  selectedLibraries.value.forEach(id => {
    const lib = allLibraries.find(l => l.id === id)
    if (lib) {
      total += lib.card_count || lib.totalCards || 0
    }
  })
  return total
})

onMounted(() => {
  loadLibraries()
})

const loadLibraries = async () => {
  try {
    const [myRes, favRes] = await Promise.all([
      libraryAPI.getMyLibraries({ page: 1, pageSize: 50 }),
      favoriteAPI.getLibraries({ page: 1, pageSize: 50 })
    ])

    myLibraries.value = (myRes.success && myRes.data?.list) || []
    favoriteLibraries.value = (favRes.success && favRes.data?.libraries) || []
    libraries.value = myLibraries.value
  } catch (error) {
    console.error('加载知识库失败:', error)
    MessagePlugin.error('加载失败')
  }
}

const onTabChange = (tab: string) => {
  activeTab.value = tab
  libraries.value = tab === 'my' ? myLibraries.value : favoriteLibraries.value
}

const onLibraryToggle = (id: number) => {
  const index = selectedLibraries.value.indexOf(id)
  if (index > -1) {
    selectedLibraries.value.splice(index, 1)
  } else {
    selectedLibraries.value.push(id)
  }
}

const onStartExam = () => {
  if (selectedLibraries.value.length === 0) {
    MessagePlugin.warning('请选择知识库')
    return
  }

  if (availableCards.value < questionCount.value) {
    MessagePlugin.warning('可用卡片不足')
    return
  }

  const examConfig = {
    libraries: selectedLibraries.value,
    questionCount: questionCount.value,
    duration: duration.value,
    mode: examMode.value
  }

  localStorage.setItem('examConfig', JSON.stringify(examConfig))
  router.push('/study/exam/do')
}
</script>

<style lang="scss" scoped>
.setup-container {
  min-height: 100vh;
  background: #f5f7fa;
  padding-top: 44px;
  padding-bottom: 100px;
}

.custom-nav {
  background: #fff;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.nav-content {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}

.nav-left, .nav-right {
  width: 60px;
}

.back-btn {
  padding: 8px;
}

.nav-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.content {
  padding: 12px 14px;
}

.section {
  background: #fff;
  border-radius: 8px;
  padding: 14px;
  margin-bottom: 10px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.section-desc {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.section-value {
  font-size: 14px;
  color: #3B82F6;
  font-weight: 600;
}

.tabs {
  display: flex;
  background: #f5f7fa;
  border-radius: 6px;
  padding: 3px;
  margin-bottom: 10px;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 8px 0;
  font-size: 14px;
  color: #666;
  border-radius: 4px;
  transition: all 0.3s;
  cursor: pointer;
}

.tab.active {
  background: #fff;
  color: #3B82F6;
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.library-list {
  max-height: 200px;
  overflow-y: auto;
}

.library-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 10px;
  border-radius: 6px;
  margin-bottom: 6px;
  background: #f8f9fa;
  border: 1px solid #e8e8e8;
  transition: all 0.3s;
  cursor: pointer;
}

.library-item.selected {
  background: #e8f0ff;
  border-color: #3B82F6;
}

.library-item:last-child {
  margin-bottom: 0;
}

.library-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.library-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.library-item.selected .library-name {
  color: #3B82F6;
  font-weight: 600;
}

.library-count {
  font-size: 12px;
  color: #999;
}

.library-item.selected .library-count {
  color: #3B82F6;
}

.empty-tip {
  text-align: center;
  padding: 20px 0;
  color: #999;
  font-size: 13px;
}

.count-options {
  display: flex;
  gap: 8px;
}

.count-option {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 14px;
  color: #666;
  border: 1px solid transparent;
  transition: all 0.3s;
  cursor: pointer;
}

.count-option.active {
  background: #f0f5ff;
  color: #3B82F6;
  border-color: #3B82F6;
  font-weight: 600;
}

.duration-slider {
  padding: 5px 0;
}

.slider {
  width: 100%;
  height: 4px;
  background: #e7e7e7;
  border-radius: 2px;
  outline: none;
  -webkit-appearance: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 18px;
    height: 18px;
    background: #3B82F6;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
  }
}

.duration-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  
  span {
    font-size: 11px;
    color: #999;
  }
}

.mode-options {
  display: flex;
  gap: 8px;
}

.mode-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 10px;
  background: #f5f7fa;
  border-radius: 6px;
  border: 1px solid transparent;
  transition: all 0.3s;
  cursor: pointer;
}

.mode-option.active {
  background: #f0f5ff;
  border-color: #3B82F6;
}

.mode-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  margin-top: 6px;
}

.mode-desc {
  font-size: 11px;
  color: #999;
  margin-top: 3px;
}

.summary-card {
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  border-radius: 8px;
  padding: 14px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
}

.summary-row:not(:last-child) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
}

.summary-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
}

.summary-value {
  font-size: 14px;
  color: #fff;
  font-weight: 600;
}

.footer-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 10px 14px;
  padding-bottom: calc(10px + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.06);
}

.start-btn {
  width: 100%;
  height: 44px;
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  border-radius: 22px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
  
  &:active {
    transform: scale(0.98);
  }
  
  &.disabled {
    background: #ccc;
    cursor: not-allowed;
  }
}
</style>

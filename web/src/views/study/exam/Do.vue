<template>
  <div class="do-container">
    <div class="custom-nav">
      <div class="nav-content">
        <div class="nav-left">
          <div class="exit-btn" @click="onExit">退出</div>
        </div>
        <div class="nav-title">考试中</div>
        <div class="nav-right"></div>
      </div>
    </div>

    <div class="header">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
      <div class="header-info">
        <div class="question-progress">
          <span class="current">{{ currentIndex + 1 }}</span>
          <span class="total">/{{ questions.length }}</span>
        </div>
        <div class="timer">
          <t-icon name="time" size="14px" color="#df1126" />
          <span>{{ remainingTimeText }}</span>
        </div>
      </div>
    </div>

    <div class="loading-container" v-if="loading">
      <t-icon name="loading" size="40px" color="#3B82F6" />
      <span class="loading-text">组卷中...</span>
    </div>

    <div class="content" v-else-if="currentQuestion">
      <div class="question-card">
        <div class="question-header">
          <div class="question-tag">第{{ currentIndex + 1 }}题</div>
          <div class="question-actions">
            <div 
              class="action-btn"
              :class="{ marked: currentQuestion.isMarked }"
              @click="onToggleMark"
            >
              <t-icon 
                name="flag" 
                size="16px" 
                :color="currentQuestion.isMarked ? '#E34D59' : '#999'" 
              />
            </div>
          </div>
        </div>
        
        <div class="question-content">
          <span class="question-text">{{ currentQuestion.question }}</span>
        </div>
      </div>

      <div class="user-answer">
        <div class="answer-label">你的作答</div>
        <textarea 
          class="answer-input"
          placeholder="请输入你的答案..."
          v-model="userAnswers[currentIndex]"
          :maxlength="1000"
        ></textarea>
      </div>
    </div>

    <div class="footer">
      <div class="nav-btns">
        <button 
          class="nav-btn prev"
          :disabled="currentIndex === 0"
          @click="onPrevQuestion"
        >上一题</button>
        <button 
          class="nav-btn next"
          @click="onNextQuestion"
        >{{ currentIndex === questions.length - 1 ? '提交试卷' : '下一题' }}</button>
      </div>
    </div>

    <div class="result-modal" v-if="showResult">
      <div class="result-content">
        <div class="result-header">
          <t-icon name="time" size="50px" color="#3B82F6" />
          <span class="result-title">考试完成</span>
        </div>
        
        <div class="result-stats">
          <div class="stat-item">
            <span class="stat-value">{{ questions.length }}</span>
            <span class="stat-label">总题数</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">{{ usedTimeText }}</span>
            <span class="stat-label">用时</span>
          </div>
        </div>

        <div class="result-tip">
          <span>请前往解析页面查看答案</span>
        </div>

        <div class="result-btns">
          <button class="result-btn review" @click="onReviewAll">
            查看解析
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next'
import { examAPI } from '@/utils/api'

const router = useRouter()

interface Question {
  id: number
  question: string
  answer: string
  isMarked: boolean
}

const loading = ref(true)
const questions = ref<Question[]>([])
const currentIndex = ref(0)
const userAnswers = ref<string[]>([])
const remainingTime = ref(0)
const totalTime = ref(0)
const showResult = ref(false)
const usedTimeText = ref('')

let timer: ReturnType<typeof setInterval> | null = null
let config: any = null

const currentQuestion = computed(() => questions.value[currentIndex.value])

const progress = computed(() => {
  if (questions.value.length === 0) return 0
  return ((currentIndex.value + 1) / questions.value.length) * 100
})

const remainingTimeText = computed(() => {
  const mins = Math.floor(remainingTime.value / 60)
  const secs = remainingTime.value % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
})

onMounted(() => {
  const configStr = localStorage.getItem('examConfig')
  if (!configStr) {
    MessagePlugin.error('考试配置错误')
    setTimeout(() => router.back(), 1500)
    return
  }
  
  config = JSON.parse(configStr)
  const totalSeconds = config.duration * 60
  totalTime.value = totalSeconds
  remainingTime.value = totalSeconds
  
  loadQuestions()
})

onUnmounted(() => {
  clearTimer()
})

const loadQuestions = async () => {
  try {
    const res = await examAPI.generate({
      libraries: config.libraries,
      count: config.questionCount,
      mode: config.mode
    })

    if (res.success && res.data?.length > 0) {
      questions.value = res.data.map((q: any) => ({
        ...q,
        isMarked: false
      }))
      userAnswers.value = new Array(questions.value.length).fill('')
      startTimer()
    } else {
      MessagePlugin.error('组卷失败')
      setTimeout(() => router.back(), 1500)
    }
  } catch (error) {
    console.error('加载题目失败:', error)
    MessagePlugin.error('加载失败')
    setTimeout(() => router.back(), 1500)
  } finally {
    loading.value = false
  }
}

const startTimer = () => {
  timer = setInterval(() => {
    if (remainingTime.value <= 0) {
      clearTimer()
      finishExam()
    } else {
      remainingTime.value--
    }
  }, 1000)
}

const clearTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const onExit = () => {
  const confirmDialog = DialogPlugin.confirm({
    header: '退出考试',
    body: '确定要退出考试吗？当前答题进度将不会保存。',
    onConfirm: () => {
      clearTimer()
      router.push('/study')
      confirmDialog.hide()
    }
  })
}

const onToggleMark = () => {
  if (currentQuestion.value) {
    currentQuestion.value.isMarked = !currentQuestion.value.isMarked
  }
}

const onPrevQuestion = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
  }
}

const onNextQuestion = () => {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
  } else {
    confirmSubmit()
  }
}

const confirmSubmit = () => {
  const unanswered = userAnswers.value.filter(a => !a || a.trim() === '').length
  
  const confirmDialog = DialogPlugin.confirm({
    header: '提交试卷',
    body: unanswered > 0 
      ? `您还有${unanswered}道题未作答，确定要提交吗？` 
      : '确定要提交试卷吗？',
    onConfirm: () => {
      finishExam()
      confirmDialog.hide()
    }
  })
}

const finishExam = () => {
  clearTimer()
  
  const usedTime = totalTime.value - remainingTime.value
  const mins = Math.floor(usedTime / 60)
  const secs = usedTime % 60
  usedTimeText.value = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`

  localStorage.setItem('examResult', JSON.stringify({
    questions: questions.value,
    userAnswers: userAnswers.value,
    usedTime
  }))

  showResult.value = true
}

const onReviewAll = () => {
  router.push('/study/exam/review')
}
</script>

<style lang="scss" scoped>
.do-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  padding-top: 44px;
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

.nav-left {
  width: 60px;
}

.exit-btn {
  font-size: 14px;
  color: #E34D59;
  padding: 4px 8px;
  cursor: pointer;
}

.nav-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.nav-right {
  width: 60px;
}

.header {
  flex-shrink: 0;
  background: #fff;
  padding: 10px 14px;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.04);
}

.progress-bar {
  height: 4px;
  background: #e7e7e7;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3B82F6 0%, #60A5FA 100%);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.header-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.question-progress .current {
  font-size: 16px;
  font-weight: 700;
  color: #3B82F6;
}

.question-progress .total {
  font-size: 14px;
  color: #999;
}

.timer {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #f81229;
  font-weight: 600;
}

.loading-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.loading-text {
  font-size: 14px;
  color: #64748B;
  margin-top: 12px;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px;
}

.question-card {
  background: #fff;
  border-radius: 8px;
  padding: 14px;
  margin-bottom: 10px;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.question-tag {
  background: #f0f5ff;
  color: #3B82F6;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
}

.action-btn {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f5f7fa;
  cursor: pointer;
}

.action-btn.marked {
  background: #fef2f2;
}

.question-content {
  padding: 10px 0;
}

.question-text {
  font-size: 16px;
  color: #333;
  line-height: 1.8;
}

.user-answer {
  background: #fff;
  border-radius: 8px;
  padding: 14px;
}

.answer-label {
  font-size: 13px;
  color: #999;
  margin-bottom: 8px;
}

.answer-input {
  width: 100%;
  min-height: 90px;
  padding: 12px;
  background: #fafbfc;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
  line-height: 1.8;
  border: 1px solid #e8e8e8;
  box-sizing: border-box;
  transition: all 0.3s ease;
  resize: none;
  outline: none;
  
  &:focus {
    border-color: #3B82F6;
    background: #fff;
    box-shadow: 0 0 0 2px rgba(0, 82, 217, 0.1);
  }
}

.footer {
  flex-shrink: 0;
  background: #fff;
  padding: 10px 14px;
  padding-bottom: calc(10px + env(safe-area-inset-bottom));
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.06);
}

.nav-btns {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.nav-btn {
  width: 135px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  font-size: 13px;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.nav-btn.prev {
  background: #f5f7fa;
  color: #666;
}

.nav-btn.next {
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  color: #fff;
}

.result-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.result-content {
  width: 300px;
  background: #fff;
  border-radius: 12px;
  padding: 24px 20px;
  text-align: center;
}

.result-header {
  margin-bottom: 16px;
}

.result-title {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin-top: 10px;
}

.result-stats {
  display: flex;
  align-items: center;
  padding: 12px 0;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 10px;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #333;
}

.stat-label {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.stat-divider {
  width: 1px;
  height: 30px;
  background: #e0e0e0;
  flex-shrink: 0;
}

.result-tip {
  font-size: 13px;
  color: #999;
  margin-bottom: 16px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 6px;
}

.result-btns {
  display: flex;
  justify-content: center;
}

.result-btn {
  width: 150px;
  height: 44px;
  border-radius: 22px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
}

.result-btn.review {
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  color: #fff;
}
</style>

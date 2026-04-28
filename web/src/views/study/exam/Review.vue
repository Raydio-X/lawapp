<template>
  <div class="review-container">
    <div class="custom-nav">
      <div class="nav-content">
        <div class="nav-title">考试解析</div>
      </div>
    </div>

    <div class="question-list">
      <div class="question-item" v-for="(item, index) in questions" :key="item.id">
        <div class="question-header">
          <div class="question-number">第{{ index + 1 }}题</div>
        </div>
        
        <div class="question-content">
          <span>{{ item.question }}</span>
        </div>

        <div class="answer-section">
          <div class="answer-row">
            <span class="answer-label">参考答案：</span>
            <span class="answer-text">{{ item.answer }}</span>
          </div>
          <div class="answer-row">
            <span class="answer-label">你的作答：</span>
            <span class="answer-text user-answer">{{ userAnswers[index] || '未作答' }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bar">
      <button class="back-btn" @click="onBack">返回</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

interface Question {
  id: number
  question: string
  answer: string
}

const questions = ref<Question[]>([])
const userAnswers = ref<string[]>([])

onMounted(() => {
  const examResultStr = localStorage.getItem('examResult')
  if (examResultStr) {
    const examResult = JSON.parse(examResultStr)
    questions.value = examResult.questions || []
    userAnswers.value = examResult.userAnswers || []
  }
})

const onBack = () => {
  router.push('/study')
}
</script>

<style lang="scss" scoped>
.review-container {
  min-height: 100vh;
  background: #f5f7fa;
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
}

.nav-content {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.question-list {
  padding: 10px 14px;
}

.question-item {
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

.question-number {
  font-size: 13px;
  color: #666;
  background: #f5f7fa;
  padding: 4px 8px;
  border-radius: 4px;
}

.question-content {
  font-size: 15px;
  color: #333;
  line-height: 1.8;
  margin-bottom: 10px;
}

.answer-section {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 10px;
}

.answer-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 6px;
}

.answer-row:last-child {
  margin-bottom: 0;
}

.answer-label {
  font-size: 13px;
  color: #666;
  flex-shrink: 0;
}

.answer-text {
  font-size: 13px;
  color: #333;
  flex: 1;
}

.answer-text.user-answer {
  color: #3B82F6;
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

.back-btn {
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
}
</style>

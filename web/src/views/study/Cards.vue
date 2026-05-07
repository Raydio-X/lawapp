<template>
  <div class="study-container">
    <div class="custom-nav">
      <div class="nav-content">
        <div class="nav-left">
          <div class="back-btn" @click="onBack">
            <t-icon name="chevron-left" size="20px" color="#333" />
          </div>
        </div>
        <div class="nav-title">学习卡片</div>
        <div class="nav-right"></div>
      </div>
    </div>

    <div class="loading-container" v-if="loading">
      <t-icon name="loading" size="40px" color="#3B82F6" />
      <span class="loading-text">加载中...</span>
    </div>

    <template v-if="!loading && currentCard">
      <div class="question-section">
        <div class="card-header">
          <div class="card-meta">
            <span class="card-number">卡片 {{ currentIndex + 1 }} / {{ totalCards }}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: ((currentIndex + 1) / totalCards) * 100 + '%' }"></div>
            </div>
          </div>
        </div>
        
        <div class="question-content">
          <span class="question-title">{{ currentCard.question }}</span>
        </div>
      </div>

      <div class="answer-section">
        <div class="answer-hidden" v-if="!answerRevealed && !keywordRevealed">
          <div class="hint-text">先回忆，再查看答案</div>
          <div class="reveal-btn-group">
            <div class="reveal-btn keyword-btn" @click="onRevealKeyword">
              <t-icon name="bookmark" size="20px" color="#fff" />
              <span>查看关键词</span>
            </div>
            <div class="reveal-btn" @click="onRevealAnswer">
              <t-icon name="browse" size="20px" color="#fff" />
              <span>查看答案</span>
            </div>
          </div>
        </div>

        <div class="keyword-revealed" :class="{ show: keywordRevealed }" v-if="keywordRevealed">
          <div class="keyword-header">
            <div class="keyword-label">
              <t-icon name="bookmark" size="16px" color="#F59E0B" />
              <span>关键词提示</span>
            </div>
            <div class="switch-to-answer" @click="onSwitchToAnswer">
              <t-icon name="browse" size="16px" color="#3B82F6" />
              <span>查看答案</span>
            </div>
          </div>
          <div class="keyword-content">
            <div class="keyword-tags" v-if="currentCard.tags && currentCard.tags.length > 0">
              <t-tag v-for="tag in currentCard.tags" :key="tag" theme="warning" variant="light" size="large">{{ tag }}</t-tag>
            </div>
            <div class="keyword-empty" v-else>
              <span>暂无关键词提示</span>
            </div>
          </div>
        </div>

        <div class="answer-revealed" :class="{ show: answerRevealed }" v-if="answerRevealed">
          <div class="answer-header">
            <div class="answer-label">
              <t-icon name="check-circle" size="16px" color="#00B578" />
              <span>参考答案</span>
            </div>
            <div class="switch-to-keyword" @click="onSwitchToKeyword">
              <t-icon name="bookmark" size="16px" color="#F59E0B" />
              <span>查看关键词</span>
            </div>
          </div>
          <div class="answer-content">
            <span class="answer-text" v-html="currentCard.answer || '暂无答案'"></span>
          </div>
          
          <div class="difficulty-section">
            <div class="difficulty-label">
              <span>难度评分</span>
              <span class="difficulty-hint">（可选）</span>
            </div>
            <div class="difficulty-stars">
              <div 
                class="star-item" 
                v-for="i in 5" 
                :key="i"
                :class="{ active: i <= difficultyRating }"
                @click="onRateDifficulty(i)"
              >
                <t-icon 
                  :name="i <= difficultyRating ? 'star-filled' : 'star'" 
                  size="24px" 
                  :color="i <= difficultyRating ? '#F59E0B' : '#CBD5E1'" 
                />
              </div>
            </div>
            <div class="difficulty-text" v-if="difficultyRating > 0">
              {{ getDifficultyText(difficultyRating) }}
            </div>
          </div>
        </div>
      </div>

      <div class="comment-section" :class="{ show: answerRevealed }" v-if="answerRevealed">
        <div class="comment-header">
          <span class="comment-title">学习笔记</span>
          <span class="comment-count">{{ comments.length }} 条笔记</span>
        </div>

        <div class="comment-list">
          <div class="comment-item" v-for="(comment, index) in comments" :key="comment.id">
            <div class="comment-avatar">
              <img v-if="comment.avatar" :src="comment.avatar" class="avatar-img" />
              <span v-else>{{ comment.avatarText }}</span>
            </div>
            <div class="comment-content">
              <div class="comment-user">
                <span class="username">{{ comment.username }}</span>
                <span class="time">{{ comment.time }}</span>
              </div>
              <span class="comment-text">{{ comment.content }}</span>
              <div class="comment-actions">
                <div class="like-btn" :class="{ liked: comment.liked }" @click="onLikeComment(index, comment.id)">
                  <t-icon :name="comment.liked ? 'thumb-up-filled' : 'thumb-up'" size="14px" :color="comment.liked ? '#3B82F6' : '#999'" />
                  <span>{{ comment.likeCount || 0 }}</span>
                </div>
                <div class="save-card-btn" @click="onSaveCommentAsCard(index)">
                  <t-icon name="file-add" size="14px" color="#999" />
                  <span>存为卡片</span>
                </div>
              </div>
            </div>
          </div>
          <div class="comment-empty" v-if="comments.length === 0">
            <t-icon name="edit" size="24px" color="#ccc" />
            <span>暂无笔记，写下第一条吧</span>
          </div>
        </div>

        <div class="comment-input-section">
          <input 
            class="comment-input" 
            placeholder="添加学习笔记..." 
            v-model="commentText"
            @keyup.enter="onSubmitComment"
          />
          <div class="send-btn" :class="{ active: commentText }" @click="onSubmitComment">
            <t-icon name="send" size="18px" :color="commentText ? '#fff' : '#ccc'" />
          </div>
        </div>
      </div>

      <div class="bottom-placeholder"></div>
    </template>
  </div>

  <div class="study-nav-bar study-mode" v-if="!loading && currentCard">
    <template v-if="isReviewMode || isDifficultyMode">
      <div class="nav-btn forgot" @click.stop="onForgot">
        <t-icon name="close-circle" size="18px" color="#fff" style="margin-right: 6px;" />
        <span class="btn-text">忘记了</span>
      </div>
      <div class="nav-btn mastered" @click.stop="onMastered">
        <t-icon name="check-circle" size="18px" color="#fff" style="margin-right: 6px;" />
        <span class="btn-text">已掌握</span>
      </div>
    </template>
    <template v-else>
      <div class="nav-btn prev" :class="{ disabled: currentIndex <= 0 || isRandomMode }" @click="onPrevCard">
        <t-icon name="chevron-left" size="18px" :color="currentIndex <= 0 || isRandomMode ? '#ccc' : '#3B82F6'" />
        <span class="btn-text">上一张</span>
      </div>
      
      <div class="nav-btn learned" :class="{ active: isCurrentCardLearned, disabled: !answerRevealed }" @click="onLearned">
        <t-icon v-if="isCurrentCardLearned" name="check-circle" size="16px" color="#fff" style="margin-right: 4px;" />
        <span class="btn-text">{{ isCurrentCardLearned ? '已学习' : '标记已学习' }}</span>
      </div>
      
      <div class="nav-btn next" :class="{ disabled: currentIndex >= totalCards - 1 }" @click="moveToNextCard" v-if="isCurrentCardLearned">
        <span class="btn-text">下一张</span>
        <t-icon name="chevron-right" size="18px" :color="currentIndex >= totalCards - 1 ? '#ccc' : '#3B82F6'" />
      </div>
      <div class="nav-btn-placeholder" v-else></div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next'
import { cardAPI, commentAPI, studyAPI } from '@/utils/api'
import { useGlobalStudyTimer } from '@/composables/useStudyTimer'

const router = useRouter()
const route = useRoute()

const { startStudyTimer, stopStudyTimer } = useGlobalStudyTimer()

interface Card {
  id: number
  question: string
  answer: string
  tags: string[]
  learned: boolean
  libraryId?: number
  libraryName?: string
}

interface Comment {
  id: number
  username: string
  avatar: string
  content: string
  time: string
  likeCount: number
  liked: boolean
  avatarText?: string
}

const currentIndex = ref(0)
const totalCards = ref(0)
const currentCard = ref<Card | null>(null)
const cardList = ref<Card[]>([])
const answerRevealed = ref(false)
const keywordRevealed = ref(false)
const loading = ref(true)
const comments = ref<Comment[]>([])
const commentText = ref('')
const difficultyRating = ref(0)
const isCurrentCardLearned = ref(false)
const isRandomMode = ref(false)
const isReviewMode = ref(false)
const isDifficultyMode = ref(false)
const difficultyName = ref('')

const getStorageKey = () => {
  if (isDifficultyMode.value) return 'difficultyCardsData'
  if (isReviewMode.value) return 'reviewCardsData'
  return 'studyCardsData'
}

const studiedCards = new Set<number>()
const learnedCardStates = new Map<number, { revealed: boolean, difficulty: number }>()

onMounted(() => {
  const index = parseInt(route.query.index as string) || 0
  const total = parseInt(route.query.total as string) || 0
  const mode = route.query.mode as string
  currentIndex.value = index
  totalCards.value = total
  isReviewMode.value = mode === 'review'
  isDifficultyMode.value = mode === 'difficulty'
  loadCardData()
  startStudyTimer()
})

onUnmounted(() => {
  stopStudyTimer()
  saveProgress()
})

const saveProgress = async () => {
  const storageKey = getStorageKey()
  const data = localStorage.getItem(storageKey)
  if (!data || cardList.value.length === 0) return

  try {
    const parsed = JSON.parse(data)
    
    const updatedCardList = cardList.value.map(card => ({
      ...card,
      learned: studiedCards.has(card.id) || card.learned
    }))
    
    const learnedCount = updatedCardList.filter(c => c.learned).length
    
    const updatedData = {
      ...parsed,
      cardList: updatedCardList,
      currentIndex: currentIndex.value,
      totalCards: updatedCardList.length,
      learned: learnedCount,
      isRandomMode: isRandomMode.value,
      isReviewMode: isReviewMode.value
    }
    
    localStorage.setItem(storageKey, JSON.stringify(updatedData))
    
    if (!isReviewMode.value) {
      await studyAPI.saveProgress({
        libraryIds: parsed.libraryIds || [],
        libraryNames: parsed.libraryNames || '',
        cardList: updatedCardList,
        currentIndex: currentIndex.value,
        learned: learnedCount,
        total: totalCards.value
      })
    }
  } catch (error) {
    console.error('保存进度失败:', error)
  }
}

const loadCardData = () => {
  const storageKey = getStorageKey()
  const data = localStorage.getItem(storageKey)
  if (data) {
    const parsed = JSON.parse(data)
    if (parsed.cardList) {
      cardList.value = parsed.cardList
      totalCards.value = parsed.totalCards || parsed.cardList.length
      currentCard.value = cardList.value[currentIndex.value]
      isRandomMode.value = parsed.isRandomMode || false
      if (!isReviewMode.value) {
        isReviewMode.value = parsed.isReviewMode || parsed.libraryNames === '艾宾浩斯复习'
      }
      if (parsed.isDifficultyMode) {
        isDifficultyMode.value = true
        difficultyName.value = parsed.difficultyName || '难度挑战'
      }
      loading.value = false
      
      if (!isReviewMode.value && !isDifficultyMode.value) {
        cardList.value.forEach(card => {
          if (card.learned && card.id) {
            studiedCards.add(card.id)
          }
        })
      }
      
      loadLearnedStatesFromStorage()
      
      if (currentCard.value) {
        loadComments(currentCard.value.id)
        
        const savedState = learnedCardStates.get(currentCard.value.id)
        if (savedState) {
          answerRevealed.value = savedState.revealed
          difficultyRating.value = savedState.difficulty
          isCurrentCardLearned.value = true
        } else {
          if (isReviewMode.value || isDifficultyMode.value) {
            answerRevealed.value = false
            isCurrentCardLearned.value = false
          } else {
            isCurrentCardLearned.value = currentCard.value.learned || false
            if (isCurrentCardLearned.value) {
              answerRevealed.value = true
            }
          }
        }
      }
    }
  } else {
    loading.value = false
    MessagePlugin.error('数据加载失败')
  }
}

const loadComments = async (cardId: number) => {
  try {
    const res = await commentAPI.getList(cardId)
    if (res.success && res.data) {
      comments.value = (res.data.list || res.data || []).map((c: any) => ({
        id: c.id,
        username: c.nickname || '用户',
        avatar: c.avatar || '',
        avatarText: (c.nickname || '用')[0],
        content: c.content,
        time: formatTime(c.created_at),
        likeCount: c.like_count || 0,
        liked: c.is_liked === 1
      }))
    }
  } catch (error) {
    console.error('加载评论失败:', error)
  }
}

const formatTime = (dateStr: string) => {
  if (!dateStr) return '未知'
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`
  return dateStr.substring(0, 10)
}

const onBack = () => {
  const confirmDialog = DialogPlugin.confirm({
    header: '退出学习',
    body: '确定要退出学习吗？',
    onConfirm: async () => {
      await stopStudyTimer()
      await saveProgress()
      if (isDifficultyMode.value) {
        router.push('/study/difficulty')
      } else {
        router.push('/study')
      }
      confirmDialog.hide()
    }
  })
}

const onRevealKeyword = () => {
  keywordRevealed.value = true
}

const onSwitchToKeyword = () => {
  answerRevealed.value = false
  keywordRevealed.value = true
}

const onSwitchToAnswer = () => {
  keywordRevealed.value = false
  answerRevealed.value = true
  recordCardStudy()
}

const onRevealAnswer = () => {
  keywordRevealed.value = false
  answerRevealed.value = true
  recordCardStudy()
}

const recordCardStudy = async () => {
  if (!currentCard.value) return
  if (studiedCards.has(currentCard.value.id)) return

  try {
    await cardAPI.recordStudy(currentCard.value.id, {
      libraryId: currentCard.value.libraryId,
      feedback: 'normal',
      duration: 0,
      isFormalStudy: true
    })
    studiedCards.add(currentCard.value.id)
  } catch (error) {
    console.error('记录学习失败:', error)
  }
}

const onSubmitComment = async () => {
  if (!commentText.value.trim()) return

  try {
    const res = await commentAPI.create(currentCard.value!.id, { content: commentText.value.trim() })
    if (res.success) {
      const newComment: Comment = {
        id: res.data?.id || Date.now(),
        username: '我',
        avatar: '我',
        content: commentText.value.trim(),
        time: '刚刚',
        likeCount: 0,
        liked: false
      }
      comments.value = [newComment, ...comments.value]
      commentText.value = ''
      MessagePlugin.success('评论成功')
    }
  } catch (error: any) {
    console.error('评论失败:', error)
    MessagePlugin.error(error.message || '评论失败')
  }
}

const onLikeComment = async (index: number, id: number) => {
  const comment = comments.value[index]
  if (!comment) return

  try {
    const res = await commentAPI.like(id)
    if (res.success) {
      comments.value[index].liked = true
      comments.value[index].likeCount = (comment.likeCount || 0) + 1
      comments.value.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
    }
  } catch (error: any) {
    console.error('点赞失败:', error)
    MessagePlugin.error(error.message || '点赞失败')
  }
}

const onSaveCommentAsCard = (index: number) => {
  const comment = comments.value[index]
  if (!comment || !currentCard.value) return

  router.push({
    path: '/create/card',
    query: {
      question: currentCard.value.question,
      answer: comment.content
    }
  })
}

const onPrevCard = () => {
  if (currentIndex.value <= 0 || isRandomMode.value) return
  switchCard(currentIndex.value - 1)
}

const onRateDifficulty = (rating: number) => {
  difficultyRating.value = rating
}

const getDifficultyText = (rating: number): string => {
  const texts = ['', '简单', '较简单', '中等', '较难', '困难']
  return texts[rating] || ''
}

const onLearned = async () => {
  if (!answerRevealed.value) {
    MessagePlugin.warning('请先查看答案')
    return
  }

  if (isCurrentCardLearned.value) {
    moveToNextCard()
    return
  }

  try {
    if (!studiedCards.has(currentCard.value!.id)) {
      await cardAPI.recordStudy(currentCard.value!.id, {
        libraryId: currentCard.value!.libraryId,
        feedback: 'normal',
        duration: 0,
        isFormalStudy: true
      })
      studiedCards.add(currentCard.value!.id)
    }

    if (difficultyRating.value > 0) {
      await cardAPI.rateDifficulty(currentCard.value!.id, difficultyRating.value)
    }

    const res = await cardAPI.setMastery(currentCard.value!.id, true, 'normal')
    if (res.success) {
      cardList.value[currentIndex.value].learned = true
      isCurrentCardLearned.value = true
      
      learnedCardStates.set(currentCard.value!.id, {
        revealed: true,
        difficulty: difficultyRating.value
      })
      
      saveLearnedStatesToStorage()
      
      moveToNextCard()
    }
  } catch (error: any) {
    console.error('标记学习失败:', error)
    MessagePlugin.error(error.message || '操作失败')
  }
}

const onForgot = async () => {
  try {
    if (!studiedCards.has(currentCard.value!.id)) {
      await cardAPI.recordStudy(currentCard.value!.id, {
        libraryId: currentCard.value!.libraryId,
        feedback: 'forgot',
        duration: 0,
        isFormalStudy: true
      })
    }
    studiedCards.add(currentCard.value!.id)

    const res = await cardAPI.setMastery(currentCard.value!.id, true, 'forgot')
    if (res.success) {
      MessagePlugin.warning('已标记为忘记，将在1天后再次复习')
      moveToNextReviewCard()
    }
  } catch (error: any) {
    console.error('标记失败:', error)
    MessagePlugin.error(error.message || '操作失败')
  }
}

const onMastered = async () => {
  try {
    if (!studiedCards.has(currentCard.value!.id)) {
      await cardAPI.recordStudy(currentCard.value!.id, {
        libraryId: currentCard.value!.libraryId,
        feedback: 'easy',
        duration: 0,
        isFormalStudy: true
      })
    }
    studiedCards.add(currentCard.value!.id)

    const res = await cardAPI.setMastery(currentCard.value!.id, true, 'easy')
    if (res.success) {
      MessagePlugin.success('已掌握！继续保持')
      moveToNextReviewCard()
    }
  } catch (error: any) {
    console.error('标记失败:', error)
    MessagePlugin.error(error.message || '操作失败')
  }
}

const moveToNextReviewCard = () => {
  const remainingIndices: number[] = []
  cardList.value.forEach((card, index) => {
    if (index !== currentIndex.value && !studiedCards.has(card.id)) {
      remainingIndices.push(index)
    }
  })
  
  if (remainingIndices.length > 0) {
    setTimeout(() => {
      switchCard(remainingIndices[0])
    }, 300)
  } else {
    clearStudyData()
    if (isDifficultyMode.value) {
      MessagePlugin.success(`恭喜完成${difficultyName.value}！`)
      setTimeout(() => {
        router.push('/study/difficulty')
      }, 1500)
    } else {
      MessagePlugin.success('恭喜完成复习！')
      setTimeout(() => {
        router.push('/study')
      }, 1500)
    }
  }
}

const moveToNextCard = () => {
  if (isRandomMode.value) {
    const unlearnedIndices: number[] = []
    cardList.value.forEach((card, index) => {
      if (!card.learned && !studiedCards.has(card.id)) {
        unlearnedIndices.push(index)
      }
    })
    
    if (unlearnedIndices.length > 0) {
      const randomIdx = Math.floor(Math.random() * unlearnedIndices.length)
      setTimeout(() => {
        switchCard(unlearnedIndices[randomIdx])
      }, 300)
    } else {
      clearStudyData()
      MessagePlugin.success('恭喜完成学习！')
      setTimeout(() => {
        router.push('/study')
      }, 1500)
    }
  } else {
    const unlearnedIndices: number[] = []
    cardList.value.forEach((card, index) => {
      if (!card.learned && !studiedCards.has(card.id)) {
        unlearnedIndices.push(index)
      }
    })
    
    if (unlearnedIndices.length > 0) {
      const nextIndex = unlearnedIndices[0]
      setTimeout(() => {
        switchCard(nextIndex)
      }, 300)
    } else {
      saveLearnedStatesToStorage()
      MessagePlugin.success('恭喜完成学习！')
      setTimeout(() => {
        router.push('/study')
      }, 1500)
    }
  }
}

const clearStudyData = () => {
  const storageKey = getStorageKey()
  localStorage.removeItem(storageKey)
}

const switchCard = (index: number) => {
  if (index < 0 || index >= totalCards.value) return
  
  currentCard.value = cardList.value[index]
  currentIndex.value = index
  comments.value = []
  commentText.value = ''
  keywordRevealed.value = false
  answerRevealed.value = false

  if (currentCard.value) {
    loadComments(currentCard.value.id)
    
    const savedState = learnedCardStates.get(currentCard.value.id)
    if (savedState) {
      answerRevealed.value = savedState.revealed
      difficultyRating.value = savedState.difficulty
      isCurrentCardLearned.value = true
    } else {
      difficultyRating.value = 0
      if (isReviewMode.value || isDifficultyMode.value) {
        isCurrentCardLearned.value = false
      } else {
        isCurrentCardLearned.value = cardList.value[index].learned || false
        if (isCurrentCardLearned.value) {
          answerRevealed.value = true
        }
      }
    }
  }
}

const saveLearnedStatesToStorage = () => {
  const storageKey = getStorageKey()
  const data = localStorage.getItem(storageKey)
  if (!data) return
  
  const parsed = JSON.parse(data)
  const states: Record<number, { revealed: boolean, difficulty: number }> = {}
  
  learnedCardStates.forEach((value, key) => {
    states[key] = value
  })
  
  parsed.learnedCardStates = states
  parsed.cardList = cardList.value.map(card => ({
    ...card,
    learned: studiedCards.has(card.id) || card.learned
  }))
  parsed.currentIndex = currentIndex.value
  parsed.isRandomMode = isRandomMode.value
  parsed.isReviewMode = isReviewMode.value
  
  localStorage.setItem(storageKey, JSON.stringify(parsed))
}

const loadLearnedStatesFromStorage = () => {
  const storageKey = getStorageKey()
  const data = localStorage.getItem(storageKey)
  if (!data) return
  
  const parsed = JSON.parse(data)
  if (parsed.learnedCardStates) {
    Object.entries(parsed.learnedCardStates).forEach(([key, value]) => {
      learnedCardStates.set(parseInt(key), value as { revealed: boolean, difficulty: number })
    })
  }
}
</script>

<style lang="scss" scoped>
.study-container {
  min-height: 100vh;
  background-color: #f5f6fa;
  padding: 12px;
  padding-top: calc(44px + 12px);
  padding-bottom: calc(90px + env(safe-area-inset-bottom, 0px));
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

.question-section {
  background: linear-gradient(135deg, #fff 0%, #f8faff 100%);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 4px 16px rgba(0, 82, 217, 0.1);
  border: 1px solid rgba(0, 82, 217, 0.08);
}

.card-header {
  margin-bottom: 16px;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-number {
  font-size: 14px;
  color: #3B82F6;
  font-weight: 600;
  background: rgba(0, 82, 217, 0.1);
  padding: 4px 10px;
  border-radius: 12px;
}

.card-tags {
  display: flex;
  gap: 6px;
}

.progress-bar {
  height: 4px;
  background-color: #e8e8e8;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3B82F6 0%, #60A5FA 100%);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.question-content {
  padding: 12px 0;
}

.question-title {
  display: block;
  font-size: 20px;
  font-weight: 600;
  color: #333;
  line-height: 1.6;
  text-align: center;
}

.answer-section {
  background-color: #fff;
  border-radius: 12px;
  margin-bottom: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.answer-hidden {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 24px;
}

.hint-text {
  font-size: 14px;
  color: #999;
  margin-bottom: 16px;
}

.reveal-btn-group {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.reveal-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 24px;
  box-shadow: 0 4px 12px rgba(0, 82, 217, 0.3);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:active {
    transform: scale(0.98);
  }
  
  &.keyword-btn {
    background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%);
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
    font-size: 15px;
    padding: 10px 16px;
  }
}

.keyword-revealed {
  padding: 16px;
  background: #FFFBEB;
  border-radius: 12px;
  border: 1px solid #FDE68A;
  opacity: 0;
  transform: translateY(-10px);
  transition: all 0.4s ease;
  
  &.show {
    opacity: 1;
    transform: translateY(0);
  }
}

.keyword-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.keyword-label {
  display: flex;
  align-items: center;
  gap: 6px;
  
  span {
    font-size: 14px;
    font-weight: 600;
    color: #D97706;
  }
}

.switch-to-answer {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: #EFF6FF;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  span {
    font-size: 13px;
    color: #3B82F6;
    font-weight: 500;
  }
  
  &:active {
    background: #DBEAFE;
  }
}

.keyword-content {
  min-height: 60px;
}

.keyword-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.keyword-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  
  span {
    font-size: 14px;
    color: #9CA3AF;
  }
}

.answer-revealed {
  padding: 16px;
  opacity: 0;
  transform: translateY(-10px);
  transition: all 0.4s ease;
  
  &.show {
    opacity: 1;
    transform: translateY(0);
  }
}

.answer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.answer-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #00B578;
}

.switch-to-keyword {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: #FFFBEB;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  span {
    font-size: 13px;
    color: #D97706;
    font-weight: 500;
  }
  
  &:active {
    background: #FEF3C7;
  }
}

.answer-content {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border-left: 3px solid #00B578;
}

.difficulty-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.difficulty-label {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 12px;
  
  span:first-child {
    font-size: 14px;
    font-weight: 600;
    color: #333;
  }
}

.difficulty-hint {
  font-size: 12px;
  color: #999;
}

.difficulty-stars {
  display: flex;
  gap: 8px;
}

.star-item {
  cursor: pointer;
  transition: transform 0.15s ease;
  
  &:active {
    transform: scale(0.9);
  }
}

.difficulty-text {
  margin-top: 8px;
  font-size: 13px;
  color: #F59E0B;
  font-weight: 500;
}

.answer-text {
  display: block;
  font-size: 16px;
  color: #333;
  line-height: 1.8;
  
  :deep(ol), :deep(ul) {
    padding-left: 1.5em;
    margin: 8px 0;
  }
  
  :deep(li) {
    margin-bottom: 4px;
  }
  
  :deep(table) {
    border-collapse: collapse;
    width: 100%;
    margin: 8px 0;
    
    td {
      border: 1px solid #ddd;
      padding: 8px;
    }
  }
  
  :deep(p) {
    margin: 0 0 8px 0;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
}

.comment-section {
  background-color: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.4s ease 0.2s;
  
  &.show {
    opacity: 1;
    transform: translateY(0);
  }
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.comment-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.comment-count {
  font-size: 13px;
  color: #999;
}

.comment-list {
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 12px;
}

.comment-item {
  display: flex;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #f5f6fa;
  
  &:last-child {
    border-bottom: none;
  }
}

.comment-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  
  .avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  span {
    font-size: 16px;
    color: #fff;
    font-weight: 600;
  }
}

.comment-content {
  flex: 1;
}

.comment-user {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.username {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.time {
  font-size: 12px;
  color: #999;
}

.comment-text {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.like-btn, .save-card-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  background-color: #f5f6fa;
  cursor: pointer;
  transition: all 0.2s ease;
  
  span {
    font-size: 12px;
    color: #999;
  }
  
  &.liked {
    background-color: rgba(0, 82, 217, 0.1);
    span { color: #3B82F6; }
  }
}

.comment-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0;
  color: #999;
  font-size: 14px;
  
  span {
    margin-top: 8px;
  }
}

.comment-input-section {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.comment-input {
  flex: 1;
  height: 40px;
  background-color: #f5f6fa;
  border-radius: 20px;
  padding: 0 16px;
  font-size: 14px;
  color: #333;
  border: none;
  outline: none;
}

.send-btn {
  width: 40px;
  height: 40px;
  background-color: #f5f6fa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &.active {
    background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  }
}

.bottom-placeholder {
  height: 16px;
}

.study-nav-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
  padding: 10px 16px;
  padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px));
  box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.06);
  z-index: 100;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  
  &.study-mode {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }
  
  .nav-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 44px;
    padding: 0 20px;
    border-radius: 22px;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:active {
      transform: scale(0.96);
    }
    
    &.disabled {
      opacity: 0.4;
      pointer-events: none;
    }
    
    .btn-text {
      font-size: 14px;
      color: #fff;
      font-weight: 500;
    }
    
    &.prev {
      background: transparent;
      box-shadow: none;
      min-width: 80px;
      
      .btn-text {
        color: #3B82F6;
      }
      
      &.disabled .btn-text {
        color: #ccc;
      }
    }
    
    &.next {
      background: transparent;
      box-shadow: none;
      min-width: 80px;
      
      .btn-text {
        color: #3B82F6;
      }
      
      &.disabled .btn-text {
        color: #ccc;
      }
    }
    
    &.learned {
      background: linear-gradient(135deg, #00B578 0%, #00C853 100%);
      box-shadow: 0 3px 12px rgba(0, 181, 120, 0.35);
      flex: 1;
      max-width: 160px;
      
      &.active {
        background: linear-gradient(135deg, #2BA47A 0%, #00995B 100%);
        box-shadow: 0 3px 12px rgba(0, 153, 91, 0.45);
      }
      
      &.disabled {
        opacity: 0.5;
      }
    }
    
    &.forgot {
      background: linear-gradient(135deg, #E34D59 0%, #F66C5C 100%);
      box-shadow: 0 3px 12px rgba(227, 77, 89, 0.35);
      flex: 1;
      
      &.disabled {
        opacity: 0.5;
      }
      
      .btn-text {
        color: #fff;
      }
    }
    
    &.mastered {
      background: linear-gradient(135deg, #00A870 0%, #00C853 100%);
      box-shadow: 0 3px 12px rgba(0, 168, 112, 0.35);
      flex: 1;
      
      &.disabled {
        opacity: 0.5;
      }
      
      .btn-text {
        color: #fff;
      }
    }
  }
  
  .nav-btn-placeholder {
    min-width: 80px;
    height: 44px;
  }
}

.btn-text {
  font-size: 15px;
  color: #fff;
  font-weight: 600;
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
</style>

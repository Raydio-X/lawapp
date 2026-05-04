<template>
  <div class="study-container">
    <div class="custom-nav">
      <div class="nav-left" @click="router.back()">
        <t-icon name="chevron-left" size="20px" color="#fff" />
      </div>
      <div class="nav-title">卡片学习</div>
      <div class="nav-right"></div>
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

      <div class="keyword-section">
        <div class="keyword-header">
          <div class="keyword-label">
            <t-icon name="bookmark" size="16px" color="#3B82F6" />
            <span>关键词</span>
          </div>
        </div>
        <div class="keyword-content">
          <div class="keyword-tags" v-if="currentCard.tags && currentCard.tags.length > 0">
            <t-tag v-for="tag in currentCard.tags" :key="tag" theme="primary" variant="light" size="large">{{ tag }}</t-tag>
          </div>
          <div class="keyword-empty" v-else>
            <span>暂无关键词</span>
          </div>
        </div>
      </div>

      <div class="answer-section">
        <div class="answer-hidden" v-if="!answerRevealed">
          <div class="hint-text">先回忆，再查看答案</div>
          <div class="reveal-btn" @click="onRevealAnswer">
            <t-icon name="browse" size="20px" color="#fff" />
            <span>查看答案</span>
          </div>
        </div>

        <div class="answer-revealed" :class="{ show: answerRevealed }" v-if="answerRevealed">
          <div class="answer-label">
            <t-icon name="check-circle" size="16px" color="#00B578" />
            <span>参考答案</span>
          </div>
          <div class="answer-content">
            <span class="answer-text" v-html="currentCard.answer"></span>
          </div>
        </div>
      </div>

      <div class="related-section" :class="{ show: answerRevealed }" v-if="answerRevealed && !singleCard">
        <div class="related-header">
          <div class="related-title-wrap">
            <span class="related-title">派生学习</span>
            <span class="related-vip-tag">VIP</span>
          </div>
          <div class="related-actions">
            <div class="link-search-btn" @click="goToLinkSearch">
              <t-icon name="add" size="16px" color="#B8860B" />
              <span>关联卡片</span>
            </div>
          </div>
        </div>

        <div class="linked-section" v-if="linkedCards.length > 0">
          <div class="linked-header">
            <span class="linked-label">已关联卡片</span>
            <span class="linked-count">{{ linkedCards.length }} 张</span>
          </div>
          <div class="linked-list-scroll">
            <div class="linked-list">
              <div 
                class="linked-item"
                v-for="item in linkedCards"
                :key="item.id"
              >
                <div class="linked-card" @click="onRelatedCardTap(item)">
                  <div class="linked-card-question">
                    <span>{{ item.question }}</span>
                  </div>
                  <div class="linked-card-library" v-if="item.library_name">{{ item.library_name }}</div>
                </div>
                <div class="unlink-btn" @click.stop="onUnlinkCard(item.id)">
                  <t-icon name="close" size="14px" color="#999" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="related-empty" v-if="linkedCards.length === 0">
          <t-icon name="info-circle" size="20px" color="#D4AF37" />
          <span>点击上方按钮手动关联卡片</span>
        </div>
        
        <div class="vip-lock-overlay" v-if="!userStore.isVip">
          <div class="vip-lock-content">
            <t-icon name="lock" size="32px" color="#D4AF37" />
            <span class="vip-lock-title">VIP专属功能</span>
            <span class="vip-lock-desc">激活VIP后可使用派生学习功能</span>
            <div class="vip-lock-btn" @click="router.push('/profile/activation')">立即激活</div>
          </div>
        </div>
      </div>

      <div class="comment-section" :class="{ show: answerRevealed }" v-if="answerRevealed">
        <div class="comment-header">
          <span class="comment-title">学习笔记</span>
          <span class="comment-count">{{ comments.length }} 条笔记</span>
        </div>

        <div class="comment-list">
          <div class="comment-item" v-for="(item, index) in comments" :key="item.id">
            <div class="comment-avatar">
              <img v-if="item.avatar" :src="item.avatar" class="avatar-img" />
              <span v-else>{{ item.avatarText }}</span>
            </div>
            <div class="comment-content">
              <div class="comment-user">
                <span class="username">{{ item.username }}</span>
                <span class="time">{{ item.time }}</span>
              </div>
              <span class="comment-text">{{ item.content }}</span>
              <div class="comment-actions">
                <div 
                  class="like-btn"
                  :class="{ liked: item.liked }"
                  @click="onLikeComment(index, item.id)"
                >
                  <t-icon 
                    :name="item.liked ? 'thumb-up-filled' : 'thumb-up'" 
                    size="14px" 
                    :color="item.liked ? '#3B82F6' : '#999'" 
                  />
                  <span>{{ item.likeCount || 0 }}</span>
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

        <div class="favorite-section">
          <div class="favorite-btn-inline" :class="{ active: isFavorite }" @click="onToggleFavorite">
            <t-icon 
              :name="isFavorite ? 'star-filled' : 'star'" 
              size="18px" 
              :color="isFavorite ? '#FAAD14' : '#999'" 
            />
            <span>{{ isFavorite ? '已收藏' : '收藏此卡片' }}</span>
          </div>
        </div>
      </div>

      <div class="bottom-placeholder"></div>
    </template>
  </div>

  <div class="study-nav-bar" :class="{ 'study-mode': mode === 'study' }" v-if="!loading && currentCard">
    <template v-if="mode === 'study'">
      <div 
        class="nav-btn-prev"
        :class="{ disabled: currentIndex <= 0 }"
        @click="onPrevCard"
      >
        <t-icon name="chevron-left" size="18px" :color="currentIndex <= 0 ? '#ccc' : '#666'" />
        <span class="prev-text">上一张</span>
      </div>
      
      <div 
        class="nav-btn-next-card"
        :class="{ disabled: currentIndex >= totalCards - 1 }"
        @click="onNextCard"
      >
        <span class="next-text">下一张</span>
      </div>
    </template>
    
    <template v-else-if="!singleCard">
      <div 
        class="nav-btn prev"
        :class="{ disabled: currentIndex <= 0 }"
        @click="onPrevCard"
      >
        <t-icon name="chevron-left" size="16px" :color="currentIndex <= 0 ? '#ccc' : '#3B82F6'" />
        <span class="nav-text">上一张</span>
      </div>
      
      <div 
        class="nav-btn next"
        :class="{ disabled: currentIndex >= totalCards - 1 }"
        @click="onNextCard"
      >
        <span class="nav-text">下一张</span>
        <t-icon name="chevron-right" size="16px" :color="currentIndex >= totalCards - 1 ? '#ccc' : '#fff'" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, onActivated } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next'
import { cardAPI, favoriteAPI, commentAPI } from '@/utils/api'
import { useCardStudyStore } from '@/stores/cardStudy'
import { useUserStore } from '@/stores/user'
import { usePermission } from '@/composables/usePermission'

const router = useRouter()
const route = useRoute()
const cardStudyStore = useCardStudyStore()
const userStore = useUserStore()
const { isVip, limits, canUseCommentToCard } = usePermission()

interface Card {
  id: number
  question: string
  answer: string
  tags?: string[]
  library_id?: number
  library_name?: string
  is_favorite?: boolean
  learned?: boolean
}

interface Comment {
  id: number
  avatar: string
  username: string
  time: string
  content: string
  likeCount: number
  liked: boolean
}

const loading = ref(true)
const currentCard = ref<Card | null>(null)
const cardList = ref<Card[]>([])
const currentIndex = ref(0)
const totalCards = ref(0)
const answerRevealed = ref(false)
const singleCard = ref(false)
const mode = ref('')
const libraryId = ref<number | string | null>(null)
const libraryName = ref('')

const relatedLoading = ref(false)
const relatedCards = ref<Card[]>([])
const linkedCards = ref<Card[]>([])

const comments = ref<Comment[]>([])
const commentText = ref('')
const isFavorite = ref(false)

const studiedCards = new Set<number>()

onMounted(() => {
  const cardId = route.query.cardId as string
  const libId = route.query.libraryId as string
  const index = route.query.index as string
  const name = route.query.name as string
  const modeParam = route.query.mode as string
  const singleCardParam = route.query.singleCard as string
  
  if (libId) {
    libraryId.value = libId === 'hot_cards' ? libId : parseInt(libId)
    libraryName.value = name ? decodeURIComponent(name) : ''
    mode.value = modeParam || ''
    singleCard.value = singleCardParam === 'true'
  } else if (singleCardParam === 'true') {
    singleCard.value = true
  }
  
  loadCardData(cardId, parseInt(index) || 0)
})

watch(
  () => route.query.cardId,
  (newCardId, oldCardId) => {
    if (newCardId && newCardId !== oldCardId) {
      const singleCardParam = route.query.singleCard as string
      const libId = route.query.libraryId as string
      
      if (singleCardParam !== 'true' && libId) {
        const stateKey = `library_${libId}_card_${newCardId}`
        const savedState = cardStudyStore.getState(stateKey)
        
        if (savedState) {
          libraryId.value = libId === 'hot_cards' ? libId : parseInt(libId)
          libraryName.value = savedState.libraryName
          mode.value = savedState.mode
          singleCard.value = false
          cardList.value = savedState.cardList as Card[]
          totalCards.value = savedState.totalCards
          currentIndex.value = savedState.currentIndex
          currentCard.value = (savedState.cardList[savedState.currentIndex] || savedState.cardList[0]) as Card
          answerRevealed.value = savedState.answerRevealed
          comments.value = savedState.comments as Comment[]
          isFavorite.value = savedState.isFavorite
          relatedCards.value = savedState.relatedCards as Card[]
          loading.value = false
          cardStudyStore.removeState(stateKey)
          return
        }
      }
      
      if (libId) {
        libraryId.value = libId === 'hot_cards' ? libId : parseInt(libId)
      } else {
        libraryId.value = null
      }
      
      if (singleCardParam === 'true') {
        singleCard.value = true
      }
      
      answerRevealed.value = mode.value !== 'study'
      loadCardData(newCardId as string, 0)
    }
  }
)

onUnmounted(() => {
  saveStudyProgress()
})

onActivated(() => {
  if (currentCard.value && answerRevealed.value) {
    loadLinkedCards()
  }
})

const loadCardData = async (cardId: string | undefined, index: number) => {
  loading.value = true
  
  try {
    if (libraryId.value === 'hot_cards') {
      await loadHotCards(cardId, index)
    } else if (libraryId.value) {
      await loadLibraryCards(cardId, index)
    } else if (cardId) {
      await loadSingleCard(parseInt(cardId))
    } else {
      MessagePlugin.error('参数错误')
      setTimeout(() => router.back(), 1500)
    }
  } catch (error) {
    console.error('加载卡片失败:', error)
    MessagePlugin.error('加载失败')
  } finally {
    loading.value = false
  }
}

const loadSingleCard = async (cardId: number) => {
  try {
    const res = await cardAPI.getDetail(cardId)
    if (res.success && res.data) {
      const card = res.data
      const list = [{
        id: card.id,
        question: card.question,
        answer: card.answer,
        tags: card.tags || [],
        learned: card.is_learned || false
      }]
      
      cardList.value = list
      totalCards.value = 1
      currentIndex.value = 0
      currentCard.value = list[0]
      answerRevealed.value = mode.value !== 'study'
      libraryName.value = card.library_name || '卡片详情'
      
      loadComments(card.id)
      checkFavorite(card.id)
      
      if (!singleCard.value && mode.value !== 'study') {
        loadRelatedCards()
        loadLinkedCards()
      }
    }
  } catch (error) {
    console.error('加载卡片详情失败:', error)
    throw error
  }
}

const loadHotCards = async (cardId: string | undefined, index: number) => {
  try {
    const res = await cardAPI.getHotCards(20)
    
    if (res.success && res.data && Array.isArray(res.data)) {
      const list = res.data.map((card: any) => ({
        id: card.id,
        question: card.question,
        answer: card.answer,
        tags: card.tags || [],
        learned: card.is_learned || false
      }))
      
      if (list.length === 0) {
        MessagePlugin.warning('暂无热门卡片')
        setTimeout(() => router.back(), 1500)
        return
      }
      
      const currentIdx = index || 0
      const card = list[currentIdx] || list[0]
      
      cardList.value = list
      totalCards.value = list.length
      currentIndex.value = currentIdx
      currentCard.value = card
      answerRevealed.value = mode.value !== 'study'
      
      loadComments(card.id)
      checkFavorite(card.id)
      
      if (!singleCard.value && mode.value !== 'study') {
        loadRelatedCards()
        loadLinkedCards()
      }
    }
  } catch (error) {
    console.error('加载热门卡片失败:', error)
    throw error
  }
}

const loadLibraryCards = async (cardId: string | undefined, index: number) => {
  try {
    const storedData = localStorage.getItem('libraryCardsData')
    
    if (storedData) {
      const data = JSON.parse(storedData)
      
      if (data.cardList && data.cardList.length > 0) {
        const list = data.cardList
        const currentIdx = index || 0
        const card = list[currentIdx] || list[0]
        
        cardList.value = list
        totalCards.value = list.length
        currentIndex.value = currentIdx
        currentCard.value = card
        answerRevealed.value = mode.value !== 'study'
        libraryName.value = data.libraryName || libraryName.value
        
        loadComments(card.id)
        checkFavorite(card.id)
        
        if (!singleCard.value && mode.value !== 'study') {
          loadRelatedCards()
          loadLinkedCards()
        }
        return
      }
    }
    
    const res = await cardAPI.getList({ 
      library_id: libraryId.value as number, 
      page: 1, 
      pageSize: 1000 
    })
    
    if (res.success && res.data) {
      const list = (res.data.list || res.data || []).map((card: any) => ({
        id: card.id,
        question: card.question,
        answer: card.answer,
        tags: card.tags || [],
        learned: card.is_learned || false
      }))
      
      if (list.length === 0) {
        MessagePlugin.warning('暂无卡片')
        setTimeout(() => router.back(), 1500)
        return
      }
      
      const currentIdx = index || 0
      const card = list[currentIdx] || list[0]
      
      cardList.value = list
      totalCards.value = list.length
      currentIndex.value = currentIdx
      currentCard.value = card
      answerRevealed.value = mode.value !== 'study'
      
      loadComments(card.id)
      checkFavorite(card.id)
      
      if (!singleCard.value && mode.value !== 'study') {
        loadRelatedCards()
        loadLinkedCards()
      }
    }
  } catch (error) {
    console.error('加载知识库卡片失败:', error)
    throw error
  }
}

const loadComments = async (cardId: number) => {
  try {
    const res = await commentAPI.getList(cardId)
    if (res.success && res.data) {
      const list = res.data.list || res.data || []
      comments.value = list.map((item: any) => ({
        id: item.id,
        avatar: item.avatar || '',
        avatarText: (item.nickname || '用')[0],
        username: item.nickname || '用户',
        time: formatTime(item.created_at),
        content: item.content,
        likeCount: item.like_count || 0,
        liked: item.is_liked === 1
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

const checkFavorite = async (cardId: number) => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    isFavorite.value = false
    return
  }
  
  try {
    const res = await favoriteAPI.check('card', cardId)
    isFavorite.value = res.data && res.data.isFavorited
  } catch (error) {
    console.error('检查收藏状态失败:', error)
  }
}

const onRevealAnswer = () => {
  answerRevealed.value = true
  recordCardStudy()
  if (!singleCard.value) {
    loadRelatedCards()
    loadLinkedCards()
  }
}

const loadRelatedCards = async () => {
  if (!currentCard.value) {
    console.log('loadRelatedCards: No current card')
    return
  }
  
  console.log('loadRelatedCards: Loading related cards for card', currentCard.value.id)
  relatedLoading.value = true
  relatedCards.value = []
  
  try {
    const res = await cardAPI.getRelated(currentCard.value.id)
    console.log('loadRelatedCards: API response', res)
    if (res.success && res.data) {
      console.log('loadRelatedCards: Found', res.data.length, 'related cards')
      relatedCards.value = res.data.slice(0, 5)
    } else {
      console.log('loadRelatedCards: No data in response')
    }
  } catch (error) {
    console.error('加载相关卡片失败:', error)
  } finally {
    relatedLoading.value = false
  }
}

const loadLinkedCards = async () => {
  if (!currentCard.value) return
  
  try {
    const res = await cardAPI.getLinkedCards(currentCard.value.id)
    if (res.success && res.data) {
      linkedCards.value = res.data
    }
  } catch (error) {
    console.error('加载已关联卡片失败:', error)
  }
}

const goToLinkSearch = () => {
  if (!currentCard.value) return
  router.push(`/card/link-search?cardId=${currentCard.value.id}`)
}

const onUnlinkCard = async (linkedCardId: number) => {
  if (!currentCard.value) return
  
  try {
    const res = await cardAPI.unlinkCard(currentCard.value.id, linkedCardId)
    if (res.success) {
      linkedCards.value = linkedCards.value.filter(card => card.id !== linkedCardId)
      MessagePlugin.success('已取消关联')
    }
  } catch (error) {
    console.error('取消关联失败:', error)
    MessagePlugin.error('取消关联失败')
  }
}

const onRelatedCardTap = (card: Card) => {
  if (currentCard.value && !singleCard.value) {
    const stateKey = `library_${libraryId.value}_card_${currentCard.value.id}`
    cardStudyStore.saveState(stateKey, {
      cardId: currentCard.value.id,
      answerRevealed: answerRevealed.value,
      currentIndex: currentIndex.value,
      totalCards: totalCards.value,
      libraryId: libraryId.value,
      libraryName: libraryName.value,
      mode: mode.value,
      cardList: cardList.value,
      comments: comments.value,
      isFavorite: isFavorite.value,
      relatedCards: relatedCards.value,
      timestamp: Date.now()
    })
  }
  router.push(`/card/study?cardId=${card.id}&singleCard=true`)
}

const recordCardStudy = async () => {
  const token = localStorage.getItem('access_token')
  if (!token || !currentCard.value) return
  
  if (studiedCards.has(currentCard.value.id)) return
  
  const isFormalStudy = mode.value === 'study'
  
  try {
    await cardAPI.recordStudy(currentCard.value.id, {
      libraryId: libraryId.value === 'hot_cards' ? null : libraryId.value,
      feedback: 'normal',
      duration: 0,
      isFormalStudy: isFormalStudy
    })
    studiedCards.add(currentCard.value.id)
  } catch (error) {
    console.error('记录学习失败:', error)
  }
}

const onToggleFavorite = async () => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    MessagePlugin.warning('请先登录')
    return
  }
  
  if (!currentCard.value) return
  
  try {
    const res = await favoriteAPI.toggle('card', currentCard.value.id)
    const isFavorited = res.data && res.data.isFavorited
    isFavorite.value = isFavorited
    
    if (res.data && res.data.totalCount !== undefined) {
      localStorage.setItem('favoriteCount', res.data.totalCount.toString())
    }
    
    MessagePlugin.success(isFavorited ? '已收藏' : '已取消收藏')
  } catch (error) {
    console.error('收藏操作失败:', error)
    MessagePlugin.error('操作失败')
  }
}

const onLikeComment = async (index: number, commentId: number) => {
  const token = localStorage.getItem('access_token')
  if (!token) {
    MessagePlugin.warning('请先登录')
    return
  }
  
  const comment = comments.value[index]
  if (!comment) return
  
  try {
    const res = await commentAPI.like(commentId)
    if (res.success) {
      const wasLiked = comment.liked
      comments.value[index].liked = res.data?.liked ?? !wasLiked
      comments.value[index].likeCount = res.data?.liked 
        ? (comment.likeCount || 0) + 1 
        : Math.max(0, (comment.likeCount || 0) - 1)
      
      comments.value.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
    }
  } catch (error) {
    console.error('点赞失败:', error)
    MessagePlugin.error('操作失败')
  }
}

const onSaveCommentAsCard = (index: number) => {
  if (!canUseCommentToCard()) return
  
  const comment = comments.value[index]
  const card = currentCard.value
  
  if (!comment || !card) return
  
  const token = localStorage.getItem('access_token')
  if (!token) {
    MessagePlugin.warning('请先登录')
    return
  }
  
  localStorage.setItem('newCardContent', JSON.stringify({
    question: card.question,
    answer: comment.content
  }))
  router.push('/create/card')
}

const onSubmitComment = async () => {
  if (!commentText.value.trim() || !currentCard.value) return
  
  const token = localStorage.getItem('access_token')
  if (!token) {
    MessagePlugin.warning('请先登录')
    return
  }
  
  try {
    const res = await commentAPI.create(currentCard.value.id, { content: commentText.value.trim() })
    if (res.success) {
      const newComment: Comment = {
        id: res.data?.id || Date.now(),
        avatar: '我',
        username: '我',
        time: '刚刚',
        content: commentText.value.trim(),
        likeCount: 0,
        liked: false
      }
      comments.value.unshift(newComment)
      commentText.value = ''
      MessagePlugin.success('笔记已添加')
    }
  } catch (error: any) {
    console.error('添加评论失败:', error)
    if (error.code === 400 && error.data?.word) {
        DialogPlugin.alert({
          header: '内容审核提醒',
          body: '您的评论包含敏感词，请修改后重新发布！',
          confirmBtn: '我知道了',
          theme: 'warning'
        })
      } else if (error.message?.includes('敏感词')) {
      MessagePlugin.warning(error.message)
    } else {
      MessagePlugin.error('添加失败')
    }
  }
}

const onPrevCard = () => {
  if (currentIndex.value <= 0) {
    MessagePlugin.warning('已经是第一张了')
    return
  }
  
  switchCard(currentIndex.value - 1)
}

const onNextCard = () => {
  if (currentIndex.value >= totalCards.value - 1) {
    MessagePlugin.warning('已经是最后一张了')
    return
  }
  
  switchCard(currentIndex.value + 1)
}

const switchCard = (index: number) => {
  const card = cardList.value[index]
  if (!card) return
  
  currentIndex.value = index
  currentCard.value = card
  answerRevealed.value = mode.value !== 'study'
  commentText.value = ''
  relatedCards.value = []
  
  loadComments(card.id)
  checkFavorite(card.id)
  saveStudyProgress()
  
  if (!singleCard.value && mode.value !== 'study') {
    loadRelatedCards()
  }
}

const saveStudyProgress = () => {
  if (!currentCard.value) return
  
  const token = localStorage.getItem('access_token')
  if (!token) return
  
  const masteryChanges = JSON.parse(localStorage.getItem('cardMasteryChanges') || '{}')
  cardList.value.forEach(card => {
    if (card.learned !== undefined) {
      masteryChanges[card.id] = card.learned
    }
  })
  localStorage.setItem('cardMasteryChanges', JSON.stringify(masteryChanges))
}
</script>

<style lang="scss" scoped>
.custom-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 44px;
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  z-index: 100;
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
  color: #fff;
}

.nav-right {
  width: 40px;
}

.study-container {
  min-height: 100vh;
  background-color: #F5F7FA;
  display: flex;
  flex-direction: column;
  padding-top: 44px;
  padding-bottom: 70px;
}

.loading-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
}

.loading-text {
  font-size: 14px;
  color: #64748B;
  margin-top: 12px;
}

.question-section {
  background: #fff;
  margin: 12px;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.card-header {
  margin-bottom: 12px;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-number {
  font-size: 13px;
  color: #64748B;
  font-weight: 500;
}

.card-tags {
  display: flex;
  gap: 6px;
}

.progress-bar {
  margin-top: 8px;
}

.progress-track {
  height: 4px;
  background-color: #E2E8F0;
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
  font-size: 17px;
  color: #1E293B;
  line-height: 1.8;
  font-weight: 500;
}

.keyword-section {
  background: #fff;
  margin: 0 12px 12px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #E2E8F0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
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
    color: #3B82F6;
  }
}

.keyword-content {
  min-height: 32px;
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
  padding: 8px 0;
  
  span {
    font-size: 13px;
    color: #999;
  }
}

.answer-section {
  background: #fff;
  margin: 0 12px 12px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.answer-hidden {
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.hint-text {
  font-size: 14px;
  color: #94A3B8;
  margin-bottom: 16px;
}

.reveal-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  color: #fff;
  padding: 12px 24px;
  border-radius: 24px;
  font-size: 15px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  cursor: pointer;
  
  &:active {
    transform: scale(0.98);
  }
}

.answer-revealed {
  padding: 16px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.answer-label {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 10px;
  
  span {
    font-size: 14px;
    color: #10B981;
    font-weight: 500;
  }
}

.answer-content {
  background: #F8FAFC;
  border-radius: 8px;
  padding: 12px;
  border-left: 2px solid #10B981;
}

.answer-text {
  font-size: 15px;
  color: #1E293B;
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

.related-section {
  position: relative;
  background: linear-gradient(135deg, #FFF8DC 0%, #FFFACD 50%, #FAFAD2 100%);
  margin: 0 12px 12px;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(218, 165, 32, 0.2);
  border: 1px solid #D4AF37;
  animation: fadeIn 0.3s ease;
}

.related-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(212, 175, 55, 0.3);
}

.related-title-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
}

.related-title {
  font-size: 15px;
  font-weight: 600;
  color: #B8860B;
}

.related-vip-tag {
  font-size: 10px;
  color: #fff;
  background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%);
  padding: 1px 6px;
  border-radius: 8px;
  font-weight: 600;
  margin-left: 4px;
}

.related-actions {
  display: flex;
  align-items: center;
}

.link-search-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: rgba(184, 134, 11, 0.1);
  border-radius: 16px;
  cursor: pointer;
  
  span {
    font-size: 13px;
    color: #B8860B;
    font-weight: 500;
  }
  
  &:active {
    background: rgba(184, 134, 11, 0.2);
  }
}

.linked-section {
  margin-bottom: 12px;
}

.linked-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.linked-label {
  font-size: 13px;
  font-weight: 500;
  color: #B8860B;
}

.linked-count {
  font-size: 12px;
  color: #C9A227;
}

.linked-list-scroll {
  overflow-x: auto;
  margin: 0 -8px;
  padding: 0 8px;
  
  &::-webkit-scrollbar {
    display: none;
  }
}

.linked-list {
  display: flex;
  gap: 8px;
  white-space: nowrap;
}

.linked-item {
  display: inline-block;
  cursor: pointer;
  position: relative;
}

.linked-card {
  width: 210px;
  background: #F8FAFC;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #8cb6f9;
  transition: all 0.2s ease;
  white-space: normal;
  
  &:active {
    transform: scale(0.98);
    border-color: #2563EB;
    background: #EFF6FF;
  }
}

.linked-card-question {
  min-height: 40px;
  
  span {
    font-size: 13px;
    color: #1E293B;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
  }
}

.linked-card-library {
  font-size: 11px;
  color: #3B82F6;
  background: rgba(59, 130, 246, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
  margin-top: 8px;
}

.unlink-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.05);
  cursor: pointer;
  flex-shrink: 0;
  
  &:active {
    background: rgba(0, 0, 0, 0.15);
  }
}

.related-loading,
.related-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
  gap: 8px;
  
  span {
    font-size: 13px;
    color: #C9A227;
  }
}

.vip-lock-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 248, 220, 0.1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.vip-lock-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  text-align: center;
  transform: translateY(-20px);
}

.vip-lock-title {
  font-size: 16px;
  font-weight: 600;
  color: #B8860B;
}

.vip-lock-desc {
  font-size: 12px;
  color: #8B7355;
}

.vip-lock-btn {
  margin-top: 8px;
  padding: 8px 20px;
  background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  border-radius: 20px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(184, 134, 11, 0.3);
  transition: all 0.2s ease;
  
  &:active {
    transform: scale(0.95);
  }
}

.related-list-scroll {
  overflow-x: auto;
  margin: 0 -8px;
  padding: 0 8px;
  
  &::-webkit-scrollbar {
    display: none;
  }
}

.related-list {
  display: flex;
  gap: 8px;
  white-space: nowrap;
}

.related-item {
  display: inline-block;
  cursor: pointer;
}

.related-card {
  width: 210px;
  background: #F8FAFC;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #8cb6f9;
  transition: all 0.2s ease;
  white-space: normal;
  
  &:active {
    transform: scale(0.98);
    border-color: #2563EB;
    background: #EFF6FF;
  }
}

.related-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.related-card-library {
  font-size: 11px;
  color: #3B82F6;
  background: rgba(59, 130, 246, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.related-card-tags {
  display: flex;
  gap: 4px;
}

.related-tag {
  font-size: 10px;
  color: #3B82F6;
  background: rgba(59, 130, 246, 0.1);
  padding: 1px 4px;
  border-radius: 3px;
}

.related-card-question {
  min-height: 40px;
  
  span {
    font-size: 13px;
    color: #1E293B;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
  }
}

.comment-section {
  background: #fff;
  margin: 0 12px 12px;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  animation: fadeIn 0.3s ease;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #E2E8F0;
}

.comment-title {
  font-size: 15px;
  font-weight: 600;
  color: #1E293B;
}

.comment-count {
  font-size: 13px;
  color: #64748B;
}

.comment-list {
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 12px;
}

.comment-item {
  display: flex;
  gap: 8px;
  padding: 10px 0;
  border-bottom: 1px solid #F1F5F9;
  
  &:last-child {
    border-bottom: none;
  }
}

.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
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
    font-size: 14px;
    color: #fff;
    font-weight: 500;
  }
}

.comment-content {
  flex: 1;
  min-width: 0;
}

.comment-user {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.username {
  font-size: 13px;
  color: #1E293B;
  font-weight: 500;
}

.time {
  font-size: 11px;
  color: #94A3B8;
}

.comment-text {
  font-size: 14px;
  color: #64748B;
  line-height: 1.6;
  display: block;
}

.comment-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 6px;
}

.like-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #64748B;
  cursor: pointer;
  
  &.liked {
    color: #3B82F6;
  }
}

.save-card-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #64748B;
  cursor: pointer;
}

.comment-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0;
  
  span {
    font-size: 13px;
    color: #94A3B8;
    margin-top: 8px;
  }
}

.comment-input-section {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #F8FAFC;
  border-radius: 24px;
}

.comment-input {
  flex: 1;
  font-size: 14px;
  color: #1E293B;
  background: transparent;
  padding: 0 8px;
  border: none;
  outline: none;
  
  &::placeholder {
    color: #94A3B8;
  }
}

.send-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #E2E8F0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  cursor: pointer;
  
  &.active {
    background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  }
}

.favorite-section {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #E2E8F0;
}

.favorite-btn-inline {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px;
  border-radius: 6px;
  background: #F8FAFC;
  font-size: 13px;
  color: #64748B;
  transition: all 0.2s ease;
  cursor: pointer;
  
  &.active {
    background: rgba(250, 173, 20, 0.1);
    color: #FAAD14;
  }
}

.bottom-placeholder {
  height: 24px;
}

.study-nav-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 12px 16px;
  padding-bottom: calc(12px + constant(safe-area-inset-bottom));
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 170px;
  z-index: 100;
  
  &.study-mode {
    background: linear-gradient(135deg, #f8faff 0%, #fff 100%);
  }
}

.nav-btn-prev {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 8px 16px;
  border-radius: 24px;
  background: #F1F5F9;
  transition: all 0.2s ease;
  cursor: pointer;
  
  &.disabled {
    opacity: 0.5;
  }
  
  .prev-text {
    display: flex;
    align-items: center;
    font-size: 14px;
    color: #64748B;
    line-height: 18px;
    height: 18px;
  }
}

.nav-btn-next-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 8px 16px;
  border-radius: 24px;
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  transition: all 0.2s ease;
  cursor: pointer;
  
  &.disabled {
    background: #E2E8F0;
    box-shadow: none;
  }
  
  .next-text {
    display: flex;
    align-items: center;
    font-size: 14px;
    color: #fff;
    font-weight: 500;
    line-height: 18px;
    height: 18px;
    margin-left: 4px;
  }
}

.nav-btn {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border-radius: 24px;
  background: #F1F5F9;
  transition: all 0.2s ease;
  cursor: pointer;
  
  &.disabled {
    opacity: 0.5;
  }
  
  &.prev {
    background: rgba(59, 130, 246, 0.08);
    padding-left: 10px;
  }
  
  &.next {
    background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
    padding-right: 10px;
  }
  
  .nav-text {
    display: flex;
    align-items: center;
    font-size: 14px;
    color: #3B82F6;
    line-height: 20px;
    height: 20px;
  }
  
  &.next .nav-text {
    color: #fff;
  }
}
</style>

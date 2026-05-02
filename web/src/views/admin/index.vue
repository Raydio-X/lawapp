<template>
  <div class="admin-container">
    <div class="custom-nav">
      <div class="nav-content">
        <span class="nav-title">管理</span>
      </div>
    </div>

    <div class="tab-bar">
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'stats' }"
        @click="activeTab = 'stats'"
      >
        <t-icon name="chart-bar" size="18px" :color="activeTab === 'stats' ? '#3B82F6' : '#999'" />
        <span>概览</span>
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'libraries' }"
        @click="activeTab = 'libraries'"
      >
        <t-icon name="folder" size="18px" :color="activeTab === 'libraries' ? '#3B82F6' : '#999'" />
        <span>知识库</span>
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'cards' }"
        @click="activeTab = 'cards'"
      >
        <t-icon name="file" size="18px" :color="activeTab === 'cards' ? '#3B82F6' : '#999'" />
        <span>卡片</span>
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'hotCards' }"
        @click="activeTab = 'hotCards'"
      >
        <t-icon name="bookmark-checked" size="18px" :color="activeTab === 'hotCards' ? '#3B82F6' : '#999'" />
        <span>热门卡片</span>
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'comments' }"
        @click="activeTab = 'comments'"
      >
        <t-icon name="chat" size="18px" :color="activeTab === 'comments' ? '#3B82F6' : '#999'" />
        <span>评论</span>
      </div>
    </div>

    <div class="content">
      <template v-if="activeTab === 'stats'">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon blue">
              <t-icon name="folder" size="24px" color="#3B82F6" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.totalLibraries }}</span>
              <span class="stat-label">知识库总数</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon green">
              <t-icon name="file" size="24px" color="#52c41a" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.totalCards }}</span>
              <span class="stat-label">卡片总数</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon orange">
              <t-icon name="user" size="24px" color="#fa8c16" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.totalUsers }}</span>
              <span class="stat-label">用户总数</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon red">
              <t-icon name="chat" size="24px" color="#f5222d" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.totalComments }}</span>
              <span class="stat-label">评论总数</span>
            </div>
          </div>
        </div>

        <div class="broadcast-entry" @click="router.push('/admin/broadcast')">
          <div class="broadcast-entry-icon">
            <t-icon name="notification-add" size="24px" color="#3B82F6" />
          </div>
          <div class="broadcast-entry-content">
            <span class="broadcast-entry-title">发布通知</span>
            <span class="broadcast-entry-desc">向所有用户发送消息通知</span>
          </div>
          <t-icon name="chevron-right" size="20px" color="#ccc" />
        </div>

        <div class="broadcast-entry" @click="router.push('/admin/blocked-words')">
          <div class="broadcast-entry-icon" style="background-color: rgba(245, 158, 11, 0.1);">
            <t-icon name="filter" size="24px" color="#F59E0B" />
          </div>
          <div class="broadcast-entry-content">
            <span class="broadcast-entry-title">屏蔽词管理</span>
            <span class="broadcast-entry-desc">管理评论敏感词过滤</span>
          </div>
          <t-icon name="chevron-right" size="20px" color="#ccc" />
        </div>
      </template>

      <template v-if="activeTab === 'libraries'">
        <div class="search-bar">
          <input 
            class="search-input" 
            placeholder="搜索知识库" 
            v-model="libraryKeyword"
            @keyup.enter="onLibrarySearch"
          />
          <div class="add-btn" @click="router.push('/admin/library-form')">
            <t-icon name="add" size="18px" color="#fff" />
            <span>新建</span>
          </div>
        </div>
        <div class="list">
          <div class="list-item" v-for="(library, index) in libraries" :key="library.id">
            <div class="item-main" @click="onViewLibrary(library)">
              <div class="item-header">
                <span class="item-title">{{ library.name }}</span>
              </div>
              <div class="item-meta">
                <span class="meta-text">{{ library.card_count || 0 }}张卡片</span>
                <span class="meta-divider">·</span>
                <span class="meta-text">{{ library.creator_name || '未知' }}</span>
              </div>
              <div class="item-tags">
                <t-tag :theme="library.is_public ? 'success' : 'warning'" variant="light" size="small">
                  {{ library.is_public ? '公开' : '私有' }}
                </t-tag>
                <t-tag 
                  v-for="tag in library.tags" 
                  :key="tag" 
                  theme="primary" 
                  variant="light" 
                  size="small"
                >{{ tag }}</t-tag>
              </div>
            </div>
            <div class="item-actions" v-if="library.created_by === currentUserId">
              <div class="action-btn edit" @click="onEditLibrary(library)">
                <t-icon name="edit" size="16px" color="#3B82F6" />
              </div>
              <div class="action-btn delete" @click="onDeleteLibrary(library, index)">
                <t-icon name="delete" size="16px" color="#f5222d" />
              </div>
            </div>
          </div>
          <div class="load-more" v-if="libraryHasMore" @click="loadMoreLibraries">
            <span>加载更多</span>
          </div>
          <div class="empty-tip" v-if="libraries.length === 0">
            <span>暂无知识库</span>
          </div>
        </div>
      </template>

      <template v-if="activeTab === 'cards'">
        <div class="search-bar">
          <input 
            class="search-input" 
            placeholder="搜索卡片" 
            v-model="cardKeyword"
            @keyup.enter="onCardSearch"
          />
          <div class="add-btn" @click="router.push('/admin/card-form')" v-if="!isBatchSelectMode">
            <t-icon name="add" size="18px" color="#fff" />
            <span>新建</span>
          </div>
        </div>
        <div class="filter-row">
          <div 
            class="filter-chip" 
            :class="{ active: cardFilterPublic === '' }"
            @click="cardFilterPublic = ''"
          >全部</div>
          <div 
            class="filter-chip" 
            :class="{ active: cardFilterPublic === '1' }"
            @click="cardFilterPublic = '1'"
          >公开</div>
          <div 
            class="filter-chip" 
            :class="{ active: cardFilterPublic === '0' }"
            @click="cardFilterPublic = '0'"
          >私有</div>
        </div>

        <div class="batch-toolbar" v-if="cards.length > 0 || isBatchSelectMode">
          <div 
            class="batch-toggle-btn" 
            :class="{ active: isBatchSelectMode }"
            @click="onToggleBatchSelect"
          >
            <t-icon :name="isBatchSelectMode ? 'check' : 'check-circle'" size="16px" :color="isBatchSelectMode ? '#3B82F6' : '#666'" />
            <span>{{ isBatchSelectMode ? '取消选择' : '批量管理' }}</span>
          </div>
          <div class="batch-actions" v-if="isBatchSelectMode && cards.length > 0">
            <div class="select-all-btn" @click="onSelectAllCards">
              <span>{{ isAllSelected ? '取消全选' : '全选' }}</span>
            </div>
            <div 
              class="move-btn" 
              :class="{ disabled: selectedCardIds.length === 0 }"
              @click="showChapterPicker = true"
            >
              <t-icon name="folder-move" size="16px" :color="selectedCardIds.length > 0 ? '#3B82F6' : '#ccc'" />
              <span>移动到章节</span>
            </div>
          </div>
        </div>

        <div class="selected-count-bar" v-if="isBatchSelectMode && selectedCardIds.length > 0">
          <span>已选择 {{ selectedCardIds.length }} 张卡片</span>
        </div>

        <div class="empty-batch-tip" v-if="isBatchSelectMode && cards.length === 0">
          <span>您还没有创建任何卡片</span>
          <span class="empty-batch-subtip">请先创建卡片后再进行批量管理</span>
        </div>

        <div class="list">
          <div 
            class="list-item card-item" 
            :class="{ selected: isBatchSelectMode && selectedCardIds.includes(card.id) }"
            v-for="(card, index) in cards" 
            :key="card.id"
          >
            <div class="item-main" @click="onCardItemTap(card)">
              <div class="select-checkbox" v-if="isBatchSelectMode">
                <t-icon 
                  :name="selectedCardIds.includes(card.id) ? 'check-circle-filled' : 'circle'" 
                  size="20px" 
                  :color="selectedCardIds.includes(card.id) ? '#3B82F6' : '#ccc'" 
                />
              </div>
              <div class="item-content">
                <div class="item-header">
                  <span class="item-title card-title-text">{{ card.question }}</span>
                </div>
                <div class="item-meta">
                  <span class="meta-text">{{ card.library_name || '未知知识库' }}</span>
                  <span class="meta-divider">·</span>
                  <span class="meta-text">{{ card.like_count || 0 }}赞</span>
                  <span class="meta-divider">·</span>
                  <span class="meta-text">{{ card.study_count || 0 }}次学习</span>
                </div>
                <div class="card-tags">
                  <t-tag :theme="card.is_public ? 'success' : 'warning'" variant="light" size="small">
                    {{ card.is_public ? '公开' : '私有' }}
                  </t-tag>
                  <t-tag 
                    v-for="tag in card.tags" 
                    :key="tag" 
                    theme="primary" 
                    variant="light" 
                    size="small"
                  >{{ tag }}</t-tag>
                </div>
              </div>
            </div>
            <div class="item-actions" v-if="!isBatchSelectMode && card.created_by === currentUserId">
              <div class="action-btn edit" @click="onEditCard(card)">
                <t-icon name="edit" size="16px" color="#3B82F6" />
              </div>
              <div class="action-btn delete" @click="onDeleteCard(card, index)">
                <t-icon name="delete" size="16px" color="#f5222d" />
              </div>
            </div>
          </div>
          <div class="load-more" v-if="cardHasMore" @click="loadMoreCards">
            <span>加载更多</span>
          </div>
          <div class="empty-tip" v-if="cards.length === 0 && !isBatchSelectMode">
            <span>暂无卡片</span>
          </div>
        </div>
      </template>

      <template v-if="activeTab === 'hotCards'">
        <div class="search-bar">
          <input 
            class="search-input" 
            placeholder="搜索热门卡片" 
            v-model="hotCardKeyword"
            @keyup.enter="onHotCardSearch"
          />
          <div class="add-btn" @click="router.push('/admin/card-form?isHot=true')">
            <t-icon name="add" size="18px" color="#fff" />
            <span>新建</span>
          </div>
        </div>
        <div class="hot-cards-header">
          <span class="hot-cards-tip">按点赞数和学习次数排序</span>
        </div>
        <div class="list">
          <div class="list-item hot-card-item" v-for="(card, index) in hotCards" :key="card.id">
            <div class="item-main" @click="onViewCard(card)">
              <div class="item-header">
                <span class="item-title card-title-text">{{ card.question }}</span>
              </div>
              <div class="item-meta">
                <span class="meta-text hot-stat">{{ card.like_count || 0 }}赞</span>
                <span class="meta-divider">·</span>
                <span class="meta-text hot-stat">{{ card.study_count || 0 }}次学习</span>
              </div>
              <div class="card-tags">
                <t-tag :theme="card.is_public ? 'success' : 'warning'" variant="light" size="small">
                  {{ card.is_public ? '公开' : '私有' }}
                </t-tag>
                <t-tag 
                  v-for="tag in card.tags" 
                  :key="tag" 
                  theme="primary" 
                  variant="light" 
                  size="small"
                >{{ tag }}</t-tag>
              </div>
            </div>
            <div class="item-actions" v-if="card.created_by === currentUserId">
              <div class="action-btn edit" @click="onEditHotCard(card)">
                <t-icon name="edit" size="16px" color="#3B82F6" />
              </div>
              <div class="action-btn delete" @click="onDeleteHotCard(card, index)">
                <t-icon name="delete" size="16px" color="#f5222d" />
              </div>
            </div>
          </div>
          <div class="load-more" v-if="hotCardHasMore" @click="loadMoreHotCards">
            <span>加载更多</span>
          </div>
          <div class="empty-tip" v-if="hotCards.length === 0">
            <span>暂无热门卡片</span>
          </div>
        </div>
      </template>

      <template v-if="activeTab === 'comments'">
        <div class="search-bar">
          <input 
            class="search-input" 
            placeholder="搜索评论" 
            v-model="commentKeyword"
            @keyup.enter="onCommentSearch"
          />
        </div>
        <div class="list">
          <div class="list-item comment-item" v-for="(comment, index) in comments" :key="comment.id">
            <div class="item-main" @click="onViewCommentDetail(comment)">
              <div class="comment-header">
                <span class="comment-user">{{ comment.nickname || '匿名用户' }}</span>
                <span class="comment-time">{{ comment.created_at }}</span>
              </div>
              <span class="comment-content">{{ comment.content }}</span>
              <div class="comment-meta">
                <span class="meta-text">评论卡片: {{ comment.card_question || '未知' }}</span>
                <span class="meta-divider">·</span>
                <span class="meta-text">{{ comment.like_count || 0 }}赞</span>
              </div>
            </div>
            <div class="item-actions">
              <div class="action-btn delete" @click="onDeleteComment(comment, index)">
                <t-icon name="delete" size="16px" color="#f5222d" />
              </div>
            </div>
          </div>
          <div class="load-more" v-if="commentHasMore" @click="loadMoreComments">
            <span>加载更多</span>
          </div>
          <div class="empty-tip" v-if="comments.length === 0">
            <span>暂无评论</span>
          </div>
        </div>
      </template>

      <div class="bottom-placeholder"></div>
    </div>

    <div class="admin-tab-bar">
      <div class="tab-bar-item active">
        <t-icon name="setting" size="22px" color="#3B82F6" />
        <span class="tab-bar-text active-text">管理</span>
      </div>
      <div class="tab-bar-item" @click="onLogout">
        <t-icon name="poweroff" size="22px" color="#999" />
        <span class="tab-bar-text">退出</span>
      </div>
    </div>

    <t-dialog
      v-model:visible="showDeleteConfirm"
      header="删除确认"
      body="确定要删除吗？此操作不可恢复。"
      confirm-btn="确定删除"
      cancel-btn="取消"
      @confirm="onConfirmDelete"
    />

    <t-popup v-model="showChapterPicker" placement="bottom">
      <div class="chapter-picker-popup" v-if="showChapterPicker">
        <div class="chapter-picker-header">
          <span class="chapter-picker-title">选择目标章节</span>
          <div class="chapter-picker-close" @click="showChapterPicker = false">
            <t-icon name="close" size="20px" color="#999" />
          </div>
        </div>
        <div class="chapter-picker-list">
          <div 
            class="chapter-picker-item"
            :class="{ selected: targetChapterId === chapter.id }"
            v-for="chapter in chapterPickerList" 
            :key="chapter.id"
            @click="targetChapterId = chapter.id"
          >
            <div class="chapter-picker-name" :style="{ paddingLeft: chapter.level * 10 + 'px' }">
              <div class="chapter-level-indicator" v-if="chapter.level > 0">
                <span>{{ chapter.level }}级</span>
              </div>
              <span>{{ chapter.name }}</span>
            </div>
            <t-icon v-if="targetChapterId === chapter.id" name="check" size="18px" color="#3B82F6" />
          </div>
        </div>
        <div class="chapter-picker-footer">
          <div class="chapter-picker-btn cancel" @click="showChapterPicker = false">取消</div>
          <div class="chapter-picker-btn confirm" @click="onConfirmMoveCards">确认移动</div>
        </div>
      </div>
    </t-popup>

    <Transition name="fade">
      <div class="comment-modal-overlay" v-if="showCommentDetail" @click="showCommentDetail = false">
        <Transition name="scale">
          <div class="comment-modal-container" v-if="showCommentDetail" @click.stop>
            <div class="comment-modal-header">
              <span class="comment-modal-title">评论详情</span>
              <div class="comment-modal-close" @click="showCommentDetail = false">
                <t-icon name="close" size="20px" color="#999" />
              </div>
            </div>
            <div class="comment-modal-content" v-if="currentComment">
              <div class="comment-modal-user">
                <div class="user-avatar">
                  <t-icon name="user" size="24px" color="#fff" />
                </div>
                <div class="user-info">
                  <span class="user-nickname">{{ currentComment.nickname || '匿名用户' }}</span>
                  <span class="user-time">{{ currentComment.created_at }}</span>
                </div>
              </div>
              <div class="comment-modal-text">{{ currentComment.content }}</div>
              <div class="comment-modal-card" @click="onViewCommentCard(currentComment)">
                <div class="card-info">
                  <span class="card-label">评论的卡片</span>
                  <span class="card-title">{{ currentComment.card_question || '未知卡片' }}</span>
                </div>
                <t-icon name="chevron-right" size="16px" color="#ccc" />
              </div>
              <div class="comment-modal-stats">
                <div class="stat-item">
                  <t-icon name="thumb-up" size="16px" color="#3B82F6" />
                  <span>{{ currentComment.like_count || 0 }} 赞</span>
                </div>
              </div>
            </div>
            <div class="comment-modal-footer">
              <div class="modal-btn delete" @click="onDeleteCommentFromDetail">
                <t-icon name="delete" size="16px" color="#f5222d" />
                <span>删除评论</span>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next'
import api from '@/utils/api'

defineOptions({
  name: 'Admin'
})

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref(localStorage.getItem('adminActiveTab') || 'stats')
const currentUserId = computed(() => userStore.userInfo?.id)

const stats = ref({
  totalLibraries: 0,
  totalCards: 0,
  totalUsers: 0,
  totalComments: 0
})

const libraries = ref<any[]>([])
const libraryKeyword = ref('')
const libraryHasMore = ref(false)
const libraryPage = ref(1)

const cards = ref<any[]>([])
const allCards = ref<any[]>([])
const cardKeyword = ref('')
const cardFilterPublic = ref('')
const cardHasMore = ref(false)
const cardPage = ref(1)
const isBatchSelectMode = ref(false)
const selectedCardIds = ref<string[]>([])
const showChapterPicker = ref(false)
const chapterPickerList = ref<any[]>([])
const targetChapterId = ref<string | null>(null)
const isAllSelected = ref(false)

const hotCards = ref<any[]>([])
const hotCardKeyword = ref('')
const hotCardHasMore = ref(false)
const hotCardPage = ref(1)

const comments = ref<any[]>([])
const commentKeyword = ref('')
const commentHasMore = ref(false)
const commentPage = ref(1)

const showDeleteConfirm = ref(false)
const deleteType = ref('')
const deleteId = ref<string | null>(null)
const deleteIndex = ref(-1)

const showCommentDetail = ref(false)
const currentComment = ref<any>(null)

const loadStats = async () => {
  try {
    const res = await api.get('/admin/stats')
    if (res.success && res.data) {
      stats.value = res.data
    }
  } catch (error) {
    console.error('加载统计失败:', error)
  }
}

const loadLibraries = async () => {
  try {
    const params: any = {
      page: libraryPage.value,
      pageSize: 20
    }
    if (libraryKeyword.value) {
      params.keyword = libraryKeyword.value
    }
    const res = await api.get('/admin/libraries', params)
    if (res.success && res.data) {
      const list = res.data.list || []
      libraries.value = libraryPage.value === 1 ? list : [...libraries.value, ...list]
      libraryHasMore.value = list.length >= 20
    }
  } catch (error) {
    console.error('加载知识库失败:', error)
  }
}

const loadCards = async () => {
  try {
    const params: any = {
      page: cardPage.value,
      pageSize: 20
    }
    if (cardKeyword.value) {
      params.keyword = cardKeyword.value
    }
    if (cardFilterPublic.value) {
      params.is_public = cardFilterPublic.value
    }
    const res = await api.get('/admin/cards', params)
    if (res.success && res.data) {
      const list = res.data.list || []
      const newAllCards = cardPage.value === 1 ? list : [...allCards.value, ...list]
      allCards.value = newAllCards
      
      const displayCards = isBatchSelectMode.value 
        ? newAllCards.filter((c: any) => c.created_by === currentUserId.value)
        : newAllCards
      
      cards.value = displayCards
      cardHasMore.value = list.length >= 20
    }
  } catch (error) {
    console.error('加载卡片失败:', error)
  }
}

const loadHotCards = async () => {
  try {
    const params: any = {
      page: hotCardPage.value,
      pageSize: 20,
      is_hot: '1'
    }
    if (hotCardKeyword.value) {
      params.keyword = hotCardKeyword.value
    }
    const res = await api.get('/admin/cards', params)
    if (res.success && res.data) {
      const list = res.data.list || []
      hotCards.value = hotCardPage.value === 1 ? list : [...hotCards.value, ...list]
      hotCardHasMore.value = list.length >= 20
    }
  } catch (error) {
    console.error('加载热门卡片失败:', error)
  }
}

const loadComments = async () => {
  try {
    const params: any = {
      page: commentPage.value,
      pageSize: 20
    }
    if (commentKeyword.value) {
      params.keyword = commentKeyword.value
    }
    const res = await api.get('/admin/comments', params)
    if (res.success && res.data) {
      const list = (res.data.list || []).map((item: any) => ({
        ...item,
        created_at: item.created_at ? item.created_at.substring(0, 16).replace('T', ' ') : ''
      }))
      comments.value = commentPage.value === 1 ? list : [...comments.value, ...list]
      commentHasMore.value = list.length >= 20
    }
  } catch (error) {
    console.error('加载评论失败:', error)
  }
}

const onLibrarySearch = () => {
  libraryPage.value = 1
  loadLibraries()
}

const onCardSearch = () => {
  cardPage.value = 1
  allCards.value = []
  loadCards()
}

const onHotCardSearch = () => {
  hotCardPage.value = 1
  loadHotCards()
}

const onCommentSearch = () => {
  commentPage.value = 1
  loadComments()
}

const loadMoreLibraries = () => {
  if (!libraryHasMore.value) return
  libraryPage.value++
  loadLibraries()
}

const loadMoreCards = () => {
  if (!cardHasMore.value) return
  cardPage.value++
  loadCards()
}

const loadMoreHotCards = () => {
  if (!hotCardHasMore.value) return
  hotCardPage.value++
  loadHotCards()
}

const loadMoreComments = () => {
  if (!commentHasMore.value) return
  commentPage.value++
  loadComments()
}

const onViewLibrary = (library: any) => {
  router.push(`/library/${library.id}`)
}

const onEditLibrary = (library: any) => {
  router.push(`/admin/library-form?id=${library.id}`)
}

const onDeleteLibrary = (library: any, index: number) => {
  deleteType.value = 'library'
  deleteId.value = library.id
  deleteIndex.value = index
  showDeleteConfirm.value = true
}

const onEditCard = (card: any) => {
  router.push(`/admin/card-form?id=${card.id}`)
}

const onDeleteCard = (card: any, index: number) => {
  deleteType.value = 'card'
  deleteId.value = card.id
  deleteIndex.value = index
  showDeleteConfirm.value = true
}

const onEditHotCard = (card: any) => {
  router.push(`/admin/card-form?id=${card.id}&isHot=true`)
}

const onDeleteHotCard = (card: any, index: number) => {
  deleteType.value = 'hotCard'
  deleteId.value = card.id
  deleteIndex.value = index
  showDeleteConfirm.value = true
}

const onDeleteComment = (comment: any, index: number) => {
  deleteType.value = 'comment'
  deleteId.value = comment.id
  deleteIndex.value = index
  showDeleteConfirm.value = true
}

const onConfirmDelete = async () => {
  if (!deleteId.value) return

  try {
    let res
    if (deleteType.value === 'library') {
      res = await api.delete(`/admin/libraries/${deleteId.value}`)
    } else if (deleteType.value === 'card' || deleteType.value === 'hotCard') {
      res = await api.delete(`/admin/cards/${deleteId.value}`)
    } else if (deleteType.value === 'comment') {
      res = await api.delete(`/admin/comments/${deleteId.value}`)
    }

    if (res && res.success) {
      MessagePlugin.success('删除成功')
      showDeleteConfirm.value = false
      
      if (deleteType.value === 'library') {
        libraries.value.splice(deleteIndex.value, 1)
      } else if (deleteType.value === 'card') {
        cards.value.splice(deleteIndex.value, 1)
      } else if (deleteType.value === 'hotCard') {
        hotCards.value.splice(deleteIndex.value, 1)
      } else if (deleteType.value === 'comment') {
        comments.value.splice(deleteIndex.value, 1)
      }
    }
  } catch (error) {
    console.error('删除失败:', error)
    MessagePlugin.error('删除失败')
  }
}

const onToggleBatchSelect = () => {
  const newMode = !isBatchSelectMode.value
  const displayCards = newMode 
    ? allCards.value.filter((c: any) => c.created_by === currentUserId.value)
    : allCards.value
  
  isBatchSelectMode.value = newMode
  cards.value = displayCards
  selectedCardIds.value = []
  isAllSelected.value = false
}

const onSelectAllCards = () => {
  if (isAllSelected.value) {
    selectedCardIds.value = []
    isAllSelected.value = false
  } else {
    selectedCardIds.value = cards.value.map(c => c.id)
    isAllSelected.value = true
  }
}

const onCardItemTap = (card: any) => {
  if (isBatchSelectMode.value) {
    const index = selectedCardIds.value.indexOf(card.id)
    if (index > -1) {
      selectedCardIds.value.splice(index, 1)
    } else {
      selectedCardIds.value.push(card.id)
    }
    isAllSelected.value = selectedCardIds.value.length === cards.value.length && cards.value.length > 0
  } else {
    onViewCard(card)
  }
}

const onViewCard = (card: any) => {
  router.push(`/card/study?cardId=${card.id}`)
}

const onConfirmMoveCards = async () => {
  if (selectedCardIds.value.length === 0) {
    MessagePlugin.warning('请先选择卡片')
    return
  }

  try {
    const res = await api.post('/cards/batch-move', {
      cardIds: selectedCardIds.value,
      chapterId: targetChapterId.value
    })
    if (res.success) {
      MessagePlugin.success(`已移动 ${res.data?.count || selectedCardIds.value.length} 张卡片`)
      showChapterPicker.value = false
      isBatchSelectMode.value = false
      selectedCardIds.value = []
      isAllSelected.value = false
      cardPage.value = 1
      allCards.value = []
      loadCards()
    } else {
      MessagePlugin.error(res.message || '移动失败')
    }
  } catch (error) {
    console.error('批量移动卡片失败:', error)
    MessagePlugin.error('移动失败')
  }
}

watch(showChapterPicker, async (visible) => {
  if (visible && selectedCardIds.value.length > 0) {
    const selectedCard = cards.value.find(c => c.id === selectedCardIds.value[0])
    if (selectedCard?.library_id) {
      try {
        const res = await api.get(`/libraries/${selectedCard.library_id}/chapters`)
        if (res.success && res.data) {
          const chapters = res.data.list || res.data || []
          chapterPickerList.value = [
            { id: null, name: '无章节', level: 0 },
            ...chapters.map((ch: any) => ({
              id: ch.id,
              name: ch.name,
              level: ch.level || 1
            }))
          ]
        }
      } catch (error) {
        console.error('加载章节列表失败:', error)
      }
    }
  }
})

const onViewCommentDetail = (comment: any) => {
  currentComment.value = comment
  showCommentDetail.value = true
}

const onViewCommentCard = (comment: any) => {
  if (comment.card_id) {
    showCommentDetail.value = false
    router.push(`/card/study?cardId=${comment.card_id}`)
  }
}

const onDeleteCommentFromDetail = () => {
  if (currentComment.value) {
    showCommentDetail.value = false
    deleteType.value = 'comment'
    deleteId.value = currentComment.value.id
    deleteIndex.value = comments.value.findIndex(c => c.id === currentComment.value.id)
    showDeleteConfirm.value = true
  }
}

const onLogout = () => {
  const confirmDialog = DialogPlugin.confirm({
    header: '提示',
    body: '确定要退出管理员账号吗？',
    onConfirm: () => {
      userStore.logout()
      router.push('/login')
      confirmDialog.hide()
    }
  })
}

watch(cardFilterPublic, () => {
  cardPage.value = 1
  allCards.value = []
  loadCards()
})

watch(activeTab, (newTab) => {
  localStorage.setItem('adminActiveTab', newTab)
})

onMounted(() => {
  loadStats()
  loadLibraries()
  loadCards()
  loadHotCards()
  loadComments()
})

onActivated(() => {
  const savedTab = localStorage.getItem('adminActiveTab')
  if (savedTab && savedTab !== activeTab.value) {
    activeTab.value = savedTab
  }
})
</script>

<style lang="scss" scoped>
.admin-container {
  min-height: 100vh;
  background-color: #f5f6fa;
  padding-bottom: 60px;
}

.custom-nav {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  z-index: 999;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
}

.nav-content {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-title {
  font-size: 17px;
  font-weight: 600;
  color: #000;
}

.tab-bar {
  display: flex;
  background-color: #fff;
  padding: 8px 12px;
  gap: 4px;
  position: sticky;
  top: 44px;
  z-index: 100;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
}

.tab-bar .tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 0;
  border-radius: 6px;
  font-size: 12px;
  color: #999;
  transition: all 0.2s;
  cursor: pointer;
}

.tab-bar .tab-item.active {
  color: #3B82F6;
  background-color: rgba(59, 130, 246, 0.06);
  font-weight: 500;
}

.content {
  padding: 12px 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  background-color: #fff;
  border-radius: 10px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon.blue {
  background-color: rgba(59, 130, 246, 0.1);
}

.stat-icon.green {
  background-color: rgba(82, 196, 26, 0.1);
}

.stat-icon.orange {
  background-color: rgba(250, 140, 22, 0.1);
}

.stat-icon.red {
  background-color: rgba(245, 34, 45, 0.1);
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.stat-label {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.search-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.search-input {
  flex: 1;
  height: 36px;
  background-color: #fff;
  border-radius: 6px;
  padding: 0 12px;
  font-size: 14px;
  color: #333;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
  border: none;
  outline: none;

  &::placeholder {
    color: #bbb;
  }
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  color: #fff;
  padding: 0 14px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  height: 36px;
}

.filter-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.filter-chip {
  padding: 4px 12px;
  border-radius: 14px;
  font-size: 13px;
  color: #666;
  background-color: #fff;
  transition: all 0.2s;
  cursor: pointer;
}

.filter-chip.active {
  color: #3B82F6;
  background-color: rgba(59, 130, 246, 0.1);
  font-weight: 500;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.list-item {
  background-color: #fff;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
  transition: all 0.2s;
}

.list-item.selected {
  background-color: #e8f3ff !important;
  border: 1px solid #3B82F6 !important;
}

.item-main {
  flex: 1;
  min-width: 0;
  cursor: pointer;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.item-title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.card-title-text {
  white-space: normal;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.meta-text {
  font-size: 12px;
  color: #999;
}

.meta-divider {
  font-size: 12px;
  color: #ddd;
}

.item-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.card-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.item-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  cursor: pointer;
}

.action-btn.edit {
  background-color: rgba(59, 130, 246, 0.08);
}

.action-btn.delete {
  background-color: rgba(245, 34, 45, 0.08);
}

.action-btn:active {
  transform: scale(0.9);
}

.comment-item .item-main {
  display: flex;
  flex-direction: column;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.comment-user {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.comment-time {
  font-size: 11px;
  color: #bbb;
}

.comment-content {
  font-size: 14px;
  color: #555;
  line-height: 1.5;
  margin-bottom: 4px;
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 4px;
}

.load-more {
  text-align: center;
  padding: 12px;
  color: #3B82F6;
  font-size: 14px;
  cursor: pointer;
}

.empty-tip {
  text-align: center;
  padding: 40px 16px;
  color: #999;
  font-size: 14px;
}

.empty-batch-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 16px;
  background-color: #fff;
  margin: 12px;
  border-radius: 8px;
}

.empty-batch-tip span {
  color: #666;
  font-size: 14px;
}

.empty-batch-subtip {
  margin-top: 8px;
  color: #999;
  font-size: 12px;
}

.bottom-placeholder {
  height: 24px;
}

.admin-tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50px;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-around;
  border-top: 1px solid #eee;
  z-index: 999;
}

.tab-bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  flex: 1;
  padding: 4px 0;
  cursor: pointer;
}

.tab-bar-text {
  font-size: 11px;
  color: #999;
}

.tab-bar-text.active-text {
  color: #3B82F6;
  font-weight: 500;
}

.batch-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: #fff;
  margin-bottom: 8px;
  border-radius: 8px;
}

.batch-toggle-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 4px;
  background-color: #f5f5f5;
  font-size: 13px;
  color: #666;
  cursor: pointer;
}

.batch-toggle-btn.active {
  background-color: #e8f3ff;
  color: #3B82F6;
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.select-all-btn {
  padding: 6px 10px;
  border-radius: 4px;
  background-color: #f5f5f5;
  font-size: 13px;
  color: #666;
  cursor: pointer;
}

.move-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 4px;
  background-color: #e8f3ff;
  font-size: 13px;
  color: #3B82F6;
  cursor: pointer;
}

.move-btn.disabled {
  background-color: #f5f5f5;
  color: #ccc;
}

.selected-count-bar {
  background-color: #e8f3ff;
  padding: 6px 10px;
  border-radius: 4px;
  margin: 0 12px 8px;
  font-size: 13px;
  color: #3B82F6;
  text-align: center;
}

.card-item .item-main {
  display: flex;
  align-items: flex-start;
}

.select-checkbox {
  margin-right: 8px;
  display: flex;
  align-items: center;
  padding-top: 4px;
}

.item-content {
  flex: 1;
}

.chapter-picker-popup {
  background-color: #fff;
  border-radius: 16px 16px 0 0;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.chapter-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.chapter-picker-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.chapter-picker-close {
  padding: 4px;
  cursor: pointer;
}

.chapter-picker-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.chapter-picker-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
}

.chapter-picker-item.selected {
  background-color: #e8f3ff;
  color: #3B82F6;
}

.chapter-picker-name {
  flex: 1;
  display: flex;
  align-items: center;
}

.chapter-level-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 20px;
  padding: 0 6px;
  background-color: #e8f4ff;
  border-radius: 4px;
  margin-right: 6px;
}

.chapter-level-indicator span {
  font-size: 11px;
  color: #3B82F6;
  font-weight: 500;
}

.chapter-picker-footer {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  border-top: 1px solid #eee;
}

.chapter-picker-btn {
  flex: 1;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.chapter-picker-btn.cancel {
  background-color: #f5f5f5;
  color: #666;
}

.chapter-picker-btn.confirm {
  background-color: #3B82F6;
  color: #fff;
}

.hot-cards-header {
  padding: 8px 12px;
  background-color: #fffaf5;
  border-bottom: 1px solid #ffe8d6;
  border-radius: 8px;
  margin-bottom: 8px;
}

.hot-cards-tip {
  font-size: 12px;
  color: #ff6b35;
}

.hot-stat {
  color: #ff6b35 !important;
  font-weight: 500;
}

.broadcast-entry {
  display: flex;
  align-items: center;
  background-color: #fff;
  border-radius: 8px;
  padding: 14px 16px;
  margin-top: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.2s;
}

.broadcast-entry:active {
  background-color: #f9f9f9;
}

.broadcast-entry-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: rgba(59, 130, 246, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.broadcast-entry-content {
  flex: 1;
}

.broadcast-entry-title {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.broadcast-entry-desc {
  font-size: 13px;
  color: #999;
}

.comment-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.comment-modal-container {
  background-color: #fff;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.comment-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.comment-modal-title {
  font-size: 17px;
  font-weight: 600;
  color: #333;
}

.comment-modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f5f5f5;
  }
}

.comment-modal-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.comment-modal-user {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.user-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-nickname {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.user-time {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.comment-modal-text {
  font-size: 15px;
  color: #333;
  line-height: 1.8;
  margin-bottom: 16px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 6px;
  word-break: break-all;
}

.comment-modal-card {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background: linear-gradient(135deg, #e8f4ff 0%, #f0f7ff 100%);
  border-radius: 6px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: linear-gradient(135deg, #d4e8ff 0%, #e0f0ff 100%);
  }

  &:active {
    transform: scale(0.98);
  }
}

.card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.card-label {
  font-size: 12px;
  color: #64748B;
}

.card-title {
  font-size: 14px;
  color: #3B82F6;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 2px;
}

.comment-modal-stats {
  display: flex;
  gap: 16px;
  padding: 12px 0;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #3B82F6;
  font-weight: 500;
}

.comment-modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.modal-btn {
  flex: 1;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &.cancel {
    background-color: #f5f6fa;
    color: #666;

    &:hover {
      background-color: #e8e9eb;
    }
  }

  &.delete {
    background-color: #fef2f2;
    color: #f5222d;

    &:hover {
      background-color: #fee2e2;
    }

    &:active {
      transform: scale(0.98);
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scale-enter-active,
.scale-leave-active {
  transition: all 0.25s ease;
}

.scale-enter-from,
.scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

@media (max-width: 480px) {
  .comment-modal-container {
    max-width: 100%;
    margin: 16px;
    max-height: 85vh;
  }

  .comment-modal-content {
    padding: 16px;
  }

  .comment-modal-footer {
    padding: 12px 16px;
  }
}

@media (max-width: 480px) {
  .tab-bar {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    
    &::-webkit-scrollbar {
      display: none;
    }
  }
  
  .tab-bar .tab-item {
    min-width: 60px;
  }
}
</style>

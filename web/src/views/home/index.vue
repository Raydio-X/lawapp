<template>
  <div class="container">
    <div class="search-section">
      <div class="search-box">
        <t-icon name="search" size="20px" color="#60A5FA" />
        <input 
          class="search-input" 
          placeholder="搜索知识卡片 / 知识库"
          v-model="searchValue"
          @keyup.enter="onSearchConfirm"
        />
        <t-icon 
          v-if="searchValue" 
          name="close-circle-filled" 
          size="20px" 
          color="#BFDBFE" 
          @click="clearSearch"
        />
      </div>
    </div>

    <div class="section hot-section">
      <div class="section-header">
        <div class="section-title-wrap">
          <div class="section-bar"></div>
          <span class="section-title">热门卡片</span>
        </div>
        <div class="more-link" @click="goToMoreCards">
          <span>查看更多</span>
          <t-icon name="chevron-right" size="14px" color="#60A5FA" />
        </div>
      </div>
      <div class="hot-cards-scroll">
        <div class="hot-cards-list">
          <div 
            class="hot-card" 
            v-for="(item, index) in hotCards" 
            :key="item.id"
            @click="onCardTap(item, index)"
          >
            <div class="hot-card-rank" v-if="index < 3">
              <span>{{ index + 1 }}</span>
            </div>
            <div class="hot-card-content">
              <div class="hot-card-title">{{ item.title }}</div>
              <div class="hot-card-tags">
                <t-tag 
                  v-for="tag in item.tags" 
                  :key="tag"
                  theme="primary" 
                  variant="light"
                  size="small"
                >{{ tag }}</t-tag>
              </div>
            </div>
            <div class="hot-card-footer">
              <div 
                class="like-count" 
                :class="{ liked: item.liked }"
                @click.stop="onLikeCard(item, index)"
              >
                <t-icon 
                  :name="item.liked ? 'thumb-up-filled' : 'thumb-up'" 
                  size="12px" 
                  :color="item.liked ? '#3B82F6' : '#94A3B8'" 
                />
                <span>{{ item.likes }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="section library-section">
      <div class="section-header">
        <div class="section-title-wrap">
          <div class="section-bar"></div>
          <span class="section-title">优质知识库</span>
        </div>
      </div>
      
      <div class="filter-tabs">
        <div class="filter-tabs-inner">
          <div 
            class="filter-tab" 
            :class="{ active: currentSort === 'hot' }"
            @click="onSortChange('hot')"
          >最热</div>
          <div 
            class="filter-tab" 
            :class="{ active: currentSort === 'new' }"
            @click="onSortChange('new')"
          >最新</div>
        </div>
      </div>

      <div class="library-grid">
        <div 
          class="library-card" 
          v-for="(item, index) in libraries" 
          :key="item.id"
          @click="onLibraryTap(item)"
        >
          <div class="library-card-left">
            <div class="library-cover">
              <div class="cover-bg" :class="'cover-' + item.subjectType"></div>
              <div class="cover-icon">
                <t-icon name="book" size="22px" color="#fff" />
              </div>
            </div>
          </div>
          <div class="library-card-body">
            <span class="library-name">{{ item.name }}</span>
            <div class="library-meta">
              <span class="meta-tag" :class="'meta-' + item.subjectType">{{ item.subject }}</span>
              <span class="meta-dot">·</span>
              <span class="meta-text">{{ item.cardCount }}张卡片</span>
            </div>
          </div>
          <div class="library-card-right">
            <div 
              class="fav-btn" 
              :class="{ favorited: item.isFavorited }"
              @click.stop="onFavoriteLibrary(item, index)"
            >
              <t-icon 
                :name="item.isFavorited ? 'star-filled' : 'star'" 
                size="18px" 
                :color="item.isFavorited ? '#F59E0B' : '#CBD5E1'" 
              />
            </div>
            <span class="fav-count">{{ item.favorites || 0 }}</span>
          </div>
        </div>
      </div>
      
      <EmptyState 
        v-if="libraries.length === 0 && !loading" 
        icon="folder-open"
        description="暂无相关知识库"
      />
    </div>

    <div class="bottom-placeholder"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { libraryAPI, cardAPI, isLoggedIn } from '@/utils/api'
import EmptyState from '@/components/EmptyState.vue'

interface HotCard {
  id: number
  title: string
  question: string
  answer: string
  tags: string[]
  likes: number
  learned: boolean
  liked: boolean
}

interface Library {
  id: number
  name: string
  subject: string
  subjectType: string
  cardCount: number
  favorites: number
  isFavorited: boolean
  createdAt: string
}

const router = useRouter()

const SUBJECT_TYPE_MAP: Record<string, string> = {
  '民法': 'civil',
  '刑法': 'criminal',
  '宪法': 'constitution',
  '行政法': 'admin'
}

const searchValue = ref('')
const currentSort = ref('hot')
const hotCards = ref<HotCard[]>([])
const allLibraries = ref<Library[]>([])
const libraries = ref<Library[]>([])
const loading = ref(false)

onMounted(() => {
  loadData()
})

const loadData = async () => {
  loading.value = true
  try {
    await Promise.all([
      loadHotCards(),
      loadLibraries()
    ])
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
}

const loadHotCards = async () => {
  try {
    const res = await cardAPI.getHotCards(5)
    if (res.success && res.data) {
      hotCards.value = (res.data || []).map((item: any) => ({
        id: item.id,
        title: item.question,
        question: item.question,
        answer: item.answer,
        tags: item.tags || [],
        likes: item.like_count || 0,
        learned: item.learned || false,
        liked: Boolean(item.is_liked)
      }))
    }
  } catch (error) {
    console.error('加载热门卡片失败:', error)
  }
}

const loadLibraries = async () => {
  try {
    const res = await libraryAPI.getList({ page: 1, pageSize: 20 })
    if (res.success && res.data) {
      const libs = (res.data.list || res.data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        subject: item.subject || item.category_name || '未分类',
        subjectType: SUBJECT_TYPE_MAP[item.subject || item.category_name] || 'default',
        cardCount: item.card_count || 0,
        favorites: item.favorite_count || 0,
        isFavorited: Boolean(item.is_favorited),
        createdAt: item.created_at || item.createdAt || new Date().toISOString()
      }))
      
      allLibraries.value = libs
      sortLibraries(currentSort.value)
    }
  } catch (error) {
    console.error('加载知识库失败:', error)
  }
}

const sortLibraries = (sortType: string) => {
  const all = [...allLibraries.value]
  
  if (sortType === 'hot') {
    all.sort((a, b) => (b.favorites || 0) - (a.favorites || 0))
  } else if (sortType === 'new') {
    all.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime()
      const timeB = new Date(b.createdAt).getTime()
      return timeB - timeA
    })
  }
  
  libraries.value = all
}

const onSearchConfirm = () => {
  if (!searchValue.value.trim()) {
    MessagePlugin.warning('请输入搜索关键词')
    return
  }
  router.push({ path: '/home/search', query: { keyword: searchValue.value } })
}

const clearSearch = () => {
  searchValue.value = ''
}

const onSortChange = (sort: string) => {
  currentSort.value = sort
  sortLibraries(sort)
}

const onCardTap = (card: HotCard, index: number) => {
  sessionStorage.setItem('hotCardsData', JSON.stringify({
    cardList: hotCards.value.map(item => ({
      id: item.id,
      question: item.question,
      answer: item.answer,
      tags: item.tags,
      learned: item.learned || false
    })),
    libraryId: 'hot_cards',
    libraryName: '热门卡片'
  }))
  
  router.push({
    path: '/card/study',
    query: { cardId: card.id, libraryId: 'hot_cards', index }
  })
}

const onLibraryTap = (library: Library) => {
  router.push({
    path: `/library/${library.id}`,
    query: { name: library.name }
  })
}

const goToMoreCards = () => {
  router.push('/home/hotCards')
}

const onLikeCard = async (card: HotCard, index: number) => {
  if (!isLoggedIn()) {
    MessagePlugin.warning('请先登录后再进行点赞操作')
    return
  }

  try {
    let res
    if (card.liked) {
      res = await cardAPI.unlike(card.id)
    } else {
      res = await cardAPI.like(card.id)
    }

    if (res.success) {
      hotCards.value[index].liked = Boolean(res.data.isLiked)
      hotCards.value[index].likes = res.data.likeCount
      MessagePlugin.success(res.data.isLiked ? '点赞成功' : '已取消点赞')
    }
  } catch (error: any) {
    MessagePlugin.error(error.message || '操作失败')
  }
}

const onFavoriteLibrary = async (library: Library, index: number) => {
  if (!isLoggedIn()) {
    MessagePlugin.warning('请先登录后再进行收藏操作')
    return
  }

  try {
    const res = await libraryAPI.toggleFavorite(library.id)
    
    if (res.success) {
      const isFavorited = Boolean(res.data.isFavorited)
      const favoriteCount = res.data.favoriteCount

      libraries.value[index].isFavorited = isFavorited
      libraries.value[index].favorites = favoriteCount

      const allIndex = allLibraries.value.findIndex(item => item.id === library.id)
      if (allIndex !== -1) {
        allLibraries.value[allIndex].isFavorited = isFavorited
        allLibraries.value[allIndex].favorites = favoriteCount
      }

      MessagePlugin.success(isFavorited ? '收藏成功' : '已取消收藏')
    }
  } catch (error: any) {
    MessagePlugin.error(error.message || '操作失败')
  }
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #FFFFFF;
  padding-bottom: calc(70px + env(safe-area-inset-bottom, 0px));
}

.search-section {
  padding: 12px 14px 0;
}

.search-box {
  display: flex;
  align-items: center;
  background-color: #F8FAFC;
  border-radius: 24px;
  padding: 10px 14px;
  gap: 8px;
  border: 1px solid #E2E8F0;
  transition: all 0.3s ease;
  
  &:focus-within {
    border-color: #60A5FA;
    background-color: #FFFFFF;
    box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.15);
  }
}

.search-input {
  flex: 1;
  font-size: 14px;
  color: #1E293B;
  height: 24px;
  background: transparent;
  
  &::placeholder {
    color: #94A3B8;
  }
}

.section {
  margin-top: 16px;
  padding: 0 14px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-bar {
  width: 3px;
  height: 16px;
  border-radius: 1.5px;
  background: linear-gradient(180deg, #3B82F6 0%, #60A5FA 100%);
}

.section-title {
  font-size: 17px;
  font-weight: 700;
  color: #1E293B;
  letter-spacing: 0.25px;
}

.more-link {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #3B82F6;
  gap: 2px;
  padding: 4px 8px;
  background: rgba(59, 130, 246, 0.06);
  border-radius: 10px;
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:active {
    background: rgba(59, 130, 246, 0.12);
  }
}

.filter-tabs {
  margin-bottom: 12px;
}

.filter-tabs-inner {
  display: flex;
  gap: 10px;
}

.filter-tab {
  font-size: 12px;
  font-weight: 400;
  color: #64748B;
  padding: 5px 12px;
  border-radius: 8px;
  background-color: #F8FAFC;
  border: 1px solid #E2E8F0;
  transition: all 0.25s ease;
  cursor: pointer;
  
  &.active {
    color: #fff;
    background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
    border-color: transparent;
    font-weight: 550;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
  }
}

.hot-cards-scroll {
  overflow-x: auto;
  margin: 0 -14px;
  padding: 0 14px;
  -webkit-overflow-scrolling: touch;
  
  &::-webkit-scrollbar {
    display: none;
  }
}

.hot-cards-list {
  display: flex;
  gap: 10px;
  padding: 4px 0;
}

.hot-card {
  display: inline-flex;
  flex-direction: column;
  justify-content: space-between;
  width: 120px;
  height: 120px;
  background: linear-gradient(145deg, #FFFFFF 0%, #F8FAFF 100%);
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 12px rgba(59, 130, 246, 0.06);
  border: 1px solid #E2E8F0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  
  &::before {
    content: '';
    position: absolute;
    bottom: 10px;
    left: 8px;
    width: 4px;
    height: 4px;
    background: rgba(59, 130, 246, 0.25);
    border-radius: 50%;
    pointer-events: none;
    box-shadow: 
      8px 0 0 rgba(59, 130, 246, 0.35),
      16px 0 0 rgba(59, 130, 246, 0.2),
      0 -8px 0 rgba(59, 130, 246, 0.2),
      8px -8px 0 rgba(59, 130, 246, 0.3),
      16px -8px 0 rgba(59, 130, 246, 0.15),
      0 -16px 0 rgba(59, 130, 246, 0.15),
      8px -16px 0 rgba(59, 130, 246, 0.2),
      16px -16px 0 rgba(59, 130, 246, 0.1);
  }
  
  &:active {
    transform: scale(0.97);
    box-shadow: 0 1px 6px rgba(59, 130, 246, 0.1);
    
    &::before {
      background: rgba(59, 130, 246, 0.45);
      box-shadow: 
        8px 0 0 rgba(59, 130, 246, 0.55),
        16px 0 0 rgba(59, 130, 246, 0.4),
        0 -8px 0 rgba(59, 130, 246, 0.4),
        8px -8px 0 rgba(59, 130, 246, 0.5),
        16px -8px 0 rgba(59, 130, 246, 0.35),
        0 -16px 0 rgba(59, 130, 246, 0.35),
        8px -16px 0 rgba(59, 130, 246, 0.4),
        16px -16px 0 rgba(59, 130, 246, 0.3);
    }
  }
}

.hot-card-rank {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 22px;
  height: 22px;
  background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(245, 158, 11, 0.3);
  
  span {
    font-size: 12px;
    font-weight: 700;
    color: #fff;
  }
}

.hot-card-content {
  flex: 1;
  padding-top: 4px;
}

.hot-card-title {
  font-size: 14px;
  font-weight: 600;
  color: #1E293B;
  line-height: 1.5;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  white-space: normal;
  padding-right: 25px;
}

.hot-card-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.hot-card-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 6px;
}

.like-count {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #94A3B8;
  padding: 5px 9px;
  border-radius: 12px;
  background: rgba(148, 163, 184, 0.08);
  transition: all 0.25s ease;
  
  &.liked {
    color: #3B82F6;
    background: rgba(59, 130, 246, 0.08);
  }
  
  &:active {
    transform: scale(0.92);
  }
}

.library-section {
  padding-bottom: 12px;
}

.library-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.library-card {
  width: 100%;
  box-sizing: border-box;
  background-color: #FFFFFF;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 12px rgba(59, 130, 246, 0.05);
  border: 1px solid #E2E8F0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  
  &:active {
    transform: scale(0.98);
    box-shadow: 0 1px 6px rgba(59, 130, 246, 0.08);
  }
}

.library-card-left {
  flex-shrink: 0;
}

.library-cover {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.cover-bg {
  position: absolute;
  inset: 0;
  
  &.cover-civil {
    background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  }
  
  &.cover-criminal {
    background: linear-gradient(135deg, #EF4444 0%, #F87171 100%);
  }
  
  &.cover-constitution {
    background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%);
  }
  
  &.cover-admin {
    background: linear-gradient(135deg, #10B981 0%, #34D399 100%);
  }
  
  &.cover-default {
    background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  }
}

.cover-icon {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.library-card-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.library-name {
  font-size: 15px;
  font-weight: 600;
  color: #1E293B;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.library-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-tag {
  font-size: 11px;
  padding: 3px 7px;
  border-radius: 4px;
  font-weight: 500;
  
  &.meta-civil {
    color: #3B82F6;
    background: rgba(59, 130, 246, 0.08);
  }
  
  &.meta-criminal {
    color: #EF4444;
    background: rgba(239, 68, 68, 0.08);
  }
  
  &.meta-constitution {
    color: #8B5CF6;
    background: rgba(139, 92, 246, 0.08);
  }
  
  &.meta-admin {
    color: #10B981;
    background: rgba(16, 185, 129, 0.08);
  }
  
  &.meta-default {
    color: #3B82F6;
    background: rgba(59, 130, 246, 0.08);
  }
}

.meta-dot {
  color: #CBD5E1;
  font-size: 10px;
}

.meta-text {
  font-size: 12px;
  color: #64748B;
}

.library-card-right {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0px;
  flex-shrink: 0;
  margin-right: 4px;
  margin-top: -4px;
}

.fav-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  transition: all 0.25s ease;
  cursor: pointer;
  
  &.favorited {
    background: transparent;
  }
  
  &:active {
    transform: scale(0.9);
  }
}

.fav-count {
  font-size: 11px;
  color: #94A3B8;
  margin-top: -4px;
}

.bottom-placeholder {
  height: 24px;
}
</style>

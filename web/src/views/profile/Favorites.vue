<template>
  <div class="container">
    <div class="custom-nav">
      <div class="nav-content">
        <div class="nav-left">
          <div class="back-btn" @click="router.back()">
            <t-icon name="chevron-left" size="20px" color="#333" />
          </div>
        </div>
        <div class="nav-title">我的收藏</div>
        <div class="nav-right"></div>
      </div>
    </div>

    <div class="header">
      <div class="tabs">
        <div 
          class="tab" 
          :class="{ active: type === 'card' }" 
          @click="onTypeChange('card')"
        >卡片</div>
        <div 
          class="tab" 
          :class="{ active: type === 'library' }" 
          @click="onTypeChange('library')"
        >知识库</div>
      </div>
    </div>

    <div class="loading" v-if="loading">
      <t-icon name="loading" size="20px" color="#3B82F6" />
      <span>加载中...</span>
    </div>

    <div class="list" v-else-if="favorites.length > 0">
      <div 
        class="item" 
        :class="{ pressed: item.pressed }"
        v-for="(item, index) in favorites" 
        :key="item.id"
        @click="onItemTap(item)"
        @mousedown="onItemTouchStart(index)"
        @mouseup="onItemTouchEnd(index)"
        @mouseleave="onItemTouchEnd(index)"
      >
        <div class="item-content">
          <div class="item-icon">
            <t-icon :name="item.type === 'library' ? 'folder' : 'file'" size="24px" color="#3B82F6" />
          </div>
          <div class="item-info">
            <span class="item-name">{{ item.name }}</span>
            <span class="item-time">{{ item.time }} 收藏</span>
          </div>
        </div>
        <div class="item-action" @click.stop="onRemoveFavorite(index)">
          <t-icon name="close" size="18px" color="#999" />
        </div>
      </div>
    </div>

    <div class="empty" v-else>
      <t-icon name="star" size="48px" color="#ccc" />
      <span>暂无收藏</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next'
import { favoriteAPI } from '@/utils/api'

const router = useRouter()

interface Favorite {
  id: number
  name: string
  type: string
  time: string
  pressed: boolean
}

const favorites = ref<Favorite[]>([])
const loading = ref(true)
const type = ref('card')

onMounted(() => {
  loadFavorites()
})

const loadFavorites = async () => {
  loading.value = true
  try {
    const res = await favoriteAPI.getList({ type: type.value, page: 1, pageSize: 100 })
    if (res.success && res.data) {
      favorites.value = (res.data.list || []).map((item: any) => ({
        id: item.target_id,
        name: item.target_name,
        type: item.target_type,
        time: formatTime(item.created_at),
        pressed: false
      }))
    }
  } catch (error) {
    console.error('加载收藏失败:', error)
    MessagePlugin.error('加载失败')
  } finally {
    loading.value = false
  }
}

const formatTime = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const onTypeChange = (newType: string) => {
  type.value = newType
  loadFavorites()
}

const onItemTouchStart = (index: number) => {
  if (favorites.value[index]) {
    favorites.value[index].pressed = true
  }
}

const onItemTouchEnd = (index: number) => {
  if (favorites.value[index]) {
    favorites.value[index].pressed = false
  }
}

const onItemTap = (item: Favorite) => {
  if (item.type === 'library') {
    router.push({
      path: '/library/detail',
      query: {
        id: item.id,
        name: item.name
      }
    })
  } else if (item.type === 'card') {
    router.push({
      path: '/card/study',
      query: {
        cardId: item.id,
        libraryId: 'hot_cards',
        index: 0
      }
    })
  }
}

const onRemoveFavorite = (index: number) => {
  const item = favorites.value[index]
  
  const confirmDialog = DialogPlugin.confirm({
    header: '提示',
    body: '确定取消收藏吗？',
    onConfirm: async () => {
      try {
        await favoriteAPI.remove(item.type, item.id)
        favorites.value = favorites.value.filter((_, i) => i !== index)
        MessagePlugin.success('已取消收藏')
      } catch (error: any) {
        console.error('取消收藏失败:', error)
        MessagePlugin.error(error.message || '操作失败')
      }
      confirmDialog.hide()
    }
  })
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #f5f6fa;
  padding-top: 44px;
  padding-bottom: env(safe-area-inset-bottom);
}

.custom-nav {
  background: #fff;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
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

.header {
  background-color: #fff;
  padding: 12px 16px;
  position: sticky;
  top: 44px;
  z-index: 10;
}

.tabs {
  display: flex;
  background-color: #f5f6fa;
  border-radius: 20px;
  padding: 3px;
}

.tab {
  flex: 1;
  text-align: center;
  padding: 8px 0;
  font-size: 14px;
  color: #666;
  border-radius: 18px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.tab.active {
  background-color: #3B82F6;
  color: #fff;
  font-weight: 600;
}

.list {
  padding: 12px;
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #fff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.item.pressed {
  background-color: #f5f6fa;
  transform: scale(0.98);
}

.item-content {
  display: flex;
  align-items: center;
  flex: 1;
}

.item-icon {
  width: 40px;
  height: 40px;
  background-color: rgba(59, 130, 246, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
}

.item-info {
  flex: 1;
}

.item-name {
  display: block;
  font-size: 15px;
  color: #333;
  font-weight: 500;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-time {
  font-size: 12px;
  color: #999;
}

.item-action {
  padding: 8px;
  cursor: pointer;
  
  &:active {
    opacity: 0.7;
  }
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #999;
}

.empty span {
  margin-top: 12px;
  font-size: 14px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #999;
}

.loading span {
  margin-top: 12px;
  font-size: 14px;
}
</style>

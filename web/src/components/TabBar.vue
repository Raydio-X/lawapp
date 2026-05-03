<template>
  <div class="tab-bar">
    <div 
      v-for="(item, index) in tabList" 
      :key="item.path"
      class="tab-bar-item"
      :class="{ active: currentPath === item.path }"
      @click="switchTab(item)"
    >
      <div class="icon-wrapper">
        <img 
          class="tab-icon" 
          :src="currentPath === item.path ? item.selectedIcon : item.icon" 
          :alt="item.text"
        />
        <div 
          v-if="item.path === '/profile' && messageStore.unreadCount > 0" 
          class="unread-dot"
        >
          <span v-if="messageStore.unreadCount <= 99">{{ messageStore.unreadCount }}</span>
          <span v-else>99+</span>
        </div>
      </div>
      <span class="tab-text">{{ item.text }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMessageStore } from '@/stores/message'

interface TabItem {
  path: string
  text: string
  icon: string
  selectedIcon: string
}

const router = useRouter()
const route = useRoute()
const messageStore = useMessageStore()

const tabList: TabItem[] = [
  {
    path: '/home',
    text: '社区',
    icon: '/assets/images/tabbar/home.png',
    selectedIcon: '/assets/images/tabbar/home-active.png'
  },
  {
    path: '/study',
    text: '学习',
    icon: '/assets/images/tabbar/study.png',
    selectedIcon: '/assets/images/tabbar/study-active.png'
  },
  {
    path: '/create',
    text: '创作',
    icon: '/assets/images/tabbar/create.png',
    selectedIcon: '/assets/images/tabbar/create-active.png'
  },
  {
    path: '/profile',
    text: '我的',
    icon: '/assets/images/tabbar/profile.png',
    selectedIcon: '/assets/images/tabbar/profile-active.png'
  }
]

const currentPath = computed(() => route.path)

const switchTab = (item: TabItem) => {
  if (currentPath.value !== item.path) {
    router.push(item.path)
  }
}

onMounted(() => {
  messageStore.startSync()
  document.addEventListener('visibilitychange', messageStore.handleVisibilityChange)
})

onUnmounted(() => {
  messageStore.stopSync()
  document.removeEventListener('visibilitychange', messageStore.handleVisibilityChange)
})
</script>

<style lang="scss" scoped>
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50px;
  background: #ffffff;
  display: flex;
  border-top: 1px solid #eee;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  z-index: 9999;
}

.tab-bar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px 0;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:active {
    opacity: 0.7;
  }
}

.icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab-icon {
  width: 24px;
  height: 24px;
  margin-bottom: 2px;
}

.unread-dot {
  position: absolute;
  top: -6px;
  right: -12px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: #E34D59;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  span {
    font-size: 10px;
    color: #fff;
    font-weight: 500;
    transform: scale(0.9);
  }
}

.tab-text {
  font-size: 11px;
  color: #999999;
  transition: color 0.2s ease;
}

.tab-bar-item.active .tab-text {
  color: #3B82F6;
}
</style>

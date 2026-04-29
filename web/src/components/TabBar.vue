<template>
  <div class="tab-bar">
    <div 
      v-for="(item, index) in tabList" 
      :key="item.path"
      class="tab-bar-item"
      :class="{ active: currentPath === item.path }"
      @click="switchTab(item)"
    >
      <img 
        class="tab-icon" 
        :src="currentPath === item.path ? item.selectedIcon : item.icon" 
        :alt="item.text"
      />
      <span class="tab-text">{{ item.text }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

interface TabItem {
  path: string
  text: string
  icon: string
  selectedIcon: string
}

const router = useRouter()
const route = useRoute()

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

.tab-icon {
  width: 24px;
  height: 24px;
  margin-bottom: 2px;
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

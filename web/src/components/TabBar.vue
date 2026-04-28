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
    icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzk5OTk5OSI+PHBhdGggZD0iTTEwIDJ2Mkg3djJIMXYxOGgyMlY2aC02VjRoLTNWMmgtNHptMCAyaDJ2MmgtMlY0em0tMyAyaDN2MmgzMlY2aDE0djE0SDNWNnptNSA0djJoMlYxMEg4em0tNCAwdjJoMlYxMEg0em0wIDR2MmgyVjE0SDR6bTQgMHYyaDJWMTRIOHptNCAwdjJoMlYxNEgxMnoiLz48L3N2Zz4=',
    selectedIcon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzNCODJGNiI+PHBhdGggZD0iTTEwIDJ2Mkg3djJIMXYxOGgyMlY2aC02VjRoLTNWMmgtNHptMCAyaDJ2MmgtMlY0em0tMyAyaDN2MmgzMlY2aDE0djE0SDNWNnptNSA0djJoMlYxMEg4em0tNCAwdjJoMlYxMEg0em0wIDR2MmgyVjE0SDR6bTQgMHYyaDJWMTRIOHptNCAwdjJoMlYxNEgxMnoiLz48L3N2Zz4='
  },
  {
    path: '/study',
    text: '学习',
    icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzk5OTk5OSI+PHBhdGggZD0iTTEyIDNMMCA5djZsMTIgNiAxMi02VjlsLTEyLTZ6bTAgMmwxMCA1LTEwIDUtMTAtNSAxMC01ek0yIDEwLjVsNCAydjRsLTQtMnYtNHptMjAgMHY0bC00IDJ2LTRsNC0yek02IDE2LjVsNiAzIDYtM3Y0bC02IDMtNi0zdi00eiIvPjwvc3ZnPg==',
    selectedIcon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzNCODJGNiI+PHBhdGggZD0iTTEyIDNMMCA5djZsMTIgNiAxMi02VjlsLTEyLTZ6bTAgMmwxMCA1LTEwIDUtMTAtNSAxMC01ek0yIDEwLjVsNCAydjRsLTQtMnYtNHptMjAgMHY0bC00IDJ2LTRsNC0yek02IDE2LjVsNiAzIDYtM3Y0bC02IDMtNi0zdi00eiIvPjwvc3ZnPg=='
  },
  {
    path: '/create',
    text: '创作',
    icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzk5OTk5OSI+PHBhdGggZD0iTTE5IDEzaC02djZoLTJ2LTZINXYtMmg2VjVoMnY2aDZ2MnoiLz48L3N2Zz4=',
    selectedIcon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzNCODJGNiI+PHBhdGggZD0iTTE5IDEzaC02djZoLTJ2LTZINXYtMmg2VjVoMnY2aDZ2MnoiLz48L3N2Zz4='
  },
  {
    path: '/profile',
    text: '我的',
    icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzk5OTk5OSI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgM2MxLjY2IDAgMyAxLjM0IDMgM3MtMS4zNCAzLTMgMy0zLTEuMzQtMy0zIDEuMzQtMyAzLTN6bTAgMTQuMmMtMi41IDAtNC43MS0xLjI4LTYtMy4yMi4wMy0xLjk5IDQtMy4wOCA2LTMuMDggMS45OSAwIDUuOTcgMS4wOSA2IDMuMDgtMS4yOSAxLjk0LTMuNSAzLjIyLTYgMy4yMnoiLz48L3N2Zz4=',
    selectedIcon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzNCODJGNiI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgM2MxLjY2IDAgMyAxLjM0IDMgM3MtMS4zNCAzLTMgMy0zLTEuMzQtMy0zIDEuMzQtMyAzLTN6bTAgMTQuMmMtMi41IDAtNC43MS0xLjI4LTYtMy4yMi4wMy0xLjk5IDQtMy4wOCA2LTMuMDggMS45OSAwIDUuOTcgMS4wOSA2IDMuMDgtMS4yOSAxLjk0LTMuNSAzLjIyLTYgMy4yMnoiLz48L3N2Zz4='
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

<template>
  <router-view v-slot="{ Component, route }">
    <keep-alive :include="['Admin']">
      <component :is="Component" :key="route.fullPath" />
    </keep-alive>
  </router-view>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { activationAPI } from '@/utils/api'

onMounted(async () => {
  const userStore = useUserStore()
  
  if (userStore.isLoggedIn && !userStore.isGuest) {
    try {
      const res = await activationAPI.getStatus()
      if (res.success && res.data) {
        userStore.setVipStatus({
          isVip: res.data.is_vip || res.data.isVip || false,
          vipExpireAt: res.data.vip_expires_at || res.data.vipExpireAt || null
        })
      }
    } catch (error) {
      console.error('初始化VIP状态失败:', error)
    }
  }
})
</script>

<style>
#app {
  width: 100%;
  min-height: 100vh;
}
</style>

<template>
  <router-view v-slot="{ Component, route }">
    <keep-alive :include="['Admin', 'LibraryDetail']">
      <component :is="Component" :key="route.fullPath" />
    </keep-alive>
  </router-view>

  <!-- 版本更新弹窗 -->
  <UpdateDialog
    :visible="showUpdateDialog"
    :latest-version="latestVersion"
    :force-update="forceUpdate"
    @close="closeUpdateDialog"
    @update="handleUpdate"
  />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Capacitor } from '@capacitor/core'
import { useUserStore } from '@/stores/user'
import { activationAPI } from '@/utils/api'
import { checkUpdate, VersionInfo } from '@/utils/versionService'
import UpdateDialog from '@/components/UpdateDialog.vue'

const showUpdateDialog = ref(false)
const latestVersion = ref<VersionInfo | null>(null)
const forceUpdate = ref(false)

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

  // 仅在 Android 原生平台检查应用更新
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
    checkAppUpdate()
  }
})

/**
 * 检查应用更新
 */
async function checkAppUpdate() {
  try {
    const result = await checkUpdate()
    
    if (result && result.needUpdate && result.latestVersion) {
      latestVersion.value = result.latestVersion
      forceUpdate.value = result.latestVersion.forceUpdate
      showUpdateDialog.value = true
      
      console.log('[App] 发现新版本:', result.latestVersion.versionName, '强制更新:', forceUpdate.value)
    }
  } catch (error) {
    console.error('[App] 检查更新失败:', error)
  }
}

/**
 * 关闭更新弹窗
 */
function closeUpdateDialog() {
  if (!forceUpdate.value) {
    showUpdateDialog.value = false
  }
}

/**
 * 处理更新
 */
function handleUpdate() {
  // 更新逻辑在 UpdateDialog 组件中处理
}
</script>

<style>
#app {
  width: 100%;
  min-height: 100vh;
}
</style>

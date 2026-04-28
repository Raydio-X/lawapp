<template>
  <div class="tab-bar-layout">
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <keep-alive :include="['Home', 'Study', 'Profile']">
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </main>
    <TabBar />
  </div>
</template>

<script setup lang="ts">
import TabBar from '@/components/TabBar.vue'
</script>

<style lang="scss" scoped>
.tab-bar-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  padding-bottom: calc(50px + env(safe-area-inset-bottom, 0px));
}
</style>

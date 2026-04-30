<template>
  <router-view v-slot="{ Component, route }">
    <keep-alive :include="['Admin']">
      <component :is="Component" :key="route.fullPath" />
    </keep-alive>
  </router-view>
</template>

<script setup lang="ts">
</script>

<style>
#app {
  width: 100%;
  min-height: 100vh;
}
</style>

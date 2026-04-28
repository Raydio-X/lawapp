<template>
  <div class="empty-state">
    <div class="empty-icon">
      <t-icon :name="icon" size="48px" :style="{ color: iconColor }" />
    </div>
    <p class="empty-text">{{ description }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  icon?: string
  description?: string
}>()

const icon = computed(() => props.icon || 'folder-open')
const iconColor = computed(() => '#BFDBFE')
const description = computed(() => props.description || '暂无数据')
</script>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.empty-icon {
  opacity: 0.6;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 14px;
  color: #94A3B8;
}
</style>

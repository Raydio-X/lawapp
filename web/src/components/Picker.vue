<template>
  <div class="picker-wrapper">
    <div 
      class="popup-overlay" 
      v-show="visible" 
      @click.self="onOverlayClick"
      @touchmove.stop.prevent
    ></div>
    <div 
      class="popup-content" 
      v-show="visible"
      @click.stop
      @touchmove.stop
    >
      <div class="picker-container">
        <div class="picker-header">
          <button type="button" class="picker-cancel" @click="onCancel">取消</button>
          <div class="picker-title">{{ title }}</div>
          <button type="button" class="picker-confirm" @click="onConfirm">确定</button>
        </div>
        <div class="picker-body" @touchmove.stop>
          <div class="picker-column" ref="columnRef">
            <div class="picker-item placeholder"></div>
            <div class="picker-item placeholder"></div>
            <div 
              class="picker-item" 
              v-for="(option, index) in options" 
              :key="option.value"
              :class="{ selected: currentIndex === index }"
              @click="onSelect(index)"
            >
              {{ option.label }}
            </div>
            <div class="picker-item placeholder"></div>
            <div class="picker-item placeholder"></div>
          </div>
          <div class="picker-indicator"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'

interface Option {
  label: string
  value: string | number
}

const props = defineProps<{
  visible: boolean
  title: string
  options: Option[]
  value?: (string | number)[]
}>()

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void
  (e: 'confirm', value: (string | number)[]): void
  (e: 'cancel'): void
}>()

const columnRef = ref<HTMLElement | null>(null)
const currentIndex = ref(0)
const itemHeight = 44
let savedScrollTop = 0

const lockBodyScroll = () => {
  savedScrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
  document.body.style.position = 'fixed'
  document.body.style.top = `-${savedScrollTop}px`
  document.body.style.width = '100%'
  document.body.style.overflow = 'hidden'
}

const unlockBodyScroll = () => {
  document.body.style.position = ''
  document.body.style.top = ''
  document.body.style.width = ''
  document.body.style.overflow = ''
  window.scrollTo(0, savedScrollTop)
}

const initSelectedIndex = () => {
  if (props.value && props.value.length > 0) {
    const val = props.value[0]
    const index = props.options.findIndex(opt => opt.value === val)
    currentIndex.value = index >= 0 ? index : 0
  } else if (props.options.length > 0) {
    currentIndex.value = 0
  }
}

const scrollToSelected = () => {
  if (!columnRef.value) return
  const scrollTop = currentIndex.value * itemHeight
  columnRef.value.scrollTop = scrollTop
}

const onSelect = (index: number) => {
  currentIndex.value = index
  if (columnRef.value) {
    columnRef.value.scrollTop = index * itemHeight
  }
}

const onConfirm = () => {
  const option = props.options[currentIndex.value]
  if (option) {
    emit('confirm', [option.value])
  }
  emit('update:visible', false)
}

const onCancel = () => {
  emit('cancel')
  emit('update:visible', false)
}

const onOverlayClick = () => {
  emit('update:visible', false)
}

const onTouchMove = (e: TouchEvent) => {
  e.stopPropagation()
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    lockBodyScroll()
    initSelectedIndex()
    nextTick(() => {
      scrollToSelected()
    })
  } else {
    unlockBodyScroll()
  }
})

watch(() => props.value, () => {
  initSelectedIndex()
}, { immediate: true })

watch(() => props.options, () => {
  initSelectedIndex()
}, { immediate: true })

onMounted(() => {
  initSelectedIndex()
})

onUnmounted(() => {
  unlockBodyScroll()
})
</script>

<style lang="scss" scoped>
.picker-wrapper {
  position: relative;
}

.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  touch-action: none;
}

.popup-content {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10000;
  display: flex;
  align-items: flex-end;
  touch-action: pan-y;
}

.picker-container {
  width: 100%;
  background: #fff;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
  border-radius: 16px 16px 0 0;
  flex-shrink: 0;
}

.picker-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.picker-cancel,
.picker-confirm {
  font-size: 15px;
  cursor: pointer;
  padding: 8px 12px;
  border: none;
  background: transparent;
  outline: none;
  
  &:active {
    opacity: 0.7;
  }
}

.picker-cancel {
  color: #999;
}

.picker-confirm {
  color: #3B82F6;
  font-weight: 500;
}

.picker-body {
  position: relative;
  height: 220px;
  overflow: hidden;
  background: #fff;
  touch-action: pan-y;
  overscroll-behavior: contain;
}

.picker-column {
  height: 100%;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  padding: 0;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  
  &::-webkit-scrollbar {
    display: none;
  }
}

.picker-item {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #333;
  scroll-snap-align: center;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  touch-action: manipulation;
  
  &.placeholder {
    cursor: default;
    visibility: hidden;
    pointer-events: none;
  }
  
  &.selected {
    color: #3B82F6;
    font-weight: 600;
  }
  
  &:active {
    background: #f5f5f5;
  }
}

.picker-indicator {
  position: absolute;
  top: 50%;
  left: 16px;
  right: 16px;
  height: 44px;
  transform: translateY(-50%);
  border-top: 1px solid #e8ecf0;
  border-bottom: 1px solid #e8ecf0;
  background: rgba(59, 130, 246, 0.05);
  pointer-events: none;
  border-radius: 8px;
}
</style>

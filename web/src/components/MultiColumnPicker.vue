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
          <div class="picker-columns">
            <div class="picker-column" 
              v-for="(column, colIndex) in columns" 
              :key="colIndex"
              :ref="el => columnRefs[colIndex] = el as HTMLElement"
              @scroll="onScroll(colIndex)"
            >
              <div class="picker-item placeholder"></div>
              <div class="picker-item placeholder"></div>
              <div 
                class="picker-item" 
                v-for="(option, index) in column" 
                :key="option.value"
                :class="{ selected: selectedIndices[colIndex] === index }"
                @click="onSelect(colIndex, index)"
              >
                {{ option.label }}
              </div>
              <div class="picker-item placeholder"></div>
              <div class="picker-item placeholder"></div>
            </div>
          </div>
          <div class="picker-indicator"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted, computed } from 'vue'

interface Option {
  label: string
  value: string | number
  children?: Option[]
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

const columnRefs = ref<(HTMLElement | null)[]>([])
const selectedIndices = ref<number[]>([0, 0, 0])
const itemHeight = 44
let savedScrollTop = 0
const scrollTimeouts: (ReturnType<typeof setTimeout> | null)[] = [null, null, null]

// 计算三列数据
const columns = computed(() => {
  const result: Option[][] = [[], [], []]
  
  // 第一列：一级章节
  result[0] = props.options.map(opt => ({
    label: opt.label,
    value: opt.value
  }))
  
  // 确保第一列索引在范围内
  if (selectedIndices.value[0] >= result[0].length) {
    selectedIndices.value[0] = 0
  }
  
  // 第二列：二级章节（根据第一列选择）
  const level1Index = selectedIndices.value[0]
  const level1Option = props.options[level1Index]
  if (level1Option && level1Option.children && level1Option.children.length > 0) {
    result[1] = level1Option.children.map(opt => ({
      label: opt.label,
      value: opt.value
    }))
    // 确保第二列索引在范围内
    if (selectedIndices.value[1] >= result[1].length) {
      selectedIndices.value[1] = 0
    }
  } else {
    result[1] = [{ label: '无', value: 0 }]
    selectedIndices.value[1] = 0
  }
  
  // 第三列：三级章节（根据第二列选择）
  const level2Index = selectedIndices.value[1]
  if (level1Option && level1Option.children && level1Option.children.length > 0) {
    const level2Option = level1Option.children[level2Index]
    if (level2Option && level2Option.children && level2Option.children.length > 0) {
      result[2] = level2Option.children.map(opt => ({
        label: opt.label,
        value: opt.value
      }))
      // 确保第三列索引在范围内
      if (selectedIndices.value[2] >= result[2].length) {
        selectedIndices.value[2] = 0
      }
    } else {
      result[2] = [{ label: '无', value: 0 }]
      selectedIndices.value[2] = 0
    }
  } else {
    result[2] = [{ label: '无', value: 0 }]
    selectedIndices.value[2] = 0
  }
  
  return result
})

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

const initSelectedIndices = () => {
  if (props.value && props.value.length > 0) {
    // 根据value找到对应的索引
    const targetValue = props.value[0]
    
    for (let i = 0; i < props.options.length; i++) {
      const level1 = props.options[i]
      
      // 检查一级
      if (level1.value === targetValue) {
        selectedIndices.value = [i, 0, 0]
        return
      }
      
      // 检查二级
      if (level1.children) {
        for (let j = 0; j < level1.children.length; j++) {
          const level2 = level1.children[j]
          if (level2.value === targetValue) {
            selectedIndices.value = [i, j, 0]
            return
          }
          
          // 检查三级
          if (level2.children) {
            for (let k = 0; k < level2.children.length; k++) {
              const level3 = level2.children[k]
              if (level3.value === targetValue) {
                selectedIndices.value = [i, j, k]
                return
              }
            }
          }
        }
      }
    }
  }
  
  // 默认选择第一项
  selectedIndices.value = [0, 0, 0]
}

const scrollToSelected = () => {
  columnRefs.value.forEach((ref, index) => {
    if (ref) {
      const scrollTop = selectedIndices.value[index] * itemHeight
      ref.scrollTop = scrollTop
    }
  })
}

// 滚动时更新选中项
const onScroll = (colIndex: number) => {
  const ref = columnRefs.value[colIndex]
  if (!ref) return
  
  // 清除之前的定时器
  if (scrollTimeouts[colIndex]) {
    clearTimeout(scrollTimeouts[colIndex]!)
  }
  
  // 使用防抖，滚动结束后更新
  scrollTimeouts[colIndex] = setTimeout(() => {
    const scrollTop = ref.scrollTop
    const newIndex = Math.round(scrollTop / itemHeight)
    
    if (newIndex !== selectedIndices.value[colIndex] && newIndex >= 0 && newIndex < columns.value[colIndex].length) {
      // 更新选中索引
      if (colIndex === 0) {
        // 第一列变化，重置第二列和第三列
        selectedIndices.value = [newIndex, 0, 0]
      } else if (colIndex === 1) {
        // 第二列变化，重置第三列
        selectedIndices.value = [selectedIndices.value[0], newIndex, 0]
      } else {
        // 第三列变化
        selectedIndices.value[2] = newIndex
      }
      
      // 滚动到对齐位置
      nextTick(() => {
        const targetRef = columnRefs.value[colIndex]
        if (targetRef) {
          targetRef.scrollTop = newIndex * itemHeight
        }
        // 如果是第一列或第二列变化，需要重新对齐后面的列
        if (colIndex < 2) {
          for (let i = colIndex + 1; i < 3; i++) {
            const nextRef = columnRefs.value[i]
            if (nextRef) {
              nextRef.scrollTop = 0
            }
          }
        }
      })
    }
  }, 100)
}

const onSelect = (colIndex: number, index: number) => {
  selectedIndices.value[colIndex] = index
  
  // 如果选择的是第一列，重置后面的列
  if (colIndex === 0) {
    selectedIndices.value = [index, 0, 0]
  } else if (colIndex === 1) {
    selectedIndices.value = [selectedIndices.value[0], index, 0]
  }
  
  nextTick(() => {
    scrollToSelected()
  })
}

const onConfirm = () => {
  // 获取选中的值
  const level1Index = selectedIndices.value[0]
  const level2Index = selectedIndices.value[1]
  const level3Index = selectedIndices.value[2]
  
  const level1 = props.options[level1Index]
  let selectedValue: string | number = level1.value
  
  // 优先选择三级，其次二级，最后一级
  if (level1.children && level1.children.length > 0) {
    const level2 = level1.children[level2Index]
    if (level2 && level2.children && level2.children.length > 0 && level2.children[level3Index]) {
      selectedValue = level2.children[level3Index].value
    } else if (level2 && level2.value !== 0) {
      selectedValue = level2.value
    }
  }
  
  emit('confirm', [selectedValue])
  emit('update:visible', false)
}

const onCancel = () => {
  emit('cancel')
  emit('update:visible', false)
}

const onOverlayClick = () => {
  emit('update:visible', false)
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    lockBodyScroll()
    initSelectedIndices()
    nextTick(() => {
      scrollToSelected()
    })
  } else {
    unlockBodyScroll()
    // 清除所有滚动定时器
    scrollTimeouts.forEach(t => {
      if (t) clearTimeout(t)
    })
  }
})

watch(() => props.value, () => {
  initSelectedIndices()
}, { immediate: true })

watch(() => props.options, () => {
  initSelectedIndices()
}, { immediate: true })

onMounted(() => {
  initSelectedIndices()
})

onUnmounted(() => {
  unlockBodyScroll()
  scrollTimeouts.forEach(t => {
    if (t) clearTimeout(t)
  })
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

.picker-columns {
  display: flex;
  height: 100%;
}

.picker-column {
  flex: 1;
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
  font-size: 14px;
  color: #333;
  scroll-snap-align: center;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  touch-action: manipulation;
  padding: 0 4px;
  text-align: center;
  word-break: break-all;
  
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
  left: 8px;
  right: 8px;
  height: 44px;
  transform: translateY(-50%);
  border-top: 1px solid #e8ecf0;
  border-bottom: 1px solid #e8ecf0;
  background: rgba(59, 130, 246, 0.05);
  pointer-events: none;
  border-radius: 8px;
}
</style>
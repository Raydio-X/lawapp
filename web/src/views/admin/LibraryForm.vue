<template>
  <div class="library-form-container">
    <div class="custom-nav">
      <div class="nav-content">
        <div class="nav-back" @click="onCancel">
          <t-icon name="chevron-left" size="20px" color="#333" />
        </div>
        <span class="nav-title">{{ isEdit ? '编辑知识库' : '创建知识库' }}</span>
        <div class="nav-placeholder"></div>
      </div>
    </div>

    <div class="form-section">
      <div class="section-title">基本信息</div>
      
      <div class="form-item">
        <span class="form-label">知识库名称 <span class="required">*</span></span>
        <input 
          class="form-input" 
          placeholder="例如：2024法硕刑法总则" 
          v-model="libraryName"
          maxlength="20"
        />
        <span class="form-count">{{ libraryName.length }}/20</span>
      </div>
    </div>

    <div class="form-section">
      <div class="section-header">
        <span class="section-title">大纲目录</span>
        <span class="section-tip">可选，创建后可在知识库详情页编辑</span>
      </div>

      <div class="outline-container">
        <div class="outline-list" v-if="outline.length > 0">
          <div 
            class="outline-item"
            :class="{ 'sub-item': item.level > 1, dragging: dragIndex === index, 'level-changing': levelChangingIndex === index }"
            :style="{ '--level-offset': (item.level - 1) * 24 + 'px' }"
            v-for="(item, index) in outline" 
            :key="item.id"
            @touchstart="onTouchStart($event, index)"
            @touchmove="onTouchMove($event, index)"
            @touchend="onTouchEnd"
            @mousedown="onMouseDown($event, index)"
          >
            <div class="outline-drag-handle">
              <t-icon name="move" size="16px" color="#ccc" />
            </div>
            <div class="outline-main" :class="'outline-level-' + item.level">
              <div class="outline-level-indicator">
                <span>{{ item.level }}级</span>
              </div>
              <div class="outline-content">
                <input 
                  class="outline-input" 
                  v-model="item.title" 
                  placeholder="输入标题"
                  maxlength="100"
                />
              </div>
            </div>
            <div class="outline-actions">
              <div class="action-btn" @click="onDeleteOutline(index)">
                <t-icon name="close" size="18px" color="#999" />
              </div>
            </div>
            <div class="level-hint" v-if="levelChangingIndex === index">
              <span>{{ levelHintText }}</span>
            </div>
          </div>
        </div>

        <div class="outline-empty" v-else>
          <t-icon name="folder" size="32px" color="#ddd" />
          <span>暂无大纲，点击下方按钮添加</span>
        </div>

        <div class="outline-add-btn" @click="onAddOutline">
          <t-icon name="add" size="18px" color="#3B82F6" />
          <span>添加标题</span>
        </div>
      </div>

      <div class="outline-tips">
        <span>提示：上下拖动可排序，左右拖动可改变层级</span>
      </div>
    </div>

    <div class="bottom-placeholder"></div>

    <div class="bottom-bar">
      <div class="btn-cancel" @click="onCancel">取消</div>
      <div class="btn-submit" :class="{ loading: loading }" @click="onSubmit">
        <span v-if="loading">{{ isEdit ? '保存中...' : '创建中...' }}</span>
        <span v-else>{{ isEdit ? '保存修改' : '创建知识库' }}</span>
      </div>
    </div>
  </div>

  <t-dialog
    v-model:visible="showCancelDialog"
    header="提示"
    :body="isEdit ? '确定要放弃修改吗？未保存的内容将丢失。' : '确定要放弃创建吗？已填写的内容将不会保存。'"
    confirm-btn="确定"
    cancel-btn="取消"
    @confirm="onConfirmCancel"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { adminAPI, libraryAPI, chapterAPI } from '@/utils/api'

interface OutlineItem {
  id: number
  title: string
  level: number
  parentId: number | null
}

const router = useRouter()
const route = useRoute()

const isEdit = computed(() => !!route.query.id)

const libraryName = ref('')
const outline = ref<OutlineItem[]>([])

const showCancelDialog = ref(false)
const loading = ref(false)

const touchStartX = ref(0)
const touchStartY = ref(0)
const touchCurrentX = ref(0)
const isDragging = ref(false)
const dragStartIndex = ref(-1)
const dragIndex = ref(-1)
const levelChangingIndex = ref(-1)
const levelHintText = ref('')

const LEVEL_THRESHOLD = 50

onMounted(() => {
  if (isEdit.value) {
    loadLibraryDetail()
  }
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
})

const loadLibraryDetail = async () => {
  loading.value = true
  try {
    const res = await libraryAPI.getDetail(Number(route.query.id))
    if (res.success && res.data) {
      const library = res.data
      libraryName.value = library.name
      
      const chaptersRes = await chapterAPI.getList(Number(route.query.id))
      if (chaptersRes.success && chaptersRes.data) {
        outline.value = chaptersRes.data.map((ch: any) => ({
          id: ch.id,
          title: ch.name,
          level: ch.level || 1,
          parentId: ch.parent_id
        }))
      }
    }
  } catch (error) {
    console.error('加载知识库详情失败', error)
  } finally {
    loading.value = false
  }
}

const onAddOutline = () => {
  const newId = Date.now()
  outline.value.push({
    id: newId,
    title: '',
    level: 1,
    parentId: null
  })
}

const onDeleteOutline = (index: number) => {
  const item = outline.value[index]
  const toDelete = [index]
  
  for (let i = index + 1; i < outline.value.length; i++) {
    if (outline.value[i].level > item.level) {
      toDelete.push(i)
    } else {
      break
    }
  }

  toDelete.reverse().forEach(i => outline.value.splice(i, 1))
}

const canChangeLevel = (index: number, newLevel: number): boolean => {
  if (newLevel < 1 || newLevel > 3) return false
  
  if (newLevel > 1) {
    if (index === 0) return false
    const prevItem = outline.value[index - 1]
    if (prevItem.level < newLevel - 1) return false
  }
  
  return true
}

const updateItemLevel = (index: number, newLevel: number) => {
  if (!canChangeLevel(index, newLevel)) return
  
  const oldLevel = outline.value[index].level
  outline.value[index].level = newLevel
  
  const levelDiff = newLevel - oldLevel
  for (let i = index + 1; i < outline.value.length; i++) {
    if (outline.value[i].level > oldLevel) {
      const newChildLevel = outline.value[i].level + levelDiff
      if (newChildLevel >= 1 && newChildLevel <= 3) {
        outline.value[i].level = newChildLevel
      }
    } else {
      break
    }
  }
}

const onTouchStart = (e: TouchEvent, index: number) => {
  const touch = e.touches[0]
  touchStartX.value = touch.clientX
  touchStartY.value = touch.clientY
  touchCurrentX.value = touch.clientX
  dragStartIndex.value = index
  isDragging.value = false
}

const onTouchMove = (e: TouchEvent, index: number) => {
  if (dragStartIndex.value !== index) return
  
  const touch = e.touches[0]
  const deltaX = touch.clientX - touchStartX.value
  const deltaY = touch.clientY - touchStartY.value
  
  touchCurrentX.value = touch.clientX
  
  if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
    isDragging.value = true
  }
  
  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > LEVEL_THRESHOLD) {
    e.preventDefault()
    
    const item = outline.value[index]
    const direction = deltaX > 0 ? 1 : -1
    const newLevel = item.level + direction
    
    if (canChangeLevel(index, newLevel)) {
      levelChangingIndex.value = index
      levelHintText.value = newLevel > item.level ? '→ 增加层级' : '← 减少层级'
    } else {
      levelChangingIndex.value = index
      levelHintText.value = '无法调整'
    }
  } else {
    levelChangingIndex.value = -1
  }
}

const onTouchEnd = () => {
  if (levelChangingIndex.value >= 0) {
    const index = levelChangingIndex.value
    const deltaX = touchCurrentX.value - touchStartX.value
    const item = outline.value[index]
    const direction = deltaX > 0 ? 1 : -1
    const newLevel = item.level + direction
    
    if (Math.abs(deltaX) > LEVEL_THRESHOLD && canChangeLevel(index, newLevel)) {
      updateItemLevel(index, newLevel)
    }
  }
  
  levelChangingIndex.value = -1
  dragStartIndex.value = -1
  isDragging.value = false
}

const onMouseDown = (e: MouseEvent, index: number) => {
  if ((e.target as HTMLElement).tagName === 'INPUT') return
  if ((e.target as HTMLElement).closest('.action-btn')) return
  
  touchStartX.value = e.clientX
  touchStartY.value = e.clientY
  touchCurrentX.value = e.clientX
  dragStartIndex.value = index
  isDragging.value = false
  dragIndex.value = index
}

const onMouseMove = (e: MouseEvent) => {
  if (dragStartIndex.value < 0) return
  
  const deltaX = e.clientX - touchStartX.value
  const deltaY = e.clientY - touchStartY.value
  
  touchCurrentX.value = e.clientX
  
  if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
    isDragging.value = true
  }
  
  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > LEVEL_THRESHOLD) {
    const index = dragStartIndex.value
    const item = outline.value[index]
    const direction = deltaX > 0 ? 1 : -1
    const newLevel = item.level + direction
    
    if (canChangeLevel(index, newLevel)) {
      levelChangingIndex.value = index
      levelHintText.value = newLevel > item.level ? '→ 增加层级' : '← 减少层级'
    } else {
      levelChangingIndex.value = index
      levelHintText.value = '无法调整'
    }
  } else {
    levelChangingIndex.value = -1
  }
}

const onMouseUp = () => {
  if (levelChangingIndex.value >= 0) {
    const index = levelChangingIndex.value
    const deltaX = touchCurrentX.value - touchStartX.value
    const item = outline.value[index]
    const direction = deltaX > 0 ? 1 : -1
    const newLevel = item.level + direction
    
    if (Math.abs(deltaX) > LEVEL_THRESHOLD && canChangeLevel(index, newLevel)) {
      updateItemLevel(index, newLevel)
    }
  }
  
  levelChangingIndex.value = -1
  dragStartIndex.value = -1
  dragIndex.value = -1
  isDragging.value = false
}

const onCancel = () => {
  if (libraryName.value || outline.value.some(o => o.title)) {
    showCancelDialog.value = true
  } else {
    router.push('/admin')
  }
}

const onConfirmCancel = () => {
  router.push('/admin')
}

const onSubmit = async () => {
  if (!libraryName.value.trim()) {
    MessagePlugin.warning('请输入知识库名称')
    return
  }

  loading.value = true
  try {
    const data = {
      name: libraryName.value,
      subject: '其他',
      description: ''
    }

    let res
    let targetLibraryId: number | null = null
    
    if (isEdit.value) {
      res = await adminAPI.updateLibrary(Number(route.query.id), data)
      targetLibraryId = Number(route.query.id)
    } else {
      res = await adminAPI.createLibrary(data)
      if (res.success && res.data) {
        targetLibraryId = res.data.id
      }
    }

    if (res.success && targetLibraryId) {
      if (outline.value.length > 0) {
        const validOutline = outline.value.filter(item => item.title.trim())
        if (validOutline.length > 0) {
          const levelParentMap: Record<number, number> = {}
          const chapters = validOutline.map((item, index) => {
            let parentId = null
            if (item.level > 1 && levelParentMap[item.level - 1]) {
              parentId = levelParentMap[item.level - 1]
            }
            
            levelParentMap[item.level] = item.id
            for (let l = item.level + 1; l <= 3; l++) {
              delete levelParentMap[l]
            }
            
            return {
              id: item.id,
              name: item.title.trim(),
              sort_order: index,
              level: item.level,
              parentId: parentId
            }
          })
          
          await chapterAPI.batchUpdate(targetLibraryId, chapters)
        }
      }

      MessagePlugin.success(isEdit.value ? '修改成功' : '创建成功')
      router.push('/admin')
    } else {
      MessagePlugin.error(res.message || '操作失败')
    }
  } catch (error) {
    console.error('操作失败:', error)
    MessagePlugin.error('操作失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.library-form-container {
  min-height: 100vh;
  background-color: #f5f6fa;
  padding: 12px 16px;
  padding-top: 60px;
  padding-bottom: 100px;
  box-sizing: border-box;
}

.custom-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  z-index: 999;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
}

.nav-content {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}

.nav-back {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.nav-title {
  font-size: 17px;
  font-weight: 600;
  color: #000;
}

.nav-placeholder {
  width: 32px;
}

.form-section {
  background-color: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.section-tip {
  font-size: 12px;
  color: #999;
  margin-left: 8px;
}

.form-item {
  margin-bottom: 12px;
  position: relative;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  display: block;
}

.required {
  color: #e34d59;
}

.form-input {
  width: 100%;
  height: 44px;
  background-color: #f5f6fa;
  border-radius: 8px;
  padding: 0 40px 0 12px;
  font-size: 15px;
  color: #333;
  box-sizing: border-box;
  border: none;
  outline: none;

  &::placeholder {
    color: #bbb;
  }
}

.form-count {
  position: absolute;
  right: 12px;
  bottom: 14px;
  font-size: 12px;
  color: #bbb;
}

.outline-container {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
}

.outline-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.outline-item {
  display: flex;
  align-items: center;
  background-color: #fff;
  border-radius: 6px;
  padding: 10px 12px;
  border: 1px solid transparent;
  cursor: move;
  position: relative;
  transition: transform 0.2s ease, box-shadow 0.2s ease, margin-left 0.2s ease;
  margin-left: var(--level-offset, 0);
  user-select: none;
}

.outline-item.sub-item {
  background-color: #fafbfc;
}

.outline-item.dragging {
  opacity: 0.8;
  border-color: #3B82F6;
  box-shadow: 0 4px 12px rgba(0, 82, 217, 0.2);
  transform: scale(1.02);
}

.outline-item.level-changing {
  border-color: #10B981;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  background-color: #f0fdf4;
}

.outline-drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-right: 6px;
  cursor: move;
}

.outline-main {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  margin-left: 0;
}

.outline-main.outline-level-2 {
  margin-left: 20px;
}

.outline-main.outline-level-3 {
  margin-left: 40px;
}

.outline-level-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 20px;
  padding: 0 6px;
  background-color: #e8f4ff;
  border-radius: 4px;
  margin-right: 6px;
}

.outline-level-indicator span {
  font-size: 11px;
  color: #3B82F6;
  font-weight: 500;
}

.outline-content {
  flex: 1;
  min-width: 0;
}

.outline-input {
  width: 100%;
  font-size: 14px;
  color: #333;
  background: transparent;
  border: none;
  outline: none;

  &::placeholder {
    color: #bbb;
  }
}

.outline-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 6px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: #f5f6fa;
  transition: all 0.2s ease;
  cursor: pointer;

  &:active {
    background-color: #e8e9eb;
  }
}

.level-hint {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  background: #10B981;
  color: #fff;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  z-index: 10;
  animation: fadeIn 0.2s ease;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 50%;
    transform: translateX(-50%);
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 5px solid #10B981;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.outline-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0;
  color: #999;
  font-size: 14px;
}

.outline-empty span {
  margin-top: 8px;
}

.outline-add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 12px;
  margin-top: 8px;
  border: 1px dashed #ddd;
  border-radius: 6px;
  color: #3B82F6;
  font-size: 14px;
  transition: all 0.2s ease;
  cursor: pointer;

  &:active {
    background-color: rgba(0, 82, 217, 0.04);
    border-color: #3B82F6;
  }
}

.outline-tips {
  margin-top: 8px;
  font-size: 12px;
  color: #999;
  text-align: center;
}

.bottom-placeholder {
  height: 24px;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  background-color: #fff;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.06);
  z-index: 100;
}

.btn-cancel {
  flex: 1;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 22px;
  font-size: 16px;
  color: #666;
  background-color: #f5f6fa;
  transition: all 0.2s ease;
  cursor: pointer;

  &:active {
    background-color: #e8e9eb;
  }
}

.btn-submit {
  flex: 2;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 22px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  box-shadow: 0 4px 12px rgba(0, 82, 217, 0.3);
  transition: all 0.2s ease;
  cursor: pointer;

  &:active {
    transform: scale(0.98);
    box-shadow: 0 2px 6px rgba(0, 82, 217, 0.2);
  }

  &.loading {
    opacity: 0.7;
    pointer-events: none;
  }
}

@media (max-width: 768px) {
  .library-form-container {
    padding: 12px 16px;
    padding-top: 60px;
    padding-bottom: 100px;
  }

  .form-section {
    padding: 16px;
  }
}
</style>

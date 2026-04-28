<template>
  <div class="library-form-container">
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

      <div class="form-item row">
        <span class="form-label">公开知识库</span>
        <div class="custom-switch" :class="{ active: isPublic }" @click="onTogglePublic">
          <div class="custom-switch-dot"></div>
        </div>
      </div>
      <div class="form-hint-wrap" v-if="isPublic">
        <span class="form-hint">公开后，所有用户可在社区看到此知识库</span>
      </div>
      <div class="form-hint-wrap" v-else>
        <span class="form-hint">仅自己可见</span>
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
            :class="{ 'sub-item': item.level > 1, dragging: dragIndex === index }"
            v-for="(item, index) in outline" 
            :key="item.id"
            draggable="true"
            @dragstart="onDragStart($event, index)"
            @dragover.prevent="onDragOver($event, index)"
            @drop="onDrop($event, index)"
            @dragend="onDragEnd"
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
              <div class="action-btn" @click="onChangeLevel(index, -1)" v-if="item.level > 1">
                <t-icon name="chevron-left" size="16px" color="#999" />
              </div>
              <div class="action-btn" @click="onChangeLevel(index, 1)" v-if="item.level < 3">
                <t-icon name="chevron-right" size="16px" color="#999" />
              </div>
              <div class="action-btn" @click="onDeleteOutline(index)">
                <t-icon name="close" size="18px" color="#999" />
              </div>
            </div>
          </div>
        </div>

        <div class="outline-empty" v-else>
          <t-icon name="book" size="32px" color="#ddd" />
          <span>暂无大纲，点击下方按钮添加</span>
        </div>

        <div class="outline-add-btn" @click="onAddOutline">
          <t-icon name="add" size="18px" color="#3B82F6" />
          <span>添加标题</span>
        </div>
      </div>

      <div class="outline-tips">
        <span>提示：拖动可排序，点击箭头可改变标题层级</span>
      </div>
    </div>

    <div class="bottom-placeholder"></div>
  </div>

  <div class="bottom-bar">
    <div class="btn-cancel" @click="onCancel">取消</div>
    <div class="btn-submit" @click="onSubmit">创建知识库</div>
  </div>

  <t-dialog
    v-model:visible="showCancelDialog"
    header="提示"
    body="确定要放弃创建吗？"
    confirm-btn="确定"
    cancel-btn="取消"
    @confirm="onConfirmCancel"
  />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { libraryAPI, chapterAPI } from '@/utils/api'

interface OutlineItem {
  id: number
  title: string
  level: number
  parentId: number | null
}

const router = useRouter()

const libraryName = ref('')
const isPublic = ref(true)
const outline = ref<OutlineItem[]>([])
const showCancelDialog = ref(false)
const dragIndex = ref(-1)
const existingLibraryNames = ref<string[]>([])

const SUBJECTS = ['民法', '刑法', '宪法', '行政法']

const getRandomSubject = () => {
  const randomIndex = Math.floor(Math.random() * SUBJECTS.length)
  return SUBJECTS[randomIndex]
}

onMounted(() => {
  loadExistingLibraryNames()
})

const loadExistingLibraryNames = async () => {
  try {
    const result = await libraryAPI.getMyLibraries({ page: 1, pageSize: 100 })
    if (result.success && result.data && result.data.list) {
      const names = result.data.list.map((item: any) => item.name.trim().toLowerCase())
      existingLibraryNames.value = names
    }
  } catch (error) {
    console.error('获取知识库列表失败:', error)
  }
}

const onTogglePublic = () => {
  isPublic.value = !isPublic.value
}

const onAddOutline = () => {
  const hasEmptyTitle = outline.value.some(item => !item.title.trim())
  if (hasEmptyTitle) {
    MessagePlugin.warning('请先填写已有标题')
    return
  }

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

const onChangeLevel = (index: number, delta: number) => {
  const item = outline.value[index]
  const newLevel = item.level + delta
  
  if (newLevel < 1 || newLevel > 3) return
  
  if (delta > 0) {
    if (index > 0) {
      const prevItem = outline.value[index - 1]
      if (prevItem.level < item.level) {
        return
      }
    } else {
      return
    }
  }
  
  outline.value[index].level = newLevel
}

const onDragStart = (e: DragEvent, index: number) => {
  dragIndex.value = index
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
  }
}

const onDragOver = (e: DragEvent, index: number) => {
  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move'
  }
}

const onDrop = (e: DragEvent, targetIndex: number) => {
  if (dragIndex.value < 0 || dragIndex.value === targetIndex) return
  
  const dragItem = outline.value[dragIndex.value]
  if (!dragItem) return
  
  const movingItems = [dragItem]
  for (let i = dragIndex.value + 1; i < outline.value.length; i++) {
    if (outline.value[i].level > dragItem.level) {
      movingItems.push(outline.value[i])
    } else {
      break
    }
  }
  
  const newOutline = [...outline.value]
  newOutline.splice(dragIndex.value, movingItems.length)
  
  let insertIndex = targetIndex
  if (targetIndex > dragIndex.value) {
    insertIndex = targetIndex - movingItems.length + 1
  }
  
  newOutline.splice(insertIndex, 0, ...movingItems)
  outline.value = newOutline
}

const onDragEnd = () => {
  dragIndex.value = -1
}

const onCancel = () => {
  if (libraryName.value || outline.value.length > 0) {
    showCancelDialog.value = true
  } else {
    router.back()
  }
}

const onConfirmCancel = () => {
  showCancelDialog.value = false
  router.back()
}

const onSubmit = async () => {
  if (!libraryName.value.trim()) {
    MessagePlugin.warning('请输入知识库名称')
    return
  }

  const newName = libraryName.value.trim().toLowerCase()
  if (existingLibraryNames.value.includes(newName)) {
    MessagePlugin.warning('知识库名称已存在')
    return
  }

  try {
    const randomSubject = getRandomSubject()
    
    const result = await libraryAPI.create({
      name: libraryName.value.trim(),
      subject: randomSubject,
      description: '',
      is_public: isPublic.value ? 1 : 0
    })

    if (result.success) {
      const libraryId = result.data.id

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
          
          await chapterAPI.batchCreate(libraryId, chapters)
        }
      }

      MessagePlugin.success('创建成功')
      
      setTimeout(() => {
        router.back()
      }, 1500)
    } else {
      MessagePlugin.error(result.message || '创建失败')
    }
  } catch (error: any) {
    console.error('创建知识库失败:', error)
    MessagePlugin.error(error.message || '创建失败')
  }
}
</script>

<style lang="scss" scoped>
.library-form-container {
  min-height: 100vh;
  background-color: #f5f6fa;
  padding: 12px 16px;
  padding-bottom: calc(70px + env(safe-area-inset-bottom));
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
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.section-tip {
  font-size: 12px;
  color: #999;
  margin-left: 8px;
}

.form-item {
  margin-bottom: 12px;
  position: relative;
}

.form-item.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-item:last-child {
  margin-bottom: 0;
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
}

.form-count {
  position: absolute;
  right: 12px;
  bottom: 14px;
  font-size: 12px;
  color: #bbb;
}

.form-hint {
  font-size: 12px;
  color: #999;
  display: block;
}

.form-hint-wrap {
  margin-top: 4px;
  min-height: 17px;
}

.custom-switch {
  width: 40px;
  height: 22px;
  background-color: #ddd;
  border-radius: 11px;
  position: relative;
  padding: 2px;
  box-sizing: border-box;
  cursor: pointer;
}

.custom-switch.active {
  background-color: #3B82F6;
}

.custom-switch-dot {
  width: 18px;
  height: 18px;
  background-color: #fff;
  border-radius: 50%;
  position: absolute;
  left: 2px;
  top: 2px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: left 0.2s ease;
}

.custom-switch.active .custom-switch-dot {
  left: 20px;
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
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  background-color: #fff;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.06);
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
}
</style>

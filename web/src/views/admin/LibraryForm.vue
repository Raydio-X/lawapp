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

      <div class="form-item">
        <span class="form-label">标签 <span class="form-label-tip">最多3个</span></span>
        <div class="tags-input-container">
          <div class="tags-list-horizontal">
            <div class="tag-item-horizontal" v-for="(tag, index) in tags" :key="index">
              <input 
                class="tag-input-horizontal" 
                v-model="tags[index]" 
                :placeholder="'标签' + (index + 1)"
                maxlength="10"
              />
              <div class="tag-remove-horizontal" @click="onRemoveTag(index)">
                <t-icon name="close" size="12px" color="#999" />
              </div>
            </div>
            <div class="tag-add-btn-horizontal" v-if="tags.length < 3" @click="onAddTag">
              <t-icon name="add" size="14px" color="#3B82F6" />
            </div>
          </div>
        </div>
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
              <div class="action-btn" @click="onDeleteOutline(index)">
                <t-icon name="close" size="18px" color="#999" />
              </div>
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
        <span>提示：拖动可排序</span>
      </div>
    </div>

    <div class="bottom-placeholder"></div>
  </div>

  <div class="bottom-bar">
    <div class="btn-cancel" @click="onCancel">取消</div>
    <div class="btn-submit" @click="onSubmit">{{ isEdit ? '保存修改' : '创建知识库' }}</div>
  </div>

  <t-dialog
    v-model:visible="showCancelDialog"
    header="提示"
    content="确定要放弃创建吗？"
    confirm-btn="确定"
    cancel-btn="取消"
    @confirm="onConfirmCancel"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import api from '@/utils/api'

const router = useRouter()
const route = useRoute()

const isEdit = computed(() => !!route.query.id)

const libraryName = ref('')
const tags = ref<string[]>([])
const outline = ref<{ id: string; title: string; level: number }[]>([])

const showCancelDialog = ref(false)
const dragIndex = ref(-1)

onMounted(() => {
  if (isEdit.value) {
    loadLibraryDetail()
  }
})

const loadLibraryDetail = async () => {
  try {
    const res = await api.get(`/libraries/${route.query.id}`)
    if (res.data.code === 0) {
      const library = res.data.data
      libraryName.value = library.name
      tags.value = library.tags || []
      outline.value = library.outline || []
    }
  } catch (error) {
    console.error('加载知识库详情失败', error)
  }
}

const onAddTag = () => {
  if (tags.value.length < 3) {
    tags.value.push('')
  }
}

const onRemoveTag = (index: number) => {
  tags.value.splice(index, 1)
}

const onAddOutline = () => {
  outline.value.push({
    id: Date.now().toString(),
    title: '',
    level: 1
  })
}

const onDeleteOutline = (index: number) => {
  outline.value.splice(index, 1)
}

const onDragStart = (e: DragEvent, index: number) => {
  dragIndex.value = index
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
  }
}

const onDragOver = (e: DragEvent, index: number) => {
  e.preventDefault()
}

const onDrop = (e: DragEvent, index: number) => {
  if (dragIndex.value !== -1 && dragIndex.value !== index) {
    const item = outline.value.splice(dragIndex.value, 1)[0]
    outline.value.splice(index, 0, item)
  }
}

const onDragEnd = () => {
  dragIndex.value = -1
}

const onCancel = () => {
  if (libraryName.value || tags.value.some(t => t) || outline.value.some(o => o.title)) {
    showCancelDialog.value = true
  } else {
    router.back()
  }
}

const onConfirmCancel = () => {
  router.back()
}

const onSubmit = async () => {
  if (!libraryName.value.trim()) {
    MessagePlugin.warning('请输入知识库名称')
    return
  }

  try {
    const data = {
      name: libraryName.value,
      tags: tags.value.filter(t => t.trim()),
      outline: outline.value.filter(o => o.title.trim())
    }

    let res
    if (isEdit.value) {
      res = await api.put(`/libraries/${route.query.id}`, data)
    } else {
      res = await api.post('/libraries', data)
    }

    if (res.data.code === 0) {
      MessagePlugin.success(isEdit.value ? '修改成功' : '创建成功')
      router.back()
    } else {
      MessagePlugin.error(res.data.message || '操作失败')
    }
  } catch (error) {
    MessagePlugin.error('操作失败，请重试')
  }
}
</script>

<style lang="scss" scoped>
.library-form-container {
  min-height: 100vh;
  background-color: #f5f6fa;
  padding-bottom: 80px;
}

.form-section {
  background-color: #fff;
  padding: 16px;
  margin-bottom: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-tip {
  font-size: 12px;
  color: #999;
}

.form-item {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.required {
  color: #f5222d;
}

.form-label-tip {
  font-size: 12px;
  color: #999;
  font-weight: normal;
  margin-left: 8px;
}

.form-input {
  width: 100%;
  height: 44px;
  padding: 0 12px;
  font-size: 14px;
  color: #333;
  background-color: #f5f7fa;
  border-radius: 6px;
  border: none;
  outline: none;
  box-sizing: border-box;

  &::placeholder {
    color: #bbb;
  }
}

.form-count {
  display: block;
  text-align: right;
  font-size: 12px;
  color: #bbb;
  margin-top: 4px;
}

.tags-input-container {
  margin-top: 8px;
}

.tags-list-horizontal {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item-horizontal {
  display: flex;
  align-items: center;
  background-color: #f5f7fa;
  border-radius: 6px;
  padding: 0 8px;
  height: 36px;
}

.tag-input-horizontal {
  width: 80px;
  height: 36px;
  font-size: 14px;
  color: #333;
  background: transparent;
  border: none;
  outline: none;
}

.tag-remove-horizontal {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.tag-add-btn-horizontal {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background-color: #e8f4ff;
  border-radius: 6px;
  cursor: pointer;
}

.outline-container {
  margin-top: 8px;
}

.outline-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.outline-item {
  display: flex;
  align-items: center;
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  transition: all 0.2s;

  &.sub-item {
    margin-left: 20px;
  }

  &.dragging {
    opacity: 0.5;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.outline-drag-handle {
  display: flex;
  align-items: center;
  cursor: move;
  margin-right: 12px;
}

.outline-main {
  flex: 1;
  display: flex;
  align-items: center;
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
  margin-right: 8px;

  span {
    font-size: 11px;
    color: #3B82F6;
    font-weight: 500;
  }
}

.outline-content {
  flex: 1;
}

.outline-input {
  width: 100%;
  height: 36px;
  padding: 0 8px;
  font-size: 14px;
  color: #333;
  background-color: #fff;
  border-radius: 4px;
  border: none;
  outline: none;

  &::placeholder {
    color: #bbb;
  }
}

.outline-actions {
  display: flex;
  align-items: center;
  margin-left: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  cursor: pointer;
}

.outline-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px;
  color: #999;
  font-size: 14px;

  span {
    margin-top: 8px;
  }
}

.outline-add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 44px;
  background-color: #fff;
  border: 1px dashed #3B82F6;
  border-radius: 8px;
  color: #3B82F6;
  font-size: 14px;
  cursor: pointer;
}

.outline-tips {
  margin-top: 12px;
  font-size: 12px;
  color: #999;
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
  border-top: 1px solid #eee;
}

.btn-cancel {
  flex: 1;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 22px;
  font-size: 15px;
  color: #666;
  background-color: #f5f7fa;
  cursor: pointer;
}

.btn-submit {
  flex: 1;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 22px;
  font-size: 15px;
  color: #fff;
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  cursor: pointer;
}
</style>

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

    <div class="bottom-bar">
      <div class="btn-cancel" @click="onCancel">取消</div>
      <div class="btn-submit" @click="onSubmit">{{ isEdit ? '保存修改' : '创建知识库' }}</div>
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
    if (res.success && res.data) {
      const library = res.data
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

    if (res.success) {
      MessagePlugin.success(isEdit.value ? '修改成功' : '创建成功')
      router.push('/admin')
    } else {
      MessagePlugin.error(res.message || '操作失败')
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

.form-label-tip {
  font-size: 12px;
  color: #999;
  font-weight: normal;
  margin-left: 4px;
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

.tags-input-container {
  width: 100%;
}

.tags-list-horizontal {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.tag-item-horizontal {
  display: flex;
  align-items: center;
  background-color: #f5f6fa;
  border-radius: 6px;
  padding: 0 4px 0 8px;
  height: 36px;
}

.tag-input-horizontal {
  width: 60px;
  height: 32px;
  font-size: 13px;
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
  border-radius: 50%;
  cursor: pointer;

  &:active {
    background-color: rgba(0, 0, 0, 0.05);
  }
}

.tag-add-btn-horizontal {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px dashed #ddd;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;

  &:active {
    background-color: rgba(0, 82, 217, 0.04);
    border-color: #3B82F6;
  }
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
  transition: all 0.2s;
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

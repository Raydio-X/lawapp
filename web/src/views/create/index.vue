<template>
  <div class="container">
    <div class="page-header">
      <span class="page-title">创建</span>
      <span class="page-subtitle">开始记录你的知识</span>
    </div>

    <div class="create-section">
      <div 
        class="create-card" 
        :class="{ pressed: libraryPressed }"
        @click="onCreateLibrary"
        @mousedown="libraryPressed = true"
        @mouseup="libraryPressed = false"
        @mouseleave="libraryPressed = false"
      >
        <div class="create-card-icon library-icon">
          <t-icon name="book" size="28px" color="#fff" />
        </div>
        <div class="create-card-content">
          <span class="create-card-title">创建知识库</span>
          <span class="create-card-desc">搭建你的专属背诵体系</span>
        </div>
        <div class="create-card-arrow">
          <t-icon name="chevron-right" size="20px" color="#ccc" />
        </div>
      </div>

      <div 
        class="create-card" 
        :class="{ pressed: cardPressed }"
        @click="onCreateCard"
        @mousedown="cardPressed = true"
        @mouseup="cardPressed = false"
        @mouseleave="cardPressed = false"
      >
        <div class="create-card-icon card-icon">
          <t-icon name="edit" size="28px" color="#fff" />
        </div>
        <div class="create-card-content">
          <span class="create-card-title">新增背诵卡片</span>
          <span class="create-card-desc">记录一个知识点</span>
        </div>
        <div class="create-card-arrow">
          <t-icon name="chevron-right" size="20px" color="#ccc" />
        </div>
      </div>
    </div>

    <div class="quick-actions">
      <div class="quick-action-title">快捷工具</div>
      <div class="quick-action-grid">
        <div class="quick-action-item disabled">
          <div class="quick-action-icon smart-icon">
            <t-icon name="bulletpoint" size="20px" color="#ccc" />
          </div>
          <span class="quick-action-text">智能导入</span>
          <div class="coming-soon-tag">即将开放</div>
        </div>
        <div class="quick-action-item" @click="onBatchImport">
          <div class="quick-action-icon batch-icon">
            <t-icon name="upload" size="20px" color="#00A870" />
          </div>
          <span class="quick-action-text">批量导入</span>
        </div>
      </div>
    </div>

    <div class="my-libraries-section">
      <div class="section-header">
        <span class="section-title">我的知识库</span>
        <span 
          class="manage-btn" 
          :class="{ active: isManageMode }"
          @click="onManageLibraries"
        >{{ isManageMode ? '取消' : '管理' }}</span>
      </div>
      
      <div class="library-list" v-if="myLibraries.length > 0">
        <div 
          class="library-item" 
          :class="{ pressed: item.pressed, 'manage-mode': isManageMode }"
          v-for="(item, index) in myLibraries" 
          :key="item.id"
          @click="onLibraryItemTap(item)"
          @mousedown="item.pressed = true"
          @mouseup="item.pressed = false"
          @mouseleave="item.pressed = false"
        >
          <div class="library-item-icon">
            <t-icon name="book" size="24px" color="#3B82F6" />
          </div>
          <div class="library-item-content">
            <span class="library-item-name">{{ item.name }}</span>
            <div class="library-item-meta">
              <span class="meta-item">{{ item.subject }}</span>
              <span class="meta-dot">·</span>
              <span class="meta-item">{{ item.cardCount }}张卡片</span>
            </div>
          </div>
          <div class="library-item-actions" v-if="isManageMode">
            <span class="action-text edit" @click.stop="onEditOutline(item, index)">编辑</span>
            <span class="action-text delete" @click.stop="onDeleteLibrary(item, index)">删除</span>
          </div>
          <div class="library-item-arrow" v-else>
            <t-icon name="chevron-right" size="16px" color="#ccc" />
          </div>
        </div>
      </div>
      
      <div class="empty-state" v-else>
        <t-icon name="book" size="40px" color="#ddd" />
        <span class="empty-text">还没有创建知识库</span>
        <span class="empty-subtext">点击上方"创建知识库"开始创建</span>
      </div>
    </div>

    <div class="bottom-placeholder"></div>

    <div class="batch-popup" v-if="showBatchImport" @click.self="showBatchImport = false">
      <div class="batch-container" @click.stop>
        <div class="batch-header">
          <span class="batch-title">批量导入</span>
          <div class="batch-close" @click="showBatchImport = false">
            <t-icon name="close" size="16px" color="#999" />
          </div>
        </div>

        <div class="batch-step" v-if="batchStep === 1">
          <div class="batch-step-header">
            <span class="batch-step-num">1</span>
            <span class="batch-step-title">选择目标知识库</span>
          </div>
          <div class="batch-library-list">
            <div 
              class="batch-library-item" 
              :class="{ selected: batchLibraryId === item.id }"
              v-for="item in myLibraries" 
              :key="item.id"
              @click="onSelectBatchLibrary(item)"
            >
              <div class="batch-library-radio">
                <div class="batch-radio-dot" v-if="batchLibraryId === item.id"></div>
              </div>
              <div class="batch-library-info">
                <span class="batch-library-name">{{ item.name }}</span>
                <span class="batch-library-count">{{ item.cardCount }}张卡片</span>
              </div>
            </div>
          </div>
          <div class="batch-empty" v-if="myLibraries.length === 0">
            <span>请先创建知识库</span>
          </div>
          <div class="batch-step-footer">
            <div 
              class="batch-next-btn" 
              :class="{ disabled: !batchLibraryId }"
              @click="onBatchNext"
            >下一步</div>
          </div>
        </div>

        <div class="batch-step" v-if="batchStep === 2">
          <div class="batch-step-header">
            <span class="batch-step-num">2</span>
            <span class="batch-step-title">上传Excel文件</span>
          </div>
          
          <div class="batch-upload-area" @click="onChooseFile">
            <div class="batch-upload-content" v-if="!batchFileName">
              <t-icon name="upload" size="32px" color="#00A870" />
              <span class="batch-upload-text">点击选择Excel文件</span>
              <span class="batch-upload-hint">支持 .xlsx / .xls 格式</span>
            </div>
            <div class="batch-upload-done" v-else>
              <t-icon name="file" size="24px" color="#00A870" />
              <span class="batch-file-name">{{ batchFileName }}</span>
              <span class="batch-file-change">点击更换文件</span>
            </div>
          </div>

          <div class="batch-template-section">
            <div class="batch-template-title">
              <t-icon name="info-circle" size="14px" color="#999" />
              <span>模板格式说明</span>
            </div>
            <div class="batch-template-info">
              <span class="batch-template-row"><span class="col-a">A列</span><span class="col-b">问题</span></span>
              <span class="batch-template-row"><span class="col-a">B列</span><span class="col-b">答案</span></span>
              <span class="batch-template-row"><span class="col-a">C列</span><span class="col-b">章节（可选）</span></span>
            </div>
            <div class="batch-download-template" @click="onDownloadTemplate">
              <t-icon name="download" size="14px" color="#3B82F6" />
              <span>下载模板</span>
            </div>
          </div>

          <div class="batch-step-actions">
            <div class="batch-prev-btn" @click="onBatchPrev">上一步</div>
            <div 
              class="batch-next-btn" 
              :class="{ disabled: !batchFileName }"
              @click="onBatchParse"
            >解析文件</div>
          </div>
        </div>

        <div class="batch-step" v-if="batchStep === 3">
          <div class="batch-step-header">
            <span class="batch-step-num">3</span>
            <span class="batch-step-title">预览并确认</span>
          </div>

          <div class="batch-preview-summary">
            <span class="batch-preview-total">共解析到 <span class="highlight">{{ batchCards.length }}</span> 张卡片</span>
          </div>

          <div class="batch-preview-list">
            <div class="batch-preview-item" v-for="(item, index) in batchCards" :key="index">
              <div class="batch-preview-index">{{ index + 1 }}</div>
              <div class="batch-preview-content">
                <span class="batch-preview-q">Q: {{ item.question }}</span>
                <span class="batch-preview-a">A: {{ item.answer }}</span>
                <span class="batch-preview-chapter" v-if="item.chapter">{{ item.chapter }}</span>
              </div>
            </div>
          </div>

          <div class="batch-step-actions">
            <div class="batch-prev-btn" @click="onBatchPrev">上一步</div>
            <div class="batch-next-btn" @click="onBatchConfirm">确认导入</div>
          </div>
        </div>

        <div class="batch-step" v-if="batchStep === 4">
          <div class="batch-result">
            <div class="batch-result-icon">
              <t-icon name="check-circle" size="48px" color="#00A870" />
            </div>
            <span class="batch-result-title">导入成功</span>
            <span class="batch-result-desc">已成功导入 {{ batchCards.length }} 张卡片</span>
          </div>
          <div class="batch-step-footer">
            <div class="batch-next-btn" @click="showBatchImport = false">完成</div>
          </div>
        </div>
      </div>
    </div>

    <div class="delete-confirm-overlay" v-if="showDeleteLibraryConfirm" @click.self="showDeleteLibraryConfirm = false">
      <div class="delete-confirm-popup" @click.stop>
        <div class="delete-confirm-title">删除确认</div>
        <div class="delete-confirm-content">
          <span>确定要删除知识库"{{ deleteLibraryItem.name }}"吗？该知识库包含的 {{ deleteLibraryItem.cardCount }} 张卡片也将被删除，此操作不可恢复。</span>
        </div>
        <div class="delete-confirm-actions">
          <div class="delete-btn cancel" @click="showDeleteLibraryConfirm = false">取消</div>
          <div class="delete-btn confirm" @click="onConfirmDeleteLibrary">删除</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { libraryAPI } from '@/utils/api'

const router = useRouter()

interface Library {
  id: number
  name: string
  subject: string
  cardCount: number
  pressed?: boolean
}

const libraryPressed = ref(false)
const cardPressed = ref(false)
const isManageMode = ref(false)
const myLibraries = ref<Library[]>([])

const showBatchImport = ref(false)
const batchStep = ref(1)
const batchLibraryId = ref(0)
const batchFileName = ref('')
const batchCards = ref<any[]>([])

const showDeleteLibraryConfirm = ref(false)
const deleteLibraryItem = ref<Library>({ id: 0, name: '', subject: '', cardCount: 0 })
const deleteLibraryIndex = ref(0)

onMounted(() => {
  loadMyLibraries()
})

const loadMyLibraries = async () => {
  try {
    const res = await libraryAPI.getMyLibraries({ page: 1, pageSize: 100 })
    if (res.success && res.data) {
      myLibraries.value = (res.data.list || res.data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        subject: item.subject || '未分类',
        cardCount: item.card_count || 0,
        pressed: false
      }))
    }
  } catch (error) {
    console.error('加载知识库失败:', error)
  }
}

const onCreateLibrary = () => {
  router.push('/create/library')
}

const onCreateCard = () => {
  router.push('/create/card')
}

const onBatchImport = () => {
  batchStep.value = 1
  batchLibraryId.value = 0
  batchFileName.value = ''
  batchCards.value = []
  showBatchImport.value = true
}

const onManageLibraries = () => {
  isManageMode.value = !isManageMode.value
}

const onLibraryItemTap = (item: Library) => {
  if (isManageMode.value) return
  router.push(`/library/${item.id}?name=${encodeURIComponent(item.name)}`)
}

const onEditOutline = (item: Library, index: number) => {
  router.push(`/create/library?id=${item.id}`)
}

const onDeleteLibrary = (item: Library, index: number) => {
  deleteLibraryItem.value = item
  deleteLibraryIndex.value = index
  showDeleteLibraryConfirm.value = true
}

const onConfirmDeleteLibrary = async () => {
  try {
    const res = await libraryAPI.delete(deleteLibraryItem.value.id)
    if (res.success) {
      myLibraries.value.splice(deleteLibraryIndex.value, 1)
      MessagePlugin.success('删除成功')
      showDeleteLibraryConfirm.value = false
    }
  } catch (error) {
    MessagePlugin.error('删除失败')
  }
}

const onSelectBatchLibrary = (item: Library) => {
  batchLibraryId.value = item.id
}

const onBatchNext = () => {
  if (batchStep.value === 1 && !batchLibraryId.value) return
  if (batchStep.value === 2 && !batchFileName.value) return
  batchStep.value++
}

const onBatchPrev = () => {
  batchStep.value--
}

const onChooseFile = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.xlsx,.xls'
  input.onchange = (e: any) => {
    const file = e.target.files[0]
    if (file) {
      batchFileName.value = file.name
    }
  }
  input.click()
}

const onBatchParse = () => {
  if (!batchFileName.value) return
  batchCards.value = [
    { question: '示例问题1', answer: '示例答案1', chapter: '' },
    { question: '示例问题2', answer: '示例答案2', chapter: '' }
  ]
  batchStep.value = 3
}

const onBatchConfirm = () => {
  batchStep.value = 4
}

const onDownloadTemplate = () => {
  MessagePlugin.info('模板下载功能开发中')
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #F5F7FA;
  padding-bottom: 60px;
}

.page-header {
  padding: 24px 16px 16px;
  background: #fff;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #1E293B;
  display: block;
  margin-bottom: 4px;
}

.page-subtitle {
  font-size: 14px;
  color: #64748B;
}

.create-section {
  padding: 0 16px;
  margin-top: 12px;
}

.create-card {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  cursor: pointer;
}

.create-card.pressed {
  transform: scale(0.98);
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.08);
}

.create-card-icon {
  width: 44px;
  height: 44px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.create-card-icon.library-icon {
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
}

.create-card-icon.card-icon {
  background: linear-gradient(135deg, #10B981 0%, #34D399 100%);
}

.create-card-content {
  flex: 1;
  min-width: 0;
}

.create-card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1E293B;
  display: block;
  margin-bottom: 4px;
}

.create-card-desc {
  font-size: 13px;
  color: #64748B;
  display: block;
}

.create-card-arrow {
  flex-shrink: 0;
  margin-left: 8px;
}

.quick-actions {
  padding: 16px;
  margin-top: 8px;
}

.quick-action-title {
  font-size: 15px;
  font-weight: 600;
  color: #1E293B;
  margin-bottom: 10px;
}

.quick-action-grid {
  display: flex;
  gap: 10px;
}

.quick-action-item {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
  cursor: pointer;
}

.quick-action-item.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.quick-action-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.quick-action-icon.smart-icon {
  background: rgba(59, 130, 246, 0.1);
}

.quick-action-icon.batch-icon {
  background: rgba(0, 168, 112, 0.1);
}

.quick-action-text {
  font-size: 13px;
  color: #1E293B;
  font-weight: 500;
}

.coming-soon-tag {
  position: absolute;
  top: 6px;
  right: 6px;
  font-size: 10px;
  color: #F59E0B;
  background: rgba(245, 158, 11, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.my-libraries-section {
  padding: 0 16px;
  margin-top: 12px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1E293B;
}

.manage-btn {
  font-size: 13px;
  color: #3B82F6;
  padding: 4px 10px;
  border-radius: 4px;
  background: rgba(59, 130, 246, 0.08);
  cursor: pointer;
}

.manage-btn.active {
  background: #3B82F6;
  color: #fff;
}

.library-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.library-item {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
  cursor: pointer;
}

.library-item.pressed {
  transform: scale(0.98);
}

.library-item.manage-mode {
  padding-right: 8px;
}

.library-item-icon {
  width: 36px;
  height: 36px;
  border-radius: 7px;
  background: rgba(59, 130, 246, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  flex-shrink: 0;
}

.library-item-content {
  flex: 1;
  min-width: 0;
}

.library-item-name {
  font-size: 15px;
  font-weight: 500;
  color: #1E293B;
  display: block;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.library-item-meta {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #64748B;
}

.meta-item {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta-dot {
  margin: 0 4px;
  color: #CBD5E1;
}

.library-item-arrow {
  flex-shrink: 0;
  margin-left: 6px;
}

.library-item-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.action-text {
  font-size: 13px;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
}

.action-text.edit {
  color: #3B82F6;
  background: rgba(59, 130, 246, 0.08);
}

.action-text.delete {
  color: #E34D59;
  background: rgba(227, 77, 89, 0.08);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px;
  background: #fff;
  border-radius: 8px;
}

.empty-text {
  font-size: 14px;
  color: #64748B;
  margin-top: 10px;
}

.empty-subtext {
  font-size: 12px;
  color: #94A3B8;
  margin-top: 4px;
}

.bottom-placeholder {
  height: 20px;
}

.batch-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 10001;
}

.batch-container {
  background: #fff;
  border-radius: 16px 16px 0 0;
  max-height: 85vh;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.batch-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #E7E7E7;
  flex-shrink: 0;
}

.batch-title {
  font-size: 17px;
  font-weight: 600;
  color: #1E293B;
}

.batch-close {
  padding: 4px;
  cursor: pointer;
}

.batch-step {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
}

.batch-step-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
}

.batch-step-num {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3B82F6;
  color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.batch-step-title {
  font-size: 15px;
  font-weight: 600;
  color: #1E293B;
}

.batch-library-list {
  max-height: 200px;
  overflow-y: auto;
}

.batch-library-item {
  display: flex;
  align-items: center;
  padding: 10px;
  background: #F8FAFC;
  border-radius: 6px;
  margin-bottom: 6px;
  border: 1px solid transparent;
  cursor: pointer;
}

.batch-library-item.selected {
  background: #E6F7FF;
  border-color: #3B82F6;
}

.batch-library-radio {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid #CBD5E1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
}

.batch-library-item.selected .batch-library-radio {
  border-color: #3B82F6;
}

.batch-radio-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #3B82F6;
}

.batch-library-info {
  flex: 1;
}

.batch-library-name {
  font-size: 14px;
  color: #1E293B;
  display: block;
  margin-bottom: 2px;
}

.batch-library-count {
  font-size: 12px;
  color: #64748B;
}

.batch-empty {
  text-align: center;
  padding: 24px 0;
  color: #94A3B8;
  font-size: 14px;
}

.batch-step-footer {
  padding: 12px 0;
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
}

.batch-step-actions {
  display: flex;
  gap: 10px;
  padding: 12px 0;
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
}

.batch-prev-btn,
.batch-next-btn {
  flex: 1;
  text-align: center;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.batch-prev-btn {
  background: #F1F5F9;
  color: #64748B;
}

.batch-next-btn {
  background: #3B82F6;
  color: #fff;
}

.batch-next-btn.disabled {
  background: #CBD5E1;
  cursor: not-allowed;
}

.batch-upload-area {
  border: 1px dashed #CBD5E1;
  border-radius: 8px;
  padding: 24px 16px;
  text-align: center;
  margin-bottom: 12px;
  cursor: pointer;
}

.batch-upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.batch-upload-text {
  font-size: 14px;
  color: #1E293B;
  margin-top: 8px;
}

.batch-upload-hint {
  font-size: 12px;
  color: #94A3B8;
  margin-top: 4px;
}

.batch-upload-done {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.batch-file-name {
  font-size: 14px;
  color: #1E293B;
  margin-top: 6px;
}

.batch-file-change {
  font-size: 12px;
  color: #3B82F6;
  margin-top: 4px;
}

.batch-template-section {
  background: #F8FAFC;
  border-radius: 6px;
  padding: 10px;
}

.batch-template-title {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #64748B;
  margin-bottom: 8px;
}

.batch-template-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.batch-template-row {
  display: flex;
  font-size: 12px;
}

.col-a {
  width: 70px;
  color: #94A3B8;
}

.col-b {
  color: #1E293B;
}

.batch-download-template {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 8px;
  padding: 8px;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
}

.batch-download-template span {
  font-size: 13px;
  color: #3B82F6;
}

.batch-preview-summary {
  text-align: center;
  padding: 10px;
  background: #F8FAFC;
  border-radius: 6px;
  margin-bottom: 8px;
}

.batch-preview-total {
  font-size: 14px;
  color: #64748B;
}

.batch-preview-total .highlight {
  color: #3B82F6;
  font-weight: 600;
}

.batch-preview-list {
  max-height: 200px;
  overflow-y: auto;
}

.batch-preview-item {
  display: flex;
  padding: 8px;
  background: #F8FAFC;
  border-radius: 6px;
  margin-bottom: 6px;
}

.batch-preview-index {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: #3B82F6;
  color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  flex-shrink: 0;
}

.batch-preview-content {
  flex: 1;
  min-width: 0;
}

.batch-preview-q {
  font-size: 13px;
  color: #1E293B;
  display: block;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.batch-preview-a {
  font-size: 12px;
  color: #64748B;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.batch-preview-chapter {
  font-size: 11px;
  color: #3B82F6;
  background: rgba(59, 130, 246, 0.08);
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
  margin-top: 4px;
}

.batch-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 16px;
}

.batch-result-icon {
  margin-bottom: 12px;
}

.batch-result-title {
  font-size: 17px;
  font-weight: 600;
  color: #1E293B;
  margin-bottom: 6px;
}

.batch-result-desc {
  font-size: 14px;
  color: #64748B;
}

.delete-confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
}

.delete-confirm-popup {
  background: #fff;
  border-radius: 12px;
  padding: 24px 16px 16px;
  width: 280px;
}

.delete-confirm-title {
  font-size: 17px;
  font-weight: 600;
  color: #1E293B;
  text-align: center;
  margin-bottom: 12px;
}

.delete-confirm-content {
  font-size: 14px;
  color: #64748B;
  text-align: center;
  line-height: 1.6;
  margin-bottom: 16px;
}

.delete-confirm-actions {
  display: flex;
  gap: 10px;
}

.delete-btn {
  flex: 1;
  text-align: center;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

.delete-btn.cancel {
  background: #F1F5F9;
  color: #64748B;
}

.delete-btn.confirm {
  background: #E34D59;
  color: #fff;
}
</style>

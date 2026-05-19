<template>
  <div class="container">
    <div class="custom-nav">
      <div class="nav-back" @click="router.back()">
        <t-icon name="chevron-left" size="24px" color="#333" />
      </div>
      <div class="nav-content">
        <span class="nav-title">卡片变更审核</span>
      </div>
      <div class="nav-right"></div>
    </div>

    <div class="loading-state" v-if="loading">
      <t-loading text="加载中..." />
    </div>

    <div class="content" v-else>
      <div class="library-info-bar">
        <div class="info-icon">
          <t-icon name="folder" size="20px" color="#8B5CF6" />
        </div>
        <div class="info-content">
          <span class="info-name">{{ library?.name || '加载中...' }}</span>
          <span class="info-count">{{ changePagination.total }}个变更待审核</span>
        </div>
      </div>

      <div class="change-list">
        <div 
          class="change-item" 
          v-for="change in changes" 
          :key="change.id"
          @click="onViewChange(change)"
        >
          <div class="change-main">
            <div class="change-icon" :class="change.change_type">
              <t-icon :name="change.change_type === 'create' ? 'add' : 'edit'" size="18px" />
            </div>
            <div class="change-content">
              <div class="change-header">
                <span class="change-type" :class="change.change_type">
                  {{ change.change_type === 'create' ? '新建卡片' : '修改卡片' }}
                </span>
                <span class="change-chapter" v-if="change.chapter_name">{{ change.chapter_name }}</span>
              </div>
              <div class="change-question">
                <span class="label">问题：</span>
                <span class="text">{{ stripHtml(change.new_question) }}</span>
              </div>
              <div class="change-meta">
                <span class="meta-item">
                  <t-icon name="user" size="12px" color="#94A3B8" />
                  {{ change.creator_name || '未知' }}
                </span>
                <span class="meta-divider">·</span>
                <span class="meta-item">{{ formatTime(change.created_at) }}</span>
              </div>
            </div>
          </div>
          <div class="change-actions">
            <div class="action-btn approve" @click.stop="onApproveChange(change)">
              <t-icon name="check" size="16px" color="#10B981" />
            </div>
            <div class="action-btn reject" @click.stop="onRejectChange(change)">
              <t-icon name="close" size="16px" color="#EF4444" />
            </div>
          </div>
        </div>
      </div>

      <div class="load-more" v-if="hasMore" @click="loadMoreChanges">
        <t-loading v-if="loadingMore" size="small" />
        <span v-else>加载更多</span>
      </div>

      <div class="empty-state" v-if="changes.length === 0">
        <t-icon name="check-circle" size="48px" color="#10B981" />
        <span class="empty-text">暂无待审核的卡片变更</span>
      </div>
    </div>

    <t-dialog
      v-model:visible="approveConfirmVisible"
      header="确认审核通过"
      :confirm-btn="{ content: '确认通过', theme: 'success' }"
      :cancel-btn="null"
      :z-index="2000"
      @confirm="confirmApprove"
    >
      <div class="confirm-content">
        <div class="confirm-icon">
          <t-icon name="check-circle" size="48px" color="#10B981" />
        </div>
        <div class="confirm-text">确定要通过此卡片变更审核吗？</div>
        <div class="confirm-hint" v-if="currentChange">
          <span class="hint-label">变更类型：</span>
          <span class="hint-value">{{ currentChange.change_type === 'create' ? '新建卡片' : '修改卡片' }}</span>
        </div>
      </div>
    </t-dialog>

    <t-dialog
      v-model:visible="rejectConfirmVisible"
      header="确认审核驳回"
      :confirm-btn="{ content: '确认驳回', theme: 'danger' }"
      :cancel-btn="null"
      :z-index="2000"
      @confirm="showRejectDialog"
    >
      <div class="confirm-content">
        <div class="confirm-icon reject">
          <t-icon name="close-circle" size="48px" color="#EF4444" />
        </div>
        <div class="confirm-text">确定要驳回此卡片变更吗？</div>
        <div class="confirm-hint" v-if="currentChange">
          <span class="hint-label">变更类型：</span>
          <span class="hint-value">{{ currentChange.change_type === 'create' ? '新建卡片' : '修改卡片' }}</span>
        </div>
        <div class="confirm-note">驳回后需要填写驳回原因</div>
      </div>
    </t-dialog>

    <t-dialog
      v-model:visible="rejectDialogVisible"
      header="审核驳回"
      :confirm-btn="{ content: '驳回', theme: 'danger' }"
      :cancel-btn="null"
      :z-index="2000"
      @confirm="confirmReject"
    >
      <div class="reject-form">
        <div class="form-label">驳回原因</div>
        <t-textarea 
          v-model="rejectNote" 
          placeholder="请输入驳回原因（将发送给用户）"
          :maxlength="500"
          :autosize="{ minRows: 3, maxRows: 6 }"
        />
      </div>
    </t-dialog>

    <t-dialog
      v-model:visible="changeDetailVisible"
      :header="currentChange?.change_type === 'create' ? '新建卡片详情' : '修改卡片详情'"
      width="700px"
      :footer="false"
      :z-index="1500"
    >
      <div class="change-detail" v-if="currentChange">
        <div class="change-info">
          <span class="change-type-tag" :class="currentChange.change_type">
            {{ currentChange.change_type === 'create' ? '新建卡片' : '修改卡片' }}
          </span>
          <span class="change-time">{{ formatDateTime(currentChange.created_at) }}</span>
        </div>
        
        <template v-if="currentChange.change_type === 'update'">
          <div class="detail-section">
            <div class="section-title">问题变更</div>
            <div class="compare-box">
              <div class="old-value">
                <span class="value-label">原内容</span>
                <span class="value-text">{{ stripHtml(currentChange.old_question) }}</span>
              </div>
              <div class="arrow">
                <t-icon name="arrow-right" size="20px" color="#94A3B8" />
              </div>
              <div class="new-value">
                <span class="value-label">新内容</span>
                <span class="value-text">{{ stripHtml(currentChange.new_question) }}</span>
              </div>
            </div>
          </div>
          
          <div class="detail-section">
            <div class="section-title">答案变更</div>
            <div class="compare-box">
              <div class="old-value">
                <span class="value-label">原内容</span>
                <span class="value-text">{{ stripHtml(currentChange.old_answer) || '暂无答案' }}</span>
              </div>
              <div class="arrow">
                <t-icon name="arrow-right" size="20px" color="#94A3B8" />
              </div>
              <div class="new-value">
                <span class="value-label">新内容</span>
                <span class="value-text">{{ stripHtml(currentChange.new_answer) }}</span>
              </div>
            </div>
          </div>
        </template>
        
        <template v-else>
          <div class="detail-section">
            <div class="section-title">卡片内容</div>
            <div class="preview-box">
              <div class="preview-row">
                <span class="preview-label">问题</span>
                <span class="preview-text">{{ stripHtml(currentChange.new_question) }}</span>
              </div>
              <div class="preview-row">
                <span class="preview-label">答案</span>
                <span class="preview-text">{{ stripHtml(currentChange.new_answer) }}</span>
              </div>
              <div class="preview-row" v-if="currentChange.new_tags && currentChange.new_tags.length > 0">
                <span class="preview-label">标签</span>
                <div class="preview-tags">
                  <span class="tag" v-for="tag in currentChange.new_tags" :key="tag">{{ tag }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>
        
        <div class="change-detail-actions">
          <t-button theme="danger" @click="onRejectChangeFromDetail">
            <template #icon><t-icon name="close" /></template>
            审核驳回
          </t-button>
          <t-button theme="success" @click="onApproveChangeFromDetail">
            <template #icon><t-icon name="check" /></template>
            审核通过
          </t-button>
        </div>
      </div>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { libraryAPI, cardChangeReviewAPI } from '@/utils/api'

interface Library {
  id: number
  name: string
  subject: string
  description: string
  card_count: number
  created_at: string
  creator_name: string
}

interface Change {
  id: number
  card_id: number
  library_id: number
  chapter_id: number
  change_type: string
  old_question: string
  old_answer: string
  old_tags: string[]
  new_question: string
  new_answer: string
  new_tags: string[]
  chapter_name: string
  creator_name: string
  created_at: string
}

const router = useRouter()
const route = useRoute()

const library = ref<Library | null>(null)
const changes = ref<Change[]>([])
const loading = ref(true)
const loadingMore = ref(false)
const page = ref(1)
const pageSize = 20
const changePagination = ref({
  total: 0,
  totalPages: 0
})

const rejectDialogVisible = ref(false)
const rejectNote = ref('')
const changeDetailVisible = ref(false)
const currentChange = ref<Change | null>(null)
const approveConfirmVisible = ref(false)
const rejectConfirmVisible = ref(false)

const hasMore = computed(() => page.value < changePagination.value.totalPages)

onMounted(() => {
  loadLibraryBasic()
  loadChanges()
})

const loadLibraryBasic = async () => {
  const libraryId = route.params.id
  if (!libraryId) return

  try {
    const res = await libraryAPI.getDetail(Number(libraryId))
    if (res && res.success && res.data) {
      library.value = res.data
    }
  } catch (error) {
    console.error('加载知识库失败:', error)
  }
}

const loadChanges = async () => {
  const libraryId = route.params.id
  if (!libraryId) {
    loading.value = false
    return
  }

  loading.value = true
  try {
    const res = await cardChangeReviewAPI.getPendingByLibrary(Number(libraryId), {
      page: page.value,
      pageSize: pageSize
    })
    if (res && res.success && res.data) {
      changes.value = res.data.list
      changePagination.value = res.data.pagination
    }
  } catch (error) {
    console.error('加载卡片变更失败:', error)
    MessagePlugin.error('加载失败')
  } finally {
    loading.value = false
  }
}

const loadMoreChanges = async () => {
  if (loadingMore.value) return
  loadingMore.value = true
  try {
    page.value++
    const libraryId = route.params.id
    const res = await cardChangeReviewAPI.getPendingByLibrary(Number(libraryId), {
      page: page.value,
      pageSize: pageSize
    })
    if (res && res.success && res.data) {
      changes.value.push(...res.data.list)
      changePagination.value = res.data.pagination
    }
  } catch (error) {
    console.error('加载更多失败:', error)
    page.value--
  } finally {
    loadingMore.value = false
  }
}

const stripHtml = (html: string) => {
  if (!html) return ''
  return html
    .replace(/<p>/gi, '')
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n+/g, '\n')
    .trim()
}

const onViewChange = (change: Change) => {
  currentChange.value = change
  changeDetailVisible.value = true
}

const onApproveChange = (change: Change) => {
  currentChange.value = change
  approveConfirmVisible.value = true
}

const confirmApprove = async () => {
  if (!currentChange.value) return
  
  try {
    const res = await cardChangeReviewAPI.approve(currentChange.value.id)
    if (res && res.success) {
      MessagePlugin.success('审核通过')
      changes.value = changes.value.filter(c => c.id !== currentChange.value!.id)
      changePagination.value.total--
      approveConfirmVisible.value = false
      changeDetailVisible.value = false
    }
  } catch (error) {
    console.error('审核通过失败:', error)
    MessagePlugin.error('操作失败')
  }
}

const onRejectChange = (change: Change) => {
  currentChange.value = change
  rejectConfirmVisible.value = true
}

const showRejectDialog = () => {
  rejectConfirmVisible.value = false
  rejectNote.value = ''
  rejectDialogVisible.value = true
}

const onApproveChangeFromDetail = () => {
  if (!currentChange.value) return
  approveConfirmVisible.value = true
}

const onRejectChangeFromDetail = () => {
  rejectConfirmVisible.value = true
}

const confirmReject = async () => {
  if (!currentChange.value) return
  
  try {
    const res = await cardChangeReviewAPI.reject(currentChange.value.id, rejectNote.value)
    if (res && res.success) {
      MessagePlugin.success('已驳回')
      changes.value = changes.value.filter(c => c.id !== currentChange.value!.id)
      changePagination.value.total--
      rejectDialogVisible.value = false
      changeDetailVisible.value = false
    }
  } catch (error) {
    console.error('审核驳回失败:', error)
    MessagePlugin.error('操作失败')
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const formatTime = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return formatDate(dateStr)
}

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #F8FAFC;
}

.custom-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #FFFFFF;
  border-bottom: 1px solid #E2E8F0;
}

.nav-back {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  
  &:active {
    background: #F1F5F9;
  }
}

.nav-title {
  font-size: 18px;
  font-weight: 600;
  color: #1E293B;
}

.nav-right {
  width: 40px;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.content {
  padding: 16px;
}

.library-info-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #FFFFFF;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.info-icon {
  width: 40px;
  height: 40px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-name {
  font-size: 16px;
  font-weight: 600;
  color: #1E293B;
}

.info-count {
  font-size: 13px;
  color: #8B5CF6;
}

.change-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.change-item {
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #E2E8F0;
  cursor: pointer;
  transition: all 0.2s;
  
  &:active {
    background: #F8FAFC;
  }
}

.change-main {
  flex: 1;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.change-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  &.create {
    background: rgba(16, 185, 129, 0.1);
    color: #10B981;
  }
  
  &.update {
    background: rgba(59, 130, 246, 0.1);
    color: #3B82F6;
  }
}

.change-content {
  flex: 1;
  min-width: 0;
}

.change-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.change-type {
  font-size: 13px;
  font-weight: 500;
  
  &.create {
    color: #10B981;
  }
  
  &.update {
    color: #3B82F6;
  }
}

.change-chapter {
  font-size: 11px;
  color: #64748B;
  background: #E2E8F0;
  padding: 2px 6px;
  border-radius: 4px;
}

.change-question {
  margin-bottom: 8px;
  
  .label {
    font-size: 12px;
    color: #94A3B8;
  }
  
  .text {
    font-size: 14px;
    font-weight: 500;
    color: #1E293B;
    margin-left: 4px;
  }
}

.change-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #94A3B8;
}

.meta-divider {
  color: #CBD5E1;
}

.change-actions {
  display: flex;
  gap: 8px;
  margin-left: 12px;
}

.action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  
  &.approve {
    background: rgba(16, 185, 129, 0.1);
    
    &:active {
      background: rgba(16, 185, 129, 0.2);
    }
  }
  
  &.reject {
    background: rgba(239, 68, 68, 0.1);
    
    &:active {
      background: rgba(239, 68, 68, 0.2);
    }
  }
}

.load-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  color: #3B82F6;
  font-size: 14px;
  cursor: pointer;
  
  &:active {
    opacity: 0.7;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  gap: 16px;
}

.empty-text {
  font-size: 16px;
  color: #64748B;
}

.reject-form {
  padding: 16px 0;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #1E293B;
  margin-bottom: 8px;
}

.confirm-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;
}

.confirm-icon {
  margin-bottom: 16px;
  
  &.reject {
    color: #EF4444;
  }
}

.confirm-text {
  font-size: 16px;
  font-weight: 500;
  color: #1E293B;
  margin-bottom: 12px;
}

.confirm-hint {
  font-size: 14px;
  color: #64748B;
  margin-bottom: 8px;
}

.hint-label {
  color: #94A3B8;
}

.hint-value {
  color: #1E293B;
  font-weight: 500;
}

.confirm-note {
  font-size: 13px;
  color: #EF4444;
  margin-top: 8px;
}

:deep(.t-dialog__footer) {
  justify-content: center;
}

.change-detail {
  padding: 8px 0;
}

.change-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.change-type-tag {
  font-size: 13px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 6px;
  
  &.create {
    color: #10B981;
    background: rgba(16, 185, 129, 0.1);
  }
  
  &.update {
    color: #3B82F6;
    background: rgba(59, 130, 246, 0.1);
  }
}

.change-time {
  font-size: 13px;
  color: #94A3B8;
}

.detail-section {
  margin-bottom: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1E293B;
  margin-bottom: 12px;
}

.compare-box {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: #F8FAFC;
  border-radius: 8px;
}

.old-value,
.new-value {
  flex: 1;
  min-width: 0;
}

.value-label {
  display: block;
  font-size: 12px;
  color: #94A3B8;
  margin-bottom: 6px;
}

.value-text {
  font-size: 14px;
  color: #1E293B;
  white-space: pre-wrap;
  word-break: break-word;
}

.arrow {
  display: flex;
  align-items: center;
  padding-top: 20px;
}

.preview-box {
  padding: 12px;
  background: #F8FAFC;
  border-radius: 8px;
}

.preview-row {
  display: flex;
  padding: 8px 0;
  border-bottom: 1px solid #E2E8F0;
  
  &:last-child {
    border-bottom: none;
  }
}

.preview-label {
  width: 60px;
  font-size: 14px;
  color: #64748B;
  flex-shrink: 0;
}

.preview-text {
  flex: 1;
  font-size: 14px;
  color: #1E293B;
  white-space: pre-wrap;
  word-break: break-word;
}

.preview-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag {
  font-size: 11px;
  color: #3B82F6;
  background: rgba(59, 130, 246, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
}

.change-detail-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #E2E8F0;
}
</style>

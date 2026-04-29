<template>
  <div class="blocked-words-container">
    <div class="custom-nav">
      <div class="nav-left" @click="router.back()">
        <t-icon name="chevron-left" size="20px" color="#333" />
      </div>
      <div class="nav-title">屏蔽词管理</div>
      <div class="nav-right"></div>
    </div>

    <div class="content">
      <div class="toolbar">
        <div class="search-box">
          <t-icon name="search" size="18px" color="#999" />
          <input 
            v-model="searchKeyword" 
            placeholder="搜索屏蔽词" 
            @keyup.enter="loadData"
          />
        </div>
        <div class="action-buttons">
          <t-button theme="primary" size="small" @click="showAddDialog = true">
            <template #icon><t-icon name="add" /></template>
            添加
          </t-button>
          <t-button theme="default" size="small" @click="showBatchDialog = true">
            批量添加
          </t-button>
        </div>
      </div>

      <div class="stats-bar">
        <span class="stats-text">共 {{ pagination.total }} 个屏蔽词</span>
      </div>

      <div class="words-list" v-if="!loading">
        <div 
          class="word-item" 
          v-for="item in words" 
          :key="item.id"
        >
          <div class="word-info">
            <span class="word-text">{{ item.word }}</span>
            <span class="word-category" :class="item.category">{{ getCategoryLabel(item.category) }}</span>
          </div>
          <div class="word-actions">
            <t-switch 
              v-model="item.is_enabled" 
              :custom-value="[1, 0]"
              size="small"
              @change="toggleStatus(item)"
            />
            <t-button 
              theme="danger" 
              variant="text" 
              size="small"
              @click="confirmDelete(item)"
            >
              删除
            </t-button>
          </div>
        </div>

        <div class="empty-state" v-if="words.length === 0">
          <t-icon name="folder" size="48px" color="#ddd" />
          <span>暂无屏蔽词</span>
        </div>
      </div>

      <div class="loading-state" v-else>
        <t-icon name="loading" size="32px" color="#3B82F6" />
        <span>加载中...</span>
      </div>

      <div class="pagination" v-if="pagination.totalPages > 1">
        <t-button 
          theme="default" 
          size="small"
          :disabled="pagination.page <= 1"
          @click="changePage(pagination.page - 1)"
        >
          上一页
        </t-button>
        <span class="page-info">{{ pagination.page }} / {{ pagination.totalPages }}</span>
        <t-button 
          theme="default" 
          size="small"
          :disabled="pagination.page >= pagination.totalPages"
          @click="changePage(pagination.page + 1)"
        >
          下一页
        </t-button>
      </div>
    </div>

    <t-dialog
      v-model:visible="showAddDialog"
      header="添加屏蔽词"
      :confirm-btn="{ content: '确定', theme: 'primary' }"
      :on-confirm="addWord"
    >
      <div class="dialog-form">
        <div class="form-item">
          <label>屏蔽词</label>
          <t-input v-model="newWord.word" placeholder="请输入屏蔽词" />
        </div>
        <div class="form-item">
          <label>分类</label>
          <t-select v-model="newWord.category" :options="categoryOptions" />
        </div>
      </div>
    </t-dialog>

    <t-dialog
      v-model:visible="showBatchDialog"
      header="批量添加屏蔽词"
      :confirm-btn="{ content: '确定', theme: 'primary' }"
      :on-confirm="batchAddWords"
    >
      <div class="dialog-form">
        <div class="form-item">
          <label>屏蔽词列表（每行一个）</label>
          <t-textarea 
            v-model="batchWords" 
            placeholder="请输入屏蔽词，每行一个"
            :autosize="{ minRows: 5, maxRows: 10 }"
          />
        </div>
        <div class="form-item">
          <label>分类</label>
          <t-select v-model="batchCategory" :options="categoryOptions" />
        </div>
      </div>
    </t-dialog>

    <t-dialog
      v-model:visible="showDeleteDialog"
      header="确认删除"
      :confirm-btn="{ content: '删除', theme: 'danger' }"
      :on-confirm="deleteWord"
    >
      <p>确定要删除屏蔽词"{{ deleteTarget?.word }}"吗？</p>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { adminAPI } from '@/utils/api'

const router = useRouter()

interface BlockedWord {
  id: number
  word: string
  category: string
  is_enabled: number
  created_at: string
}

const words = ref<BlockedWord[]>([])
const loading = ref(false)
const searchKeyword = ref('')
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0
})

const showAddDialog = ref(false)
const showBatchDialog = ref(false)
const showDeleteDialog = ref(false)
const newWord = ref({ word: '', category: 'general' })
const batchWords = ref('')
const batchCategory = ref('general')
const deleteTarget = ref<BlockedWord | null>(null)

const categoryOptions = [
  { label: '通用', value: 'general' },
  { label: '脏话', value: 'profanity' },
  { label: '侮辱', value: 'insult' },
  { label: '广告', value: 'ad' },
  { label: '其他', value: 'other' }
]

const getCategoryLabel = (category: string) => {
  const option = categoryOptions.find(opt => opt.value === category)
  return option?.label || category
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await adminAPI.getBlockedWords({
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      keyword: searchKeyword.value
    })
    if (res.success && res.data) {
      words.value = res.data.list || []
      pagination.value = {
        ...pagination.value,
        ...res.data.pagination
      }
    }
  } catch (error) {
    console.error('加载屏蔽词失败:', error)
    MessagePlugin.error('加载失败')
  } finally {
    loading.value = false
  }
}

const changePage = (page: number) => {
  pagination.value.page = page
  loadData()
}

const addWord = async () => {
  if (!newWord.value.word.trim()) {
    MessagePlugin.warning('请输入屏蔽词')
    return false
  }

  try {
    const res = await adminAPI.createBlockedWord({
      word: newWord.value.word.trim(),
      category: newWord.value.category
    })
    if (res.success) {
      MessagePlugin.success('添加成功')
      showAddDialog.value = false
      newWord.value = { word: '', category: 'general' }
      loadData()
      return true
    } else {
      MessagePlugin.error(res.message || '添加失败')
      return false
    }
  } catch (error: any) {
    console.error('添加屏蔽词失败:', error)
    MessagePlugin.error(error.message || '添加失败')
    return false
  }
}

const batchAddWords = async () => {
  const wordList = batchWords.value
    .split('\n')
    .map(w => w.trim())
    .filter(w => w.length > 0)

  if (wordList.length === 0) {
    MessagePlugin.warning('请输入屏蔽词')
    return false
  }

  try {
    const res = await adminAPI.batchCreateBlockedWords({
      words: wordList,
      category: batchCategory.value
    })
    if (res.success) {
      MessagePlugin.success(`成功添加 ${res.data?.count || wordList.length} 个屏蔽词`)
      showBatchDialog.value = false
      batchWords.value = ''
      batchCategory.value = 'general'
      loadData()
      return true
    } else {
      MessagePlugin.error(res.message || '添加失败')
      return false
    }
  } catch (error: any) {
    console.error('批量添加屏蔽词失败:', error)
    MessagePlugin.error(error.message || '添加失败')
    return false
  }
}

const toggleStatus = async (item: BlockedWord) => {
  try {
    const res = await adminAPI.updateBlockedWord(item.id, {
      is_enabled: item.is_enabled
    })
    if (res.success) {
      MessagePlugin.success(item.is_enabled ? '已启用' : '已禁用')
    } else {
      item.is_enabled = item.is_enabled ? 0 : 1
      MessagePlugin.error('操作失败')
    }
  } catch (error) {
    console.error('更新状态失败:', error)
    item.is_enabled = item.is_enabled ? 0 : 1
    MessagePlugin.error('操作失败')
  }
}

const confirmDelete = (item: BlockedWord) => {
  deleteTarget.value = item
  showDeleteDialog.value = true
}

const deleteWord = async () => {
  if (!deleteTarget.value) return false

  try {
    const res = await adminAPI.deleteBlockedWord(deleteTarget.value.id)
    if (res.success) {
      MessagePlugin.success('删除成功')
      showDeleteDialog.value = false
      deleteTarget.value = null
      loadData()
      return true
    } else {
      MessagePlugin.error('删除失败')
      return false
    }
  } catch (error) {
    console.error('删除屏蔽词失败:', error)
    MessagePlugin.error('删除失败')
    return false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.blocked-words-container {
  min-height: 100vh;
  background-color: #f5f6fa;
}

.custom-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 44px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  z-index: 100;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.nav-left {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:active {
    opacity: 0.8;
  }
}

.nav-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.nav-right {
  width: 40px;
}

.content {
  padding: 56px 12px 20px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 8px;
  padding: 8px 12px;
  gap: 8px;
  
  input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 14px;
    
    &::placeholder {
      color: #999;
    }
  }
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.stats-bar {
  margin-bottom: 12px;
}

.stats-text {
  font-size: 12px;
  color: #999;
}

.words-list {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.word-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
}

.word-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.word-text {
  font-size: 14px;
  color: #333;
}

.word-category {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: #f0f0f0;
  color: #666;
  
  &.profanity {
    background: #fee2e2;
    color: #dc2626;
  }
  
  &.insult {
    background: #fef3c7;
    color: #d97706;
  }
  
  &.ad {
    background: #dbeafe;
    color: #2563eb;
  }
}

.word-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  gap: 8px;
  color: #999;
  font-size: 14px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  gap: 8px;
  color: #999;
  font-size: 14px;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
}

.page-info {
  font-size: 13px;
  color: #666;
}

.dialog-form {
  padding: 8px 0;
}

.form-item {
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  label {
    display: block;
    font-size: 14px;
    color: #333;
    margin-bottom: 8px;
  }
}
</style>

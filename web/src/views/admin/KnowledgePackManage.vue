<template>
  <div class="container">
    <div class="custom-nav">
      <div class="nav-back" @click="router.back()">
        <t-icon name="chevron-left" size="24px" color="#333" />
      </div>
      <div class="nav-content">
        <span class="nav-title">知识包管理</span>
      </div>
      <div class="nav-right">
        <div class="add-btn" @click="router.push('/admin/knowledge-pack-upload')">
          <t-icon name="add" size="18px" color="#fff" />
        </div>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <input 
        class="search-input" 
        placeholder="搜索知识包" 
        v-model="keyword"
        @keyup.enter="onSearch"
      />
    </div>

    <div class="content">
      <!-- 文件夹管理区域 -->
      <div class="section">
        <div class="section-header">
          <span class="section-title">文件夹管理</span>
          <div class="section-actions">
            <t-button size="small" theme="primary" variant="outline" @click="onCreateFolder">
              <template #icon><t-icon name="add" /></template>
              新建文件夹
            </t-button>
          </div>
        </div>

        <div class="folder-list">
          <!-- 根目录 -->
          <div 
            class="folder-item" 
            :class="{ active: currentFolderId === 'root' }"
            @click="onSelectFolder('root')"
          >
            <div class="folder-icon">
              <t-icon name="folder-open" size="24px" color="#F59E0B" />
            </div>
            <div class="folder-info">
              <div class="folder-name">根目录</div>
              <div class="folder-meta">全部知识包</div>
            </div>
            <div class="folder-count">{{ totalPackCount }}</div>
          </div>

          <!-- 未分类 -->
          <div 
            class="folder-item" 
            :class="{ active: currentFolderId === 'unclassified' }"
            @click="onSelectFolder('unclassified')"
          >
            <div class="folder-icon">
              <t-icon name="folder" size="24px" color="#94A3B8" />
            </div>
            <div class="folder-info">
              <div class="folder-name">未分类</div>
              <div class="folder-meta">未归档的知识包</div>
            </div>
            <div class="folder-count">{{ unclassifiedCount }}</div>
          </div>

          <!-- 自定义文件夹 -->
          <div 
            v-for="folder in folders" 
            :key="folder.id"
            class="folder-item" 
            :class="{ active: currentFolderId === String(folder.id) }"
          >
            <div class="folder-main" @click="onSelectFolder(String(folder.id))">
              <div class="folder-icon">
                <t-icon name="folder" size="24px" color="#3B82F6" />
              </div>
              <div class="folder-info">
                <div class="folder-name">{{ folder.name }}</div>
                <div class="folder-meta">{{ folder.description || '暂无描述' }}</div>
              </div>
              <div class="folder-count">{{ folder.pack_count || 0 }}</div>
            </div>
            <div class="folder-actions">
              <div class="action-btn" @click.stop="onEditFolder(folder)" title="编辑">
                <t-icon name="edit" size="16px" color="#64748B" />
              </div>
              <div class="action-btn delete" @click.stop="onDeleteFolder(folder)" title="删除">
                <t-icon name="delete" size="16px" color="#EF4444" />
              </div>
            </div>
          </div>

          <div class="empty-folder" v-if="folders.length === 0 && !loadingFolders">
            暂无自定义文件夹，点击上方按钮创建
          </div>
        </div>
      </div>

      <!-- 知识包列表区域 -->
      <div class="section">
        <div class="section-header">
          <span class="section-title">{{ currentFolderName }}</span>
        </div>

        <div class="pack-list" v-if="packs.length > 0">
          <div 
            class="pack-item" 
            v-for="pack in packs" 
            :key="pack.id"
          >
            <div class="pack-main" @click="onViewPack(pack)">
              <div class="pack-icon">
                <t-icon name="file-pdf" size="24px" color="#3B82F6" />
              </div>
              <div class="pack-content">
                <div class="pack-title">{{ pack.title }}</div>
                <div class="pack-meta">
                  <span class="meta-item">{{ pack.file_size_formatted }}</span>
                  <span class="meta-divider">·</span>
                  <span class="meta-item">{{ pack.download_count }}次下载</span>
                  <span class="meta-divider">·</span>
                  <span class="meta-item">{{ formatDate(pack.created_at) }}</span>
                </div>
              </div>
            </div>
            <div class="pack-actions">
              <div class="action-btn move" @click.stop="onMoveSinglePack(pack)" title="移动">
                <t-icon name="folder" size="18px" color="#3B82F6" />
              </div>
              <div class="action-btn delete" @click.stop="onDeletePack(pack)" title="删除">
                <t-icon name="delete" size="18px" color="#EF4444" />
              </div>
            </div>
          </div>
        </div>

        <div class="load-more" v-if="hasMore" @click="loadMore">
          <t-loading v-if="loadingMore" size="small" />
          <span v-else>加载更多</span>
        </div>

        <div class="empty-state" v-if="packs.length === 0 && !loadingPacks">
          <t-icon name="folder-open" size="48px" color="#CBD5E1" />
          <span class="empty-text">{{ currentFolderId === 'unclassified' ? '暂无未分类知识包' : '暂无知识包' }}</span>
          <t-button theme="primary" @click="router.push('/admin/knowledge-pack-upload')">
            上传知识包
          </t-button>
        </div>
      </div>
    </div>

    <div class="loading-state" v-if="loadingPacks && packs.length === 0">
      <t-loading text="加载中..." />
    </div>

    <!-- 文件夹编辑弹窗 -->
    <t-dialog
      v-model:visible="folderDialogVisible"
      :header="isEditFolder ? '编辑文件夹' : '新建文件夹'"
      :confirm-btn="{ content: '保存', theme: 'primary' }"
      :cancel-btn="{ content: '取消' }"
      @confirm="confirmFolderSave"
    >
      <div class="folder-form">
        <div class="form-item">
          <label class="form-label required">文件夹名称</label>
          <input 
            class="form-input" 
            v-model="folderForm.name" 
            placeholder="请输入文件夹名称"
            maxlength="100"
          />
        </div>
        <div class="form-item">
          <label class="form-label">文件夹描述</label>
          <textarea 
            class="form-textarea" 
            v-model="folderForm.description" 
            placeholder="请输入文件夹描述（可选）"
            maxlength="500"
            rows="3"
          ></textarea>
        </div>
      </div>
    </t-dialog>

    <!-- 移动到文件夹弹窗 -->
    <t-dialog
      v-model:visible="moveDialogVisible"
      header="移动到文件夹"
      :confirm-btn="{ content: '移动', theme: 'primary' }"
      :cancel-btn="{ content: '取消' }"
      @confirm="confirmMove"
    >
      <div class="move-dialog-content">
        <div 
          class="move-option" 
          :class="{ active: moveTargetFolderId === null }"
          @click="moveTargetFolderId = null"
        >
          <t-icon name="folder-open" size="20px" color="#F59E0B" />
          <span>根目录（未分类）</span>
        </div>
        <div 
          v-for="folder in folders" 
          :key="folder.id"
          class="move-option" 
          :class="{ active: moveTargetFolderId === folder.id }"
          @click="moveTargetFolderId = folder.id"
        >
          <t-icon name="folder" size="20px" color="#3B82F6" />
          <span>{{ folder.name }}</span>
        </div>
      </div>
    </t-dialog>

    <!-- 删除确认弹窗 -->
    <t-dialog
      v-model:visible="deleteDialogVisible"
      header="确认删除"
      :body="deleteDialogMessage"
      :confirm-btn="{ content: '删除', theme: 'danger' }"
      :cancel-btn="{ content: '取消' }"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { knowledgePackAPI, knowledgePackFolderAPI } from '@/utils/api'

interface KnowledgePack {
  id: number
  title: string
  description: string
  file_size_formatted: string
  created_at: string
  download_count: number
  folder_id: number | null
}

interface Folder {
  id: number
  name: string
  description: string
  pack_count: number
}

const router = useRouter()
const packs = ref<KnowledgePack[]>([])
const folders = ref<Folder[]>([])
const loadingPacks = ref(false)
const loadingFolders = ref(false)
const loadingMore = ref(false)
const hasMore = ref(false)
const keyword = ref('')
const currentPage = ref(1)
const pageSize = 20

const currentFolderId = ref<string>('root')
const selectedPacks = ref<number[]>([])

// 文件夹弹窗
const folderDialogVisible = ref(false)
const isEditFolder = ref(false)
const editingFolderId = ref<number | null>(null)
const folderForm = ref({
  name: '',
  description: ''
})

// 移动弹窗
const moveDialogVisible = ref(false)
const moveTargetFolderId = ref<number | null>(null)

// 删除弹窗
const deleteDialogVisible = ref(false)
const deleteDialogMessage = ref('')
const deleteType = ref<'folder' | 'pack'>('pack')
const folderToDelete = ref<Folder | null>(null)

const currentFolderName = computed(() => {
  if (currentFolderId.value === 'root') return '全部知识包'
  if (currentFolderId.value === 'unclassified') return '未分类知识包'
  const folder = folders.value.find(f => String(f.id) === currentFolderId.value)
  return folder ? folder.name : '知识包'
})

const totalPackCount = computed(() => {
  return folders.value.reduce((sum, f) => sum + (f.pack_count || 0), 0)
})

const unclassifiedCount = computed(() => {
  // 这里需要从后端获取未分类数量，暂时用0
  return 0
})

onMounted(() => {
  loadFolders()
  loadPacks()
})

const loadFolders = async () => {
  loadingFolders.value = true
  try {
    const res = await knowledgePackFolderAPI.getList()
    if (res.success && res.data) {
      folders.value = res.data.flat || []
    }
  } catch (error) {
    console.error('加载文件夹列表失败:', error)
  } finally {
    loadingFolders.value = false
  }
}

const loadPacks = async (isLoadMore = false) => {
  if (isLoadMore) {
    loadingMore.value = true
  } else {
    loadingPacks.value = true
    currentPage.value = 1
  }

  try {
    const params: any = {
      page: currentPage.value,
      pageSize,
      keyword: keyword.value
    }

    if (currentFolderId.value !== 'root') {
      params.folderId = currentFolderId.value
    }

    const res = await knowledgePackAPI.getAdminList(params)
    
    if (res.success && res.data) {
      const list = res.data.list || []
      
      if (isLoadMore) {
        packs.value = [...packs.value, ...list]
      } else {
        packs.value = list
      }
      
      hasMore.value = list.length === pageSize
    }
  } catch (error) {
    console.error('加载知识包列表失败:', error)
  } finally {
    loadingPacks.value = false
    loadingMore.value = false
  }
}

const onSearch = () => {
  loadPacks()
}

const onSelectFolder = (folderId: string) => {
  currentFolderId.value = folderId
  loadPacks()
}

const loadMore = () => {
  currentPage.value++
  loadPacks(true)
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const onViewPack = (pack: KnowledgePack) => {
  router.push(`/knowledge-pack/${pack.id}`)
}

// 文件夹操作
const onCreateFolder = () => {
  isEditFolder.value = false
  editingFolderId.value = null
  folderForm.value = {
    name: '',
    description: ''
  }
  folderDialogVisible.value = true
}

const onEditFolder = (folder: Folder) => {
  isEditFolder.value = true
  editingFolderId.value = folder.id
  folderForm.value = {
    name: folder.name,
    description: folder.description || ''
  }
  folderDialogVisible.value = true
}

const confirmFolderSave = async () => {
  if (!folderForm.value.name.trim()) {
    MessagePlugin.warning('请输入文件夹名称')
    return
  }

  try {
    if (isEditFolder.value && editingFolderId.value) {
      const res = await knowledgePackFolderAPI.update(editingFolderId.value, {
        name: folderForm.value.name.trim(),
        description: folderForm.value.description.trim()
      })
      if (res.success) {
        MessagePlugin.success('文件夹更新成功')
        folderDialogVisible.value = false
        loadFolders()
      }
    } else {
      const res = await knowledgePackFolderAPI.create({
        name: folderForm.value.name.trim(),
        description: folderForm.value.description.trim()
      })
      if (res.success) {
        MessagePlugin.success('文件夹创建成功')
        folderDialogVisible.value = false
        loadFolders()
      }
    }
  } catch (err: any) {
    MessagePlugin.error(err.message || '操作失败')
  }
}

const onDeleteFolder = (folder: Folder) => {
  folderToDelete.value = folder
  deleteType.value = 'folder'
  deleteDialogMessage.value = `确定要删除文件夹"${folder.name}"吗？\n文件夹内的知识包将移至未分类。`
  deleteDialogVisible.value = true
}

// 移动知识包
const onMoveSinglePack = (pack: KnowledgePack) => {
  selectedPacks.value = [pack.id]
  moveTargetFolderId.value = pack.folder_id
  moveDialogVisible.value = true
}

const confirmMove = async () => {
  if (selectedPacks.value.length === 0) return

  try {
    const res = await knowledgePackFolderAPI.move(selectedPacks.value, moveTargetFolderId.value)
    if (res.success) {
      MessagePlugin.success('移动成功')
      moveDialogVisible.value = false
      loadPacks()
      loadFolders()
    }
  } catch (err: any) {
    MessagePlugin.error(err.message || '移动失败')
  }
}

// 删除知识包
const onDeletePack = (pack: KnowledgePack) => {
  selectedPacks.value = [pack.id]
  deleteType.value = 'pack'
  deleteDialogMessage.value = `确定要删除知识包"${pack.title}"吗？此操作不可恢复。`
  deleteDialogVisible.value = true
}

const confirmDelete = async () => {
  try {
    if (deleteType.value === 'folder' && folderToDelete.value) {
      const res = await knowledgePackFolderAPI.delete(folderToDelete.value.id)
      if (res.success) {
        MessagePlugin.success('文件夹删除成功')
        if (currentFolderId.value === String(folderToDelete.value.id)) {
          currentFolderId.value = 'root'
          loadPacks()
        }
        loadFolders()
      }
    } else if (deleteType.value === 'pack') {
      for (const id of selectedPacks.value) {
        await knowledgePackAPI.delete(id)
      }
      MessagePlugin.success('删除成功')
      packs.value = packs.value.filter(p => !selectedPacks.value.includes(p.id))
      loadFolders()
    }
  } catch (err: any) {
    MessagePlugin.error(err.message || '删除失败')
  } finally {
    deleteDialogVisible.value = false
    folderToDelete.value = null
  }
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #F8FAFC;
}

.custom-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: #fff;
  border-bottom: 1px solid #E2E8F0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-back {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 8px;
  
  &:active {
    background-color: #F1F5F9;
  }
}

.nav-content {
  flex: 1;
  text-align: center;
}

.nav-title {
  font-size: 17px;
  font-weight: 600;
  color: #1E293B;
}

.nav-right {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.add-btn {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:active {
    transform: scale(0.95);
  }
}

.search-bar {
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #E2E8F0;
}

.search-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 14px;
  background: #F8FAFC;
  
  &:focus {
    outline: none;
    border-color: #3B82F6;
  }
  
  &::placeholder {
    color: #94A3B8;
  }
}

.content {
  padding: 16px;
}

.section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1E293B;
}

.folder-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.folder-item {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 10px;
  padding: 12px;
  border: 1px solid transparent;
  transition: all 0.2s;
  
  &.active {
    background: #EFF6FF;
    border-color: #BFDBFE;
  }
}

.folder-main {
  flex: 1;
  display: flex;
  align-items: center;
  cursor: pointer;
  min-width: 0;
}

.folder-icon {
  width: 40px;
  height: 40px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 12px;
}

.folder-info {
  flex: 1;
  min-width: 0;
}

.folder-name {
  font-size: 14px;
  font-weight: 500;
  color: #1E293B;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.folder-meta {
  font-size: 12px;
  color: #94A3B8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.folder-count {
  font-size: 13px;
  font-weight: 500;
  color: #64748B;
  background: #F1F5F9;
  padding: 2px 8px;
  border-radius: 10px;
  flex-shrink: 0;
}

.folder-actions {
  display: flex;
  gap: 4px;
  margin-left: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  
  &:active {
    background: rgba(0, 0, 0, 0.05);
  }
  
  &.delete:active {
    background: rgba(239, 68, 68, 0.1);
  }
}

.empty-folder {
  text-align: center;
  padding: 20px;
  font-size: 13px;
  color: #94A3B8;
}

.pack-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pack-item {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 10px;
  padding: 12px;
  transition: all 0.2s;
}

.pack-main {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  min-width: 0;
}

.pack-icon {
  width: 40px;
  height: 40px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pack-content {
  flex: 1;
  min-width: 0;
}

.pack-title {
  font-size: 14px;
  font-weight: 500;
  color: #1E293B;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pack-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.meta-item {
  font-size: 11px;
  color: #64748B;
}

.meta-divider {
  color: #CBD5E1;
  font-size: 11px;
}

.pack-actions {
  display: flex;
  gap: 12px;
  margin-left: 8px;
  
  .action-btn.move {
    background: rgba(59, 130, 246, 0.1);
  }
  
  .action-btn.delete {
    background: rgba(239, 68, 68, 0.1);
  }
}

.load-more {
  display: flex;
  justify-content: center;
  padding: 16px;
  font-size: 13px;
  color: #3B82F6;
  cursor: pointer;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  gap: 12px;
  background: #fff;
  border-radius: 10px;
}

.empty-text {
  font-size: 13px;
  color: #94A3B8;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.folder-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  
  &.required::after {
    content: '*';
    color: #EF4444;
    margin-left: 2px;
  }
}

.form-input {
  padding: 10px 12px;
  border: 1px solid #E2E8F0;
  border-radius: 6px;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #3B82F6;
  }
}

.form-textarea {
  padding: 10px 12px;
  border: 1px solid #E2E8F0;
  border-radius: 6px;
  font-size: 14px;
  resize: none;
  
  &:focus {
    outline: none;
    border-color: #3B82F6;
  }
}

.move-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.move-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #1E293B;
  transition: all 0.2s;
  
  &:active {
    background: #F1F5F9;
  }
  
  &.active {
    background: #EFF6FF;
    color: #3B82F6;
    font-weight: 500;
  }
}
</style>

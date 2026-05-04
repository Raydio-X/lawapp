<template>
  <div class="admin-container">
    <div class="custom-nav">
      <div class="nav-content">
        <div class="nav-left">
          <div class="back-btn" @click="router.push('/admin')">
            <t-icon name="chevron-left" size="20px" color="#333" />
          </div>
        </div>
        <div class="nav-title">激活码管理</div>
        <div class="nav-right"></div>
      </div>
    </div>

    <div class="content">
      <div class="generate-section">
        <div class="section-title">生成激活码</div>
        
        <div class="form-row">
          <div class="form-item">
            <label class="form-label">VIP时长</label>
            <div class="duration-options">
              <div 
                class="duration-option" 
                :class="{ active: selectedDuration === 7 }"
                @click="selectedDuration = 7"
              >7天</div>
              <div 
                class="duration-option" 
                :class="{ active: selectedDuration === 30 }"
                @click="selectedDuration = 30"
              >1个月</div>
              <div 
                class="duration-option" 
                :class="{ active: selectedDuration === 90 }"
                @click="selectedDuration = 90"
              >3个月</div>
              <div 
                class="duration-option" 
                :class="{ active: selectedDuration === 180 }"
                @click="selectedDuration = 180"
              >6个月</div>
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-item">
            <label class="form-label">生成数量</label>
            <div class="quantity-input-wrapper">
              <input 
                type="number" 
                class="quantity-input"
                v-model.number="generateQuantity"
                min="1"
                max="100"
              />
              <span class="quantity-hint">最多100个</span>
            </div>
          </div>
        </div>

        <div class="generate-btn" :class="{ disabled: generating }" @click="onGenerate">
          <t-icon v-if="generating" name="loading" size="18px" color="#fff" />
          <span v-else>生成激活码</span>
        </div>
      </div>

      <div class="list-section">
        <div class="section-header">
          <span class="section-title">激活码列表</span>
          <div class="filter-tabs">
            <div 
              class="filter-tab" 
              :class="{ active: statusFilter === 'all' }"
              @click="statusFilter = 'all'"
            >全部</div>
            <div 
              class="filter-tab" 
              :class="{ active: statusFilter === 'unused' }"
              @click="statusFilter = 'unused'"
            >未使用</div>
            <div 
              class="filter-tab" 
              :class="{ active: statusFilter === 'used' }"
              @click="statusFilter = 'used'"
            >已使用</div>
          </div>
        </div>

        <div class="code-list">
          <div class="code-item" v-for="item in filteredCodes" :key="item.id">
            <div class="code-main">
              <div class="code-value">{{ item.code }}</div>
              <div class="code-meta">
                <span class="meta-tag duration">{{ formatDuration(item.duration_days) }}</span>
                <span class="meta-tag status" :class="{ used: item.is_used }">
                  {{ item.is_used ? '已使用' : '未使用' }}
                </span>
              </div>
            </div>
            <div class="code-info">
              <div class="info-row">
                <span class="info-label">生成时间</span>
                <span class="info-value">{{ formatDateTime(item.created_at) }}</span>
              </div>
              <div class="info-row" v-if="item.is_used">
                <span class="info-label">使用时间</span>
                <span class="info-value">{{ formatDateTime(item.used_at) }}</span>
              </div>
              <div class="info-row" v-if="item.is_used && item.used_by_name">
                <span class="info-label">使用者</span>
                <span class="info-value">{{ item.used_by_name }}</span>
              </div>
            </div>
            <div class="code-actions">
              <div class="action-btn copy" @click="onCopyCode(item.code)">
                <t-icon name="file-copy" size="16px" color="#3B82F6" />
              </div>
              <div class="action-btn delete" @click="onDeleteCode(item)" v-if="!item.is_used">
                <t-icon name="delete" size="16px" color="#f5222d" />
              </div>
            </div>
          </div>
          
          <div class="empty-tip" v-if="filteredCodes.length === 0">
            <t-icon name="folder-open" size="48px" color="#ccc" />
            <span>暂无激活码</span>
          </div>
        </div>

        <div class="load-more" v-if="hasMore" @click="loadMore">
          <span>加载更多</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next'
import api, { activationCodeAPI } from '@/utils/api'

const router = useRouter()

const selectedDuration = ref(30)
const generateQuantity = ref(1)
const generating = ref(false)

const codeList = ref<any[]>([])
const statusFilter = ref('all')
const hasMore = ref(false)
const currentPage = ref(1)
const pageSize = 20

const filteredCodes = computed(() => {
  if (statusFilter.value === 'all') {
    return codeList.value
  } else if (statusFilter.value === 'unused') {
    return codeList.value.filter(item => !item.is_used)
  } else {
    return codeList.value.filter(item => item.is_used)
  }
})

const generateCode = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let code = ''
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

const formatDuration = (days: number): string => {
  if (days === 7) return '7天'
  if (days === 30) return '1个月'
  if (days === 90) return '3个月'
  if (days === 180) return '6个月'
  return `${days}天`
}

const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const onGenerate = async () => {
  if (generating.value) return
  
  if (generateQuantity.value < 1 || generateQuantity.value > 100) {
    MessagePlugin.warning('生成数量需在1-100之间')
    return
  }
  
  generating.value = true
  
  try {
    const codes: string[] = []
    for (let i = 0; i < generateQuantity.value; i++) {
      codes.push(generateCode())
    }
    
    const res = await activationCodeAPI.batchCreate({
      codes,
      duration_days: selectedDuration.value
    })
    
    if (res.success) {
      MessagePlugin.success(`成功生成${generateQuantity.value}个激活码`)
      loadCodeList()
    } else {
      MessagePlugin.error(res.message || '生成失败')
    }
  } catch (error: any) {
    console.error('生成激活码失败:', error)
    MessagePlugin.error(error.message || '生成失败')
  } finally {
    generating.value = false
  }
}

const loadCodeList = async (page = 1) => {
  try {
    const res = await activationCodeAPI.getList({
      page,
      pageSize
    })
    
    console.log('加载激活码列表响应:', res)
    
    if (res.success && res.data) {
      console.log('列表数据:', res.data)
      const list = res.data.list || []
      if (page === 1) {
        codeList.value = list
      } else {
        codeList.value = [...codeList.value, ...list]
      }
      hasMore.value = res.data.hasMore || false
      currentPage.value = page
    } else {
      console.error('响应数据格式错误:', res)
      MessagePlugin.error('获取激活码列表失败')
    }
  } catch (error) {
    console.error('加载激活码列表失败:', error)
    MessagePlugin.error('加载激活码列表失败')
  }
}

const loadMore = () => {
  if (hasMore.value) {
    loadCodeList(currentPage.value + 1)
  }
}

const onCopyCode = async (code: string) => {
  try {
    await navigator.clipboard.writeText(code)
    MessagePlugin.success('已复制到剪贴板')
  } catch (error) {
    MessagePlugin.error('复制失败')
  }
}

const onDeleteCode = (item: any) => {
  const dialog = DialogPlugin.confirm({
    header: '删除确认',
    body: `确定要删除激活码"${item.code}"吗？`,
    confirmBtn: '删除',
    cancelBtn: '取消',
    onConfirm: async () => {
      try {
        const res = await activationCodeAPI.delete(item.id)
        if (res.success) {
          MessagePlugin.success('删除成功')
          codeList.value = codeList.value.filter(c => c.id !== item.id)
        } else {
          MessagePlugin.error(res.message || '删除失败')
        }
      } catch (error) {
        MessagePlugin.error('删除失败')
      }
      dialog.hide()
    }
  })
}

onMounted(() => {
  loadCodeList()
})
</script>

<style scoped>
.admin-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.custom-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.nav-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 50px;
  padding: 0 16px;
}

.nav-left, .nav-right {
  width: 40px;
}

.back-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  cursor: pointer;
  
  &:active {
    background: #f5f5f5;
  }
}

.nav-title {
  font-size: 17px;
  font-weight: 600;
  color: #333;
}

.content {
  padding: 12px;
}

.generate-section {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.form-row {
  margin-bottom: 16px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #666;
}

.duration-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.duration-option {
  padding: 8px 16px;
  background: #f5f5f5;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:active {
    transform: scale(0.98);
  }
  
  &.active {
    background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
    color: #1a1a2e;
    font-weight: 600;
  }
}

.quantity-input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.quantity-input {
  width: 100px;
  height: 40px;
  padding: 0 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  text-align: center;
  
  &:focus {
    outline: none;
    border-color: #3B82F6;
  }
}

.quantity-hint {
  font-size: 12px;
  color: #999;
}

.generate-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 44px;
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
  border-radius: 8px;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
  
  &:active {
    transform: scale(0.98);
  }
  
  &.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.list-section {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.filter-tabs {
  display: flex;
  gap: 8px;
}

.filter-tab {
  padding: 6px 12px;
  background: #f5f5f5;
  border-radius: 6px;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  
  &.active {
    background: #3B82F6;
    color: #fff;
  }
}

.code-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.code-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.code-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.code-value {
  font-size: 16px;
  font-weight: 600;
  font-family: monospace;
  color: #333;
  letter-spacing: 1px;
}

.code-meta {
  display: flex;
  gap: 6px;
}

.meta-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  
  &.duration {
    background: rgba(59, 130, 246, 0.1);
    color: #3B82F6;
  }
  
  &.status {
    background: rgba(16, 185, 129, 0.1);
    color: #10B981;
    
    &.used {
      background: rgba(153, 153, 153, 0.1);
      color: #999;
    }
  }
}

.code-info {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #999;
}

.info-value {
  font-size: 12px;
  color: #666;
}

.code-actions {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
  
  &:active {
    transform: scale(0.95);
  }
  
  &.copy {
    background: rgba(59, 130, 246, 0.1);
  }
  
  &.delete {
    background: rgba(245, 34, 45, 0.1);
  }
}

.empty-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  gap: 12px;
  
  span {
    font-size: 14px;
    color: #999;
  }
}

.load-more {
  display: flex;
  justify-content: center;
  padding: 16px 0;
  cursor: pointer;
  
  span {
    font-size: 14px;
    color: #3B82F6;
  }
}
</style>

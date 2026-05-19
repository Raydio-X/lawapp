<template>
  <div class="knowledge-packs-section">
    <div class="section-header">
      <div class="section-title-wrap">
        <div class="section-bar"></div>
        <span class="section-title">精选知识包</span>
      </div>
      <div class="more-link" @click="goToMore">
        <span>查看更多</span>
        <t-icon name="chevron-right" size="14px" color="#60A5FA" />
      </div>
    </div>

    <div class="packs-scroll" v-if="packs.length > 0">
      <div class="packs-list">
        <div 
          class="pack-card" 
          v-for="pack in packs" 
          :key="pack.id"
          @click="onPackTap(pack)"
        >
          <div class="pack-icon">
            <t-icon name="file-pdf" size="32px" color="#3B82F6" />
          </div>
          <div class="pack-content">
            <div class="pack-title">{{ pack.title }}</div>
            <div class="pack-desc">{{ pack.description || '暂无简介' }}</div>
            <div class="pack-meta">
              <span class="meta-item">
                <t-icon name="download" size="12px" color="#94A3B8" />
                {{ pack.download_count || 0 }}次下载
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="empty-state" v-else-if="!loading">
      <t-icon name="folder-open" size="40px" color="#CBD5E1" />
      <span class="empty-text">暂无精选知识包</span>
    </div>

    <div class="loading-state" v-if="loading">
      <t-loading text="加载中..." />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { knowledgePackAPI } from '@/utils/api'

interface KnowledgePack {
  id: number
  title: string
  description: string
  file_path: string
  file_name: string
  file_size: number
  file_size_formatted: string
  created_at: string
  download_count: number
  view_count: number
}

const router = useRouter()
const packs = ref<KnowledgePack[]>([])
const loading = ref(false)

onMounted(() => {
  loadPacks()
})

const loadPacks = async () => {
  loading.value = true
  try {
    const res = await knowledgePackAPI.getFeatured(6)
    if (res && res.success && res.data) {
      packs.value = res.data
    }
  } catch (error) {
    console.error('加载精选知识包失败:', error)
  } finally {
    loading.value = false
  }
}

const onPackTap = (pack: KnowledgePack) => {
  router.push(`/knowledge-pack/${pack.id}`)
}

const goToMore = () => {
  router.push('/knowledge-packs')
}

defineExpose({
  refresh: loadPacks
})
</script>

<style lang="scss" scoped>
.knowledge-packs-section {
  margin-top: 16px;
  padding: 0 14px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-bar {
  width: 3px;
  height: 16px;
  border-radius: 1.5px;
  background: linear-gradient(180deg, #10B981 0%, #34D399 100%);
}

.section-title {
  font-size: 17px;
  font-weight: 700;
  color: #1E293B;
  letter-spacing: 0.25px;
}

.more-link {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #3B82F6;
  gap: 2px;
  padding: 4px 8px;
  background: rgba(59, 130, 246, 0.06);
  border-radius: 10px;
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:active {
    background: rgba(59, 130, 246, 0.12);
  }
}

.packs-scroll {
  overflow-x: auto;
  margin: 0 -14px;
  padding: 0 14px;
  -webkit-overflow-scrolling: touch;
  
  &::-webkit-scrollbar {
    display: none;
  }
}

.packs-list {
  display: flex;
  gap: 12px;
  padding: 4px 0;
}

.pack-card {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  width: 210px;
  background: linear-gradient(145deg, #FFFFFF 0%, #f0f7fd 100%);
  border-radius: 8px;
  padding: 14px;
  box-shadow: 0 2px 12px rgba(16, 185, 129, 0.06);
  border: 1px solid #E2E8F0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  cursor: pointer;
  
  &:active {
    transform: scale(0.97);
    box-shadow: 0 1px 6px rgba(16, 185, 129, 0.1);
  }
}

.pack-icon {
  width: 60px;
  height: 60px;
  background: rgba(0, 76, 255, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 14px;
}

.pack-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.pack-title {
  font-size: 14px;
  font-weight: 600;
  color: #1E293B;
  line-height: 1.3;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.pack-desc {
  font-size: 12px;
  color: #64748B;
  line-height: 1.4;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.pack-meta {
  display: flex;
  gap: 12px;
  margin-top: auto;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #94A3B8;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 0;
  gap: 10px;
}

.empty-text {
  font-size: 14px;
  color: #94A3B8;
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}
</style>

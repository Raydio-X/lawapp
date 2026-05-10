<template>
  <div class="user-detail-page">
    <div class="custom-nav">
      <div class="nav-content">
        <div class="nav-back" @click="router.back()">
          <t-icon name="chevron-left" size="24px" color="#333" />
        </div>
        <span class="nav-title">用户详情</span>
        <div class="nav-placeholder"></div>
      </div>
    </div>

    <div class="page-content" v-if="userDetail">
      <div class="user-header">
        <div class="user-avatar-section">
          <img v-if="userDetail.avatar" :src="userDetail.avatar" class="avatar-img" />
          <div v-else class="avatar-placeholder">
            <t-icon name="user" size="48px" color="#fff" />
          </div>
          <div class="vip-badge" v-if="userDetail.is_vip">VIP</div>
        </div>
        <div class="user-name">{{ userDetail.nickname || '未设置昵称' }}</div>
        <div class="user-role">
          <t-tag v-if="userDetail.role === 'admin'" theme="warning" variant="light" size="large">管理员</t-tag>
          <t-tag v-else theme="primary" variant="light" size="large">普通用户</t-tag>
        </div>
      </div>

      <div class="info-section">
        <div class="section-title">基本信息</div>
        <div class="info-card">
          <div class="info-item">
            <span class="info-label">用户ID</span>
            <span class="info-value">{{ userDetail.user_id }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">性别</span>
            <span class="info-value">{{ userDetail.gender }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">手机号</span>
            <span class="info-value">{{ userDetail.phone || '未绑定' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">注册时间</span>
            <span class="info-value">{{ formatDate(userDetail.created_at) }}</span>
          </div>
          <div class="info-item" v-if="userDetail.is_vip">
            <span class="info-label">VIP到期</span>
            <span class="info-value vip-text">{{ formatDate(userDetail.vip_expires_at) }}</span>
          </div>
          <div class="info-item" v-if="userDetail.daily_goal">
            <span class="info-label">每日目标</span>
            <span class="info-value">{{ userDetail.daily_goal }}张卡片</span>
          </div>
          <div class="info-item full-width" v-if="userDetail.bio">
            <span class="info-label">个人简介</span>
            <span class="info-value bio-text">{{ userDetail.bio }}</span>
          </div>
        </div>
      </div>

      <div class="stats-section">
        <div class="section-title">数据统计</div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon blue">
              <t-icon name="folder" size="24px" color="#3B82F6" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ userDetail.library_count || 0 }}</span>
              <span class="stat-label">知识库</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon green">
              <t-icon name="file" size="24px" color="#52c41a" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ userDetail.card_count || 0 }}</span>
              <span class="stat-label">卡片</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon orange">
              <t-icon name="chat" size="24px" color="#fa8c16" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ userDetail.comment_count || 0 }}</span>
              <span class="stat-label">评论</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon red">
              <t-icon name="heart" size="24px" color="#f5222d" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ userDetail.favorite_count || 0 }}</span>
              <span class="stat-label">收藏</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon purple">
              <t-icon name="book" size="24px" color="#722ed1" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ userDetail.study_count || 0 }}</span>
              <span class="stat-label">学习次数</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon cyan">
              <t-icon name="time" size="24px" color="#13c2c2" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ formatStudyTime(userDetail.total_study_time) }}</span>
              <span class="stat-label">学习时长</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="loading-container" v-else>
      <t-loading text="加载中..." />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import api from '@/utils/api'

defineOptions({
  name: 'AdminUserDetail'
})

const router = useRouter()
const route = useRoute()
const userDetail = ref<any>(null)

const loadUserDetail = async () => {
  const userId = route.params.id
  if (!userId) {
    MessagePlugin.error('用户ID不存在')
    router.back()
    return
  }

  try {
    const res = await api.get(`/admin/users/${userId}`)
    if (res.success && res.data) {
      userDetail.value = res.data
    } else {
      MessagePlugin.error(res.message || '获取用户详情失败')
      router.back()
    }
  } catch (error) {
    console.error('获取用户详情失败:', error)
    MessagePlugin.error('获取用户详情失败')
    router.back()
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const formatStudyTime = (seconds: number) => {
  if (!seconds || seconds === 0) return '0分钟'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}小时${minutes > 0 ? minutes + '分钟' : ''}`
  }
  return `${minutes}分钟`
}

onMounted(() => {
  loadUserDetail()
})
</script>

<style scoped lang="scss">
.user-detail-page {
  min-height: 100vh;
  background-color: #f5f6fa;
}

.custom-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background-color: #fff;
  z-index: 100;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.nav-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 16px;
}

.nav-back {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f5f5f5;
  }
}

.nav-title {
  font-size: 17px;
  font-weight: 600;
  color: #333;
}

.nav-placeholder {
  width: 40px;
}

.page-content {
  padding: 72px 16px 24px;
}

.user-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0;
  background-color: #fff;
  border-radius: 12px;
  margin-bottom: 16px;
}

.user-avatar-section {
  position: relative;
  margin-bottom: 16px;
}

.avatar-img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.vip-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  border: 2px solid #fff;
}

.user-name {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.user-role {
  margin-bottom: 8px;
}

.info-section,
.stats-section {
  background-color: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.info-card {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 4px 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #eee;

  &:last-child {
    border-bottom: none;
  }

  &.full-width {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

.info-label {
  font-size: 14px;
  color: #666;
}

.info-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;

  &.vip-text {
    color: #FFD700;
    font-weight: 600;
  }

  &.bio-text {
    word-break: break-all;
    line-height: 1.6;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 12px;
  transition: all 0.2s;

  &:hover {
    background-color: #f0f1f2;
  }
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;

  &.blue {
    background-color: rgba(59, 130, 246, 0.1);
  }

  &.green {
    background-color: rgba(82, 196, 26, 0.1);
  }

  &.orange {
    background-color: rgba(250, 140, 22, 0.1);
  }

  &.red {
    background-color: rgba(245, 34, 45, 0.1);
  }

  &.purple {
    background-color: rgba(114, 46, 209, 0.1);
  }

  &.cyan {
    background-color: rgba(19, 194, 194, 0.1);
  }
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.stat-label {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}
</style>

<template>
  <div class="user-list-page">
    <div class="custom-nav">
      <div class="nav-content">
        <div class="nav-back" @click="router.back()">
          <t-icon name="chevron-left" size="24px" color="#333" />
        </div>
        <span class="nav-title">用户列表</span>
        <div class="nav-placeholder"></div>
      </div>
    </div>

    <div class="search-bar">
      <input 
        class="search-input" 
        placeholder="搜索用户昵称/ID" 
        v-model="userKeyword"
        @keyup.enter="onUserSearch"
      />
    </div>

    <div class="page-content">
      <div class="user-item" v-for="user in users" :key="user.id" @click="onViewUserDetail(user)">
        <div class="user-avatar-wrapper">
          <img v-if="user.avatar" :src="user.avatar" class="user-avatar-img" />
          <div v-else class="user-avatar-placeholder">
            <t-icon name="user" size="24px" color="#fff" />
          </div>
          <div class="vip-badge" v-if="user.is_vip">VIP</div>
        </div>
        <div class="user-info">
          <div class="user-name-row">
            <span class="user-nickname">{{ user.nickname || '未设置昵称' }}</span>
            <t-tag v-if="user.role === 'admin'" theme="warning" variant="light" size="small">管理员</t-tag>
          </div>
          <div class="user-meta">
            <span class="user-id">ID: {{ user.user_id }}</span>
            <span class="user-divider">·</span>
            <span class="user-stat">{{ user.library_count || 0 }}知识库</span>
            <span class="user-divider">·</span>
            <span class="user-stat">{{ user.card_count || 0 }}卡片</span>
          </div>
        </div>
        <t-icon name="chevron-right" size="18px" color="#ccc" />
      </div>

      <div class="load-more" v-if="userHasMore" @click="loadMoreUsers">
        <span>加载更多</span>
      </div>

      <div class="empty-tip" v-if="users.length === 0 && !userLoading">
        <span>暂无用户</span>
      </div>

      <div class="loading-tip" v-if="userLoading">
        <span>加载中...</span>
      </div>

      <div class="bottom-placeholder"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import api from '@/utils/api'

defineOptions({
  name: 'AdminUserList'
})

const router = useRouter()

const users = ref<any[]>([])
const userKeyword = ref('')
const userHasMore = ref(false)
const userPage = ref(1)
const userLoading = ref(false)

const loadUsers = async () => {
  if (userLoading.value) return
  userLoading.value = true
  try {
    const params: any = {
      page: userPage.value,
      pageSize: 20
    }
    if (userKeyword.value) {
      params.keyword = userKeyword.value
    }
    const res = await api.get('/admin/users', params)
    if (res.success && res.data) {
      const list = res.data.list || []
      users.value = userPage.value === 1 ? list : [...users.value, ...list]
      userHasMore.value = list.length >= 20
    }
  } catch (error) {
    console.error('加载用户列表失败:', error)
    MessagePlugin.error('加载用户列表失败')
  } finally {
    userLoading.value = false
  }
}

const loadMoreUsers = () => {
  userPage.value++
  loadUsers()
}

const onUserSearch = () => {
  userPage.value = 1
  users.value = []
  loadUsers()
}

const onViewUserDetail = (user: any) => {
  router.push(`/admin/users/${user.id}`)
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped lang="scss">
.user-list-page {
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

.search-bar {
  position: fixed;
  top: 56px;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background-color: #fff;
  z-index: 99;
  border-bottom: 1px solid #f0f0f0;
}

.search-input {
  width: 100%;
  height: 40px;
  padding: 0 16px;
  border: 1px solid #e8e8e8;
  border-radius: 20px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #3B82F6;
  }
}

.page-content {
  padding: 120px 16px 24px;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: #fff;
  border-radius: 12px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #f8f9fa;
  }

  &:active {
    background-color: #f0f1f2;
  }
}

.user-avatar-wrapper {
  position: relative;
  width: 48px;
  height: 48px;
  margin-right: 12px;
  flex-shrink: 0;
}

.user-avatar-img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.user-avatar-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.vip-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 4px;
  border-radius: 4px;
  border: 2px solid #fff;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.user-nickname {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-meta {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #999;
}

.user-id {
  color: #666;
}

.user-divider {
  margin: 0 6px;
  color: #ddd;
}

.user-stat {
  color: #999;
}

.load-more {
  padding: 16px;
  text-align: center;
  color: #3B82F6;
  font-size: 14px;
  cursor: pointer;
}

.empty-tip,
.loading-tip {
  padding: 60px 20px;
  text-align: center;
  color: #999;
  font-size: 14px;
}

.bottom-placeholder {
  height: 24px;
}
</style>

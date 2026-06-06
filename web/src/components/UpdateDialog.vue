<template>
  <div class="update-dialog-overlay" v-if="visible">
    <div class="update-dialog" :class="{ 'force-update': forceUpdate }">
      <!-- 标题区域 -->
      <div class="dialog-header">
        <div class="header-icon">
          <t-icon name="download" size="32px" />
        </div>
        <h3 class="header-title">{{ forceUpdate ? '发现新版本' : '有新版本可用' }}</h3>
        <p class="header-version">v{{ latestVersion?.versionName }}</p>
      </div>

      <!-- 更新日志 -->
      <div class="dialog-content">
        <div class="update-log" v-if="latestVersion?.updateLog">
          <h4 class="log-title">更新内容</h4>
          <div class="log-content">{{ latestVersion.updateLog }}</div>
        </div>
        <div class="update-info" v-else>
          <p>新版本已发布，建议您更新以获得更好的体验。</p>
        </div>

        <!-- 强制更新提示 -->
        <div class="force-notice" v-if="forceUpdate">
          <t-icon name="error-circle" size="16px" />
          <span>此版本为重要更新，必须更新后才能继续使用</span>
        </div>
      </div>

      <!-- 按钮区域 -->
      <div class="dialog-footer">
        <!-- 强制更新：只显示更新按钮 -->
        <template v-if="forceUpdate">
          <button class="btn-update primary" @click="handleUpdate" :disabled="updating">
            <t-icon v-if="updating" name="loading" size="18px" class="spin" />
            <span>{{ updating ? '正在下载...' : '立即更新' }}</span>
          </button>
        </template>

        <!-- 可选更新：显示更新、忽略按钮 -->
        <template v-else>
          <button class="btn-ignore" @click="handleIgnore">忽略此版本</button>
          <button class="btn-update primary" @click="handleUpdate" :disabled="updating">
            <t-icon v-if="updating" name="loading" size="18px" class="spin" />
            <span>{{ updating ? '正在下载...' : '立即更新' }}</span>
          </button>
        </template>
      </div>

      <!-- 下载进度 -->
      <div class="download-progress" v-if="downloading">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
        </div>
        <p class="progress-text">{{ progress }}%</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import { VersionInfo, setIgnoredVersion } from '@/utils/versionService'
import { AppUpdate } from '@/plugins/AppUpdate'

const props = defineProps<{
  visible: boolean
  latestVersion: VersionInfo | null
  forceUpdate: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update'): void
}>()

const updating = ref(false)
const downloading = ref(false)
const progress = ref(0)

const handleUpdate = async () => {
  if (!props.latestVersion) {
    MessagePlugin.error('版本信息获取失败')
    return
  }

  updating.value = true
  downloading.value = true
  progress.value = 0

  try {
    console.log('[UpdateDialog] 开始下载更新:', props.latestVersion.downloadUrl)

    // 添加进度监听
    const progressListener = await AppUpdate.addListener('downloadProgress', (data) => {
      progress.value = data.progress
    })

    // 调用原生插件下载并安装 APK
    const result = await AppUpdate.downloadAndInstall({
      url: props.latestVersion.downloadUrl,
      versionName: props.latestVersion.versionName
    })

    // 移除进度监听
    progressListener.remove()

    if (result.success) {
      MessagePlugin.success('下载完成，正在安装...')
    }
  } catch (error: any) {
    console.error('[UpdateDialog] 下载更新失败:', error)
    MessagePlugin.error(error.message || '下载失败，请稍后重试')
  } finally {
    updating.value = false
    downloading.value = false
  }
}

const handleIgnore = () => {
  if (props.latestVersion) {
    setIgnoredVersion(props.latestVersion.versionName)
    MessagePlugin.success('已忽略此版本')
    emit('close')
  }
}
</script>

<style scoped>
.update-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.update-dialog {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 360px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.dialog-header {
  background: linear-gradient(135deg, #1890ff 0%, #0052d9 100%);
  padding: 24px 20px;
  text-align: center;
  color: #fff;
}

.header-icon {
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 4px;
}

.header-version {
  font-size: 14px;
  opacity: 0.9;
  margin: 0;
}

.dialog-content {
  padding: 20px;
}

.update-log {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
}

.log-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px;
}

.log-content {
  font-size: 13px;
  color: #666;
  line-height: 1.6;
  white-space: pre-wrap;
}

.update-info {
  font-size: 14px;
  color: #666;
  text-align: center;
}

.force-notice {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding: 10px 12px;
  background: #fff3cd;
  border-radius: 8px;
  font-size: 13px;
  color: #856404;
}

.dialog-footer {
  padding: 0 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-update,
.btn-ignore {
  width: 100%;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.btn-update.primary {
  background: linear-gradient(135deg, #1890ff 0%, #0052d9 100%);
  color: #fff;
  border: none;
}

.btn-update.primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);
}

.btn-update.primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-ignore {
  background: transparent;
  color: #999;
  border: 1px solid #ddd;
}

.btn-ignore:hover {
  border-color: #bbb;
  color: #666;
}

.download-progress {
  padding: 0 20px 20px;
}

.progress-bar {
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1890ff 0%, #0052d9 100%);
  transition: width 0.3s;
}

.progress-text {
  text-align: center;
  font-size: 12px;
  color: #999;
  margin: 8px 0 0;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>

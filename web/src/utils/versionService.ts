import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import api from './api'

// 版本信息接口
export interface VersionInfo {
  versionCode: number
  versionName: string
  platform: string
  downloadUrl: string
  forceUpdate: boolean
  updateLog: string
  releaseDate: string
}

export interface CheckResult {
  needUpdate: boolean
  currentVersion: string
  latestVersion: VersionInfo | null
}

// 检查频率配置
export type CheckFrequency = 'always' | 'daily' | 'weekly' | 'never'

// 存储键
const STORAGE_KEYS = {
  LAST_CHECK_TIME: 'version_last_check_time',
  IGNORED_VERSION: 'version_ignored',
  CHECK_FREQUENCY: 'version_check_frequency'
}

/**
 * 版本号比较函数
 * @param v1 版本号1，如 "1.2.3"
 * @param v2 版本号2，如 "1.2.4"
 * @returns v1 < v2 返回 -1，v1 = v2 返回 0，v1 > v2 返回 1
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number)
  const parts2 = v2.split('.').map(Number)

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0
    const p2 = parts2[i] || 0

    if (p1 < p2) return -1
    if (p1 > p2) return 1
  }

  return 0
}

/**
 * 判断是否为大版本更新（主版本号变化）
 */
export function isMajorUpdate(currentVersion: string, latestVersion: string): boolean {
  const currentMajor = parseInt(currentVersion.split('.')[0], 10)
  const latestMajor = parseInt(latestVersion.split('.')[0], 10)
  return latestMajor > currentMajor
}

/**
 * 获取当前应用版本
 */
async function getCurrentVersion(): Promise<string> {
  if (Capacitor.isNativePlatform()) {
    try {
      const info = await App.getInfo()
      return info.version || '1.0.0'
    } catch (error) {
      console.error('[VersionService] 获取应用版本失败:', error)
      return '1.0.0'
    }
  }
  // Web 端从 package.json 或环境变量获取
  return import.meta.env.VITE_APP_VERSION || '1.0.0'
}

/**
 * 获取上次检查时间
 */
function getLastCheckTime(): number {
  const time = localStorage.getItem(STORAGE_KEYS.LAST_CHECK_TIME)
  return time ? parseInt(time, 10) : 0
}

/**
 * 设置上次检查时间
 */
function setLastCheckTime(time: number): void {
  localStorage.setItem(STORAGE_KEYS.LAST_CHECK_TIME, time.toString())
}

/**
 * 获取检查频率
 */
function getCheckFrequency(): CheckFrequency {
  return (localStorage.getItem(STORAGE_KEYS.CHECK_FREQUENCY) as CheckFrequency) || 'daily'
}

/**
 * 设置检查频率
 */
export function setCheckFrequency(frequency: CheckFrequency): void {
  localStorage.setItem(STORAGE_KEYS.CHECK_FREQUENCY, frequency)
}

/**
 * 检查是否应该执行版本检查
 */
function shouldCheckVersion(): boolean {
  const frequency = getCheckFrequency()

  if (frequency === 'never') {
    return false
  }

  if (frequency === 'always') {
    return true
  }

  const lastCheck = getLastCheckTime()
  const now = Date.now()

  if (frequency === 'daily') {
    // 每天检查一次
    const lastCheckDate = new Date(lastCheck).toDateString()
    const nowDate = new Date(now).toDateString()
    return lastCheckDate !== nowDate
  }

  if (frequency === 'weekly') {
    // 每周检查一次
    const weekMs = 7 * 24 * 60 * 60 * 1000
    return now - lastCheck > weekMs
  }

  return true
}

/**
 * 获取已忽略的版本
 */
function getIgnoredVersion(): string | null {
  return localStorage.getItem(STORAGE_KEYS.IGNORED_VERSION)
}

/**
 * 设置忽略的版本
 */
export function setIgnoredVersion(version: string): void {
  localStorage.setItem(STORAGE_KEYS.IGNORED_VERSION, version)
}

/**
 * 清除忽略的版本
 */
export function clearIgnoredVersion(): void {
  localStorage.removeItem(STORAGE_KEYS.IGNORED_VERSION)
}

/**
 * 检查版本更新
 * @param force 是否强制检查（忽略频率设置）
 */
export async function checkUpdate(force: boolean = false): Promise<CheckResult | null> {
  // 非原生平台不检查
  if (!Capacitor.isNativePlatform()) {
    return null
  }

  // 检查平台
  const platform = Capacitor.getPlatform()
  if (platform !== 'android') {
    return null
  }

  // 检查频率
  if (!force && !shouldCheckVersion()) {
    return null
  }

  try {
    const currentVersion = await getCurrentVersion()

    // 调用后端接口检查版本
    const response = await api.post('/version/check', {
      currentVersion,
      platform: 'android'
    })

    // 更新检查时间
    setLastCheckTime(Date.now())

    if (response.success && response.data) {
      const result = response.data as CheckResult

      // 如果是可选更新，检查是否被忽略
      if (result.needUpdate && result.latestVersion && !result.latestVersion.forceUpdate) {
        const ignoredVersion = getIgnoredVersion()
        if (ignoredVersion === result.latestVersion.versionName) {
          return { ...result, needUpdate: false }
        }
      }

      return result
    }

    return null
  } catch (error) {
    console.error('[VersionService] 检查版本更新失败:', error)
    return null
  }
}

/**
 * 获取最新版本信息
 */
export async function getLatestVersion(): Promise<VersionInfo | null> {
  try {
    const response = await api.get<{ latestVersion: VersionInfo | null }>('/version/latest', {
      platform: 'android'
    })

    if (response.success && response.data?.latestVersion) {
      return response.data.latestVersion
    }

    return null
  } catch (error) {
    console.error('[VersionService] 获取最新版本失败:', error)
    return null
  }
}

/**
 * 版本检查服务
 */
export const VersionService = {
  checkUpdate,
  getLatestVersion,
  getCurrentVersion,
  compareVersions,
  isMajorUpdate,
  setCheckFrequency,
  setIgnoredVersion,
  clearIgnoredVersion,
  getIgnoredVersion: () => getIgnoredVersion(),
  getCheckFrequency: () => getCheckFrequency()
}

export default VersionService

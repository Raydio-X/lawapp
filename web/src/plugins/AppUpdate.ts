import { registerPlugin } from '@capacitor/core'

export interface AppUpdatePlugin {
  /**
   * 下载并安装 APK
   */
  downloadAndInstall(options: {
    url: string
    versionName?: string
  }): Promise<{ success: boolean; message: string }>

  /**
   * 检查是否有安装权限
   */
  checkInstallPermission(): Promise<{ hasPermission: boolean }>

  /**
   * 请求安装权限
   */
  requestInstallPermission(): Promise<void>

  /**
   * 打开应用设置页面
   */
  openAppSettings(): Promise<void>

  /**
   * 添加下载进度监听器
   */
  addListener(
    eventName: 'downloadProgress',
    listenerFunc: (data: { progress: number }) => void
  ): Promise<{ remove: () => void }>
}

export const AppUpdate = registerPlugin<AppUpdatePlugin>('AppUpdate')

export default AppUpdate

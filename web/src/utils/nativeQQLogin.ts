import { Capacitor, registerPlugin } from '@capacitor/core'

export interface QQLoginResult {
  success: boolean
  openId?: string
  accessToken?: string
  expiresIn?: number
  unionId?: string
  error?: string
}

export interface QQSupportResult {
  isSupported: boolean
  appId: string
  hasNetwork: boolean
}

export interface QQLoginPlugin {
  login(): Promise<QQLoginResult>
  logout(): Promise<{ success: boolean }>
  isLoggedIn(): Promise<{ isLoggedIn: boolean; openId?: string; accessToken?: string }>
  getUserInfo(): Promise<QQLoginResult>
  checkSupport(): Promise<QQSupportResult>
}

const QQLogin = registerPlugin<QQLoginPlugin>('QQLogin')

export class NativeQQLogin {
  private static instance: NativeQQLogin
  private appId: string

  private constructor() {
    // 根据平台选择不同的 APP ID
    const webAppId = import.meta.env.VITE_QQ_WEB_APP_ID || ''
    const mobileAppId = import.meta.env.VITE_QQ_MOBILE_APP_ID || ''
    this.appId = Capacitor.isNativePlatform() ? mobileAppId : webAppId
  }

  static getInstance(): NativeQQLogin {
    if (!NativeQQLogin.instance) {
      NativeQQLogin.instance = new NativeQQLogin()
    }
    return NativeQQLogin.instance
  }

  /**
   * 检查是否为原生平台
   */
  isNativePlatform(): boolean {
    return Capacitor.isNativePlatform()
  }

  /**
   * 检查是否已登录
   */
  async isLoggedIn(): Promise<{ isLoggedIn: boolean; openId?: string; accessToken?: string }> {
    if (!this.isNativePlatform()) {
      return { isLoggedIn: false }
    }

    try {
      const result = await QQLogin.isLoggedIn()
      return result
    } catch (error) {
      console.error('Check QQ login status error:', error)
      return { isLoggedIn: false }
    }
  }

  /**
   * 发起QQ登录
   */
  async login(): Promise<QQLoginResult> {
    // 先检查平台
    if (!this.isNativePlatform()) {
      return {
        success: false,
        error: '非原生平台，请使用Web QQ登录'
      }
    }
    
    try {
      const result = await QQLogin.login()
      return result
    } catch (error: any) {
      console.error('QQ login error:', error)
      return {
        success: false,
        error: error.message || 'QQ登录失败'
      }
    }
  }

  /**
   * 登出
   */
  async logout(): Promise<boolean> {
    if (!this.isNativePlatform()) {
      return false
    }

    try {
      await QQLogin.logout()
      return true
    } catch (error) {
      console.error('QQ logout error:', error)
      return false
    }
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(): Promise<QQLoginResult> {
    if (!this.isNativePlatform()) {
      return {
        success: false,
        error: '非原生平台'
      }
    }

    try {
      const result = await QQLogin.getUserInfo()
      return result
    } catch (error: any) {
      console.error('Get QQ user info error:', error)
      return {
        success: false,
        error: error.message || '获取用户信息失败'
      }
    }
  }

  /**
   * 检查QQ登录支持状态
   */
  async checkSupport(): Promise<QQSupportResult> {
    if (!this.isNativePlatform()) {
      return {
        isSupported: false,
        appId: '',
        hasNetwork: false
      }
    }

    try {
      const result = await QQLogin.checkSupport()
      return result
    } catch (error: any) {
      console.error('Check QQ support error:', error)
      return {
        isSupported: false,
        appId: '',
        hasNetwork: false
      }
    }
  }
}

export const nativeQQLogin = NativeQQLogin.getInstance()

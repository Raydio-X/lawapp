import { Capacitor, registerPlugin } from '@capacitor/core'

export interface QQLoginResult {
  success: boolean
  openId?: string
  accessToken?: string
  expiresIn?: number
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
    
    console.log('NativeQQLogin constructor:')
    console.log('  isNativePlatform:', Capacitor.isNativePlatform())
    console.log('  webAppId:', webAppId)
    console.log('  mobileAppId:', mobileAppId)
    console.log('  this.appId:', this.appId)
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
    console.log('NativeQQLogin.login() called')
    console.log('  isNativePlatform:', this.isNativePlatform())
    console.log('  appId:', this.appId)
    
    // 直接尝试调用原生插件，不检查平台
    // 如果在非原生平台，会抛出异常
    try {
      console.log('  Calling QQLogin.login()...')
      const result = await QQLogin.login()
      console.log('  QQLogin.login() result:', result)
      return result
    } catch (error: any) {
      console.error('QQ login error:', error)
      
      // 如果是插件未找到的错误，说明不是原生平台
      if (error.message && error.message.includes('not available')) {
        return {
          success: false,
          error: '非原生平台，请使用Web QQ登录'
        }
      }
      
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

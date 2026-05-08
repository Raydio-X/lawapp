<template>
  <div class="login-container">
    <div class="bg-decoration">
      <div class="bg-gradient"></div>
      
      <div class="floating-card card-2">
        <div class="card-inner">
          <div class="card-line"></div>
          <div class="card-line short"></div>
        </div>
      </div>
      
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
    </div>

    <div class="test-mode-toggle" @click="toggleLoginMode">
      <t-icon :name="isTestMode ? 'user' : 'setting'" size="14px" color="#64748B" />
      <span>{{ isTestMode ? 'QQ登录' : '测试账号' }}</span>
    </div>

    <div class="logo-section">
      <div class="logo-wrapper">
        <t-avatar 
          class="app-logo"
          image="/assets/images/logo.png" 
          size="85px"
          shape="round"
        />
      </div>
      <span class="app-name">法硕背诵助手</span>
      <span class="app-slogan">高效记忆 · 轻松备考</span>
    </div>

    <div class="login-section">
      <div class="login-card">
        <span class="login-title">欢迎使用</span>
        <span class="login-desc">登录后即可使用完整功能</span>
        
        <template v-if="!isTestMode">
          <button class="qq-login-btn" @click="onQQLogin">
            <t-icon name="logo-qq" size="24px" color="#fff" />
            <span class="btn-text">QQ一键登录</span>
          </button>
        </template>
        
        <template v-else>
          <div class="test-login-form">
            <div class="form-item">
              <input 
                class="form-input" 
                type="text" 
                placeholder="请输入测试账号"
                v-model="testAccount"
              />
            </div>
            <div class="form-item">
              <input 
                class="form-input" 
                type="password" 
                placeholder="请输入测试密码"
                v-model="testPassword"
                @keyup.enter="handleTestLogin"
              />
            </div>
            <button class="test-login-btn" @click="handleTestLogin">登录</button>
          </div>
        </template>
      </div>
    </div>

    <div class="agreement-section">
      <div class="checkbox-wrapper" @click="toggleAgreement">
        <t-icon 
          :name="hasAgreed ? 'check-circle-filled' : 'circle'" 
          size="16px" 
          :color="hasAgreed ? '#3B82F6' : '#ccc'"
        />
      </div>
      <span class="agreement-text">
        登录即代表您同意
        <span class="link" @click="showUserAgreement">《用户协议》</span>
        和
        <span class="link" @click="showPrivacyPolicy">《隐私政策》</span>
      </span>
    </div>

    <div class="footer">
      <span class="version">v1.0.0</span>
    </div>
    
    <div class="bottom-decoration">
      <div class="floating-card card-3">
        <div class="card-inner">
          <div class="card-line"></div>
          <div class="card-line short"></div>
          <div class="card-line"></div>
        </div>
      </div>
      <div class="floating-card card-4">
        <div class="card-inner">
          <div class="card-line"></div>
          <div class="card-line short"></div>
        </div>
      </div>
      <div class="floating-card card-5">
        <div class="card-inner">
          <div class="card-line"></div>
          <div class="card-line short"></div>
          <div class="card-line"></div>
        </div>
      </div>
    </div>

    <t-dialog
      v-model:visible="showAgreementDialog"
      :header="agreementTitle"
      :body="agreementContent"
      :confirm-btn="'我知道了'"
      :cancel-btn="null"
      @confirm="showAgreementDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { authAPI } from '@/utils/api'
import { useUserStore } from '@/stores/user'

declare global {
  interface Window {
    QC: any
  }
}

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const hasAgreed = ref(false)
const showAgreementDialog = ref(false)
const agreementTitle = ref('')
const agreementContent = ref('')
const isTestMode = ref(false)
const qqLoginLoading = ref(false)

const testAccount = ref('')
const testPassword = ref('')

const QQ_APP_ID = import.meta.env.VITE_QQ_APP_ID || ''
const QQ_REDIRECT_URI = window.location.origin + '/login'

const USER_AGREEMENT = `用户协议

欢迎使用法硕背诵助手！

本协议是您与法硕背诵助手之间关于使用本应用的法律协议。

1. 服务内容
本应用为用户提供法律知识学习和记忆辅助服务。

2. 用户注册
用户需要注册账号才能使用完整功能，请提供真实、准确的信息。

3. 用户行为规范
用户不得利用本应用从事违法活动，不得发布违法信息。

4. 知识产权
本应用的所有内容（包括但不限于文字、图片、软件等）的知识产权归本应用所有。

5. 免责声明
本应用不对因网络状况等原因导致的服务中断承担责任。

6. 协议修改
本应用有权修改本协议，修改后的协议将在应用内公布。`

const PRIVACY_POLICY = `隐私政策

我们重视您的隐私保护，本政策说明我们如何收集、使用和保护您的信息。

1. 信息收集
我们收集您注册时提供的账号信息，以及使用过程中产生的学习记录。

2. 信息使用
您的信息仅用于提供和改进服务，不会用于其他目的。

3. 信息保护
我们采取合理的安全措施保护您的信息不被未经授权的访问。

4. 信息分享
未经您的同意，我们不会向第三方分享您的个人信息。

5. Cookie使用
本应用可能使用Cookie技术来改善用户体验。

6. 政策更新
我们可能会更新本政策，更新后的政策将在应用内公布。`

const toggleAgreement = () => {
  hasAgreed.value = !hasAgreed.value
}

const showUserAgreement = () => {
  agreementTitle.value = '用户协议'
  agreementContent.value = USER_AGREEMENT
  showAgreementDialog.value = true
}

const showPrivacyPolicy = () => {
  agreementTitle.value = '隐私政策'
  agreementContent.value = PRIVACY_POLICY
  showAgreementDialog.value = true
}

const toggleLoginMode = () => {
  isTestMode.value = !isTestMode.value
}

const initQQSDK = () => {
  if (!QQ_APP_ID) {
    console.log('QQ_APP_ID not configured')
    return
  }
  
  if (window.QC) {
    console.log('QQ SDK already loaded')
    return
  }
  
  const script = document.createElement('script')
  script.src = 'https://connect.qq.com/qc_jssdk.js'
  script.setAttribute('data-appid', QQ_APP_ID)
  script.setAttribute('data-redirecturi', QQ_REDIRECT_URI)
  script.setAttribute('id', 'qq-jssdk')
  script.async = true
  script.onload = () => {
    console.log('QQ SDK loaded successfully')
  }
  script.onerror = () => {
    console.error('QQ SDK load failed')
  }
  document.head.appendChild(script)
}

const onQQLogin = () => {
  if (!hasAgreed.value) {
    MessagePlugin.warning('请先同意用户协议和隐私政策')
    return
  }

  if (!QQ_APP_ID) {
    MessagePlugin.error('QQ登录未配置，请联系管理员')
    return
  }

  if (!window.QC) {
    MessagePlugin.error('QQ SDK加载失败，请刷新页面重试')
    return
  }

  qqLoginLoading.value = true

  window.QC.Login.showPopup({
    appId: QQ_APP_ID,
    redirectURI: QQ_REDIRECT_URI
  })
}

const checkQQLoginStatus = () => {
  if (!window.QC || !QQ_APP_ID) return

  if (window.QC.Login.check()) {
    window.QC.Login.getMe(async (openId: string, accessToken: string) => {
      try {
        const res = await authAPI.qqLogin(accessToken, openId)
        
        if (res.success && res.data) {
          userStore.setToken(res.data.token)
          userStore.setUserInfo({
            id: res.data.userInfo.id,
            userId: res.data.userInfo.userId,
            nickName: res.data.userInfo.nickname,
            avatarUrl: res.data.userInfo.avatar || '/assets/images/default-avatar.svg',
            bio: res.data.userInfo.bio,
            role: res.data.userInfo.role
          })
          MessagePlugin.success('登录成功')
          
          const redirect = route.query.redirect as string
          if (redirect) {
            router.push(redirect)
          } else {
            router.push('/home')
          }
        }
      } catch (error: any) {
        MessagePlugin.error(error.message || 'QQ登录失败')
      } finally {
        qqLoginLoading.value = false
      }
    })
  } else {
    qqLoginLoading.value = false
  }
}

const handleTestLogin = async () => {
  if (!hasAgreed.value) {
    MessagePlugin.warning('请先同意用户协议和隐私政策')
    return
  }
  
  if (!testAccount.value.trim()) {
    MessagePlugin.warning('请输入账号')
    return
  }
  if (!testPassword.value.trim()) {
    MessagePlugin.warning('请输入密码')
    return
  }

  try {
    const res = await authAPI.testLogin(testAccount.value, testPassword.value)
    if (res.success && res.data) {
      userStore.setToken(res.data.token)
      userStore.setUserInfo({
        id: res.data.userInfo.id,
        userId: res.data.userInfo.userId,
        nickName: res.data.userInfo.nickname,
        avatarUrl: res.data.userInfo.avatar || '/assets/images/default-avatar.svg',
        bio: res.data.userInfo.bio,
        role: res.data.userInfo.role
      })
      MessagePlugin.success('登录成功')
      
      const redirect = route.query.redirect as string
      if (redirect) {
        router.push(redirect)
      } else if (res.data.userInfo.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/home')
      }
    }
  } catch (error: any) {
    MessagePlugin.error(error.message || '登录失败')
  }
}

onMounted(() => {
  initQQSDK()
  
  setTimeout(() => {
    checkQQLoginStatus()
  }, 500)
})
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(160deg, #f0f7ff 0%, #e8f4ff 50%, #f5f9ff 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 20px;
  box-sizing: border-box;
}

.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.bg-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(ellipse at 20% 20%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 80%, rgba(96, 165, 250, 0.06) 0%, transparent 50%);
}

.floating-card {
  position: absolute;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 10px;
  box-shadow: 
    0 5px 20px rgba(59, 130, 246, 0.12),
    0 2px 6px rgba(59, 130, 246, 0.06);
  border: 0.5px solid rgba(59, 130, 246, 0.1);
  backdrop-filter: blur(2px);
}

.card-inner {
  padding: 12px 14px;
}

.card-line {
  height: 5px;
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.3) 0%, rgba(59, 130, 246, 0.1) 100%);
  border-radius: 2.5px;
  margin-bottom: 7px;
  
  &.short {
    width: 60%;
  }
  
  &:last-child {
    margin-bottom: 0;
  }
}

.card-2 {
  width: 55px;
  top: 14%;
  right: 6%;
  transform: rotate(12deg);
  animation: float2 10s ease-in-out infinite;
}

.bottom-decoration {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 45%;
  pointer-events: none;
  overflow: hidden;
  
  .floating-card {
    position: absolute;
  }
  
  .card-3 {
    width: 72px;
    top: 17%;
    left: 6%;
    transform: rotate(5deg);
    animation: float3 9s ease-in-out infinite;
  }
  
  .card-4 {
    width: 60px;
    top: 27%;
    right: 8%;
    transform: rotate(-10deg);
    animation: float4 7s ease-in-out infinite;
  }
  
  .card-5 {
    width: 80px;
    top: 53%;
    left: 30%;
    transform: rotate(-5deg);
    animation: float5 11s ease-in-out infinite;
  }
}

@keyframes float2 {
  0%, 100% { transform: rotate(12deg) translateY(0); }
  50% { transform: rotate(12deg) translateY(-8px); }
}

@keyframes float3 {
  0%, 100% { transform: rotate(5deg) translateY(0); }
  50% { transform: rotate(5deg) translateY(-9px); }
}

@keyframes float4 {
  0%, 100% { transform: rotate(-10deg) translateY(0); }
  50% { transform: rotate(-10deg) translateY(-6px); }
}

@keyframes float5 {
  0%, 100% { transform: rotate(-5deg) translateY(0); }
  50% { transform: rotate(-5deg) translateY(-8px); }
}

.circle {
  position: absolute;
  border-radius: 50%;
  
  &.circle-1 {
    width: 250px;
    height: 250px;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.06) 0%, transparent 70%);
    top: -75px;
    right: -50px;
    animation: pulse 8s ease-in-out infinite;
  }
  
  &.circle-2 {
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(96, 165, 250, 0.05) 0%, transparent 70%);
    bottom: -50px;
    left: -50px;
    animation: pulse 10s ease-in-out infinite;
    animation-delay: 2s;
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.7; }
}

.test-mode-toggle {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  z-index: 10;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  span {
    font-size: 12px;
    color: #64748B;
  }
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 40px;
  margin-bottom: 30px;
  z-index: 1;
}

.logo-wrapper {
  margin-bottom: 16px;
}

.app-logo {
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.2);
  border-radius: 14px;
}

.app-name {
  font-size: 24px;
  font-weight: 700;
  color: #1E293B;
  margin-bottom: 6px;
  letter-spacing: 2px;
}

.app-slogan {
  font-size: 14px;
  color: #64748B;
  letter-spacing: 1px;
}

.login-section {
  width: 100%;
  max-width: 320px;
  z-index: 1;
}

.login-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px 20px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.login-title {
  display: block;
  font-size: 20px;
  font-weight: 600;
  color: #1E293B;
  text-align: center;
  margin-bottom: 6px;
}

.login-desc {
  display: block;
  font-size: 13px;
  color: #64748B;
  text-align: center;
  margin-bottom: 24px;
}

.qq-login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 48px;
  background: linear-gradient(135deg, #12B7F5 0%, #0099FF 100%);
  border-radius: 24px;
  border: none;
  padding: 0;
  transition: all 0.3s ease;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(18, 183, 245, 0.3);
  
  &:active {
    transform: scale(0.98);
    opacity: 0.9;
  }
  
  .btn-text {
    font-size: 16px;
    color: #fff;
    font-weight: 500;
    margin-left: 8px;
  }
}

.test-login-form {
  .form-item {
    margin-bottom: 12px;
  }
  
  .form-input {
    width: 100%;
    height: 44px;
    background: #F8FAFC;
    border-radius: 8px;
    padding: 0 14px;
    font-size: 15px;
    color: #1E293B;
    box-sizing: border-box;
    border: 1px solid #E2E8F0;
    
    &::placeholder {
      color: #94A3B8;
    }
    
    &:focus {
      border-color: #3B82F6;
      background: #fff;
      outline: none;
    }
  }
  
  .test-login-btn {
    width: 100%;
    height: 44px;
    background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
    border-radius: 22px;
    border: none;
    margin-top: 8px;
    font-size: 16px;
    color: #fff;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    
    &:active {
      opacity: 0.9;
    }
  }
}

.agreement-section {
  display: flex;
  align-items: center;
  margin-top: 24px;
  padding: 0 20px;
  z-index: 1;
  white-space: nowrap;
}

.checkbox-wrapper {
  margin-right: 6px;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
}

.agreement-text {
  font-size: 12px;
  color: #64748B;
  line-height: 1.6;
}

.link {
  color: #3B82F6;
  font-weight: 500;
  cursor: pointer;
}

.footer {
  margin-top: auto;
  padding-bottom: 20px;
  z-index: 1;
}

.version {
  font-size: 12px;
  color: #94A3B8;
}
</style>

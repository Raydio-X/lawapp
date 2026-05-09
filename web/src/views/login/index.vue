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
      <span class="app-name">律卡</span>
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
      :confirm-btn="'我知道了'"
      :cancel-btn="null"
      @confirm="showAgreementDialog = false"
    >
      <div class="agreement-content">{{ agreementContent }}</div>
    </t-dialog>
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

const USER_AGREEMENT = `欢迎您使用律卡（以下简称“本应用”）。本协议是您与律卡开发运营方之间就您注册、登录及使用本应用所订立的协议。请您在使用本应用前认真阅读并充分理解本协议的全部内容，特别是有关免责、责任限制以及用户义务等条款。 当您点击“同意”或实际开始使用本应用，即视为您已充分阅读并接受本协议的全部内容。
一、服务内容
律卡是一款面向法律硕士考试学习场景的辅助工具，主要为用户提供知识卡片管理、背诵学习、学习记录统计、学习数据同步、评论互动等服务。为了持续优化用户体验，本应用可能根据实际运营情况对服务内容进行调整，包括功能新增、升级、暂停或终止部分服务。
本应用部分功能属于增值服务，例如VIP会员功能。用户可根据自身需求自愿选择是否开通。VIP服务的具体权益、使用规则及有效期限，以应用内实际展示内容为准。
二、账号注册与使用
您可以通过 QQ 授权登录或本应用提供的其他方式注册并使用服务。在注册及使用过程中，您应保证所提供的信息真实、准确、合法且有效。如因信息不真实或不完整导致无法正常使用服务或产生相关损失，由您自行承担责任。
您应妥善保管账号信息及登录凭证，并对账号下发生的所有行为承担责任。未经本应用书面许可，您不得将账号赠与、出租、出借、售卖或转让给他人使用。因账号保管不善、密码泄露或第三方盗用所造成的损失，本应用不承担责任。
如发现任何未经授权使用您账号的情况，您应立即通过应用内反馈方式联系我们。
三、用户行为规范
您在使用本应用过程中，应遵守国家法律法规、公序良俗以及互联网相关规范，不得利用本应用从事任何违法违规活动。
您不得发布、传播、存储含有违法、淫秽、暴力、侮辱、诽谤、虚假信息或侵犯他人合法权益的内容；不得利用技术手段干扰、破坏本应用的正常运行；不得恶意攻击服务器、批量抓取数据、实施作弊行为或进行任何影响平台安全与稳定的行为。
对于违反法律法规或本协议约定的用户，本应用有权视情节采取警告、限制功能、暂停服务、封禁账号等措施，并保留追究法律责任的权利。
四、知识产权声明
本应用中的所有内容，包括但不限于软件、程序、界面设计、文字、图片、图标、音频、数据及相关知识库内容，其知识产权均归本应用或相关权利人所有，受法律保护。
用户在本应用中发布的学习笔记、评论、知识卡片等内容，其知识产权仍归用户本人所有。但用户同意授予本应用一项免费的、非独占的、可在服务范围内使用的许可，以便用于内容展示、数据存储、产品优化及相关运营服务。
未经本应用或相关权利人书面许可，任何人不得以任何形式对本应用内容进行复制、转载、传播、修改或用于商业用途。
五、VIP会员服务
本应用提供VIP会员服务，用户可通过激活码或应用内提供的其他方式开通。VIP服务属于虚拟网络服务，会员资格在有效期限内可享受对应权益，具体权益内容以应用内实际展示为准。
由于虚拟服务具有即时性和在线交付特征，VIP服务一经激活或使用，除法律法规另有规定外，原则上不支持退款。为了持续提升服务质量，本应用有权根据运营情况对会员权益、收费标准及服务内容进行调整，并会通过适当方式提前通知用户。
六、免责声明
本应用将尽力保障服务的连续性与安全性，但受网络环境、设备故障、系统维护、第三方服务异常等因素影响，服务可能出现中断、延迟或异常情况。对此，本应用不承担由此造成的直接或间接损失。
用户通过本应用发布、上传或传播的内容，仅代表用户个人观点和立场，由用户自行承担相应责任。本应用不对用户内容的真实性、合法性或准确性承担保证责任。
本应用部分功能可能依赖第三方服务，例如 QQ 登录、云服务等。对于因第三方服务异常、政策变化或不可抗力导致的问题，本应用不承担责任，但会尽合理努力协调解决。
七、协议的变更与终止
本应用有权根据法律法规变化、产品运营需要或服务调整情况，对本协议内容进行修改。更新后的协议将在应用内公布，并自公布之日起生效。
如您继续使用本应用服务，即视为您接受更新后的协议内容；如您不同意修改后的协议，应立即停止使用相关服务。
如您违反本协议约定，或存在损害平台及其他用户合法权益的行为，本应用有权暂停或终止向您提供服务。
八、联系我们
如您对本协议或本应用服务有任何疑问、意见或建议，您可以通过应用内反馈功能与我们联系，我们将在合理期限内予以回复。`

const PRIVACY_POLICY = `更新日期：2026年5月8日
生效日期：2026年5月8日

律卡（以下简称“本应用”）非常重视您的个人信息与隐私保护。我们深知个人信息对您的重要性，并将按照相关法律法规要求，采取合理安全措施保护您的个人信息安全。
在您使用本应用前，请您仔细阅读并充分理解本隐私政策。您点击“同意”或继续使用本应用，即表示您已理解并同意本隐私政策的全部内容。
一、我们收集的信息
为了向您提供正常服务、保障账号安全以及优化学习体验，我们可能会在您使用本应用过程中收集必要的信息。
当您通过 QQ 登录本应用时，我们会获取您授权公开的昵称、头像等基础信息，用于账号创建与身份识别。若您拒绝授权，可能无法使用部分登录功能。
在您使用学习功能过程中，我们会记录您的学习数据，包括学习记录、学习进度、背诵情况、错题记录、收藏内容等，以便为您提供学习统计、数据同步和个性化服务。
为了保障应用稳定运行，我们还可能收集设备信息与日志信息，例如设备型号、操作系统版本、应用版本、IP 地址、崩溃日志、操作记录等。这些信息主要用于故障排查、安全防护及产品优化。
二、我们如何使用您的信息
我们收集的信息将主要用于以下用途：保障应用功能正常运行；为您提供学习服务与数据同步；优化产品功能与用户体验；进行安全监测、防范风险与异常行为；以及向您发送必要的服务通知。
未经您的明确同意，我们不会向任何无关第三方出售、出租或交易您的个人信息。
三、信息共享与披露
我们仅会在以下情况下共享、披露您的个人信息：
在获得您的明确授权或同意后；依据法律法规要求、行政机关或司法机关要求；为维护本应用、用户或社会公众合法权益所必要；或在发生合并、收购、资产转让等情形时，在法律允许范围内进行必要的数据转移，并要求新的持有方继续履行隐私保护义务。
四、信息存储与安全保护
您的个人信息将存储于中华人民共和国境内服务器。我们会采取包括数据加密、访问权限控制、安全审计等合理措施，尽可能保护您的个人信息不被泄露、篡改或丢失。
但请您理解，互联网环境并非绝对安全，任何安全措施都无法做到百分之百无风险。因此，请您妥善保管个人账号及密码信息。
五、Cookie 与相关技术
为了改善用户体验、实现登录状态保持及数据统计分析，本应用可能使用 Cookie 或类似技术。您可以通过设备或浏览器设置进行管理，但部分功能可能因此无法正常使用。
六、第三方服务说明
本应用部分功能可能接入第三方服务或 SDK，例如 QQ 登录服务。相关第三方可能会按照其自身隐私政策收集和处理部分信息。请您在使用相关服务前，仔细阅读对应第三方的隐私政策。
其中，QQ 登录服务由腾讯 QQ 提供，相关数据处理规则受其隐私政策约束。
七、您的权利
您有权查询、更正、删除您的部分个人信息，也有权注销账号或撤回相关授权。您可以通过应用内反馈功能联系我们，我们将在合理期限内处理您的请求。
在您注销账号后，我们将在法律法规要求期限届满后删除或匿名化处理您的相关信息，但法律法规另有规定的除外。
八、未成年人保护
本应用主要面向成年人学习使用。如您为未成年人，应在监护人指导下阅读并使用本应用。我们不会在明知用户为未成年人的情况下，主动收集超出必要范围的个人信息。
九、隐私政策的更新
为了适应法律法规变化或产品功能调整，我们可能适时更新本隐私政策。更新后的政策将在应用内公布，并在必要时通过弹窗、通知等方式提示您。
如您继续使用本应用服务，即表示您同意更新后的隐私政策内容。
十、联系我们
如果您对本隐私政策有任何疑问、意见或投诉建议，您可以通过应用内反馈功能联系我们，我们会尽快处理并回复。`

const toggleAgreement = () => {
  hasAgreed.value = !hasAgreed.value
}

const formatAgreementText = (text: string) => {
  const titlePattern = /^[一二三四五六七八九十]+、/
  const datePattern = /^(更新日期|生效日期)：/
  return text.split('\n').map(line => {
    if (titlePattern.test(line) || datePattern.test(line)) {
      return line
    }
    return '　　' + line
  }).join('\n')
}

const showUserAgreement = () => {
  agreementTitle.value = '用户协议'
  agreementContent.value = formatAgreementText(USER_AGREEMENT)
  showAgreementDialog.value = true
}

const showPrivacyPolicy = () => {
  agreementTitle.value = '隐私政策'
  agreementContent.value = formatAgreementText(PRIVACY_POLICY)
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

.agreement-content {
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.8;
  font-size: 13px;
  color: #333;
  max-height: 60vh;
  overflow-y: auto;
}
</style>

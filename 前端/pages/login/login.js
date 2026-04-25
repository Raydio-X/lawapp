const { authAPI } = require('../../utils/api');

Page({
  data: {
    hasAgreed: false,
    showAgreementDialog: false,
    agreementTitle: '',
    agreementContent: '',
    isLoading: false,
    showTestLogin: false,
    testAccount: '',
    testPassword: ''
  },

  TEST_CREDENTIALS: {
    account: 'test',
    password: '123456'
  },

  onLoad(options) {
    this.checkLoginStatus();
    
    if (options.redirect) {
      this.redirectUrl = decodeURIComponent(options.redirect);
    }
  },

  onShow() {
    this.checkLoginStatus();
  },

  checkLoginStatus() {
    const token = wx.getStorageSync('access_token');
    const userInfo = wx.getStorageSync('userInfo');

    if (token && userInfo) {
      this.navigateToTarget();
    }
  },

  navigateToTarget() {
    const userInfo = wx.getStorageSync('userInfo');
    const isAdmin = userInfo && userInfo.role === 'admin';

    if (isAdmin) {
      wx.reLaunch({
        url: '/pages/admin/manage/manage'
      });
      return;
    }

    if (this.redirectUrl) {
      if (this.redirectUrl.includes('/pages/home/home') || 
          this.redirectUrl.includes('/pages/create/create') || 
          this.redirectUrl.includes('/pages/profile/profile')) {
        wx.switchTab({ url: this.redirectUrl });
      } else {
        wx.redirectTo({ url: this.redirectUrl });
      }
    } else {
      wx.switchTab({
        url: '/pages/home/home'
      });
    }
  },

  toggleAgreement() {
    this.setData({
      hasAgreed: !this.data.hasAgreed
    });
  },

  async onWechatLoginNew() {
    if (!this.data.hasAgreed) {
      this.showToast('请先同意用户协议和隐私政策', 'warning');
      return;
    }

    if (this.data.isLoading) return;

    this.setData({ isLoading: true });

    try {
      const loginRes = await wx.login();
      const code = loginRes.code;
      
      if (!code) {
        throw new Error('获取微信登录凭证失败');
      }

      let userProfile = {
        nickName: '微信用户',
        avatarUrl: ''
      };

      try {
        const profileRes = await new Promise((resolve, reject) => {
          wx.getUserProfile({
            desc: '用于完善用户资料',
            success: resolve,
            fail: reject
          });
        });
        userProfile = profileRes.userInfo;
      } catch (err) {
        console.warn('获取用户信息失败，使用默认信息:', err);
      }

      const response = await authAPI.login(code, userProfile);

      if (response.success) {
        const { token, userInfo: serverUserInfo } = response.data;
        
        wx.setStorageSync('access_token', token);
        wx.setStorageSync('userInfo', {
          id: serverUserInfo.id,
          nickName: serverUserInfo.nickname || userProfile.nickName,
          avatarUrl: serverUserInfo.avatar || userProfile.avatarUrl,
          bio: serverUserInfo.bio,
          role: serverUserInfo.role || 'user'
        });
        wx.removeStorageSync('isGuest');

        this.showToast('登录成功', 'success');
        
        setTimeout(() => {
          this.navigateToTarget();
        }, 500);
      } else {
        this.showToast(response.message || '登录失败', 'error');
      }
    } catch (error) {
      console.error('登录失败:', error);
      this.showToast(error.message || '登录失败，请重试', 'error');
    } finally {
      this.setData({ isLoading: false });
    }
  },

  async onWechatLogin(e) {
    if (!this.data.hasAgreed) {
      this.showToast('请先同意用户协议和隐私政策', 'warning');
      return;
    }

    if (this.data.isLoading) return;

    if (e.detail.errMsg && e.detail.errMsg.includes('fail')) {
      this.showToast('需要授权才能登录', 'warning');
      return;
    }

    this.setData({ isLoading: true });

    try {
      const loginRes = await wx.login();
      const code = loginRes.code;
      
      if (!code) {
        throw new Error('获取微信登录凭证失败');
      }

      const userProfile = e.detail.userInfo || {
        nickName: '微信用户',
        avatarUrl: ''
      };

      const response = await authAPI.login(code, userProfile);

      if (response.success) {
        const { token, userInfo: serverUserInfo } = response.data;
        
        wx.setStorageSync('access_token', token);
        wx.setStorageSync('userInfo', {
          id: serverUserInfo.id,
          nickName: serverUserInfo.nickname || userProfile.nickName,
          avatarUrl: serverUserInfo.avatar || userProfile.avatarUrl,
          bio: serverUserInfo.bio,
          role: serverUserInfo.role || 'user'
        });
        wx.removeStorageSync('isGuest');

        this.showToast('登录成功', 'success');
        
        setTimeout(() => {
          this.navigateToTarget();
        }, 500);
      } else {
        this.showToast(response.message || '登录失败', 'error');
      }
    } catch (error) {
      console.error('登录失败:', error);
      this.showToast(error.message || '登录失败，请重试', 'error');
    } finally {
      this.setData({ isLoading: false });
    }
  },

  showUserAgreement() {
    this.setData({
      showAgreementDialog: true,
      agreementTitle: '用户协议',
      agreementContent: `欢迎使用法硕背诵助手！
1.服务条款：本软件为您提供法硕考试相关的学习资料和记忆卡片服务。
2.账号安全：您需要妥善保管自己的账号信息，不得将账号借给他人使用。
3.用户行为规范：您在使用本服务时应当遵守法律法规，不得发布违法违规内容。
4.知识产权：本软件的所有内容受知识产权保护，未经授权不得复制或传播。
5.免责声明：本软件提供的学习资料仅供参考，不构成法律建议。`
    });
  },

  showPrivacyPolicy() {
    this.setData({
      showAgreementDialog: true,
      agreementTitle: '隐私政策',
      agreementContent: `我们非常重视您的隐私保护。
1.信息收集：我们仅收集必要的用户信息，包括微信昵称、头像等公开信息。
2.信息使用：我们使用您的信息来提供个性化的学习服务。
3.信息保护：我们采用严格的安全措施保护您的个人信息。
4.信息共享：我们不会将您的个人信息出售或分享给第三方。
5.您的权利：您有权查看、修改或删除您的个人信息。`
    });
  },

  closeAgreementDialog() {
    this.setData({
      showAgreementDialog: false
    });
  },

  showToast(message, theme = 'success') {
    const toast = this.selectComponent('#t-toast');
    if (toast) {
      toast.show({
        message,
        theme,
        duration: 2000
      });
    } else {
      wx.showToast({
        title: message,
        icon: theme === 'success' ? 'success' : 'none'
      });
    }
  },

  showTestEntry() {
    this.setData({
      showTestLogin: true,
      testAccount: '',
      testPassword: ''
    });
  },

  closeTestLogin() {
    this.setData({
      showTestLogin: false
    });
  },

  onTestAccountInput(e) {
    this.setData({
      testAccount: e.detail.value
    });
  },

  onTestPasswordInput(e) {
    this.setData({
      testPassword: e.detail.value
    });
  },

  async onTestLogin() {
    const { testAccount, testPassword } = this.data;

    if (!testAccount || !testPassword) {
      this.showToast('请输入账号和密码', 'warning');
      return;
    }

    this.setData({ isLoading: true });

    try {
      const response = await authAPI.testLogin(testAccount, testPassword);

      if (response.success) {
        const { token, userInfo: serverUserInfo } = response.data;
        
        wx.setStorageSync('access_token', token);
        wx.setStorageSync('userInfo', {
          id: serverUserInfo.id,
          nickName: serverUserInfo.nickname,
          avatarUrl: serverUserInfo.avatar,
          bio: serverUserInfo.bio,
          role: serverUserInfo.role || 'user'
        });
        wx.removeStorageSync('isGuest');

        this.showToast('测试登录成功', 'success');
        this.setData({ showTestLogin: false });

        setTimeout(() => {
          this.navigateToTarget();
        }, 500);
      } else {
        this.showToast(response.message || '账号或密码错误', 'error');
      }
    } catch (error) {
      console.error('测试登录失败:', error);
      this.showToast(error.message || '登录失败', 'error');
    } finally {
      this.setData({ isLoading: false });
    }
  }
});

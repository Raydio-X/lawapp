import updateManager from './common/updateManager';

App({
  globalData: {
    userInfo: null,
    isLogin: false,
    isGuest: false,
    systemInfo: null
  },

  onLaunch: function () {
    // 检查更新
    updateManager();

    // 获取系统信息
    this.getSystemInfo();

    // 检查登录状态
    this.checkLoginStatus();
  },

  onShow: function () {
    // 每次显示时检查登录状态
    this.checkLoginStatus();
  },

  /**
   * 获取系统信息
   */
  getSystemInfo() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.globalData.systemInfo = systemInfo;
    } catch (e) {
      console.error('获取系统信息失败:', e);
    }
  },

  /**
   * 检查登录状态
   */
  checkLoginStatus: function () {
    const token = wx.getStorageSync('access_token');
    const userInfo = wx.getStorageSync('userInfo');

    if (token && userInfo) {
      // 已登录
      this.globalData.isLogin = true;
      this.globalData.userInfo = userInfo;
    } else {
      // 未登录
      this.globalData.isLogin = false;
      this.globalData.userInfo = null;
      this.globalData.isGuest = wx.getStorageSync('isGuest') === true;
    }
  }
});

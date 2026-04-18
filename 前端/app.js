import updateManager from './common/updateManager';

App({
  globalData: {
    userInfo: null,
    isLogin: false,
    isGuest: false,
    systemInfo: null,
    studyTimer: null,
    studyStartTime: null,
    isStudying: false
  },

  onLaunch: function () {
    updateManager();
    this.getSystemInfo();
    this.checkLoginStatus();
  },

  onShow: function () {
    this.checkLoginStatus();
  },

  onHide: function () {
    this.pauseStudyTimer();
  },

  getSystemInfo() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.globalData.systemInfo = systemInfo;
    } catch (e) {
      console.error('获取系统信息失败:', e);
    }
  },

  checkLoginStatus: function () {
    const token = wx.getStorageSync('access_token');
    const userInfo = wx.getStorageSync('userInfo');

    if (token && userInfo) {
      this.globalData.isLogin = true;
      this.globalData.userInfo = userInfo;
    } else {
      this.globalData.isLogin = false;
      this.globalData.userInfo = null;
      this.globalData.isGuest = wx.getStorageSync('isGuest') === true;
    }
  },

  startStudyTimer() {
    if (this.globalData.isStudying) return;
    
    this.globalData.isStudying = true;
    this.globalData.studyStartTime = Date.now();
    
    if (this.globalData.studyTimer) {
      clearInterval(this.globalData.studyTimer);
    }
    
    this.globalData.studyTimer = setInterval(() => {
      this.syncStudyTime();
    }, 30000);
    
    console.log('学习计时开始');
  },

  pauseStudyTimer() {
    if (!this.globalData.isStudying) return;
    
    this.syncStudyTime();
    
    if (this.globalData.studyTimer) {
      clearInterval(this.globalData.studyTimer);
      this.globalData.studyTimer = null;
    }
    
    this.globalData.isStudying = false;
    console.log('学习计时暂停');
  },

  stopStudyTimer() {
    if (!this.globalData.isStudying) return;
    
    this.syncStudyTime();
    
    if (this.globalData.studyTimer) {
      clearInterval(this.globalData.studyTimer);
      this.globalData.studyTimer = null;
    }
    
    this.globalData.isStudying = false;
    this.globalData.studyStartTime = null;
    console.log('学习计时停止');
  },

  async syncStudyTime() {
    if (!this.globalData.studyStartTime) return;
    
    const duration = Math.floor((Date.now() - this.globalData.studyStartTime) / 1000);
    if (duration < 5) return;
    
    const token = wx.getStorageSync('access_token');
    if (!token) return;
    
    try {
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: 'http://localhost:3000/api/study/time',
          method: 'POST',
          data: { libraryId: null, duration: duration },
          header: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          success: (res) => resolve(res),
          fail: (err) => reject(err)
        });
      });
      
      if (res.statusCode === 200) {
        this.globalData.studyStartTime = Date.now();
        console.log(`同步学习时长: ${duration}秒`);
      }
    } catch (error) {
      console.error('同步学习时间失败:', error);
    }
  },

  getStudyStatus() {
    return this.globalData.isStudying;
  }
});

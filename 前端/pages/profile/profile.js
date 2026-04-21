const { authAPI, studyAPI, libraryAPI, favoriteAPI, messageAPI } = require('../../utils/api');

Page({
  data: {
    userInfo: {
      nickName: '法硕考生',
      avatarUrl: ''
    },
    stats: {
      libraryCount: 0,
      cardCount: 0,
      favoriteCount: 0
    },
    studyProgress: {
      percent: 0,
      todayCards: 0,
      streak: 0,
      totalTime: '0分钟',
      todayStudyTime: 0,
      dailyGoal: 50,
      todayNew: 0,
      weekTime: '0分钟',
      weekTrend: 0,
      toReview: 0,
      totalCards: 0
    },
    goalPercent: 0,
    loading: false,
    unreadCount: 0,
    showPlanPicker: false,
    cardCountOptions: [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70],
    pickerValue: [8],
    tempCardCount: 50
  },

  studyTimeTimer: null,
  isLoading: false,

  onLoad() {
    this.loadAllData(true);
  },

  onShow() {
    if (!this.isLoading) {
      this.loadAllData(false);
    }
    this.startStudyTimeTimer();
  },

  onHide() {
    this.stopStudyTimeTimer();
  },

  onUnload() {
    this.stopStudyTimeTimer();
  },

  startStudyTimeTimer() {
    this.loadTodayStudyTime();
    this.studyTimeTimer = setInterval(() => {
      this.loadTodayStudyTime();
    }, 10000);
  },

  stopStudyTimeTimer() {
    if (this.studyTimeTimer) {
      clearInterval(this.studyTimeTimer);
      this.studyTimeTimer = null;
    }
  },

  async loadTodayStudyTime() {
    const token = wx.getStorageSync('access_token');
    if (!token) return;

    try {
      const res = await studyAPI.getTodayStudyTime();
      if (res.success && res.data) {
        const seconds = res.data.todayStudyTime || 0;
        this.setData({
          'studyProgress.todayStudyTime': seconds,
          'studyProgress.totalTime': this.formatStudyTime(seconds)
        });
      }
    } catch (error) {
      console.error('获取今日学习时间失败:', error);
    }
  },

  formatStudyTime(seconds) {
    if (!seconds || seconds <= 0) return '0分钟';
    const minutes = Math.floor(seconds / 60);
    return `${minutes}分钟`;
  },

  async loadAllData(showLoading = false) {
    const token = wx.getStorageSync('access_token');
    if (!token) {
      this.resetData();
      return;
    }

    if (this.isLoading) return;
    this.isLoading = true;

    if (showLoading) {
      this.setData({ loading: true });
    }

    try {
      await Promise.all([
        this.loadUserInfo(),
        this.loadStats(),
        this.loadStudyProgress(),
        this.loadUnreadCount()
      ]);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      this.isLoading = false;
      if (showLoading) {
        this.setData({ loading: false });
      }
    }
  },

  resetData() {
    this.setData({
      userInfo: {
        nickName: '未登录',
        avatarUrl: ''
      },
      stats: {
        libraryCount: 0,
        cardCount: 0,
        favoriteCount: 0
      },
      studyProgress: {
        percent: 0,
        todayCards: 0,
        streak: 0,
        totalTime: '0分钟',
        todayStudyTime: 0,
        dailyGoal: 50,
        todayNew: 0,
        weekTime: '0分钟',
        weekTrend: 0,
        toReview: 0,
        totalCards: 0
      },
      goalPercent: 0
    });
  },

  async loadUserInfo() {
    try {
      const res = await authAPI.getCurrentUser();
      if (res.success && res.data) {
        const user = res.data;
        this.setData({
          userInfo: {
            id: user.id,
            nickName: user.nickname || user.username || '法硕考生',
            avatarUrl: user.avatar_url || ''
          }
        });
        wx.setStorageSync('userInfo', this.data.userInfo);
      }
    } catch (error) {
      console.error('加载用户信息失败:', error);
      const cachedUserInfo = wx.getStorageSync('userInfo');
      if (cachedUserInfo) {
        this.setData({ userInfo: cachedUserInfo });
      }
    }
  },

  async loadStats() {
    const cachedFavoriteCount = wx.getStorageSync('favoriteCount') || 0;
    
    this.setData({
      'stats.favoriteCount': cachedFavoriteCount
    });

    try {
      const [libRes, favRes] = await Promise.all([
        libraryAPI.getMyLibraries(),
        favoriteAPI.getList({ page: 1, pageSize: 1 })
      ]);

      let libraryCount = 0;
      let cardCount = 0;
      let favoriteCount = 0;

      if (libRes.success && libRes.data) {
        const libData = libRes.data.list || libRes.data || [];
        libraryCount = libData.length;
        cardCount = libData.reduce((sum, lib) => sum + (lib.card_count || 0), 0);
      }

      if (favRes.success && favRes.data) {
        favoriteCount = favRes.data.pagination?.total || favRes.data.total || 0;
        wx.setStorageSync('favoriteCount', favoriteCount);
      }

      this.setData({
        stats: {
          libraryCount,
          cardCount,
          favoriteCount
        }
      });
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  },

  async loadStudyProgress() {
    try {
      const res = await studyAPI.getStats();
      if (res.success && res.data) {
        const stats = res.data;
        const dailyGoal = stats.dailyGoal || 50;
        const todayCards = stats.todayCards || 0;
        const goalPercent = Math.min(100, Math.round((todayCards / dailyGoal) * 100));

        this.setData({
          'studyProgress.percent': stats.progress || 0,
          'studyProgress.todayCards': todayCards,
          'studyProgress.streak': stats.streak || 0,
          'studyProgress.dailyGoal': dailyGoal,
          'studyProgress.todayNew': stats.todayNew || 0,
          'studyProgress.weekTime': this.formatStudyTime(stats.weekTime || 0),
          'studyProgress.weekTrend': stats.weekTrend || 0,
          'studyProgress.toReview': stats.toReview || 0,
          'studyProgress.totalCards': stats.totalCards || 0,
          goalPercent: goalPercent
        });
      }
    } catch (error) {
      console.error('加载学习进度失败:', error);
    }
  },

  async loadUnreadCount() {
    try {
      const res = await messageAPI.getUnreadCount();
      if (res.success && res.data) {
        this.setData({ unreadCount: res.data.count || 0 });
      }
    } catch (error) {
      console.error('获取未读消息数失败:', error);
    }
  },

  onEditProfile() {
    wx.showActionSheet({
      itemList: ['修改昵称', '更换头像'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.editNickname();
            break;
          case 1:
            this.changeAvatar();
            break;
        }
      }
    });
  },

  async editNickname() {
    wx.showModal({
      title: '修改昵称',
      content: '',
      editable: true,
      placeholderText: '请输入昵称',
      success: async (res) => {
        if (res.confirm && res.content) {
          try {
            const result = await authAPI.updateProfile({ nickname: res.content });
            if (result.success) {
              this.setData({
                'userInfo.nickName': res.content
              });
              wx.setStorageSync('userInfo', this.data.userInfo);
              wx.showToast({ title: '修改成功', icon: 'success' });
            } else {
              wx.showToast({ title: result.message || '修改失败', icon: 'none' });
            }
          } catch (error) {
            wx.showToast({ title: error.message || '修改失败', icon: 'none' });
          }
        }
      }
    });
  },

  changeAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        try {
          const result = await authAPI.updateProfile({ avatar_url: tempFilePath });
          if (result.success) {
            this.setData({
              'userInfo.avatarUrl': tempFilePath
            });
            wx.setStorageSync('userInfo', this.data.userInfo);
            wx.showToast({ title: '更换成功', icon: 'success' });
          }
        } catch (error) {
          this.setData({
            'userInfo.avatarUrl': tempFilePath
          });
          wx.setStorageSync('userInfo', this.data.userInfo);
          wx.showToast({ title: '更换成功', icon: 'success' });
        }
      }
    });
  },

  onStatTap(e) {
    const type = e.currentTarget.dataset.type;
    const typeMap = {
      library: '知识库',
      card: '卡片',
      favorite: '收藏'
    };
    wx.showToast({
      title: `查看${typeMap[type]}`,
      icon: 'none'
    });
  },

  onViewDetail() {
    wx.navigateTo({ url: '/pages/profile/study-stats/study-stats' });
  },

  onMenuTap(e) {
    const menu = e.currentTarget.dataset.menu;
    
    switch(menu) {
      case 'library':
        wx.switchTab({ url: '/pages/create/create' });
        break;
      case 'favorite':
        wx.navigateTo({ url: '/pages/profile/favorites/favorites' });
        break;
      case 'message':
        wx.navigateTo({ url: '/pages/profile/messages/messages' });
        break;
      case 'plan':
        this.showPlanPickerPopup();
        break;
      default:
        wx.showToast({
          title: `${menu}功能开发中`,
          icon: 'none'
        });
    }
  },

  showPlanPickerPopup() {
    const { cardCountOptions } = this.data;
    const currentGoal = this.data.studyProgress.dailyGoal || 50;
    const index = cardCountOptions.indexOf(currentGoal);
    const pickerIndex = index >= 0 ? index : 8;
    
    this.setData({
      showPlanPicker: true,
      pickerValue: [pickerIndex],
      tempCardCount: cardCountOptions[pickerIndex]
    });
  },

  onClosePlanPicker() {
    this.setData({ showPlanPicker: false });
  },

  onPickerChange(e) {
    const { cardCountOptions } = this.data;
    const index = e.detail.value[0];
    this.setData({
      pickerValue: [index],
      tempCardCount: cardCountOptions[index]
    });
  },

  async onConfirmPlan() {
    const { tempCardCount } = this.data;
    
    try {
      const result = await studyAPI.updateDailyGoal(tempCardCount);
      if (result.success) {
        const todayCards = this.data.studyProgress.todayCards || 0;
        const goalPercent = Math.min(100, Math.round((todayCards / tempCardCount) * 100));
        
        this.setData({
          'studyProgress.dailyGoal': tempCardCount,
          goalPercent: goalPercent,
          showPlanPicker: false
        });
        wx.showToast({ title: '设置成功', icon: 'success' });
      } else {
        wx.showToast({ title: result.message || '设置失败', icon: 'none' });
      }
    } catch (error) {
      const todayCards = this.data.studyProgress.todayCards || 0;
      const goalPercent = Math.min(100, Math.round((todayCards / tempCardCount) * 100));
      
      this.setData({
        'studyProgress.dailyGoal': tempCardCount,
        goalPercent: goalPercent,
        showPlanPicker: false
      });
      wx.showToast({ title: '设置成功', icon: 'success' });
    }
  },

  preventClose() {},

  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      confirmColor: '#E34D59',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('access_token');
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('isGuest');

          wx.showToast({ title: '已退出登录', icon: 'success' });

          setTimeout(() => {
            wx.redirectTo({
              url: '/pages/login/login'
            });
          }, 1000);
        }
      }
    });
  }
});

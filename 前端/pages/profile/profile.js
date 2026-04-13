const { authAPI, studyAPI, libraryAPI, favoriteAPI, wrongCardAPI } = require('../../utils/api');

Page({
  data: {
    userInfo: {
      nickName: '法硕考生',
      avatarUrl: '',
      bio: '法硕备考中，每天进步一点点'
    },
    stats: {
      libraryCount: 0,
      cardCount: 0,
      favoriteCount: 0,
      wrongCount: 0
    },
    studyProgress: {
      percent: 0,
      todayCards: 0,
      streak: 0,
      totalTime: '0h'
    },
    loading: false
  },

  onLoad() {
    this.loadAllData();
  },

  onShow() {
    this.loadAllData();
  },

  async loadAllData() {
    const token = wx.getStorageSync('access_token');
    if (!token) {
      this.resetData();
      return;
    }

    this.setData({ loading: true });

    try {
      await Promise.all([
        this.loadUserInfo(),
        this.loadStats(),
        this.loadStudyProgress()
      ]);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      this.setData({ loading: false });
    }
  },

  resetData() {
    this.setData({
      userInfo: {
        nickName: '未登录',
        avatarUrl: '',
        bio: '请先登录'
      },
      stats: {
        libraryCount: 0,
        cardCount: 0,
        favoriteCount: 0,
        wrongCount: 0
      },
      studyProgress: {
        percent: 0,
        todayCards: 0,
        streak: 0,
        totalTime: '0h'
      }
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
            avatarUrl: user.avatar_url || '',
            bio: user.bio || '法硕备考中，每天进步一点点'
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
      const [libRes, favRes, wrongRes] = await Promise.all([
        libraryAPI.getMyLibraries(),
        favoriteAPI.getList({ page: 1, pageSize: 1 }),
        wrongCardAPI.getList({ page: 1, pageSize: 1 })
      ]);

      let libraryCount = 0;
      let cardCount = 0;
      let favoriteCount = 0;
      let wrongCount = 0;

      if (libRes.success && libRes.data) {
        const libData = libRes.data.list || libRes.data || [];
        libraryCount = libData.length;
        cardCount = libData.reduce((sum, lib) => sum + (lib.card_count || 0), 0);
      }

      if (favRes.success && favRes.data) {
        favoriteCount = favRes.data.pagination?.total || favRes.data.total || 0;
        wx.setStorageSync('favoriteCount', favoriteCount);
      }

      if (wrongRes.success && wrongRes.data) {
        wrongCount = wrongRes.data.pagination?.total || wrongRes.data.total || 0;
      }

      this.setData({
        stats: {
          libraryCount,
          cardCount,
          favoriteCount,
          wrongCount
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
        const totalMinutes = stats.totalTime || 0;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const totalTime = hours > 0 ? `${hours}h${minutes > 0 ? minutes + 'm' : ''}` : `${minutes}m`;

        this.setData({
          studyProgress: {
            percent: stats.progress || 0,
            todayCards: stats.todayCards || 0,
            streak: stats.streak || 0,
            totalTime: totalTime
          }
        });
      }
    } catch (error) {
      console.error('加载学习进度失败:', error);
    }
  },

  onEditProfile() {
    wx.showActionSheet({
      itemList: ['修改昵称', '修改简介', '更换头像'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.editNickname();
            break;
          case 1:
            this.editBio();
            break;
          case 2:
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

  async editBio() {
    wx.showModal({
      title: '修改简介',
      content: '',
      editable: true,
      placeholderText: '请输入简介',
      success: async (res) => {
        if (res.confirm && res.content) {
          try {
            const result = await authAPI.updateProfile({ bio: res.content });
            if (result.success) {
              this.setData({
                'userInfo.bio': res.content
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
    wx.showToast({
      title: '查看学习详情',
      icon: 'none'
    });
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
      case 'wrong':
        wx.navigateTo({ url: '/pages/profile/wrongCards/wrongCards' });
        break;
      case 'statistics':
        wx.navigateTo({ url: '/pages/profile/statistics/statistics' });
        break;
      default:
        wx.showToast({
          title: `${menu}功能开发中`,
          icon: 'none'
        });
    }
  },

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

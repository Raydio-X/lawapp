const { libraryAPI, studyAPI, favoriteAPI, cardAPI } = require('../../utils/api');

Page({
  data: {
    greeting: '',
    streak: 0,
    unlearnedCount: 0,
    reviewCount: 0,
    favoriteCount: 0,
    libraries: [],
    loading: true
  },

  onLoad() {
    this.setGreeting();
  },

  onShow() {
    this.loadData();
  },

  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  setGreeting() {
    const hour = new Date().getHours();
    let greeting = '';
    if (hour < 6) {
      greeting = '夜深了，早点休息';
    } else if (hour < 9) {
      greeting = '早上好';
    } else if (hour < 12) {
      greeting = '上午好';
    } else if (hour < 14) {
      greeting = '中午好';
    } else if (hour < 18) {
      greeting = '下午好';
    } else if (hour < 22) {
      greeting = '晚上好';
    } else {
      greeting = '夜深了，早点休息';
    }
    this.setData({ greeting });
  },

  async loadData() {
    try {
      await Promise.all([
        this.loadStats(),
        this.loadLibraries(),
        this.loadFavorites()
      ]);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      this.setData({ loading: false });
    }
  },

  async loadStats() {
    try {
      const [statsRes, reviewCountRes] = await Promise.all([
        studyAPI.getStats(),
        cardAPI.getReviewCount()
      ]);

      if (statsRes.success) {
        const stats = statsRes.data;
        this.setData({
          streak: stats.streak || 0
        });
      }

      if (reviewCountRes.success && reviewCountRes.data) {
        this.setData({
          reviewCount: reviewCountRes.data.count || 0
        });
      }
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  },

  async loadLibraries() {
    try {
      const [myLibrariesRes, favoriteLibrariesRes] = await Promise.all([
        libraryAPI.getMyLibraries(),
        favoriteAPI.getLibraries()
      ]);

      let totalUnlearned = 0;
      let myLibraries = [];

      if (myLibrariesRes.success) {
        myLibraries = myLibrariesRes.data.list || myLibrariesRes.data.libraries || myLibrariesRes.data || [];
        myLibraries.forEach(lib => {
          const unlearned = (lib.totalCards || lib.card_count || 0) - (lib.learnedCards || lib.learned_cards || 0);
          totalUnlearned += unlearned;
        });
        this.setData({ libraries: myLibraries });
      }

      if (favoriteLibrariesRes.success) {
        const favoriteLibraries = favoriteLibrariesRes.data.libraries || favoriteLibrariesRes.data.list || favoriteLibrariesRes.data || [];
        const myIds = new Set(myLibraries.map(lib => lib.id));
        
        favoriteLibraries.forEach(lib => {
          if (!myIds.has(lib.id)) {
            const unlearned = (lib.totalCards || lib.card_count || 0) - (lib.learnedCards || lib.learned_cards || 0);
            totalUnlearned += unlearned;
          }
        });
      }

      this.setData({ unlearnedCount: totalUnlearned });
    } catch (error) {
      console.error('加载知识库失败:', error);
    }
  },

  async loadFavorites() {
    try {
      const res = await favoriteAPI.getList();
      if (res.success) {
        const favorites = res.data || [];
        this.setData({ favoriteCount: favorites.length });
      }
    } catch (error) {
      console.error('加载收藏失败:', error);
    }
  },

  onStartStudy() {
    wx.navigateTo({
      url: '/pages/study/select'
    });
  },

  async onReview() {
    if (this.data.reviewCount === 0) {
      wx.showToast({
        title: '暂无待复习卡片',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '准备中...' });
    
    try {
      const res = await cardAPI.getReviewCards();
      
      wx.hideLoading();
      
      if (!res.success || !res.data || res.data.length === 0) {
        wx.showToast({
          title: '暂无待复习卡片',
          icon: 'none'
        });
        return;
      }
      
      const reviewCards = res.data.map(card => ({
        id: card.id,
        question: card.question,
        answer: card.answer || '',
        tags: card.tags,
        learned: true,
        libraryId: card.libraryId,
        libraryName: card.libraryName
      }));
      
      wx.setStorageSync('studyCardsData', {
        cardList: reviewCards,
        libraryNames: '艾宾浩斯复习',
        totalCards: reviewCards.length
      });
      
      wx.navigateTo({
        url: `/pages/study/cards/cards?index=0&total=${reviewCards.length}`
      });
    } catch (error) {
      wx.hideLoading();
      console.error('复习失败:', error);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    }
  },

  onSmartExam() {
    wx.navigateTo({
      url: '/pages/study/exam/setup'
    });
  },

  onFavorites() {
    wx.navigateTo({
      url: '/pages/profile/favorites/favorites'
    });
  },

  onDifficulty() {
    wx.showToast({
      title: '功能开发中，敬请期待',
      icon: 'none'
    });
  }
});

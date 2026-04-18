const { libraryAPI, favoriteAPI } = require('../../../utils/api');

Page({
  data: {
    activeTab: 'my',
    libraries: [],
    myLibraries: [],
    favoriteLibraries: [],
    selectedLibraries: [],
    questionCount: 20,
    duration: 30,
    examMode: 'random',
    availableCards: 0
  },

  onLoad() {
    this.loadLibraries();
  },

  async loadLibraries() {
    wx.showLoading({ title: '加载中...' });
    try {
      const [myRes, favRes] = await Promise.all([
        libraryAPI.getMyLibraries({ page: 1, pageSize: 50 }),
        favoriteAPI.getLibraries({ page: 1, pageSize: 50 })
      ]);

      const myLibraries = (myRes.success && myRes.data?.list) || [];
      const favoriteLibraries = (favRes.success && favRes.data?.libraries) || [];

      this.setData({
        myLibraries,
        favoriteLibraries,
        libraries: myLibraries
      });
    } catch (error) {
      console.error('加载知识库失败:', error);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  onTabChange(e) {
    const tab = e.currentTarget.dataset.tab;
    const libraries = tab === 'my' ? this.data.myLibraries : this.data.favoriteLibraries;
    this.setData({ 
      activeTab: tab, 
      libraries 
    });
  },

  onLibraryToggle(e) {
    const id = e.currentTarget.dataset.id;
    let selectedLibraries = [...this.data.selectedLibraries];
    const index = selectedLibraries.indexOf(id);
    
    if (index > -1) {
      selectedLibraries.splice(index, 1);
    } else {
      selectedLibraries.push(id);
    }

    const availableCards = this.calculateAvailableCards(selectedLibraries);
    
    this.setData({ 
      selectedLibraries,
      availableCards 
    });
  },

  calculateAvailableCards(selectedIds) {
    const allLibraries = [...this.data.myLibraries, ...this.data.favoriteLibraries];
    let total = 0;
    selectedIds.forEach(id => {
      const lib = allLibraries.find(l => l.id === id);
      if (lib) {
        total += lib.card_count || lib.totalCards || 0;
      }
    });
    return total;
  },

  onCountChange(e) {
    const count = parseInt(e.currentTarget.dataset.count);
    this.setData({ questionCount: count });
  },

  onDurationChange(e) {
    this.setData({ duration: e.detail.value });
  },

  onModeChange(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({ examMode: mode });
  },

  onStartExam() {
    if (this.data.selectedLibraries.length === 0) {
      wx.showToast({ title: '请选择知识库', icon: 'none' });
      return;
    }

    if (this.data.availableCards < this.data.questionCount) {
      wx.showToast({ title: '可用卡片不足', icon: 'none' });
      return;
    }

    const examConfig = {
      libraries: this.data.selectedLibraries,
      questionCount: this.data.questionCount,
      duration: this.data.duration,
      mode: this.data.examMode
    };

    wx.setStorageSync('examConfig', examConfig);
    wx.navigateTo({ url: '/pages/study/exam/do/do' });
  }
});

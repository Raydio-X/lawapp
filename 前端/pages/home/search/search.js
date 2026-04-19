const { cardAPI, libraryAPI } = require('../../../utils/api');

Page({
  data: {
    keyword: '',
    activeTab: 'cards',
    cards: [],
    cardsTotal: 0,
    cardsPage: 1,
    cardsHasMore: false,
    cardsLoading: false,
    libraries: [],
    libsTotal: 0,
    libsPage: 1,
    libsHasMore: false,
    libsLoading: false
  },

  onLoad(options) {
    if (options.keyword) {
      const keyword = decodeURIComponent(options.keyword);
      this.setData({ keyword });
      this.doSearch();
    }
  },

  onSearchInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  onSearchConfirm() {
    const { keyword } = this.data;
    if (!keyword.trim()) {
      wx.showToast({ title: '请输入搜索关键词', icon: 'none' });
      return;
    }
    this.setData({
      cards: [],
      libraries: [],
      cardsPage: 1,
      libsPage: 1,
      cardsTotal: 0,
      libsTotal: 0
    });
    this.doSearch();
  },

  clearKeyword() {
    this.setData({
      keyword: '',
      cards: [],
      libraries: [],
      cardsPage: 1,
      libsPage: 1,
      cardsTotal: 0,
      libsTotal: 0
    });
  },

  goBack() {
    wx.navigateBack();
  },

  onTabChange(e) {
    this.setData({ activeTab: e.detail.value });
    const { activeTab, keyword } = this.data;
    if (!keyword.trim()) return;
    if (activeTab === 'libraries' && this.data.libraries.length === 0) {
      this.searchLibraries();
    }
  },

  doSearch() {
    const { activeTab } = this.data;
    if (activeTab === 'cards') {
      this.searchCards();
    } else {
      this.searchLibraries();
    }
  },

  async searchCards() {
    const { keyword, cardsPage } = this.data;
    if (!keyword.trim()) return;

    this.setData({ cardsLoading: true });
    try {
      const res = await cardAPI.search(keyword, { page: cardsPage, pageSize: 10 });
      if (res.success && res.data) {
        const list = (res.data.list || []).map(item => ({
          ...item,
          tags: Array.isArray(item.tags) ? item.tags : (typeof item.tags === 'string' ? JSON.parse(item.tags) : [])
        }));
        const pagination = res.data.pagination || {};
        this.setData({
          cards: cardsPage === 1 ? list : [...this.data.cards, ...list],
          cardsTotal: pagination.total || 0,
          cardsHasMore: pagination.page < pagination.totalPages
        });
      }
    } catch (error) {
      console.error('搜索卡片失败:', error);
      wx.showToast({ title: '搜索失败', icon: 'none' });
    } finally {
      this.setData({ cardsLoading: false });
    }
  },

  async searchLibraries() {
    const { keyword, libsPage } = this.data;
    if (!keyword.trim()) return;

    this.setData({ libsLoading: true });
    try {
      const res = await libraryAPI.search(keyword, { page: libsPage, pageSize: 10 });
      if (res.success && res.data) {
        const list = res.data.list || [];
        const pagination = res.data.pagination || {};
        this.setData({
          libraries: libsPage === 1 ? list : [...this.data.libraries, ...list],
          libsTotal: pagination.total || 0,
          libsHasMore: pagination.page < pagination.totalPages
        });
      }
    } catch (error) {
      console.error('搜索知识库失败:', error);
      wx.showToast({ title: '搜索失败', icon: 'none' });
    } finally {
      this.setData({ libsLoading: false });
    }
  },

  loadMoreCards() {
    if (this.data.cardsLoading || !this.data.cardsHasMore) return;
    this.setData({ cardsPage: this.data.cardsPage + 1 });
    this.searchCards();
  },

  loadMoreLibraries() {
    if (this.data.libsLoading || !this.data.libsHasMore) return;
    this.setData({ libsPage: this.data.libsPage + 1 });
    this.searchLibraries();
  },

  onCardTap(e) {
    const index = e.currentTarget.dataset.index;
    const card = this.data.cards[index];
    if (card) {
      wx.navigateTo({ 
        url: `/pages/card/study/study?cardId=${card.id}&libraryId=${card.library_id || ''}` 
      });
    }
  },

  onLibraryTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/library/detail/detail?id=${id}` });
  }
});

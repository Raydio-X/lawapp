const { libraryAPI, cardAPI, isLoggedIn } = require('../../utils/api');

Page({
  data: {
    searchValue: '',
    currentFilter: 'all',
    hotCards: [],
    allLibraries: [],
    libraries: [],
    loading: false
  },

  isLoading: false,

  onLoad() {
    this.loadData(true);
  },

  onShow() {
    if (!this.isLoading) {
      this.loadData(false);
    }
  },

  onPullDownRefresh() {
    this.loadData(false, () => {
      wx.stopPullDownRefresh();
    });
  },

  async loadData(showLoading = false, callback) {
    if (this.isLoading) return;
    this.isLoading = true;

    if (showLoading) {
      this.setData({ loading: true });
    }

    try {
      await Promise.all([
        this.loadHotCards(),
        this.loadLibraries()
      ]);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      this.isLoading = false;
      if (showLoading) {
        this.setData({ loading: false });
      }
      if (callback) callback();
    }
  },

  async loadHotCards() {
    try {
      const res = await cardAPI.getHotCards(5);
      if (res.success && res.data) {
        const cards = (res.data || []).map(item => ({
          id: item.id,
          title: item.question,
          question: item.question,
          answer: item.answer,
          tags: item.tags || [],
          likes: item.like_count || 0,
          learned: item.learned || false,
          liked: Boolean(item.is_liked),
          pressed: false
        }));
        this.setData({ hotCards: cards });
      }
    } catch (error) {
      console.error('加载热门卡片失败:', error);
    }
  },

  async loadLibraries() {
    try {
      const res = await libraryAPI.getList({ page: 1, pageSize: 20 });
      if (res.success && res.data) {
        const libs = (res.data.list || res.data || []).map(item => ({
          id: item.id,
          name: item.name,
          subject: item.subject || item.category_name || '未分类',
          cardCount: item.card_count || 0,
          favorites: item.favorite_count || 0,
          isFavorited: Boolean(item.is_favorited),
          pressed: false
        }));
        this.setData({
          allLibraries: libs,
          libraries: libs
        });
      }
    } catch (error) {
      console.error('加载知识库失败:', error);
    }
  },

  onSearchInput(e) {
    this.setData({
      searchValue: e.detail.value
    });
  },

  clearSearch() {
    this.setData({
      searchValue: ''
    });
  },

  onFilterChange(e) {
    const filter = e.currentTarget.dataset.filter;
    const allLibraries = this.data.allLibraries;
    let filteredLibraries = [];
    
    if (filter === 'all') {
      filteredLibraries = allLibraries;
    } else if (filter === 'civil') {
      filteredLibraries = allLibraries.filter(item => item.subject === '民法');
    } else if (filter === 'criminal') {
      filteredLibraries = allLibraries.filter(item => item.subject === '刑法');
    }
    
    this.setData({
      currentFilter: filter,
      libraries: filteredLibraries
    });
  },

  onCardTouchStart(e) {
    const { index, type } = e.currentTarget.dataset;
    const key = type === 'hot' ? 'hotCards' : 'libraries';
    const items = this.data[key];
    if (items && items[index]) {
      items[index].pressed = true;
      this.setData({ [key]: items });
    }
  },

  onCardTouchEnd(e) {
    const { index, type } = e.currentTarget.dataset;
    const key = type === 'hot' ? 'hotCards' : 'libraries';
    const items = this.data[key];
    if (items && items[index]) {
      items[index].pressed = false;
      this.setData({ [key]: items });
    }
  },

  onLibraryTouchStart(e) {
    const { index } = e.currentTarget.dataset;
    const libraries = this.data.libraries;
    if (libraries && libraries[index]) {
      libraries[index].pressed = true;
      this.setData({ libraries });
    }
  },

  onLibraryTouchEnd(e) {
    const { index } = e.currentTarget.dataset;
    const libraries = this.data.libraries;
    if (libraries && libraries[index]) {
      libraries[index].pressed = false;
      this.setData({ libraries });
    }
  },

  onCardTap(e) {
    const { index, type } = e.currentTarget.dataset;
    
    if (type === 'hot') {
      const hotCards = this.data.hotCards;
      const card = hotCards[index];
      
      if (!card) return;
      
      const cardList = hotCards.map(item => ({
        id: item.id,
        question: item.question,
        answer: item.answer,
        tags: item.tags,
        learned: item.learned || false
      }));
      
      wx.setStorageSync('hotCardsData', {
        cardList: cardList,
        libraryId: 'hot_cards',
        libraryName: '热门卡片'
      });
      
      wx.navigateTo({
        url: `/pages/card/study/study?cardId=${card.id}&libraryId=hot_cards&index=${index}`,
        fail: (err) => {
          console.error('跳转失败:', err);
          wx.showToast({ title: '页面跳转失败', icon: 'none' });
        }
      });
    }
  },

  onLibraryTap(e) {
    const { index } = e.currentTarget.dataset;
    const library = this.data.libraries[index];
    
    if (!library) {
      console.error('未找到对应的知识库，index:', index);
      return;
    }
    
    console.log('跳转到知识库详情页:', library.id, library.name);
    
    wx.navigateTo({
      url: `/pages/library/detail/detail?id=${library.id}&name=${encodeURIComponent(library.name)}`,
      fail: (err) => {
        console.error('跳转失败:', err);
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  goToMoreCards() {
    wx.navigateTo({
      url: '/pages/home/hotCards/hotCards',
      fail: (err) => {
        console.error('跳转失败:', err);
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  async onLikeCard(e) {
    if (!isLoggedIn()) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再进行点赞操作',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/login/login' });
          }
        }
      });
      return;
    }

    const { index, id } = e.currentTarget.dataset;
    const hotCards = this.data.hotCards;
    const card = hotCards[index];

    if (!card) return;

    try {
      let res;
      if (card.liked) {
        res = await cardAPI.unlike(id);
      } else {
        res = await cardAPI.like(id);
      }

      if (res.success) {
        hotCards[index].liked = Boolean(res.data.isLiked);
        hotCards[index].likes = res.data.likeCount;
        this.setData({ hotCards });

        wx.showToast({ 
          title: res.data.isLiked ? '点赞成功' : '已取消点赞', 
          icon: 'success' 
        });
      }
    } catch (error) {
      console.error('操作失败:', error);
      wx.showToast({ title: error.message || '操作失败', icon: 'none' });
    }
  },

  async onFavoriteLibrary(e) {
    if (!isLoggedIn()) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再进行收藏操作',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/login/login' });
          }
        }
      });
      return;
    }

    const { index, id } = e.currentTarget.dataset;
    const libraries = this.data.libraries;
    const library = libraries[index];

    if (!library) return;

    try {
      const res = await libraryAPI.toggleFavorite(id);
      
      if (res.success) {
        const isFavorited = Boolean(res.data.isFavorited);
        const favoriteCount = res.data.favoriteCount;

        libraries[index].isFavorited = isFavorited;
        libraries[index].favorites = favoriteCount;
        this.setData({ libraries });

        const allLibraries = this.data.allLibraries;
        const allIndex = allLibraries.findIndex(item => item.id === id);
        if (allIndex !== -1) {
          allLibraries[allIndex].isFavorited = isFavorited;
          allLibraries[allIndex].favorites = favoriteCount;
          this.setData({ allLibraries });
        }

        wx.showToast({ 
          title: isFavorited ? '收藏成功' : '已取消收藏', 
          icon: 'success' 
        });
      }
    } catch (error) {
      console.error('操作失败:', error);
      wx.showToast({ title: error.message || '操作失败', icon: 'none' });
    }
  }
});

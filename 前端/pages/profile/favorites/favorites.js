const { favoriteAPI } = require('../../../utils/api');

Page({
  data: {
    favorites: [],
    loading: true,
    type: 'card'
  },

  _isLoading: false,

  onLoad() {
    this.loadFavorites(true);
  },

  onShow() {
    if (!this._isLoading) {
      this.loadFavorites(false);
    }
  },

  async loadFavorites(showLoading = false) {
    if (this._isLoading) return;
    this._isLoading = true;

    if (showLoading) {
      this.setData({ loading: true });
    }

    try {
      const res = await favoriteAPI.getList({ type: this.data.type, page: 1, pageSize: 100 });
      if (res.success && res.data) {
        const favorites = (res.data.list || []).map(item => ({
          id: item.target_id,
          name: item.target_name,
          type: item.target_type,
          time: this.formatTime(item.created_at),
          pressed: false
        }));
        this.setData({ favorites });
      }
    } catch (error) {
      console.error('加载收藏失败:', error);
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    } finally {
      this._isLoading = false;
      if (showLoading) {
        this.setData({ loading: false });
      }
    }
  },

  formatTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  },

  onTypeChange(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ type });
    this.loadFavorites();
  },

  onItemTouchStart(e) {
    const { index } = e.currentTarget.dataset;
    const favorites = this.data.favorites;
    if (favorites[index]) {
      favorites[index].pressed = true;
      this.setData({ favorites });
    }
  },

  onItemTouchEnd(e) {
    const { index } = e.currentTarget.dataset;
    const favorites = this.data.favorites;
    if (favorites[index]) {
      favorites[index].pressed = false;
      this.setData({ favorites });
    }
  },

  onItemTap(e) {
    const { index } = e.currentTarget.dataset;
    const item = this.data.favorites[index];
    
    if (item.type === 'library') {
      wx.navigateTo({
        url: `/pages/library/detail/detail?id=${item.id}&name=${encodeURIComponent(item.name)}`
      });
    } else if (item.type === 'card') {
      wx.navigateTo({
        url: `/pages/card/study/study?cardId=${item.id}&libraryId=hot_cards&index=0`
      });
    }
  },

  async onRemoveFavorite(e) {
    const { index } = e.currentTarget.dataset;
    const item = this.data.favorites[index];

    wx.showModal({
      title: '提示',
      content: '确定取消收藏吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await favoriteAPI.remove(item.type, item.id);
            const favorites = this.data.favorites.filter((_, i) => i !== index);
            this.setData({ favorites });
            wx.showToast({ title: '已取消收藏', icon: 'success' });
          } catch (error) {
            wx.showToast({ title: error.message || '操作失败', icon: 'none' });
          }
        }
      }
    });
  }
});

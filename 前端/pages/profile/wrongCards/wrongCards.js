const { wrongCardAPI, cardAPI } = require('../../../utils/api');

Page({
  data: {
    wrongCards: [],
    loading: true,
    stats: {
      total: 0,
      mastered: 0,
      unmastered: 0
    }
  },

  onLoad() {
    this.loadWrongCards();
  },

  onShow() {
    this.loadWrongCards();
  },

  async loadWrongCards() {
    this.setData({ loading: true });

    try {
      const [listRes, statsRes] = await Promise.all([
        wrongCardAPI.getList({ page: 1, pageSize: 100 }),
        wrongCardAPI.getStats()
      ]);

      if (listRes.success && listRes.data) {
        const wrongCards = (listRes.data.list || []).map(item => ({
          id: item.card_id,
          question: item.question,
          answer: item.answer,
          tags: item.tags || [],
          libraryName: item.library_name,
          isMastered: item.is_mastered === 1,
          time: this.formatTime(item.created_at),
          pressed: false
        }));
        this.setData({ wrongCards });
      }

      if (statsRes.success && statsRes.data) {
        this.setData({ stats: statsRes.data });
      }
    } catch (error) {
      console.error('加载错题失败:', error);
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  formatTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  },

  onItemTouchStart(e) {
    const { index } = e.currentTarget.dataset;
    const wrongCards = this.data.wrongCards;
    if (wrongCards[index]) {
      wrongCards[index].pressed = true;
      this.setData({ wrongCards });
    }
  },

  onItemTouchEnd(e) {
    const { index } = e.currentTarget.dataset;
    const wrongCards = this.data.wrongCards;
    if (wrongCards[index]) {
      wrongCards[index].pressed = false;
      this.setData({ wrongCards });
    }
  },

  onItemTap(e) {
    const { index } = e.currentTarget.dataset;
    const item = this.data.wrongCards[index];
    
    wx.navigateTo({
      url: `/pages/card/study/study?cardId=${item.id}&libraryId=hot_cards&index=0`
    });
  },

  async onToggleMastered(e) {
    const { index } = e.currentTarget.dataset;
    const item = this.data.wrongCards[index];

    try {
      if (item.isMastered) {
        await wrongCardAPI.markAsUnmastered(item.id);
      } else {
        await wrongCardAPI.markAsMastered(item.id);
      }

      const wrongCards = this.data.wrongCards;
      wrongCards[index].isMastered = !item.isMastered;
      this.setData({ wrongCards });

      const stats = this.data.stats;
      if (item.isMastered) {
        stats.mastered++;
        stats.unmastered--;
      } else {
        stats.mastered--;
        stats.unmastered++;
      }
      this.setData({ stats });

      wx.showToast({ 
        title: item.isMastered ? '已标记掌握' : '已取消掌握', 
        icon: 'success' 
      });
    } catch (error) {
      wx.showToast({ title: error.message || '操作失败', icon: 'none' });
    }
  },

  async onRemove(e) {
    const { index } = e.currentTarget.dataset;
    const item = this.data.wrongCards[index];

    wx.showModal({
      title: '提示',
      content: '确定从错题本中移除吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await wrongCardAPI.delete(item.id);
            const wrongCards = this.data.wrongCards.filter((_, i) => i !== index);
            const stats = this.data.stats;
            stats.total--;
            if (item.isMastered) {
              stats.mastered--;
            } else {
              stats.unmastered--;
            }
            this.setData({ wrongCards, stats });
            wx.showToast({ title: '已移除', icon: 'success' });
          } catch (error) {
            wx.showToast({ title: error.message || '操作失败', icon: 'none' });
          }
        }
      }
    });
  }
});

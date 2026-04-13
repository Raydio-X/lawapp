const { cardAPI, isLoggedIn } = require('../../../utils/api');

Page({
  data: {
    hotCards: [],
    loading: true
  },

  onLoad() {
    this.loadHotCards();
  },

  onShow() {
    const masteryChanges = wx.getStorageSync('cardMasteryChanges');
    if (masteryChanges && Object.keys(masteryChanges).length > 0) {
      this.updateCardMastery(masteryChanges);
      wx.removeStorageSync('cardMasteryChanges');
    }
  },

  updateCardMastery(masteryChanges) {
    if (!masteryChanges || Object.keys(masteryChanges).length === 0) return;

    const hotCards = this.data.hotCards;
    let hasChanges = false;

    hotCards.forEach(card => {
      if (masteryChanges[card.id] !== undefined) {
        card.learned = masteryChanges[card.id];
        hasChanges = true;
      }
    });

    if (hasChanges) {
      this.setData({ hotCards });
    }
  },

  async loadHotCards() {
    this.setData({ loading: true });

    try {
      const res = await cardAPI.getHotCards(20);
      if (res.success && res.data) {
        const hotCards = res.data.map(card => ({
          id: card.id,
          title: card.question.length > 30 ? card.question.substring(0, 30) + '...' : card.question,
          question: card.question,
          answer: card.answer,
          tags: card.tags || [],
          likes: card.like_count || card.study_count || 0,
          learned: card.is_learned || false,
          liked: Boolean(card.is_liked),
          pressed: false
        }));

        this.setData({ hotCards });
      }
    } catch (error) {
      console.error('加载热门卡片失败:', error);
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onCardTouchStart(e) {
    const { index } = e.currentTarget.dataset;
    const hotCards = this.data.hotCards;
    if (hotCards[index]) {
      hotCards[index].pressed = true;
      this.setData({ hotCards });
    }
  },

  onCardTouchEnd(e) {
    const { index } = e.currentTarget.dataset;
    const hotCards = this.data.hotCards;
    if (hotCards[index]) {
      hotCards[index].pressed = false;
      this.setData({ hotCards });
    }
  },

  onCardTap(e) {
    const { index } = e.currentTarget.dataset;
    const hotCards = this.data.hotCards;
    const card = hotCards[index];

    if (!card) return;

    wx.navigateTo({
      url: `/pages/card/study/study?cardId=${card.id}&libraryId=hot_cards&index=${index}`,
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
  }
});

const { cardAPI, studyAPI, commentAPI } = require('../../../utils/api');

const app = getApp();

Page({
  data: {
    statusBarHeight: 20,
    currentIndex: 0,
    totalCards: 0,
    progress: 0,
    currentCard: null,
    cardList: [],
    answerRevealed: false,
    libraryNames: '',
    loading: true,
    comments: [],
    commentText: ''
  },

  studiedCards: null,

  onLoad(options) {
    const systemInfo = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: systemInfo.statusBarHeight });
    
    const { index, total } = options;
    this.studiedCards = new Set();
    this.setData({
      currentIndex: parseInt(index) || 0,
      totalCards: parseInt(total) || 0
    });
    
    this.loadCardData();
    app.startStudyTimer();
  },

  onUnload() {
    app.stopStudyTimer();
  },

  onHide() {
    app.pauseStudyTimer();
  },

  onShow() {
    if (app.getStudyStatus()) {
      app.startStudyTimer();
    }
  },

  onBack() {
    wx.showModal({
      title: '退出学习',
      content: '确定要退出学习吗？',
      success: (res) => {
        if (res.confirm) {
          app.stopStudyTimer();
          wx.switchTab({ url: '/pages/study/index' });
        }
      }
    });
  },

  loadCardData() {
    const data = wx.getStorageSync('studyCardsData');
    if (data && data.cardList) {
      const { cardList, libraryNames, totalCards } = data;
      const currentCard = cardList[this.data.currentIndex];
      const progress = totalCards > 0 ? Math.round(((this.data.currentIndex + 1) / totalCards) * 100) : 0;
      
      this.setData({
        cardList,
        libraryNames,
        totalCards,
        currentCard,
        progress,
        loading: false
      });

      if (currentCard) {
        this.loadComments(currentCard.id);
      }
    } else {
      this.setData({ loading: false });
      wx.showToast({
        title: '数据加载失败',
        icon: 'none'
      });
    }
  },

  async loadComments(cardId) {
    try {
      const res = await commentAPI.getList(cardId);
      if (res.success && res.data) {
        const comments = (res.data.list || res.data || []).map(c => ({
          id: c.id,
          username: c.nickname || '用户',
          avatar: (c.nickname || '用')[0],
          content: c.content,
          time: this.formatTime(c.created_at),
          likeCount: c.like_count || 0,
          liked: false
        }));
        this.setData({ comments });
      }
    } catch (error) {
      console.error('加载评论失败:', error);
    }
  },

  formatTime(dateStr) {
    if (!dateStr) return '未知';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 30) return `${days}天前`;
    return dateStr.substring(0, 10);
  },

  onRevealAnswer() {
    this.setData({ answerRevealed: true });
    this.recordCardStudy();
  },

  async recordCardStudy() {
    const token = wx.getStorageSync('access_token');
    if (!token) return;

    const { currentCard } = this.data;
    if (!currentCard) return;

    if (this.studiedCards.has(currentCard.id)) return;

    try {
      await cardAPI.recordStudy(currentCard.id, {
        libraryId: currentCard.libraryId,
        feedback: 'normal',
        duration: 0,
        isFormalStudy: true
      });
      this.studiedCards.add(currentCard.id);
    } catch (error) {
      console.error('记录学习失败:', error);
    }
  },

  onCommentInput(e) {
    this.setData({ commentText: e.detail.value });
  },

  async onSubmitComment() {
    const { commentText, currentCard } = this.data;
    
    if (!commentText.trim()) return;

    const token = wx.getStorageSync('access_token');
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    try {
      const res = await commentAPI.create(currentCard.id, { content: commentText.trim() });
      if (res.success) {
        const newComment = {
          id: res.data?.id || Date.now(),
          username: '我',
          avatar: '我',
          content: commentText.trim(),
          time: '刚刚',
          likeCount: 0,
          liked: false
        };
        this.setData({
          comments: [newComment, ...this.data.comments],
          commentText: ''
        });
        wx.showToast({ title: '评论成功', icon: 'success' });
      }
    } catch (error) {
      console.error('评论失败:', error);
      wx.showToast({ title: error.message || '评论失败', icon: 'none' });
    }
  },

  async onLikeComment(e) {
    const { index, id } = e.currentTarget.dataset;
    const comments = this.data.comments;
    const comment = comments[index];

    if (!comment) return;

    const token = wx.getStorageSync('access_token');
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    try {
      const res = await commentAPI.like(id);
      if (res.success) {
        comments[index].liked = true;
        comments[index].likeCount = (comment.likeCount || 0) + 1;
        
        comments.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
        
        this.setData({ comments });
      }
    } catch (error) {
      console.error('点赞失败:', error);
      wx.showToast({ title: error.message || '点赞失败', icon: 'none' });
    }
  },

  onSaveCommentAsCard(e) {
    const { index } = e.currentTarget.dataset;
    const comment = this.data.comments[index];
    const currentCard = this.data.currentCard;

    if (!comment || !currentCard) return;

    const token = wx.getStorageSync('access_token');
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    wx.navigateTo({
      url: `/pages/create/cardForm/cardForm?question=${encodeURIComponent(currentCard.question)}&answer=${encodeURIComponent(comment.content)}`
    });
  },

  onPrevCard() {
    const { currentIndex } = this.data;
    if (currentIndex <= 0) return;
    
    this.switchCard(currentIndex - 1);
  },

  async onForgot() {
    const { currentCard, currentIndex, totalCards, answerRevealed, cardList } = this.data;
    
    if (!answerRevealed) {
      wx.showToast({
        title: '请先查看答案',
        icon: 'none'
      });
      return;
    }

    try {
      if (!this.studiedCards.has(currentCard.id)) {
        await cardAPI.recordStudy(currentCard.id, {
          libraryId: currentCard.libraryId,
          feedback: 'hard',
          duration: 0,
          isFormalStudy: true
        });
        this.studiedCards.add(currentCard.id);
      }

      const res = await cardAPI.setMastery(currentCard.id, false);
      
      if (res.success) {
        const updatedCard = {
          ...currentCard,
          learned: false
        };

        const updatedCardList = [...cardList];
        updatedCardList[currentIndex] = updatedCard;

        wx.setStorageSync('studyCardsData', {
          cardList: updatedCardList,
          libraryNames: this.data.libraryNames,
          totalCards
        });

        this.moveToNextCard(currentIndex, totalCards);
      }
    } catch (error) {
      console.error('标记忘记失败:', error);
      wx.showToast({
        title: error.message || '操作失败',
        icon: 'none'
      });
    }
  },

  async onMastered() {
    const { currentCard, currentIndex, totalCards, answerRevealed, cardList } = this.data;
    
    if (!answerRevealed) {
      wx.showToast({
        title: '请先查看答案',
        icon: 'none'
      });
      return;
    }

    try {
      if (!this.studiedCards.has(currentCard.id)) {
        await cardAPI.recordStudy(currentCard.id, {
          libraryId: currentCard.libraryId,
          feedback: 'easy',
          duration: 0,
          isFormalStudy: true
        });
        this.studiedCards.add(currentCard.id);
      }

      const res = await cardAPI.setMastery(currentCard.id, true);
      
      if (res.success) {
        const updatedCard = {
          ...currentCard,
          learned: true
        };

        const updatedCardList = [...cardList];
        updatedCardList[currentIndex] = updatedCard;

        wx.setStorageSync('studyCardsData', {
          cardList: updatedCardList,
          libraryNames: this.data.libraryNames,
          totalCards
        });

        this.moveToNextCard(currentIndex, totalCards);
      }
    } catch (error) {
      console.error('标记掌握失败:', error);
      wx.showToast({
        title: error.message || '操作失败',
        icon: 'none'
      });
    }
  },

  moveToNextCard(currentIndex, totalCards) {
    if (currentIndex >= totalCards - 1) {
      wx.showToast({
        title: '恭喜完成学习！',
        icon: 'success'
      });
      setTimeout(() => {
        app.stopStudyTimer();
        wx.switchTab({ url: '/pages/study/index' });
      }, 1500);
    } else {
      setTimeout(() => {
        this.switchCard(currentIndex + 1);
      }, 300);
    }
  },

  switchCard(index) {
    const { cardList, totalCards } = this.data;
    
    if (index < 0 || index >= totalCards) return;
    
    const currentCard = cardList[index];
    const progress = totalCards > 0 ? Math.round(((index + 1) / totalCards) * 100) : 0;
    
    this.setData({
      currentIndex: index,
      currentCard,
      progress,
      answerRevealed: false,
      comments: [],
      commentText: ''
    });

    if (currentCard) {
      this.loadComments(currentCard.id);
    }
  }
});

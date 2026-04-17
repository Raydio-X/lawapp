const { cardAPI, studyAPI, commentAPI } = require('../../../utils/api');

Page({
  data: {
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

  studyTimer: null,
  studyStartTime: null,
  studiedCards: null,

  onLoad(options) {
    const { index, total } = options;
    this.studiedCards = new Set();
    this.setData({
      currentIndex: parseInt(index) || 0,
      totalCards: parseInt(total) || 0
    });
    
    this.loadCardData();
    this.startStudyTimer();
  },

  onUnload() {
    this.stopStudyTimer();
    this.syncStudyTime();
  },

  onHide() {
    this.stopStudyTimer();
    this.syncStudyTime();
  },

  onShow() {
    if (this.studyStartTime) {
      this.startStudyTimer();
    }
  },

  startStudyTimer() {
    if (this.studyTimer) {
      clearInterval(this.studyTimer);
    }
    this.studyStartTime = Date.now();
    this.studyTimer = setInterval(() => {
      this.syncStudyTime();
    }, 30000);
  },

  stopStudyTimer() {
    if (this.studyTimer) {
      clearInterval(this.studyTimer);
      this.studyTimer = null;
    }
  },

  async syncStudyTime() {
    if (!this.studyStartTime) return;
    
    const duration = Math.floor((Date.now() - this.studyStartTime) / 1000);
    if (duration < 10) return;
    
    try {
      await studyAPI.recordStudyTime(null, duration, { showLoading: false });
      this.studyStartTime = Date.now();
    } catch (error) {
      console.error('同步学习时间失败:', error);
    }
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
        duration: 0
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

  async onMarkLearned() {
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
          feedback: 'normal',
          duration: 0
        });
        this.studiedCards.add(currentCard.id);
      }

      const res = await cardAPI.toggleMastery(currentCard.id);
      
      if (res.success) {
        const isLearned = res.data.mastered;
        
        const updatedCard = {
          ...currentCard,
          learned: isLearned
        };

        const updatedCardList = [...cardList];
        updatedCardList[currentIndex] = updatedCard;

        wx.setStorageSync('studyCardsData', {
          cardList: updatedCardList,
          libraryNames: this.data.libraryNames,
          totalCards
        });

        if (currentIndex >= totalCards - 1) {
          wx.showToast({
            title: '恭喜完成学习！',
            icon: 'success'
          });
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        } else {
          setTimeout(() => {
            this.switchCard(currentIndex + 1);
          }, 300);
        }
      }
    } catch (error) {
      console.error('标记学习失败:', error);
      wx.showToast({
        title: error.message || '操作失败',
        icon: 'none'
      });
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

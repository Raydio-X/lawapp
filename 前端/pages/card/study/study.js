const { cardAPI, commentAPI, studyAPI, wrongCardAPI, favoriteAPI } = require('../../../utils/api');

Page({
  data: {
    libraryId: null,
    currentIndex: 0,
    totalCards: 0,
    currentCard: null,
    answerRevealed: false,
    comments: [],
    commentText: '',
    cardList: [],
    loading: true,
    libraryName: '',
    isFavorite: false,
    mode: ''
  },

  studiedCards: new Set(),

  onLoad(options) {
    const { cardId, libraryId, index, name, mode } = options;
    
    if (libraryId) {
      this.setData({ 
        libraryId: libraryId === 'hot_cards' ? libraryId : parseInt(libraryId),
        libraryName: name ? decodeURIComponent(name) : '',
        mode: mode || ''
      });
    }
    
    this.loadCardData(cardId, parseInt(index) || 0);
  },

  onUnload() {
    this.saveStudyProgress();
    this.notifyPrevPage();
  },

  onHide() {
  },

  notifyPrevPage() {
    const pages = getCurrentPages();
    console.log('notifyPrevPage - pages.length:', pages.length);
    if (pages.length < 2) return;

    const prevPage = pages[pages.length - 2];
    const masteryChanges = wx.getStorageSync('cardMasteryChanges');
    
    console.log('notifyPrevPage - prevPage.route:', prevPage.route);
    console.log('notifyPrevPage - masteryChanges:', masteryChanges);
    
    if (!masteryChanges || Object.keys(masteryChanges).length === 0) return;

    if (prevPage.route === 'pages/library/detail/detail') {
      console.log('Calling updateCardMastery on detail page');
      if (typeof prevPage.updateCardMastery === 'function') {
        prevPage.updateCardMastery(masteryChanges);
      } else {
        console.log('updateCardMastery method not found');
      }
    } else if (prevPage.route === 'pages/home/hotCards/hotCards') {
      if (typeof prevPage.updateCardMastery === 'function') {
        prevPage.updateCardMastery(masteryChanges);
      }
    }

    wx.removeStorageSync('cardMasteryChanges');
  },

  async loadCardData(cardId, index) {
    this.setData({ loading: true });

    try {
      if (this.data.libraryId === 'hot_cards') {
        await this.loadHotCards(cardId, index);
      } else if (this.data.libraryId) {
        await this.loadLibraryCards(cardId, index);
      } else if (cardId) {
        await this.loadSingleCard(cardId);
      } else {
        wx.showToast({ title: '参数错误', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 1500);
      }
    } catch (error) {
      console.error('加载卡片失败:', error);
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  async loadSingleCard(cardId) {
    try {
      const res = await cardAPI.getDetail(cardId);
      if (res.success && res.data) {
        const card = res.data;
        const cardList = [{
          id: card.id,
          question: card.question,
          answer: card.answer,
          tags: card.tags || [],
          learned: card.is_learned || false,
          studyCount: card.study_count || 0
        }];

        this.setData({
          cardList: cardList,
          totalCards: 1,
          currentIndex: 0,
          currentCard: cardList[0],
          answerRevealed: false,
          libraryName: card.library_name || '卡片详情'
        });

        wx.setNavigationBarTitle({ title: '卡片详情' });
        this.loadComments(card.id);
        this.checkFavorite(card.id);
      }
    } catch (error) {
      console.error('加载卡片详情失败:', error);
      throw error;
    }
  },

  async loadHotCards(cardId, index) {
    try {
      const res = await cardAPI.getHotCards(20);
      console.log('热门卡片API返回:', res);
      
      if (res.success && res.data && Array.isArray(res.data)) {
        const cardList = res.data.map(card => ({
          id: card.id,
          question: card.question,
          answer: card.answer,
          tags: card.tags || [],
          learned: card.is_learned || false,
          likes: card.like_count || 0
        }));

        console.log('处理后的卡片列表:', cardList);

        if (cardList.length === 0) {
          wx.showToast({ title: '暂无热门卡片', icon: 'none' });
          setTimeout(() => wx.navigateBack(), 1500);
          return;
        }

        const currentIndex = index || 0;
        const currentCard = cardList[currentIndex] || cardList[0];

        console.log('当前卡片:', currentCard);
        console.log('设置数据: cardList.length=', cardList.length, 'currentIndex=', currentIndex);

        this.setData({
          cardList: cardList,
          totalCards: cardList.length,
          currentIndex: currentIndex,
          currentCard: currentCard,
          answerRevealed: false
        });

        console.log('setData完成，currentCard:', this.data.currentCard);

        wx.setNavigationBarTitle({
          title: `热门卡片 ${currentIndex + 1}/${cardList.length}`
        });

        this.loadComments(currentCard.id);
        this.checkFavorite(currentCard.id);
      } else {
        console.error('API返回数据格式错误:', res);
        throw new Error('数据格式错误');
      }
    } catch (error) {
      console.error('加载热门卡片异常:', error);
      throw error;
    }
  },

  async loadLibraryCards(cardId, index) {
    try {
      const storedData = wx.getStorageSync('libraryCardsData');
      
      if (storedData && storedData.isFiltered && storedData.cardList && storedData.cardList.length > 0) {
        const cardList = storedData.cardList;
        const currentIndex = index || 0;
        const currentCard = cardList[currentIndex] || cardList[0];

        this.setData({
          cardList: cardList,
          totalCards: cardList.length,
          currentIndex: currentIndex,
          currentCard: currentCard,
          answerRevealed: false
        });

        const titleName = this.data.libraryName || '卡片';
        wx.setNavigationBarTitle({
          title: `${titleName} ${currentIndex + 1}/${cardList.length}`
        });

        this.loadComments(currentCard.id);
        this.checkFavorite(currentCard.id);
        return;
      }

      const res = await cardAPI.getList({ 
        library_id: this.data.libraryId, 
        page: 1, 
        pageSize: 1000 
      });

      console.log('知识库卡片API返回:', res);

      if (res.success && res.data) {
        const cardList = (res.data.list || res.data || []).map(card => ({
          id: card.id,
          question: card.question,
          answer: card.answer,
          tags: card.tags || [],
          learned: card.is_learned || false,
          studyCount: card.study_count || 0
        }));

        console.log('处理后的卡片列表:', cardList);

        if (cardList.length === 0) {
          wx.showToast({ title: '暂无卡片', icon: 'none' });
          setTimeout(() => wx.navigateBack(), 1500);
          return;
        }

        const currentIndex = index || 0;
        const currentCard = cardList[currentIndex] || cardList[0];

        console.log('当前卡片:', currentCard);

        this.setData({
          cardList: cardList,
          totalCards: cardList.length,
          currentIndex: currentIndex,
          currentCard: currentCard,
          answerRevealed: false
        });

        const titleName = this.data.libraryName || '卡片';
        wx.setNavigationBarTitle({
          title: `${titleName} ${currentIndex + 1}/${cardList.length}`
        });

        this.loadComments(currentCard.id);
        this.checkFavorite(currentCard.id);
      } else {
        console.error('API返回数据格式错误:', res);
        throw new Error('数据格式错误');
      }
    } catch (error) {
      console.error('加载知识库卡片异常:', error);
      throw error;
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

  async checkFavorite(cardId) {
    const token = wx.getStorageSync('access_token');
    if (!token) {
      this.setData({ isFavorite: false });
      return;
    }

    try {
      const res = await favoriteAPI.check('card', cardId);
      this.setData({ isFavorite: res.data && res.data.isFavorited });
    } catch (error) {
      console.error('检查收藏状态失败:', error);
    }
  },

  onRevealAnswer() {
    this.setData({ answerRevealed: true });
    this.recordCardStudy();
  },

  async recordCardStudy() {
    const token = wx.getStorageSync('access_token');
    if (!token) return;

    const { currentCard, libraryId } = this.data;
    if (!currentCard) return;

    if (this.studiedCards.has(currentCard.id)) return;

    try {
      await cardAPI.recordStudy(currentCard.id, {
        libraryId: libraryId === 'hot_cards' ? null : libraryId,
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
    const { currentIndex, cardList } = this.data;
    
    if (currentIndex <= 0) {
      wx.showToast({ title: '已经是第一张了', icon: 'none' });
      return;
    }

    this.switchCard(currentIndex - 1);
  },

  onNextCard() {
    const { currentIndex, totalCards } = this.data;
    
    if (currentIndex >= totalCards - 1) {
      wx.showToast({ title: '已经是最后一张了', icon: 'none' });
      return;
    }

    this.switchCard(currentIndex + 1);
  },

  switchCard(index) {
    const { cardList, libraryId, libraryName } = this.data;
    const newCard = cardList[index];

    this.setData({
      currentIndex: index,
      currentCard: newCard,
      answerRevealed: false,
      commentText: ''
    });

    const titlePrefix = libraryId === 'hot_cards' ? '热门卡片' : (libraryName || '卡片');
    wx.setNavigationBarTitle({
      title: `${titlePrefix} ${index + 1}/${cardList.length}`
    });

    this.loadComments(newCard.id);
    this.checkFavorite(newCard.id);
    this.saveStudyProgress();
  },

  async onToggleFavorite() {
    const token = wx.getStorageSync('access_token');
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    try {
      const res = await favoriteAPI.toggle('card', this.data.currentCard.id);
      const isFavorited = res.data && res.data.isFavorited;
      this.setData({ isFavorite: isFavorited });

      if (res.data && res.data.totalCount !== undefined) {
        wx.setStorageSync('favoriteCount', res.data.totalCount);
      }

      wx.showToast({
        title: isFavorited ? '已收藏' : '已取消收藏',
        icon: 'success'
      });
    } catch (error) {
      console.error('收藏操作失败:', error);
      wx.showToast({ title: error.message || '操作失败', icon: 'none' });
    }
  },

  async saveStudyProgress() {
    const { libraryId, currentIndex, currentCard } = this.data;
    if (!currentCard) return;

    const token = wx.getStorageSync('access_token');
    if (!token) return;

    try {
      if (libraryId !== 'hot_cards') {
        await studyAPI.getLibraryProgress(libraryId);
      }
    } catch (error) {
      console.error('保存学习进度失败:', error);
    }
  }
});

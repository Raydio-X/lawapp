const { adminAPI } = require('../../../utils/api');
const { cardAPI, chapterAPI, messageAPI } = require('../../../utils/api');

Page({
  data: {
    statusBarHeight: 0,
    navBarHeight: 0,
    activeTab: 'stats',
    stats: {
      totalLibraries: 0,
      totalCards: 0,
      totalUsers: 0,
      totalComments: 0,
      publicLibraries: 0,
      publicCards: 0
    },

    libraries: [],
    libraryPage: 1,
    libraryHasMore: true,
    libraryKeyword: '',

    cards: [],
    cardPage: 1,
    cardHasMore: true,
    cardKeyword: '',
    cardFilterPublic: '',

    allCards: [],
    isBatchSelectMode: false,
    selectedCardIds: [],
    showChapterPicker: false,
    chapterPickerList: [],
    targetChapterId: null,
    isAllSelected: false,

    comments: [],
    commentPage: 1,
    commentHasMore: true,
    commentKeyword: '',

    hotCards: [],
    hotCardPage: 1,
    hotCardHasMore: true,
    hotCardKeyword: '',

    showDeleteConfirm: false,
    deleteType: '',
    deleteId: null,
    deleteName: '',
    cancelBtnConfig: {
      content: '取消',
      style: 'color: #333;'
    },

    currentUserId: null
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight;
    const navBarHeight = statusBarHeight + 44;
    
    const userInfo = wx.getStorageSync('userInfo');
    
    this.setData({ 
      statusBarHeight,
      navBarHeight,
      currentUserId: userInfo ? userInfo.id : null
    });
    this.loadStats();
    this.loadLibraries();
    this.loadCards();
    this.loadComments();
    this._firstLoad = true;
  },

  onShow() {
    if (!this._firstLoad) {
      this.refreshAllData();
    }
    this._firstLoad = false;
  },

  refreshAllData() {
    this.setData({
      libraryPage: 1,
      cardPage: 1,
      commentPage: 1,
      libraryHasMore: true,
      cardHasMore: true,
      commentHasMore: true
    });
    this.loadStats();
    this.loadLibraries();
    this.loadCards();
    this.loadComments();
  },

  onPullDownRefresh() {
    this.setData({
      libraryPage: 1,
      cardPage: 1,
      commentPage: 1,
      libraryHasMore: true,
      cardHasMore: true,
      commentHasMore: true
    });
    this.loadStats();
    this.loadCurrentTabData(() => {
      wx.stopPullDownRefresh();
    });
  },

  onSwitchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ 
      activeTab: tab,
      isBatchSelectMode: false,
      selectedCardIds: [],
      isAllSelected: false
    });
    this.loadCurrentTabData();
  },

  loadCurrentTabData(callback) {
    const { activeTab } = this.data;
    if (activeTab === 'stats') {
      this.loadStats(callback);
    } else if (activeTab === 'libraries') {
      this.loadLibraries(callback);
    } else if (activeTab === 'cards') {
      this.loadCards(callback);
    } else if (activeTab === 'hotCards') {
      this.loadHotCards(callback);
    } else if (activeTab === 'comments') {
      this.loadComments(callback);
    } else if (callback) {
      callback();
    }
  },

  async loadStats(callback) {
    try {
      const res = await adminAPI.getStats();
      if (res.success && res.data) {
        this.setData({ stats: res.data });
      }
    } catch (error) {
      console.error('加载统计失败:', error);
    }
    if (callback) callback();
  },

  async loadLibraries(callback) {
    try {
      const params = {
        page: this.data.libraryPage,
        pageSize: 20
      };
      if (this.data.libraryKeyword) {
        params.keyword = this.data.libraryKeyword;
      }
      const res = await adminAPI.getLibraries(params);
      if (res.success && res.data) {
        const list = res.data.list || [];
        this.setData({
          libraries: this.data.libraryPage === 1 ? list : [...this.data.libraries, ...list],
          libraryHasMore: list.length >= 20
        });
      }
    } catch (error) {
      console.error('加载知识库失败:', error);
    }
    if (callback) callback();
  },

  async loadCards(callback) {
    try {
      const params = {
        page: this.data.cardPage,
        pageSize: 20
      };
      if (this.data.cardKeyword) {
        params.keyword = this.data.cardKeyword;
      }
      if (this.data.cardFilterPublic) {
        params.is_public = this.data.cardFilterPublic;
      }
      const res = await adminAPI.getCards(params);
      if (res.success && res.data) {
        const list = res.data.list || [];
        const allCards = this.data.cardPage === 1 ? list : [...this.data.allCards, ...list];
        const currentUserId = this.data.currentUserId;
        const displayCards = this.data.isBatchSelectMode 
          ? allCards.filter(c => c.created_by === currentUserId)
          : allCards;
        
        this.setData({
          allCards: allCards,
          cards: displayCards,
          cardHasMore: list.length >= 20
        });
      }
    } catch (error) {
      console.error('加载卡片失败:', error);
    }
    if (callback) callback();
  },

  async loadHotCards(callback) {
    try {
      const params = {
        page: this.data.hotCardPage,
        pageSize: 20,
        is_hot: '1'
      };
      if (this.data.hotCardKeyword) {
        params.keyword = this.data.hotCardKeyword;
      }
      const res = await adminAPI.getCards(params);
      if (res.success && res.data) {
        const list = res.data.list || [];
        this.setData({
          hotCards: this.data.hotCardPage === 1 ? list : [...this.data.hotCards, ...list],
          hotCardHasMore: list.length >= 20
        });
      }
    } catch (error) {
      console.error('加载热门卡片失败:', error);
    }
    if (callback) callback();
  },

  async loadComments(callback) {
    try {
      const params = {
        page: this.data.commentPage,
        pageSize: 20
      };
      if (this.data.commentKeyword) {
        params.keyword = this.data.commentKeyword;
      }
      const res = await adminAPI.getComments(params);
      if (res.success && res.data) {
        const list = (res.data.list || []).map(item => ({
          ...item,
          created_at: item.created_at ? item.created_at.split(' ')[0] : ''
        }));
        this.setData({
          comments: this.data.commentPage === 1 ? list : [...this.data.comments, ...list],
          commentHasMore: list.length >= 20
        });
      }
    } catch (error) {
      console.error('加载评论失败:', error);
    }
    if (callback) callback();
  },

  onLibrarySearchInput(e) {
    this.setData({ libraryKeyword: e.detail.value });
  },

  onLibrarySearch() {
    this.setData({ libraryPage: 1 });
    this.loadLibraries();
  },

  onCardSearchInput(e) {
    this.setData({ cardKeyword: e.detail.value });
  },

  onCardSearch() {
    this.setData({ cardPage: 1, allCards: [] });
    this.loadCards();
  },

  onCardFilterChange(e) {
    const filter = e.currentTarget.dataset.filter;
    this.setData({ cardFilterPublic: filter, cardPage: 1, allCards: [] });
    this.loadCards();
  },

  onCommentSearchInput(e) {
    this.setData({ commentKeyword: e.detail.value });
  },

  onCommentSearch() {
    this.setData({ commentPage: 1 });
    this.loadComments();
  },

  onHotCardSearchInput(e) {
    this.setData({ hotCardKeyword: e.detail.value });
  },

  onHotCardSearch() {
    this.setData({ hotCardPage: 1 });
    this.loadHotCards();
  },

  onShowCreateHotCard() {
    wx.navigateTo({
      url: '/pages/admin/cardForm/cardForm?isHot=1'
    });
  },

  onEditHotCard(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/admin/cardForm/cardForm?id=${id}&isHot=1`
    });
  },

  onDeleteHotCard(e) {
    const { id, index } = e.currentTarget.dataset;
    const card = this.data.hotCards[index];
    this.setData({
      showDeleteConfirm: true,
      deleteType: 'hotCard',
      deleteId: id,
      deleteName: card.question
    });
  },

  onEditLibrary(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/admin/libraryForm/libraryForm?id=${id}`
    });
  },

  onEditCard(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/admin/cardForm/cardForm?id=${id}`
    });
  },

  onToggleBatchSelect() {
    const { isBatchSelectMode, allCards, currentUserId } = this.data;
    const newMode = !isBatchSelectMode;
    const displayCards = newMode 
      ? allCards.filter(c => c.created_by === currentUserId)
      : allCards;
    
    this.setData({
      isBatchSelectMode: newMode,
      cards: displayCards,
      selectedCardIds: [],
      isAllSelected: false
    });
  },

  onSelectCard(e) {
    const { id } = e.currentTarget.dataset;
    const { selectedCardIds, cards } = this.data;
    const index = selectedCardIds.indexOf(id);
    if (index > -1) {
      selectedCardIds.splice(index, 1);
    } else {
      selectedCardIds.push(id);
    }
    const isAllSelected = selectedCardIds.length === cards.length && cards.length > 0;
    this.setData({ selectedCardIds: [...selectedCardIds], isAllSelected });
  },

  onSelectAllCards() {
    const { cards, isAllSelected } = this.data;
    if (isAllSelected) {
      this.setData({ selectedCardIds: [], isAllSelected: false });
    } else {
      this.setData({ selectedCardIds: cards.map(c => c.id), isAllSelected: true });
    }
  },

  async onShowChapterPicker() {
    const { selectedCardIds, cards } = this.data;
    
    if (selectedCardIds.length === 0) {
      wx.showToast({ title: '请先选择卡片', icon: 'none' });
      return;
    }

    const selectedCard = cards.find(c => c.id === selectedCardIds[0]);
    if (!selectedCard) return;

    const libraryId = selectedCard.library_id;
    if (!libraryId) {
      wx.showToast({ title: '无法获取卡片所属知识库', icon: 'none' });
      return;
    }

    try {
      const res = await chapterAPI.getList(libraryId);
      if (res.success && res.data) {
        const chapters = res.data.list || res.data || [];
        const chapterPickerList = [
          { id: null, name: '无章节', level: 0 },
          ...chapters.map(ch => ({
            id: ch.id,
            name: ch.name,
            level: ch.level || 1
          }))
        ];
        this.setData({
          showChapterPicker: true,
          chapterPickerList,
          targetChapterId: null
        });
      }
    } catch (error) {
      console.error('加载章节列表失败:', error);
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    }
  },

  onSelectChapter(e) {
    const { id } = e.currentTarget.dataset;
    this.setData({ targetChapterId: id });
  },

  onCloseChapterPicker() {
    this.setData({ showChapterPicker: false });
  },

  async onConfirmMoveCards() {
    const { selectedCardIds, targetChapterId } = this.data;
    
    if (selectedCardIds.length === 0) {
      wx.showToast({ title: '请先选择卡片', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '移动中...' });

    try {
      const res = await cardAPI.batchMove(selectedCardIds, targetChapterId);
      wx.hideLoading();

      if (res.success) {
        this.setData({
          showChapterPicker: false,
          isBatchSelectMode: false,
          selectedCardIds: [],
          isAllSelected: false,
          cardPage: 1,
          allCards: []
        });
        
        this.loadCards();
        wx.showToast({ title: `已移动 ${res.data.count} 张卡片`, icon: 'success' });
      } else {
        wx.showToast({ title: res.message || '移动失败', icon: 'none' });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('批量移动卡片失败:', error);
      wx.showToast({ title: error.message || '移动失败', icon: 'none' });
    }
  },

  onDeleteLibrary(e) {
    const { id, index } = e.currentTarget.dataset;
    const library = this.data.libraries[index];
    this.setData({
      showDeleteConfirm: true,
      deleteType: 'library',
      deleteId: id,
      deleteName: library.name
    });
  },

  onDeleteCard(e) {
    const { id, index } = e.currentTarget.dataset;
    const card = this.data.cards[index];
    this.setData({
      showDeleteConfirm: true,
      deleteType: 'card',
      deleteId: id,
      deleteName: card.question
    });
  },

  onDeleteComment(e) {
    const { id, index } = e.currentTarget.dataset;
    const comment = this.data.comments[index];
    this.setData({
      showDeleteConfirm: true,
      deleteType: 'comment',
      deleteId: id,
      deleteName: comment.content
    });
  },

  onCancelDelete() {
    this.setData({ showDeleteConfirm: false });
  },

  async onConfirmDelete() {
    const { deleteType, deleteId } = this.data;

    try {
      let res;
      if (deleteType === 'library') {
        res = await adminAPI.deleteLibrary(deleteId);
      } else if (deleteType === 'card' || deleteType === 'hotCard') {
        res = await adminAPI.deleteCard(deleteId);
      } else if (deleteType === 'comment') {
        res = await adminAPI.deleteComment(deleteId);
      }

      if (res && res.success) {
        wx.showToast({ title: '删除成功', icon: 'success' });
        this.setData({ showDeleteConfirm: false });
        this.loadCurrentTabData();
      }
    } catch (error) {
      console.error('删除失败:', error);
      wx.showToast({ title: error.message || '删除失败', icon: 'none' });
    }
  },

  onShowCreateLibrary() {
    wx.navigateTo({
      url: '/pages/admin/libraryForm/libraryForm'
    });
  },

  onShowCreateCard() {
    wx.navigateTo({
      url: '/pages/admin/cardForm/cardForm'
    });
  },

  onSwitchToCommunity() {
    wx.reLaunch({
      url: '/pages/admin/community/community'
    });
  },

  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出管理员账号吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('access_token');
          wx.removeStorageSync('userInfo');
          wx.reLaunch({
            url: '/pages/login/login'
          });
        }
      }
    });
  },

  loadMoreLibraries() {
    if (!this.data.libraryHasMore) return;
    this.setData({ libraryPage: this.data.libraryPage + 1 });
    this.loadLibraries();
  },

  loadMoreCards() {
    if (!this.data.cardHasMore) return;
    this.setData({ cardPage: this.data.cardPage + 1 });
    this.loadCards();
  },

  loadMoreHotCards() {
    if (!this.data.hotCardHasMore) return;
    this.setData({ hotCardPage: this.data.hotCardPage + 1 });
    this.loadHotCards();
  },

  loadMoreComments() {
    if (!this.data.commentHasMore) return;
    this.setData({ commentPage: this.data.commentPage + 1 });
    this.loadComments();
  },

  onGoToBroadcast() {
    wx.navigateTo({
      url: '/pages/admin/broadcast/broadcast'
    });
  }
});

const { libraryAPI, favoriteAPI, cardAPI } = require('../../utils/api');

Page({
  data: {
    libraries: [],
    selectedCount: 0,
    isAllSelected: false,
    loading: true
  },

  onLoad() {
    this.loadLibraries();
  },

  async loadLibraries() {
    try {
      const [myRes, favRes] = await Promise.all([
        libraryAPI.getMyLibraries(),
        favoriteAPI.getLibraries()
      ]);

      const myLibraries = (myRes.success ? (myRes.data.list || myRes.data.libraries || myRes.data || []) : []).map(lib => {
        const totalCards = lib.totalCards || lib.card_count || 0;
        const learnedCards = lib.learnedCards || lib.learned_cards || 0;
        return {
          ...lib,
          totalCards,
          learnedCards,
          progress: totalCards > 0 ? Math.round((learnedCards / totalCards) * 100) : 0,
          unlearned: totalCards - learnedCards,
          selected: false,
          source: 'my'
        };
      });

      const favLibraries = (favRes.success ? (favRes.data.libraries || favRes.data.list || []) : []).map(lib => {
        const totalCards = lib.totalCards || lib.total_cards || 0;
        const learnedCards = lib.learnedCards || lib.learned_cards || 0;
        return {
          ...lib,
          totalCards,
          learnedCards,
          progress: totalCards > 0 ? Math.round((learnedCards / totalCards) * 100) : 0,
          unlearned: totalCards - learnedCards,
          selected: false,
          source: 'favorite'
        };
      });

      const myIds = new Set(myLibraries.map(lib => lib.id));
      const uniqueFavLibraries = favLibraries.filter(lib => !myIds.has(lib.id));
      
      const allLibraries = [...myLibraries, ...uniqueFavLibraries];
      
      this.setData({ 
        libraries: allLibraries,
        loading: false
      });
    } catch (error) {
      console.error('加载知识库失败:', error);
      this.setData({ loading: false });
    }
  },

  onToggleSelect(e) {
    const { index } = e.currentTarget.dataset;
    const libraries = this.data.libraries;
    libraries[index].selected = !libraries[index].selected;
    
    const selectedCount = libraries.filter(lib => lib.selected).length;
    const isAllSelected = selectedCount === libraries.length && libraries.length > 0;
    
    this.setData({ 
      libraries,
      selectedCount,
      isAllSelected
    });
  },

  onSelectAll() {
    const { isAllSelected, libraries } = this.data;
    const newSelected = !isAllSelected;
    
    const updatedLibraries = libraries.map(lib => ({
      ...lib,
      selected: newSelected
    }));
    
    const selectedCount = newSelected ? libraries.length : 0;
    
    this.setData({ 
      libraries: updatedLibraries,
      selectedCount,
      isAllSelected: newSelected
    });
  },

  async onStartStudy() {
    const { libraries, selectedCount } = this.data;
    
    if (selectedCount === 0) {
      wx.showToast({
        title: '请选择知识库',
        icon: 'none'
      });
      return;
    }

    const selectedLibraries = libraries.filter(lib => lib.selected);
    let totalUnlearned = 0;
    selectedLibraries.forEach(lib => {
      totalUnlearned += lib.unlearned;
    });

    if (totalUnlearned === 0) {
      wx.showToast({
        title: '所选知识库已全部掌握',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '准备中...' });

    try {
      const unlearnedCards = [];
      
      for (const lib of selectedLibraries) {
        const cardsRes = await cardAPI.getList({ library_id: lib.id, page: 1, pageSize: 1000 });
        
        if (cardsRes.success && cardsRes.data) {
          const cards = cardsRes.data.list || cardsRes.data || [];
          
          cards.forEach(card => {
            if (!card.is_learned) {
              unlearnedCards.push({
                id: card.id,
                question: card.question,
                answer: card.answer || '',
                tags: card.tags,
                learned: false,
                libraryId: lib.id,
                libraryName: lib.name
              });
            }
          });
        }
      }
      
      wx.hideLoading();
      
      if (unlearnedCards.length === 0) {
        wx.showToast({
          title: '没有待学习的卡片',
          icon: 'none'
        });
        return;
      }

      const libraryNames = selectedLibraries.map(lib => lib.name).join('、');
      
      wx.setStorageSync('studyCardsData', {
        cardList: unlearnedCards,
        libraryNames: libraryNames,
        totalCards: unlearnedCards.length
      });
      
      wx.navigateTo({
        url: `/pages/study/cards/cards?index=0&total=${unlearnedCards.length}`
      });
    } catch (error) {
      wx.hideLoading();
      console.error('开始学习失败:', error);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    }
  },

  async onRandomStudy() {
    const { libraries, selectedCount } = this.data;
    
    if (selectedCount === 0) {
      wx.showToast({
        title: '请选择知识库',
        icon: 'none'
      });
      return;
    }

    const selectedLibraries = libraries.filter(lib => lib.selected);

    wx.showLoading({ title: '准备中...' });

    try {
      const allCards = [];
      
      for (const lib of selectedLibraries) {
        const cardsRes = await cardAPI.getList({ library_id: lib.id, page: 1, pageSize: 1000 });
        
        if (cardsRes.success && cardsRes.data) {
          const cards = cardsRes.data.list || cardsRes.data || [];
          
          cards.forEach(card => {
            allCards.push({
              id: card.id,
              question: card.question,
              answer: card.answer || '',
              tags: card.tags,
              learned: card.is_learned || false,
              libraryId: lib.id,
              libraryName: lib.name
            });
          });
        }
      }
      
      wx.hideLoading();
      
      if (allCards.length === 0) {
        wx.showToast({
          title: '所选知识库没有卡片',
          icon: 'none'
        });
        return;
      }

      const randomIndex = Math.floor(Math.random() * allCards.length);
      const libraryNames = selectedLibraries.map(lib => lib.name).join('、');
      
      wx.setStorageSync('studyCardsData', {
        cardList: allCards,
        libraryNames: libraryNames,
        totalCards: allCards.length
      });
      
      wx.navigateTo({
        url: `/pages/study/cards/cards?index=${randomIndex}&total=${allCards.length}`
      });
    } catch (error) {
      wx.hideLoading();
      console.error('随机抽题失败:', error);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    }
  }
});

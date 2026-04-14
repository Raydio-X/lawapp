const { libraryAPI, cardAPI, chapterAPI } = require('../../../utils/api');

Page({
  data: {
    libraryInfo: {
      id: 0,
      name: '',
      subject: '',
      totalCards: 0,
      learnedCards: 0,
      progress: 0
    },
    selectedChapterIndex: -1,
    selectedChildIndex: -1,
    selectedGrandChildIndex: -1,
    selectedChapter: null,
    chapters: [],
    allCards: [],
    loading: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ 'libraryInfo.id': parseInt(options.id) });
    }
    if (options.name) {
      this.setData({ 'libraryInfo.name': decodeURIComponent(options.name) });
    }
    this.loadLibraryData();
  },

  onShow() {
    const masteryChanges = wx.getStorageSync('cardMasteryChanges');
    if (masteryChanges && Object.keys(masteryChanges).length > 0) {
      this.updateCardMastery(masteryChanges);
      wx.removeStorageSync('cardMasteryChanges');
    }
  },

  updateCardMastery(masteryChanges) {
    console.log('updateCardMastery called with:', masteryChanges);
    if (!masteryChanges || Object.keys(masteryChanges).length === 0) return;

    const chapters = this.data.chapters;
    const selectedChapterIndex = this.data.selectedChapterIndex;
    const selectedChildIndex = this.data.selectedChildIndex;
    const selectedGrandChildIndex = this.data.selectedGrandChildIndex;
    let hasChanges = false;

    const updateChapterCards = (chapter) => {
      chapter.cards.forEach(card => {
        if (masteryChanges[card.id] !== undefined) {
          const newLearned = masteryChanges[card.id];
          console.log('Updating card', card.id, 'from', card.learned, 'to', newLearned);
          if (card.learned !== newLearned) {
            if (card.learned) {
              chapter.learnedCount--;
            } else {
              chapter.learnedCount++;
            }
            card.learned = newLearned;
            hasChanges = true;
          }
        }
      });
      
      if (chapter.children && chapter.children.length > 0) {
        chapter.children.forEach(child => updateChapterCards(child));
      }
    };

    chapters.forEach(chapter => updateChapterCards(chapter));

    console.log('hasChanges:', hasChanges);
    if (hasChanges) {
      let selectedChapter = null;
      if (selectedChapterIndex >= 0) {
        if (selectedGrandChildIndex >= 0 && 
            chapters[selectedChapterIndex].children && 
            chapters[selectedChapterIndex].children[selectedChildIndex] &&
            chapters[selectedChapterIndex].children[selectedChildIndex].children) {
          selectedChapter = chapters[selectedChapterIndex].children[selectedChildIndex].children[selectedGrandChildIndex];
        } else if (selectedChildIndex >= 0 && chapters[selectedChapterIndex].children) {
          selectedChapter = chapters[selectedChapterIndex].children[selectedChildIndex];
        } else {
          selectedChapter = chapters[selectedChapterIndex];
        }
      }
      this.setData({ 
        chapters,
        selectedChapter
      });
      this.calculateProgress();
    }
  },

  onPullDownRefresh() {
    this.loadLibraryData(() => {
      wx.stopPullDownRefresh();
    });
  },

  async loadLibraryData(callback) {
    const libraryId = this.data.libraryInfo.id;
    if (!libraryId) {
      wx.showToast({ title: '知识库ID无效', icon: 'none' });
      if (callback) callback();
      return;
    }

    this.setData({ loading: true });

    try {
      const [libRes, cardsRes] = await Promise.all([
        libraryAPI.getDetail(libraryId),
        cardAPI.getList({ library_id: libraryId, page: 1, pageSize: 1000 })
      ]);

      if (libRes.success && libRes.data) {
        const lib = libRes.data;
        this.setData({
          'libraryInfo.name': lib.name,
          'libraryInfo.subject': lib.subject || '未分类'
        });
        
        if (lib.chapters && lib.chapters.length > 0) {
          this.processChapters(lib.chapters);
        }
      }

      if (cardsRes.success && cardsRes.data) {
        const cards = cardsRes.data.list || cardsRes.data || [];
        this.processCards(cards);
      }

      if (callback) callback();
    } catch (error) {
      console.error('加载知识库失败:', error);
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
      if (callback) callback();
    } finally {
      this.setData({ loading: false });
    }
  },

  processChapters(chapters) {
    const processChapter = (chapter, level = 1) => {
      const result = {
        id: chapter.id,
        title: chapter.name,
        level: level,
        expanded: false,
        pressed: false,
        learnedCount: 0,
        cards: [],
        children: []
      };
      
      if (chapter.children && chapter.children.length > 0) {
        result.children = chapter.children.map(child => processChapter(child, level + 1));
      }
      
      return result;
    };
    
    const processedChapters = chapters.map(chapter => processChapter(chapter));
    this.setData({ chapters: processedChapters });
  },

  processCards(cards) {
    const chapters = this.data.chapters;
    const allCards = [];

    cards.forEach(card => {
      const chapterId = card.chapter_id;
      allCards.push({
        id: card.id,
        title: card.question,
        question: card.question,
        answer: card.answer,
        tags: card.tags || [],
        learned: card.is_learned || false,
        pressed: false,
        chapterId: chapterId
      });

      const findChapter = (chapterList) => {
        for (const chapter of chapterList) {
          if (chapter.id === chapterId) {
            return chapter;
          }
          if (chapter.children && chapter.children.length > 0) {
            const found = findChapter(chapter.children);
            if (found) return found;
          }
        }
        return null;
      };

      const chapter = findChapter(chapters);
      if (chapter) {
        chapter.cards.push({
          id: card.id,
          title: card.question,
          tags: card.tags || [],
          learned: card.is_learned || false,
          pressed: false
        });
        if (card.is_learned) {
          chapter.learnedCount++;
        }
      }
    });

    this.setData({
      chapters: chapters,
      allCards: allCards
    });

    this.calculateProgress();

    if (chapters.length > 0) {
      this.expandAndSelectChapter(0);
    }
  },

  calculateProgress() {
    const chapters = this.data.chapters;
    let totalCards = 0;
    let learnedCards = 0;

    const countChapterCards = (chapter) => {
      let count = { total: 0, learned: 0 };
      count.total += chapter.cards.length;
      count.learned += chapter.learnedCount;
      
      if (chapter.children && chapter.children.length > 0) {
        chapter.children.forEach(child => {
          const childCount = countChapterCards(child);
          count.total += childCount.total;
          count.learned += childCount.learned;
        });
      }
      
      return count;
    };

    chapters.forEach(chapter => {
      const count = countChapterCards(chapter);
      totalCards += count.total;
      learnedCards += count.learned;
    });

    const progress = totalCards > 0 ? Math.round((learnedCards / totalCards) * 100) : 0;

    this.setData({
      'libraryInfo.totalCards': totalCards,
      'libraryInfo.learnedCards': learnedCards,
      'libraryInfo.progress': progress
    });
  },

  expandAndSelectChapter(index) {
    const chapters = this.data.chapters;
    if (index < 0 || index >= chapters.length) return;

    const updateData = {
      selectedChapterIndex: index,
      selectedChildIndex: -1,
      selectedGrandChildIndex: -1,
      selectedChapter: chapters[index]
    };

    let needUpdateChapters = false;
    chapters.forEach((chapter, i) => {
      if (chapter.expanded !== (i === index)) {
        chapter.expanded = (i === index);
        needUpdateChapters = true;
      }
    });

    if (needUpdateChapters) {
      updateData.chapters = chapters;
    }

    this.setData(updateData);
  },

  onChapterTap(e) {
    const index = e.currentTarget.dataset.index;
    const chapters = this.data.chapters;
    const chapter = chapters[index];

    const updateData = {
      selectedChapterIndex: index,
      selectedChildIndex: -1,
      selectedGrandChildIndex: -1,
      selectedChapter: chapters[index]
    };

    let needUpdateChapters = false;
    const isExpanding = !chapter.expanded;
    chapters.forEach((ch, i) => {
      if (ch.expanded !== ((i === index) ? isExpanding : false)) {
        ch.expanded = (i === index) ? isExpanding : false;
        needUpdateChapters = true;
      }
    });

    if (needUpdateChapters) {
      updateData.chapters = chapters;
    }

    this.setData(updateData);
  },

  onChildChapterTap(e) {
    const chapterIndex = e.currentTarget.dataset.chapterIndex;
    const childIndex = e.currentTarget.dataset.childIndex;
    const chapters = this.data.chapters;
    const childChapter = chapters[chapterIndex].children[childIndex];

    const updateData = {
      selectedChapterIndex: chapterIndex,
      selectedChildIndex: childIndex,
      selectedGrandChildIndex: -1,
      selectedChapter: childChapter
    };

    if (childChapter.children && childChapter.children.length > 0) {
      childChapter.expanded = !childChapter.expanded;
      updateData.chapters = chapters;
    }

    this.setData(updateData);
  },

  onGrandChildChapterTap(e) {
    const chapterIndex = e.currentTarget.dataset.chapterIndex;
    const childIndex = e.currentTarget.dataset.childIndex;
    const grandChildIndex = e.currentTarget.dataset.grandchildIndex;
    const chapters = this.data.chapters;
    const grandChildChapter = chapters[chapterIndex].children[childIndex].children[grandChildIndex];

    this.setData({
      selectedChapterIndex: chapterIndex,
      selectedChildIndex: childIndex,
      selectedGrandChildIndex: grandChildIndex,
      selectedChapter: grandChildChapter
    });
  },

  onSectionTap(e) {
    const chapterIndex = e.currentTarget.dataset.chapterIndex;
    const sectionIndex = e.currentTarget.dataset.sectionIndex;
    
    this.setData({
      selectedChapterIndex: chapterIndex,
      selectedChapter: this.data.chapters[chapterIndex],
      selectedSectionIndex: sectionIndex
    });
    
    const section = this.data.chapters[chapterIndex].sections[sectionIndex];
    wx.showToast({
      title: `查看: ${section.title}`,
      icon: 'none'
    });
  },

  onCardTap(e) {
    const index = e.currentTarget.dataset.index;
    const card = this.data.selectedChapter.cards[index];
    const chapterIndex = this.data.selectedChapterIndex;
    
    let globalIndex = 0;
    for (let i = 0; i < chapterIndex; i++) {
      globalIndex += this.data.chapters[i].cards.length;
    }
    globalIndex += index;
    
    this.saveCardsDataAndNavigate(card.id, globalIndex);
  },

  saveCardsDataAndNavigate(targetCardId, globalIndex) {
    const allCards = [];
    this.data.chapters.forEach(chapter => {
      chapter.cards.forEach(card => {
        const fullCard = this.data.allCards.find(c => c.id === card.id);
        allCards.push({
          id: card.id,
          question: card.title,
          answer: fullCard ? fullCard.answer : '',
          tags: card.tags,
          learned: card.learned
        });
      });
    });
    
    wx.setStorageSync('libraryCardsData', {
      cardList: allCards,
      libraryId: this.data.libraryInfo.id,
      libraryName: this.data.libraryInfo.name
    });
    
    wx.navigateTo({
      url: `/pages/card/study/study?cardId=${targetCardId}&libraryId=${this.data.libraryInfo.id}&index=${globalIndex}`
    });
  },

  onStartStudy() {
    const chapters = this.data.chapters;
    const unlearnedCards = [];
    
    const collectUnlearnedCards = (chapterList) => {
      chapterList.forEach(chapter => {
        chapter.cards.forEach(card => {
          if (!card.learned) {
            const fullCard = this.data.allCards.find(c => c.id === card.id);
            unlearnedCards.push({
              id: card.id,
              question: card.title,
              answer: fullCard ? fullCard.answer : '',
              tags: card.tags,
              learned: card.learned
            });
          }
        });
        
        if (chapter.children && chapter.children.length > 0) {
          collectUnlearnedCards(chapter.children);
        }
      });
    };
    
    collectUnlearnedCards(chapters);
    
    if (unlearnedCards.length === 0) {
      wx.showToast({
        title: '恭喜！已掌握所有卡片',
        icon: 'success'
      });
      return;
    }
    
    wx.setStorageSync('libraryCardsData', {
      cardList: unlearnedCards,
      libraryId: this.data.libraryInfo.id,
      libraryName: this.data.libraryInfo.name,
      isFiltered: true
    });
    
    wx.navigateTo({
      url: `/pages/card/study/study?cardId=${unlearnedCards[0].id}&libraryId=${this.data.libraryInfo.id}&index=0`
    });
  },

  onRandomStudy() {
    const chapters = this.data.chapters;
    const allCards = [];
    
    chapters.forEach((chapter, chapterIndex) => {
      chapter.cards.forEach((card, cardIndex) => {
        let globalIndex = 0;
        for (let i = 0; i < chapterIndex; i++) {
          globalIndex += chapters[i].cards.length;
        }
        globalIndex += cardIndex;
        allCards.push({ ...card, globalIndex });
      });
    });

    if (allCards.length > 0) {
      const randomIndex = Math.floor(Math.random() * allCards.length);
      const randomCard = allCards[randomIndex];
      this.saveCardsDataAndNavigate(randomCard.id, randomCard.globalIndex);
    }
  }
});

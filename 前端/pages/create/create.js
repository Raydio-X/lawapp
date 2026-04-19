const { libraryAPI, authAPI, chapterAPI, cardAPI } = require('../../utils/api');

Page({
  data: {
    libraryPressed: false,
    cardPressed: false,
    myLibraries: [],
    loading: false,
    isManageMode: false,
    showOutlinePopup: false,
    currentLibrary: null,
    outline: [],
    dragIndex: -1,
    showDeleteConfirm: false,
    deleteItem: { title: '', childCount: 0, toDelete: [] },
    showDeleteLibraryConfirm: false,
    deleteLibraryItem: { id: null, name: '', cardCount: 0, index: -1 },
    editTab: 'info',
    editLibraryName: '',
    editCards: [],
    showDeleteCardConfirm: false,
    deleteCardItem: { id: null, index: -1 },
    smartImportDisabled: true,
    showBatchImport: false,
    batchStep: 1,
    batchLibraryId: null,
    batchLibraryName: '',
    batchFileName: '',
    batchFilePath: '',
    batchCards: [],
    batchImporting: false,
    batchImportSuccess: false,
    batchImportCount: 0,
    batchImportError: '',
    isBatchSelectMode: false,
    selectedCardIds: [],
    showChapterPicker: false,
    chapterPickerList: [],
    targetChapterId: null
  },

  _dragStartX: 0,
  _dragStartY: 0,
  _dragStartTime: 0,
  _lastLevelChangeTime: 0,
  _lastSortTime: 0,
  _isDragging: false,
  _isLoading: false,

  onLoad() {
    this.loadMyLibraries(true);
  },

  onShow() {
    if (!this._isLoading) {
      this.loadMyLibraries(false);
    }
    
    if (this.data.showOutlinePopup && this.data.currentLibrary) {
      this.loadCards(this.data.currentLibrary.id);
    }
  },

  async loadMyLibraries(showLoading = false) {
    const token = wx.getStorageSync('access_token');
    if (!token) {
      this.setData({ myLibraries: [] });
      return;
    }

    if (this._isLoading) return;
    this._isLoading = true;

    if (showLoading) {
      this.setData({ loading: true });
    }

    try {
      const res = await libraryAPI.getMyLibraries();
      if (res.success && res.data) {
        const libraries = (res.data.list || res.data || []).map(item => ({
          id: item.id,
          name: item.name,
          subject: item.subject || item.category_name || '未分类',
          cardCount: item.card_count || 0,
          isPublic: item.is_public === 1,
          pressed: false
        }));
        this.setData({ myLibraries: libraries });
      }
    } catch (error) {
      console.error('加载知识库失败:', error);
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      });
    } finally {
      this._isLoading = false;
      if (showLoading) {
        this.setData({ loading: false });
      }
    }
  },

  onLibraryTouchStart() {
    this.setData({ libraryPressed: true });
  },

  onLibraryTouchEnd() {
    this.setData({ libraryPressed: false });
  },

  onCreateLibrary() {
    const token = wx.getStorageSync('access_token');
    if (!token) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    wx.navigateTo({
      url: '/pages/create/libraryForm/libraryForm',
      fail: (err) => {
        console.error('跳转失败:', err);
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  onCardTouchStart() {
    this.setData({ cardPressed: true });
  },

  onCardTouchEnd() {
    this.setData({ cardPressed: false });
  },

  onCreateCard() {
    if (this.data.myLibraries.length === 0) {
      wx.showModal({
        title: '提示',
        content: '请先创建知识库',
        showCancel: false
      });
      return;
    }

    wx.navigateTo({
      url: '/pages/create/cardForm/cardForm',
      fail: (err) => {
        console.error('跳转失败:', err);
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  onSmartImport() {
    if (this.data.smartImportDisabled) {
      wx.showToast({ title: '即将开放，敬请期待', icon: 'none' });
      return;
    }
  },

  onBatchImport() {
    if (this.data.myLibraries.length === 0) {
      wx.showModal({
        title: '提示',
        content: '请先创建知识库',
        showCancel: false
      });
      return;
    }
    this.setData({
      showBatchImport: true,
      batchStep: 1,
      batchLibraryId: null,
      batchLibraryName: '',
      batchFileName: '',
      batchFilePath: '',
      batchCards: [],
      batchImporting: false,
      batchImportSuccess: false,
      batchImportCount: 0,
      batchImportError: ''
    });
  },

  onCloseBatchImport() {
    this.setData({ showBatchImport: false });
    if (this.data.batchImportSuccess) {
      this.loadMyLibraries();
    }
  },

  onSelectBatchLibrary(e) {
    const { id, name } = e.currentTarget.dataset;
    this.setData({
      batchLibraryId: id,
      batchLibraryName: name
    });
  },

  onBatchNext() {
    const { batchStep, batchLibraryId, batchFileName } = this.data;
    if (batchStep === 1 && !batchLibraryId) return;
    if (batchStep === 2 && !batchFileName) return;
    this.setData({ batchStep: batchStep + 1 });
  },

  onBatchPrev() {
    const { batchStep } = this.data;
    if (batchStep > 1) {
      this.setData({ batchStep: batchStep - 1 });
    }
  },

  onChooseFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['xlsx', 'xls'],
      success: (res) => {
        const file = res.tempFiles[0];
        this.setData({
          batchFileName: file.name,
          batchFilePath: file.path
        });
      },
      fail: () => {
        wx.showToast({ title: '已取消选择', icon: 'none' });
      }
    });
  },

  onDownloadTemplate() {
    wx.showLoading({ title: '下载中...' });
    
    wx.downloadFile({
      url: 'https://your-domain.com/templates/batch-import-template.xlsx',
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200) {
          wx.openDocument({
            filePath: res.tempFilePath,
            showMenu: true,
            success: () => {
              wx.showToast({ title: '下载成功', icon: 'success' });
            },
            fail: () => {
              wx.showToast({ title: '打开失败', icon: 'none' });
            }
          });
        } else {
          this.showTemplateGuide();
        }
      },
      fail: () => {
        wx.hideLoading();
        this.showTemplateGuide();
      }
    });
  },

  showTemplateGuide() {
    wx.showModal({
      title: '模板格式说明',
      content: '请按以下格式创建Excel文件：\n\nA列 - 问题\nB列 - 答案\nC列 - 章节（可选）\n\n第一行为表头，数据从第二行开始',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  async onBatchParse() {
    const { batchFilePath, batchLibraryId } = this.data;
    if (!batchFilePath) return;

    wx.showLoading({ title: '解析中...' });

    try {
      const res = await cardAPI.batchImport(batchFilePath, {
        library_id: String(batchLibraryId),
        preview: 'true'
      });

      wx.hideLoading();

      if (res.success && res.data && res.data.cards) {
        this.setData({
          batchCards: res.data.cards,
          batchStep: 3
        });
      } else {
        wx.showToast({ title: res.message || '解析失败', icon: 'none' });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('解析文件失败:', error);
      wx.showToast({ title: error.message || '解析失败', icon: 'none' });
    }
  },

  async onBatchConfirmImport() {
    if (this.data.batchImporting) return;

    this.setData({ batchImporting: true });

    try {
      const res = await cardAPI.batchImport(this.data.batchFilePath, {
        library_id: String(this.data.batchLibraryId),
        preview: 'false'
      });

      if (res.success) {
        this.setData({
          batchImporting: false,
          batchImportSuccess: true,
          batchImportCount: res.data.count || this.data.batchCards.length,
          batchStep: 4
        });
      } else {
        this.setData({
          batchImporting: false,
          batchImportSuccess: false,
          batchImportError: res.message || '导入失败',
          batchStep: 4
        });
      }
    } catch (error) {
      console.error('批量导入失败:', error);
      this.setData({
        batchImporting: false,
        batchImportSuccess: false,
        batchImportError: error.message || '导入失败',
        batchStep: 4
      });
    }
  },

  onLibraryItemTouchStart(e) {
    const { index } = e.currentTarget.dataset;
    const myLibraries = this.data.myLibraries;
    myLibraries[index].pressed = true;
    this.setData({ myLibraries });
  },

  onLibraryItemTouchEnd(e) {
    const { index } = e.currentTarget.dataset;
    const myLibraries = this.data.myLibraries;
    myLibraries[index].pressed = false;
    this.setData({ myLibraries });
  },

  onLibraryItemTap(e) {
    if (this.data.isManageMode) return;
    
    const { index } = e.currentTarget.dataset;
    const library = this.data.myLibraries[index];
    
    wx.navigateTo({
      url: `/pages/library/detail/detail?id=${library.id}&name=${encodeURIComponent(library.name)}`,
      fail: (err) => {
        console.error('跳转失败:', err);
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  onManageLibraries() {
    this.setData({
      isManageMode: !this.data.isManageMode
    });
  },

  onCancelDelete() {
    this.setData({ isManageMode: false });
  },

  async onEditOutline(e) {
    const { id, index } = e.currentTarget.dataset;
    const library = this.data.myLibraries[index];

    this.setData({
      currentLibrary: library,
      showOutlinePopup: true,
      editTab: 'info',
      editLibraryName: library.name,
      editCards: []
    });

    await this.loadChapters(id);
    await this.loadCards(id);
  },

  async loadCards(libraryId) {
    try {
      const res = await cardAPI.getList({ library_id: libraryId, page: 1, pageSize: 1000 });
      if (res.success && res.data) {
        const cards = (res.data.list || res.data || []).map(card => ({
          id: card.id,
          question: card.question,
          answer: card.answer,
          chapterId: card.chapter_id,
          chapterName: card.chapter_name || ''
        }));
        this.setData({ editCards: cards });
      }
    } catch (error) {
      console.error('加载卡片失败:', error);
    }
  },

  onSwitchEditTab(e) {
    const { tab } = e.currentTarget.dataset;
    this.setData({ editTab: tab });
  },

  onLibraryNameInput(e) {
    this.setData({ editLibraryName: e.detail.value });
  },

  async onSaveLibraryName() {
    const { editLibraryName, currentLibrary } = this.data;
    
    if (!editLibraryName.trim()) {
      wx.showToast({ title: '请输入知识库名称', icon: 'none' });
      return;
    }

    if (editLibraryName === currentLibrary.name) {
      wx.showToast({ title: '名称未修改', icon: 'none' });
      return;
    }

    try {
      const res = await libraryAPI.update(currentLibrary.id, { name: editLibraryName.trim() });
      if (res.success) {
        const myLibraries = this.data.myLibraries;
        const index = myLibraries.findIndex(lib => lib.id === currentLibrary.id);
        if (index !== -1) {
          myLibraries[index].name = editLibraryName.trim();
          this.setData({ 
            myLibraries,
            'currentLibrary.name': editLibraryName.trim()
          });
        }
        wx.showToast({ title: '保存成功', icon: 'success' });
      }
    } catch (error) {
      console.error('保存知识库名称失败:', error);
      wx.showToast({ title: error.message || '保存失败', icon: 'none' });
    }
  },

  onEditCard(e) {
    const { id } = e.currentTarget.dataset;
    const { currentLibrary } = this.data;
    
    wx.navigateTo({
      url: `/pages/create/cardForm/cardForm?id=${id}&libraryId=${currentLibrary.id}&libraryName=${encodeURIComponent(currentLibrary.name)}`
    });
  },

  onDeleteCard(e) {
    const { id, index } = e.currentTarget.dataset;
    
    this.setData({
      showDeleteCardConfirm: true,
      deleteCardItem: { id, index }
    });
  },

  onDeleteCardConfirmChange(e) {
    this.setData({ showDeleteCardConfirm: e.detail.visible });
  },

  onCancelDeleteCard() {
    this.setData({
      showDeleteCardConfirm: false,
      deleteCardItem: { id: null, index: -1 }
    });
  },

  async onConfirmDeleteCard() {
    const { id, index } = this.data.deleteCardItem;

    try {
      const res = await cardAPI.delete(id);
      if (res.success) {
        const editCards = this.data.editCards;
        editCards.splice(index, 1);
        
        const myLibraries = this.data.myLibraries;
        const libIndex = myLibraries.findIndex(lib => lib.id === this.data.currentLibrary.id);
        if (libIndex !== -1 && myLibraries[libIndex].cardCount > 0) {
          myLibraries[libIndex].cardCount--;
        }
        
        this.setData({ 
          editCards,
          myLibraries,
          showDeleteCardConfirm: false,
          deleteCardItem: { id: null, index: -1 }
        });
        
        wx.showToast({ title: '删除成功', icon: 'success' });
      }
    } catch (error) {
      console.error('删除卡片失败:', error);
      wx.showToast({ title: error.message || '删除失败', icon: 'none' });
    }
  },

  onAddCard() {
    const { currentLibrary } = this.data;
    
    wx.navigateTo({
      url: `/pages/create/cardForm/cardForm?libraryId=${currentLibrary.id}&libraryName=${encodeURIComponent(currentLibrary.name)}`
    });
  },

  onToggleBatchSelect() {
    const { isBatchSelectMode } = this.data;
    this.setData({
      isBatchSelectMode: !isBatchSelectMode,
      selectedCardIds: []
    });
  },

  onSelectCard(e) {
    const { id } = e.currentTarget.dataset;
    const { selectedCardIds } = this.data;
    
    const index = selectedCardIds.indexOf(id);
    if (index > -1) {
      selectedCardIds.splice(index, 1);
    } else {
      selectedCardIds.push(id);
    }
    
    this.setData({ selectedCardIds: [...selectedCardIds] });
  },

  onSelectAllCards() {
    const { editCards, selectedCardIds } = this.data;
    
    if (selectedCardIds.length === editCards.length) {
      this.setData({ selectedCardIds: [] });
    } else {
      this.setData({ selectedCardIds: editCards.map(c => c.id) });
    }
  },

  async onShowChapterPicker() {
    const { selectedCardIds, currentLibrary } = this.data;
    
    if (selectedCardIds.length === 0) {
      wx.showToast({ title: '请先选择卡片', icon: 'none' });
      return;
    }

    try {
      const res = await chapterAPI.getList(currentLibrary.id);
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
    const { selectedCardIds, targetChapterId, currentLibrary } = this.data;
    
    if (selectedCardIds.length === 0) {
      wx.showToast({ title: '请先选择卡片', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '移动中...' });

    try {
      const res = await cardAPI.batchMove(selectedCardIds, targetChapterId);
      wx.hideLoading();

      if (res.success) {
        const targetChapter = this.data.chapterPickerList.find(c => c.id === targetChapterId);
        const targetChapterName = targetChapter ? targetChapter.name : '无章节';
        
        const editCards = this.data.editCards.map(card => {
          if (selectedCardIds.includes(card.id)) {
            return { ...card, chapterId: targetChapterId, chapterName: targetChapterName };
          }
          return card;
        });

        this.setData({
          editCards,
          showChapterPicker: false,
          isBatchSelectMode: false,
          selectedCardIds: []
        });

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

  async loadChapters(libraryId) {
    try {
      const res = await chapterAPI.getList(libraryId);
      if (res.success && res.data) {
        const chapters = res.data.list || res.data || [];
        const outline = chapters.map(chapter => ({
          id: chapter.id,
          title: chapter.name,
          level: chapter.level || 1,
          parentId: chapter.parent_id
        }));
        this.setData({ outline });
      }
    } catch (error) {
      console.error('加载大纲失败:', error);
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    }
  },

  onOutlinePopupChange(e) {
    this.setData({ showOutlinePopup: e.detail.visible });
    if (!e.detail.visible) {
      this.saveOutline();
    }
  },

  onCloseOutlinePopup() {
    this.saveOutline();
    this.setData({ showOutlinePopup: false });
  },

  onAddOutline() {
    const outline = this.data.outline;
    
    const hasEmptyTitle = outline.some(item => !item.title.trim());
    if (hasEmptyTitle) {
      wx.showToast({ title: '请先填写已有标题', icon: 'none' });
      return;
    }

    const newId = -(Date.now());
    outline.push({
      id: newId,
      title: '',
      level: 1,
      parentId: null
    });
    this.setData({ outline });
  },

  onDeleteOutline(e) {
    const { index } = e.currentTarget.dataset;
    const outline = this.data.outline;
    const item = outline[index];
    
    const toDelete = [index];
    for (let i = index + 1; i < outline.length; i++) {
      if (outline[i].level > item.level) {
        toDelete.push(i);
      } else {
        break;
      }
    }

    this.setData({
      showDeleteConfirm: true,
      deleteItem: {
        title: item.title,
        childCount: toDelete.length - 1,
        toDelete: toDelete
      }
    });
  },

  onDeleteConfirmChange(e) {
    this.setData({ showDeleteConfirm: e.detail.visible });
  },

  preventTouchMove() {
    return false;
  },

  onCancelDelete() {
    this.setData({ 
      showDeleteConfirm: false,
      deleteItem: { title: '', childCount: 0, toDelete: [] }
    });
  },

  onConfirmDelete() {
    const { toDelete } = this.data.deleteItem;
    const outline = this.data.outline;
    
    toDelete.reverse().forEach(i => outline.splice(i, 1));
    this.setData({ 
      outline,
      showDeleteConfirm: false,
      deleteItem: { title: '', childCount: 0, toDelete: [] }
    });
  },

  onOutlineInput(e) {
    const { index } = e.currentTarget.dataset;
    const value = e.detail.value;
    const outline = this.data.outline;
    outline[index].title = value;
    this.setData({ outline });
  },

  onTouchStart(e) {
    const { index } = e.currentTarget.dataset;
    this._dragStartX = e.touches[0].clientX;
    this._dragStartY = e.touches[0].clientY;
    this._dragStartTime = Date.now();
    this._lastLevelChangeTime = 0;
    this._lastSortTime = 0;
    this._isDragging = false;
    this.setData({ dragIndex: index });
  },

  onTouchMove(e) {
    const { dragIndex, outline } = this.data;
    if (dragIndex < 0) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - this._dragStartX;
    const deltaY = currentY - this._dragStartY;
    const timeDiff = Date.now() - this._dragStartTime;
    const now = Date.now();

    if (!this._isDragging && timeDiff > 200 && Math.abs(deltaY) > 10) {
      this._isDragging = true;
    }

    if (this._isDragging && Math.abs(deltaY) > 60 && now - this._lastSortTime > 350) {
      const dragItem = outline[dragIndex];
      if (!dragItem) return;
      
      let targetIndex = dragIndex;
      if (deltaY > 0) {
        for (let i = dragIndex + 1; i < outline.length; i++) {
          if (outline[i].level === dragItem.level) {
            targetIndex = i;
            break;
          }
        }
      } else {
        for (let i = dragIndex - 1; i >= 0; i--) {
          if (outline[i].level === dragItem.level) {
            targetIndex = i;
            break;
          }
        }
      }

      if (targetIndex !== dragIndex) {
        const movingItems = [dragItem];
        for (let i = dragIndex + 1; i < outline.length; i++) {
          if (outline[i].level > dragItem.level) {
            movingItems.push(outline[i]);
          } else {
            break;
          }
        }

        const newOutline = [...outline];
        newOutline.splice(dragIndex, movingItems.length);
        
        let insertIndex = targetIndex;
        if (targetIndex > dragIndex) {
          insertIndex = targetIndex - movingItems.length + 1;
        }
        
        newOutline.splice(insertIndex, 0, ...movingItems);
        
        this._dragStartY = currentY;
        this._lastSortTime = now;
        this.setData({ 
          outline: newOutline,
          dragIndex: insertIndex
        });
      }
    }

    if (Math.abs(deltaX) > 100 && now - this._lastLevelChangeTime > 500) {
      const item = outline[dragIndex];
      if (!item) return;
      
      const oldLevel = item.level;
      
      if (deltaX > 0 && item.level < 3) {
        let canIncrease = false;
        if (dragIndex > 0) {
          const prevItem = outline[dragIndex - 1];
          if (prevItem.level >= item.level) {
            canIncrease = true;
          }
        }
        
        if (canIncrease) {
          const newOutline = [...outline];
          newOutline[dragIndex].level++;
          this._dragStartX = currentX;
          this._lastLevelChangeTime = now;
          this.setData({ outline: newOutline });
        }
      } else if (deltaX < 0 && item.level > 1) {
        const newLevel = item.level - 1;
        const newOutline = [...outline];
        newOutline[dragIndex].level = newLevel;
        
        for (let i = dragIndex + 1; i < newOutline.length; i++) {
          if (newOutline[i].level > oldLevel) {
            newOutline[i].level = Math.max(newOutline[i].level - 1, newLevel + 1);
          } else {
            break;
          }
        }
        
        this._dragStartX = currentX;
        this._lastLevelChangeTime = now;
        this.setData({ outline: newOutline });
      }
    }
  },

  onTouchEnd() {
    this._isDragging = false;
    this.setData({ dragIndex: -1 });
  },

  async saveOutline() {
    const { outline, currentLibrary } = this.data;
    if (!currentLibrary) return;

    const validOutline = outline.filter(item => item.title.trim());
    
    try {
      const levelParentMap = {};
      const chapters = validOutline.map((item, index) => {
        let parentId = null;
        if (item.level > 1 && levelParentMap[item.level - 1]) {
          parentId = levelParentMap[item.level - 1];
        }
        
        levelParentMap[item.level] = item.id;
        for (let l = item.level + 1; l <= 3; l++) {
          delete levelParentMap[l];
        }
        
        return {
          id: item.id,
          name: item.title.trim(),
          sort_order: index,
          level: item.level,
          parentId: parentId
        };
      });

      if (chapters.length > 0 || outline.some(item => item.id > 0)) {
        await chapterAPI.batchUpdate(currentLibrary.id, chapters);
        await this.loadChapters(currentLibrary.id);
      }
    } catch (error) {
      console.error('保存大纲失败:', error);
      wx.showToast({ title: error.message || '保存失败', icon: 'none' });
    }
  },

  onDeleteLibrary(e) {
    const { id, index } = e.currentTarget.dataset;
    const library = this.data.myLibraries[index];

    this.setData({
      showDeleteLibraryConfirm: true,
      deleteLibraryItem: {
        id: id,
        name: library.name,
        cardCount: library.cardCount,
        index: index
      }
    });
  },

  onDeleteLibraryConfirmChange(e) {
    this.setData({ showDeleteLibraryConfirm: e.detail.visible });
  },

  onCancelDeleteLibrary() {
    this.setData({ 
      showDeleteLibraryConfirm: false,
      deleteLibraryItem: { id: null, name: '', cardCount: 0, index: -1 }
    });
  },

  async onConfirmDeleteLibrary() {
    const { id, index } = this.data.deleteLibraryItem;

    try {
      const result = await libraryAPI.delete(id);
      if (result.success) {
        wx.showToast({ title: '删除成功', icon: 'success' });
        this.loadMyLibraries();
        if (this.data.myLibraries.length <= 1) {
          this.setData({ isManageMode: false });
        }
      } else {
        wx.showToast({ title: result.message || '删除失败', icon: 'none' });
      }
    } catch (error) {
      console.error('删除知识库失败:', error);
      wx.showToast({ title: error.message || '删除失败', icon: 'none' });
    }

    this.setData({ 
      showDeleteLibraryConfirm: false,
      deleteLibraryItem: { id: null, name: '', cardCount: 0, index: -1 }
    });
  }
});

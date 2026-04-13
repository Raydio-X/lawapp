const { libraryAPI, chapterAPI } = require('../../../utils/api');

Page({
  data: {
    libraryName: '',
    isPublic: true,
    outline: [],
    showCancelDialog: false,
    dragIndex: -1,
    existingLibraryNames: []
  },

  _dragStartX: 0,
  _dragStartY: 0,
  _dragStartTime: 0,
  _lastLevelChangeTime: 0,
  _lastSortTime: 0,
  _isDragging: false,

  async onLoad() {
    await this.loadExistingLibraryNames();
  },

  async loadExistingLibraryNames() {
    try {
      const result = await libraryAPI.getMyLibraries({ page: 1, pageSize: 100 });
      if (result.success && result.data && result.data.list) {
        const names = result.data.list.map(item => item.name.trim().toLowerCase());
        this.setData({ existingLibraryNames: names });
      }
    } catch (error) {
      console.error('获取知识库列表失败:', error);
    }
  },

  onInputName(e) {
    this.setData({ libraryName: e.detail.value });
  },

  onTogglePublic() {
    this.setData({ isPublic: !this.data.isPublic });
  },

  onAddOutline() {
    const outline = this.data.outline;
    
    const hasEmptyTitle = outline.some(item => !item.title.trim());
    if (hasEmptyTitle) {
      wx.showToast({ title: '请先填写已有标题', icon: 'none' });
      return;
    }

    const newId = Date.now();
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

    toDelete.reverse().forEach(i => outline.splice(i, 1));
    this.setData({ outline });
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

  onCancel() {
    if (this.data.libraryName || this.data.outline.length > 0) {
      this.setData({ showCancelDialog: true });
    } else {
      wx.navigateBack();
    }
  },

  onConfirmCancel() {
    this.setData({ showCancelDialog: false });
    wx.navigateBack();
  },

  async onSubmit() {
    const { libraryName, isPublic, outline, existingLibraryNames } = this.data;

    if (!libraryName.trim()) {
      wx.showToast({ title: '请输入知识库名称', icon: 'none' });
      return;
    }

    const newName = libraryName.trim().toLowerCase();
    if (existingLibraryNames.includes(newName)) {
      wx.showToast({ title: '知识库名称已存在', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '创建中...', mask: true });

    try {
      const result = await libraryAPI.create({
        name: libraryName.trim(),
        subject: '法学',
        description: '',
        is_public: isPublic ? 1 : 0
      });

      if (result.success) {
        const libraryId = result.data.id;

        if (outline.length > 0) {
          const validOutline = outline.filter(item => item.title.trim());
          if (validOutline.length > 0) {
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
            
            await chapterAPI.batchCreate(libraryId, chapters);
          }
        }

        wx.hideLoading();
        wx.showToast({ title: '创建成功', icon: 'success' });
        
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        wx.hideLoading();
        wx.showToast({ title: result.message || '创建失败', icon: 'none' });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('创建知识库失败:', error);
      wx.showToast({ title: error.message || '创建失败', icon: 'none' });
    }
  }
});

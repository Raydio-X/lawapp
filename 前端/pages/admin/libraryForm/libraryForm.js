const { adminAPI, chapterAPI } = require('../../../utils/api');

Page({
  data: {
    libraryId: null,
    isEdit: false,
    libraryName: '',
    tags: [],
    outline: [],
    showCancelDialog: false,
    dragIndex: -1
  },

  _dragStartX: 0,
  _dragStartY: 0,
  _dragStartTime: 0,
  _lastLevelChangeTime: 0,
  _lastSortTime: 0,
  _isDragging: false,

  onLoad(options) {
    if (options.id) {
      this.setData({ 
        libraryId: parseInt(options.id), 
        isEdit: true 
      });
      wx.setNavigationBarTitle({ title: '编辑知识库' });
      this.loadLibraryDetail(parseInt(options.id));
    } else {
      if (options.name) {
        this.setData({ libraryName: decodeURIComponent(options.name) });
      }
    }
  },

  async loadLibraryDetail(libraryId) {
    try {
      wx.showLoading({ title: '加载中...', mask: true });
      
      const res = await adminAPI.getLibraries({ page: 1, pageSize: 100 });
      if (res.success && res.data) {
        const library = res.data.list.find(item => item.id === libraryId);
        if (library) {
          const tags = Array.isArray(library.tags) ? library.tags : [];
          this.setData({
            libraryName: library.name,
            tags: tags
          });
          
          const chaptersRes = await chapterAPI.getList(libraryId);
          if (chaptersRes.success && chaptersRes.data) {
            const outline = chaptersRes.data.map(ch => ({
              id: ch.id,
              title: ch.name,
              level: ch.level || 1,
              parentId: ch.parent_id
            }));
            this.setData({ outline });
          }
        }
      }
      wx.hideLoading();
    } catch (error) {
      wx.hideLoading();
      console.error('加载知识库详情失败:', error);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  onInputName(e) {
    this.setData({ libraryName: e.detail.value });
  },

  onTagInput(e) {
    const { index } = e.currentTarget.dataset;
    const value = e.detail.value;
    const tags = this.data.tags;
    tags[index] = value;
    this.setData({ tags });
  },

  onAddTag() {
    if (this.data.tags.length >= 3) {
      wx.showToast({ title: '最多添加3个标签', icon: 'none' });
      return;
    }
    const tags = this.data.tags;
    const hasEmptyTag = tags.some(tag => !tag.trim());
    if (hasEmptyTag) {
      wx.showToast({ title: '请先填写已有标签', icon: 'none' });
      return;
    }
    tags.push('');
    this.setData({ tags });
  },

  onRemoveTag(e) {
    const { index } = e.currentTarget.dataset;
    const tags = this.data.tags;
    tags.splice(index, 1);
    this.setData({ tags });
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
    const hasTags = this.data.tags.some(tag => tag.trim());
    if (this.data.libraryName || hasTags || this.data.outline.length > 0) {
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
    const { libraryId, isEdit, libraryName, tags, outline } = this.data;

    if (!libraryName.trim()) {
      wx.showToast({ title: '请输入知识库名称', icon: 'none' });
      return;
    }

    wx.showLoading({ title: isEdit ? '保存中...' : '创建中...', mask: true });

    try {
      const validTags = tags.filter(tag => tag.trim());
      
      let result;
      if (isEdit && libraryId) {
        result = await adminAPI.updateLibrary(libraryId, {
          name: libraryName.trim(),
          subject: validTags.length > 0 ? validTags[0] : '',
          tags: validTags,
          is_public: 1
        });
      } else {
        result = await adminAPI.createLibrary({
          name: libraryName.trim(),
          subject: validTags.length > 0 ? validTags[0] : '',
          tags: validTags,
          is_public: 1
        });
      }

      if (result.success) {
        const targetLibraryId = isEdit ? libraryId : result.data.id;

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
            
            await chapterAPI.batchCreate(targetLibraryId, chapters);
          }
        }

        wx.hideLoading();
        wx.showToast({ title: isEdit ? '保存成功' : '创建成功', icon: 'success' });
        
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        wx.hideLoading();
        wx.showToast({ title: result.message || (isEdit ? '保存失败' : '创建失败'), icon: 'none' });
      }
    } catch (error) {
      wx.hideLoading();
      console.error(isEdit ? '保存知识库失败:' : '创建知识库失败:', error);
      wx.showToast({ title: error.message || (isEdit ? '保存失败' : '创建失败'), icon: 'none' });
    }
  }
});

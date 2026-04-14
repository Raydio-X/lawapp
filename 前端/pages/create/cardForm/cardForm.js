const { libraryAPI, cardAPI, chapterAPI } = require('../../../utils/api');

Page({
  data: {
    cardId: null,
    isEdit: false,
    question: '',
    answer: '',

    selectedLibrary: null,
    selectedChapter: null,

    showLibraryPicker: false,
    showChapterPicker: false,

    selectedLibraryIndex: [],
    selectedChapterIndex: [],

    libraryOptions: [],
    chapterOptions: [],

    libraries: [],
    chapters: [],
    
    loading: false,
    canSubmit: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ cardId: parseInt(options.id), isEdit: true });
      wx.setNavigationBarTitle({ title: '编辑卡片' });
    } else {
      wx.setNavigationBarTitle({ title: '新增卡片' });
    }
    if (options.question) {
      this.setData({ question: decodeURIComponent(options.question) });
    }
    if (options.answer) {
      this.setData({ answer: decodeURIComponent(options.answer) });
    }
    if (options.libraryId) {
      this.setData({ 
        preselectedLibraryId: parseInt(options.libraryId),
        preselectedLibraryName: options.libraryName ? decodeURIComponent(options.libraryName) : ''
      });
    }
    
    this.loadLibraries();
  },

  async loadLibraries() {
    const token = wx.getStorageSync('access_token');
    if (!token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    this.setData({ loading: true });

    try {
      if (this.data.isEdit && this.data.cardId) {
        await this.loadCardDetail();
      }
      
      const res = await libraryAPI.getMyLibraries();
      if (res.success && res.data) {
        const libraries = res.data.list || res.data || [];
        
        if (libraries.length === 0) {
          wx.showModal({
            title: '提示',
            content: '请先创建知识库',
            showCancel: false,
            success: () => {
              wx.navigateBack();
            }
          });
          return;
        }

        const libraryOptions = libraries.map(lib => ({
          label: lib.name,
          value: lib.id
        }));

        let selectedLibrary = null;
        if (this.data.preselectedLibraryId) {
          selectedLibrary = libraries.find(lib => lib.id === this.data.preselectedLibraryId);
        }
        if (!selectedLibrary && this.data.editLibraryId) {
          selectedLibrary = libraries.find(lib => lib.id === this.data.editLibraryId);
        }
        if (!selectedLibrary) {
          selectedLibrary = libraries[0];
        }

        this.setData({
          libraries: libraries,
          libraryOptions: libraryOptions,
          selectedLibrary: selectedLibrary,
          selectedLibraryIndex: [selectedLibrary.id]
        });

        await this.loadChapters(selectedLibrary.id);
        this.checkCanSubmit();
      }
    } catch (error) {
      console.error('加载知识库失败:', error);
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  async loadCardDetail() {
    try {
      const res = await cardAPI.getDetail(this.data.cardId);
      if (res.success && res.data) {
        const card = res.data;
        this.setData({
          question: card.question,
          answer: card.answer,
          editLibraryId: card.library_id,
          editChapterId: card.chapter_id
        });
      }
    } catch (error) {
      console.error('加载卡片详情失败:', error);
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    }
  },

  async loadChapters(libraryId) {
    try {
      const res = await chapterAPI.getList(libraryId);
      if (res.success && res.data) {
        const chapters = res.data || [];
        
        const chapterOptions = chapters.map(ch => ({
          label: ch.name,
          value: ch.id
        }));

        let selectedChapter = null;
        if (this.data.editChapterId) {
          selectedChapter = chapters.find(ch => ch.id === this.data.editChapterId);
        }
        if (!selectedChapter && chapters.length > 0) {
          selectedChapter = chapters[0];
        }

        this.setData({
          chapters: chapters,
          chapterOptions: chapterOptions,
          selectedChapter: selectedChapter,
          selectedChapterIndex: selectedChapter ? [selectedChapter.id] : []
        });
      }
    } catch (error) {
      console.error('加载章节失败:', error);
      this.setData({
        chapters: [],
        chapterOptions: [],
        selectedChapter: null
      });
    }
  },

  onQuestionInput(e) {
    this.setData({ question: e.detail.value });
    this.checkCanSubmit();
  },

  onAnswerInput(e) {
    this.setData({ answer: e.detail.value });
    this.checkCanSubmit();
  },

  onSelectLibrary() {
    this.setData({ showLibraryPicker: true });
  },

  onLibraryConfirm(e) {
    const { value } = e.detail;
    const libraryId = value[0];
    const selectedLibrary = this.data.libraries.find(lib => lib.id === libraryId);

    if (!selectedLibrary) return;

    this.setData({
      selectedLibrary: selectedLibrary,
      selectedLibraryIndex: value,
      showLibraryPicker: false,
      selectedChapter: null,
      selectedChapterIndex: []
    });

    this.loadChapters(selectedLibrary.id);
    this.checkCanSubmit();
  },

  onSelectChapter() {
    if (!this.data.selectedLibrary) {
      wx.showToast({ title: '请先选择知识库', icon: 'none' });
      return;
    }
    this.setData({ showChapterPicker: true });
  },

  onChapterConfirm(e) {
    const { value } = e.detail;
    const chapterId = value[0];
    const selectedChapter = this.data.chapters.find(ch => ch.id === chapterId);

    if (!selectedChapter) return;

    this.setData({
      selectedChapter: selectedChapter,
      selectedChapterIndex: value,
      showChapterPicker: false
    });

    this.checkCanSubmit();
  },

  onPickerCancel() {
    this.setData({
      showLibraryPicker: false,
      showChapterPicker: false
    });
  },

  onLibraryPick(e) {
    const { value } = e.detail;
    this.setData({ selectedLibraryIndex: value });
  },

  onChapterPick(e) {
    const { value } = e.detail;
    this.setData({ selectedChapterIndex: value });
  },

  onLibraryConfirmBtn() {
    const { selectedLibraryIndex, libraries } = this.data;
    const libraryId = Array.isArray(selectedLibraryIndex) ? selectedLibraryIndex[0] : selectedLibraryIndex;
    const selectedLibrary = libraries.find(lib => lib.id === libraryId);

    if (!selectedLibrary) return;

    this.setData({
      selectedLibrary: selectedLibrary,
      showLibraryPicker: false,
      selectedChapter: null,
      selectedChapterIndex: []
    });

    this.loadChapters(selectedLibrary.id);
    this.checkCanSubmit();
  },

  onChapterConfirmBtn() {
    const { selectedChapterIndex, chapters } = this.data;
    const chapterId = Array.isArray(selectedChapterIndex) ? selectedChapterIndex[0] : selectedChapterIndex;
    const selectedChapter = chapters.find(ch => ch.id === chapterId);

    if (!selectedChapter) return;

    this.setData({
      selectedChapter: selectedChapter,
      showChapterPicker: false
    });

    this.checkCanSubmit();
  },

  checkCanSubmit() {
    const { question, answer, selectedLibrary } = this.data;
    const canSubmit = question.trim() && answer.trim() && selectedLibrary;
    this.setData({ canSubmit });
  },

  onCancel() {
    wx.showModal({
      title: '确认取消',
      content: '确定要放弃当前编辑的内容吗？',
      confirmColor: '#e34d59',
      success: (res) => {
        if (res.confirm) {
          wx.navigateBack();
        }
      }
    });
  },

  async onSubmit() {
    const { isEdit, cardId, question, answer, selectedLibrary, selectedChapter } = this.data;

    if (!question.trim()) {
      wx.showToast({ title: '请输入题目', icon: 'none' });
      return;
    }

    if (!answer.trim()) {
      wx.showToast({ title: '请输入答案', icon: 'none' });
      return;
    }

    if (!selectedLibrary) {
      wx.showToast({ title: '请选择知识库', icon: 'none' });
      return;
    }

    this.setData({ loading: true });

    try {
      const cardData = {
        library_id: selectedLibrary.id,
        chapter_id: selectedChapter ? selectedChapter.id : null,
        question: question.trim(),
        answer: answer.trim(),
        tags: [],
        is_public: 1
      };

      let result;
      if (isEdit && cardId) {
        result = await cardAPI.update(cardId, cardData);
      } else {
        result = await cardAPI.create(cardData);
      }

      if (result.success) {
        wx.showToast({ title: isEdit ? '保存成功' : '创建成功', icon: 'success', duration: 1500 });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        wx.showToast({ title: result.message || (isEdit ? '保存失败' : '创建失败'), icon: 'none' });
      }
    } catch (error) {
      console.error(isEdit ? '保存卡片失败:' : '创建卡片失败:', error);
      wx.showToast({ title: error.message || (isEdit ? '保存失败' : '创建失败'), icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  }
});

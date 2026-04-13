const { libraryAPI, cardAPI, chapterAPI } = require('../../../utils/api');

Page({
  data: {
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
    if (options.question) {
      this.setData({ question: decodeURIComponent(options.question) });
    }
    if (options.answer) {
      this.setData({ answer: decodeURIComponent(options.answer) });
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

        this.setData({
          libraries: libraries,
          libraryOptions: libraryOptions,
          selectedLibrary: libraries[0],
          selectedLibraryIndex: [libraries[0].id]
        });

        this.loadChapters(libraries[0].id);
        this.checkCanSubmit();
      }
    } catch (error) {
      console.error('加载知识库失败:', error);
      wx.showToast({ title: error.message || '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
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

        this.setData({
          chapters: chapters,
          chapterOptions: chapterOptions,
          selectedChapter: chapters.length > 0 ? chapters[0] : null,
          selectedChapterIndex: chapters.length > 0 ? [chapters[0].id] : []
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
    const { question, answer, selectedLibrary, selectedChapter } = this.data;

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

      const result = await cardAPI.create(cardData);

      if (result.success) {
        wx.showToast({ title: '创建成功', icon: 'success', duration: 1500 });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        wx.showToast({ title: result.message || '创建失败', icon: 'none' });
      }
    } catch (error) {
      console.error('创建卡片失败:', error);
      wx.showToast({ title: error.message || '创建失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  }
});

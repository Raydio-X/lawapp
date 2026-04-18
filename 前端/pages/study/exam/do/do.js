const { examAPI } = require('../../../../utils/api');

Page({
  data: {
    statusBarHeight: 20,
    questions: [],
    currentIndex: 0,
    currentQuestion: null,
    userAnswers: [],
    markedQuestions: [],
    remainingTime: 0,
    totalTime: 0,
    remainingTimeText: '',
    usedTimeText: '',
    progress: 0,
    showResult: false
  },

  timer: null,

  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: systemInfo.statusBarHeight });

    const config = wx.getStorageSync('examConfig');
    if (!config) {
      wx.showToast({ title: '考试配置错误', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }
    
    this.config = config;
    const totalSeconds = config.duration * 60;
    this.setData({ 
      totalTime: totalSeconds,
      remainingTime: totalSeconds,
      remainingTimeText: this.formatTime(totalSeconds)
    });
    this.loadQuestions();
  },

  onUnload() {
    this.clearTimer();
  },

  async loadQuestions() {
    wx.showLoading({ title: '组卷中...' });
    try {
      const res = await examAPI.generate({
        libraries: this.config.libraries,
        count: this.config.questionCount,
        mode: this.config.examMode
      });

      if (res.success && res.data?.length > 0) {
        const questions = res.data.map(q => ({
          ...q,
          isMarked: false
        }));
        
        this.setData({ 
          questions,
          currentQuestion: questions[0],
          userAnswers: new Array(questions.length).fill('')
        });
        this.startTimer();
      } else {
        wx.showToast({ title: '组卷失败', icon: 'none' });
        setTimeout(() => wx.navigateBack(), 1500);
      }
    } catch (error) {
      console.error('加载题目失败:', error);
      wx.showToast({ title: '加载失败', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
    } finally {
      wx.hideLoading();
    }
  },

  startTimer() {
    this.timer = setInterval(() => {
      const remainingTime = this.data.remainingTime - 1;
      if (remainingTime <= 0) {
        this.clearTimer();
        this.finishExam();
      } else {
        this.setData({ 
          remainingTime,
          remainingTimeText: this.formatTime(remainingTime)
        });
      }
    }, 1000);
  },

  clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },

  onExit() {
    wx.showModal({
      title: '退出考试',
      content: '确定要退出考试吗？当前答题进度将不会保存。',
      success: (res) => {
        if (res.confirm) {
          this.clearTimer();
          wx.switchTab({ url: '/pages/study/index' });
        }
      }
    });
  },

  onAnswerInput(e) {
    const answer = e.detail.value;
    const userAnswers = [...this.data.userAnswers];
    userAnswers[this.data.currentIndex] = answer;
    this.setData({ userAnswers });
  },

  onToggleMark() {
    const questions = [...this.data.questions];
    questions[this.data.currentIndex].isMarked = !questions[this.data.currentIndex].isMarked;
    this.setData({ 
      questions,
      currentQuestion: questions[this.data.currentIndex]
    });
  },

  onPrevQuestion() {
    if (this.data.currentIndex > 0) {
      const newIndex = this.data.currentIndex - 1;
      this.goToQuestion(newIndex);
    }
  },

  onNextQuestion() {
    if (this.data.currentIndex < this.data.questions.length - 1) {
      const newIndex = this.data.currentIndex + 1;
      this.goToQuestion(newIndex);
    } else {
      this.confirmSubmit();
    }
  },

  confirmSubmit() {
    const unanswered = this.data.userAnswers.filter(a => !a || a.trim() === '').length;
    
    wx.showModal({
      title: '提交试卷',
      content: unanswered > 0 
        ? `您还有${unanswered}道题未作答，确定要提交吗？` 
        : '确定要提交试卷吗？',
      success: (res) => {
        if (res.confirm) {
          this.finishExam();
        }
      }
    });
  },

  goToQuestion(index) {
    const progress = ((index + 1) / this.data.questions.length) * 100;
    this.setData({
      currentIndex: index,
      currentQuestion: this.data.questions[index],
      progress
    });
  },

  finishExam() {
    this.clearTimer();
    
    const usedTime = this.data.totalTime - this.data.remainingTime;

    wx.setStorageSync('examResult', {
      questions: this.data.questions,
      userAnswers: this.data.userAnswers,
      usedTime
    });

    this.setData({
      showResult: true,
      usedTimeText: this.formatTime(usedTime)
    });
  },

  onReviewAll() {
    wx.navigateTo({ url: '/pages/study/exam/review/review' });
  }
});

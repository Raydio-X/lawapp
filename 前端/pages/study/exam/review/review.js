Page({
  data: {
    questions: [],
    userAnswers: [],
    statusBarHeight: 20
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: systemInfo.statusBarHeight });
    
    const examResult = wx.getStorageSync('examResult');
    if (examResult) {
      this.setData({
        questions: examResult.questions,
        userAnswers: examResult.userAnswers
      });
    }
  },

  onBack() {
    wx.switchTab({ url: '/pages/study/index' });
  }
});

const { messageAPI } = require('../../../utils/api');

Page({
  data: {
    title: '',
    content: ''
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  onCancel() {
    wx.navigateBack();
  },

  onSend() {
    const { title, content } = this.data;

    if (!title.trim()) {
      wx.showToast({ title: '请输入通知标题', icon: 'none' });
      return;
    }

    if (!content.trim()) {
      wx.showToast({ title: '请输入通知内容', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认发送',
      content: `确定要向所有用户发送通知"${title}"吗？`,
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '发送中...' });
          try {
            const result = await messageAPI.broadcast({
              title: title,
              content: content
            });
            wx.hideLoading();

            if (result.success) {
              wx.showToast({ title: `已发送给 ${result.data.count} 位用户`, icon: 'success' });
              setTimeout(() => {
                wx.navigateBack();
              }, 1500);
            } else {
              wx.showToast({ title: result.message || '发送失败', icon: 'none' });
            }
          } catch (error) {
            wx.hideLoading();
            console.error('发送通知失败:', error);
            wx.showToast({ title: error.message || '发送失败', icon: 'none' });
          }
        }
      }
    });
  }
});

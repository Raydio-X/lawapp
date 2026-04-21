const { messageAPI } = require('../../../utils/api');

Page({
  data: {
    messages: [],
    page: 1,
    hasMore: true,
    loading: false,
    unreadCount: 0,
    showDetail: false,
    currentMessage: null
  },

  onLoad() {
    this.loadMessages();
  },

  onShow() {
    if (this.data.messages.length > 0) {
      this.setData({ page: 1, hasMore: true });
      this.loadMessages();
    }
  },

  onPullDownRefresh() {
    this.setData({ page: 1, hasMore: true });
    this.loadMessages(() => {
      wx.stopPullDownRefresh();
    });
  },

  async loadMessages(callback) {
    if (this.data.loading) {
      if (callback) callback();
      return;
    }

    this.setData({ loading: true });

    try {
      const params = {
        page: this.data.page,
        pageSize: 20
      };

      const res = await messageAPI.getList(params);

      if (res.success && res.data) {
        const list = (res.data.list || []).map(item => {
          let formattedTime = '';
          if (item.created_at) {
            const date = new Date(item.created_at);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            formattedTime = `${year}-${month}-${day} ${hours}:${minutes}`;
          }
          return {
            ...item,
            created_at: formattedTime
          };
        });

        this.setData({
          messages: this.data.page === 1 ? list : [...this.data.messages, ...list],
          hasMore: list.length >= 20
        });
      }
    } catch (error) {
      console.error('加载消息失败:', error);
    } finally {
      this.setData({ loading: false });
      if (callback) callback();
    }
  },

  async onMessageTap(e) {
    const { id, index } = e.currentTarget.dataset;
    const message = this.data.messages[index];

    this.setData({
      showDetail: true,
      currentMessage: message
    });

    if (!message.is_read) {
      try {
        await messageAPI.markAsRead(id);
        this.setData({
          [`messages[${index}].is_read`]: 1
        });
      } catch (error) {
        console.error('标记已读失败:', error);
      }
    }
  },

  onDetailClose() {
    this.setData({
      showDetail: false,
      currentMessage: null
    });
  },

  async onMarkAllRead() {
    try {
      const res = await messageAPI.markAllAsRead();
      if (res.success) {
        const messages = this.data.messages.map(m => ({ ...m, is_read: 1 }));
        this.setData({ messages });
        wx.showToast({ title: '已全部标记为已读', icon: 'success' });
      }
    } catch (error) {
      console.error('全部标记已读失败:', error);
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  onDeleteMessage(e) {
    const { id, index } = e.currentTarget.dataset;

    wx.showModal({
      title: '删除消息',
      content: '确定要删除这条消息吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await messageAPI.delete(id);
            if (result.success) {
              const messages = [...this.data.messages];
              messages.splice(index, 1);
              this.setData({ messages });
              wx.showToast({ title: '已删除', icon: 'success' });
            }
          } catch (error) {
            console.error('删除消息失败:', error);
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  loadMore() {
    if (!this.data.hasMore) return;
    this.setData({ page: this.data.page + 1 });
    this.loadMessages();
  }
});

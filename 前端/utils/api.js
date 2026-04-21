/**
 * API 请求工具类
 * 封装微信小程序的 wx.request 方法，统一处理请求和响应
 */

// API 基础配置
//const API_BASE_URL = 'http://47.97.108.0:3000/api';
const API_BASE_URL = 'http://localhost:3000/api';

const TOKEN_KEY = 'access_token';

const checkTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch (e) {
    return true;
  }
};

const getValidToken = () => {
  const token = wx.getStorageSync(TOKEN_KEY);
  if (token && !checkTokenExpired(token)) {
    return token;
  }
  if (token) {
    wx.removeStorageSync(TOKEN_KEY);
    wx.removeStorageSync('userInfo');
  }
  return null;
};

const isLoggedIn = () => {
  return !!getValidToken();
};

/**
 * 封装请求方法
 * @param {Object} options 请求配置
 * @returns {Promise}
 */
const request = (options) => {
  return new Promise((resolve, reject) => {
    const token = getValidToken();
    
    if (options.showLoading !== false) {
      wx.showLoading({
        title: options.loadingText || '加载中...',
        mask: true
      });
    }

    wx.request({
      url: `${API_BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.header
      },
      timeout: options.timeout || 30000,
      success: (res) => {
        // 隐藏加载提示
        if (options.showLoading !== false) {
          wx.hideLoading();
        }

        // 处理响应
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const data = res.data;
          
          if (data.success) {
            // 业务成功
            resolve(data);
          } else {
            // 业务失败
            const error = new Error(data.message || '请求失败');
            error.code = data.code;
            error.data = data;
            reject(error);
          }
        } else if (res.statusCode === 401) {
          // Token 过期，清除登录状态并跳转到登录页
          wx.removeStorageSync(TOKEN_KEY);
          wx.removeStorageSync('userInfo');
          
          wx.showToast({
            title: '登录已过期，请重新登录',
            icon: 'none'
          });
          
          // 延迟跳转
          setTimeout(() => {
            wx.redirectTo({
              url: '/pages/login/login'
            });
          }, 1500);
          
          reject(new Error('登录已过期'));
        } else if (res.statusCode === 403) {
          reject(new Error('无权访问该资源'));
        } else if (res.statusCode === 404) {
          reject(new Error('请求的资源不存在'));
        } else if (res.statusCode === 429) {
          reject(new Error('请求过于频繁，请稍后再试'));
        } else {
          reject(new Error(res.data?.message || `服务器错误 (${res.statusCode})`));
        }
      },
      fail: (err) => {
        // 隐藏加载提示
        if (options.showLoading !== false) {
          wx.hideLoading();
        }

        console.error('请求失败:', err);
        
        let errorMsg = '网络请求失败';
        if (err.errMsg && err.errMsg.includes('timeout')) {
          errorMsg = '请求超时，请检查网络';
        } else if (err.errMsg && err.errMsg.includes('fail')) {
          // 检查是否是开发环境 localhost 问题
          if (API_BASE_URL.includes('localhost')) {
            errorMsg = '无法连接到后端服务。请检查：\n1. 后端服务是否已启动 (npm run dev)\n2. 是否使用正确的 IP 地址替代 localhost';
          } else {
            errorMsg = '网络连接失败，请检查网络设置';
          }
        }
        
        reject(new Error(errorMsg));
      }
    });
  });
};

/**
 * GET 请求
 */
const get = (url, params = {}, options = {}) => {
  return request({
    url,
    method: 'GET',
    data: params,
    ...options
  });
};

/**
 * POST 请求
 */
const post = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'POST',
    data,
    ...options
  });
};

/**
 * PUT 请求
 */
const put = (url, data = {}, options = {}) => {
  return request({
    url,
    method: 'PUT',
    data,
    ...options
  });
};

/**
 * DELETE 请求
 */
const del = (url, params = {}, options = {}) => {
  return request({
    url,
    method: 'DELETE',
    data: params,
    ...options
  });
};

/**
 * 上传文件
 */
const upload = (url, filePath, options = {}) => {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync(TOKEN_KEY);
    
    wx.uploadFile({
      url: `${API_BASE_URL}${url}`,
      filePath,
      name: options.name || 'file',
      header: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      formData: options.formData || {},
      success: (res) => {
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(res.data);
            if (data.success) {
              resolve(data);
            } else {
              reject(new Error(data.message || '上传失败'));
            }
          } catch (e) {
            resolve({ data: res.data });
          }
        } else if (res.statusCode === 401) {
          wx.removeStorageSync(TOKEN_KEY);
          wx.removeStorageSync('userInfo');
          wx.showToast({ title: '登录已过期，请重新登录', icon: 'none' });
          setTimeout(() => { wx.redirectTo({ url: '/pages/login/login' }); }, 1500);
          reject(new Error('登录已过期'));
        } else {
          try {
            const data = JSON.parse(res.data);
            reject(new Error(data.message || `上传失败 (${res.statusCode})`));
          } catch (e) {
            reject(new Error(`上传失败 (${res.statusCode})`));
          }
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '网络请求失败'));
      }
    });
  });
};

// ==================== API 接口封装 ====================

/**
 * 认证相关 API
 */
const authAPI = {
  // 微信登录
  login: (code, userInfo) => {
    return post('/auth/login', { code, userInfo });
  },

  // 测试登录
  testLogin: (account, password) => {
    return post('/auth/test-login', { account, password });
  },

  // 获取当前用户信息
  getCurrentUser: () => {
    return get('/auth/me');
  },

  // 更新用户信息
  updateProfile: (data) => {
    return put('/auth/profile', data);
  },

  // 刷新 Token
  refreshToken: () => {
    return post('/auth/refresh');
  }
};

/**
 * 知识库相关 API
 */
const libraryAPI = {
  // 获取知识库列表
  getList: (params = {}) => {
    return get('/libraries', params);
  },

  // 获取知识库详情
  getDetail: (id) => {
    return get(`/libraries/${id}`);
  },

  // 创建知识库
  create: (data) => {
    return post('/libraries', data);
  },

  // 更新知识库
  update: (id, data) => {
    return put(`/libraries/${id}`, data);
  },

  // 删除知识库
  delete: (id) => {
    return del(`/libraries/${id}`);
  },

  // 获取我的知识库
  getMyLibraries: (params = {}) => {
    return get('/libraries/my', params);
  },

  // 获取推荐知识库
  getRecommended: (limit = 6) => {
    return get('/libraries/recommended', { limit });
  },

  // 获取分类列表
  getCategories: () => {
    return get('/libraries/categories');
  },

  // 搜索知识库
  search: (keyword, params = {}) => {
    return get('/libraries/search', { keyword, ...params });
  },

  // 收藏/取消收藏
  toggleFavorite: (id) => {
    return post(`/libraries/${id}/favorite`);
  },

  // 点赞知识库
  like: (id) => {
    return post(`/libraries/${id}/like`);
  },

  // 取消点赞知识库
  unlike: (id) => {
    return post(`/libraries/${id}/unlike`);
  }
};

/**
 * 卡片相关 API
 */
const cardAPI = {
  // 获取卡片列表
  getList: (params = {}) => {
    return get('/cards', params);
  },

  // 获取卡片详情
  getDetail: (id) => {
    return get(`/cards/${id}`);
  },

  // 创建卡片
  create: (data) => {
    return post('/cards', data);
  },

  // 更新卡片
  update: (id, data) => {
    return put(`/cards/${id}`, data);
  },

  // 删除卡片
  delete: (id) => {
    return del(`/cards/${id}`);
  },

  // 获取热门卡片
  getHotCards: (limit = 10, page = null, pageSize = null) => {
    const params = { limit };
    if (page) params.page = page;
    if (pageSize) params.pageSize = pageSize;
    return get('/cards/hot', params, { showLoading: false });
  },

  // 搜索卡片
  search: (keyword, params = {}) => {
    return get('/cards/search', { keyword, ...params });
  },

  // 记录学习
  recordStudy: (id, data = {}) => {
    return post(`/cards/${id}/study`, data);
  },

  // 添加错题
  addWrong: (id) => {
    return post(`/cards/${id}/wrong`);
  },

  // 标记已掌握
  markAsMastered: (id) => {
    return post(`/cards/${id}/master`);
  },

  // 设置掌握状态
  setMastery: (id, mastered) => {
    return post(`/cards/${id}/mastery`, { mastered });
  },

  // 切换掌握状态
  toggleMastery: (id) => {
    return post(`/cards/${id}/mastery/toggle`);
  },

  // 点赞卡片
  like: (id) => {
    return post(`/cards/${id}/like`);
  },

  // 取消点赞卡片
  unlike: (id) => {
    return post(`/cards/${id}/unlike`);
  },

  // 获取下一张卡片
  getNext: (id) => {
    return get(`/cards/${id}/next`);
  },

  // 获取上一张卡片
  getPrev: (id) => {
    return get(`/cards/${id}/prev`);
  },

  // 获取随机卡片
  getRandom: (libraryId) => {
    return get(`/libraries/${libraryId}/cards/random`);
  },

  // 获取待复习卡片列表
  getReviewCards: () => {
    return get('/cards/review/list');
  },

  // 获取待复习卡片数量
  getReviewCount: () => {
    return get('/cards/review/count');
  },

  batchImport: (filePath, formData) => {
    return upload('/cards/batch-import', filePath, {
      name: 'file',
      formData: formData || {}
    });
  },

  batchMove: (cardIds, chapterId) => {
    return post('/cards/batch-move', { cardIds, chapterId });
  }
};

/**
 * 章节相关 API
 */
const chapterAPI = {
  // 获取章节列表
  getList: (libraryId) => {
    return get(`/libraries/${libraryId}/chapters`);
  },

  // 创建章节
  create: (libraryId, data) => {
    return post(`/libraries/${libraryId}/chapters`, data);
  },

  // 批量创建章节
  batchCreate: (libraryId, chapters) => {
    return post('/chapters/batch', { libraryId, chapters });
  },

  // 批量更新章节
  batchUpdate: (libraryId, chapters) => {
    return post('/chapters/batch-update', { libraryId, chapters });
  },

  // 更新章节
  update: (id, data) => {
    return put(`/chapters/${id}`, data);
  },

  // 删除章节
  delete: (id) => {
    return del(`/chapters/${id}`);
  },

  // 获取章节卡片
  getCards: (id) => {
    return get(`/chapters/${id}/cards`);
  }
};

/**
 * 学习记录相关 API
 */
const studyAPI = {
  getStats: () => {
    return get('/study/stats');
  },

  getTodayRecords: () => {
    return get('/study/today');
  },

  getCalendar: (params = {}) => {
    return get('/study/calendar', params);
  },

  getLibraryProgress: (libraryId) => {
    return get(`/study/progress/${libraryId}`);
  },

  getRecentCards: (limit = 10) => {
    return get('/study/recent', { limit });
  },

  getTrend: (days = 7) => {
    return get('/study/trend', { days });
  },

  getHeatmap: (year) => {
    return get('/study/heatmap', { year });
  },

  getMonthlyStats: (year, month) => {
    return get('/study/monthly-stats', { year, month });
  },

  getMonthlyAvgStats: (year, month) => {
    return get('/study/monthly-avg-stats', { year, month });
  },

  recordStudyTime: (libraryId, duration, options = {}) => {
    return post('/study/time', { libraryId, duration }, { showLoading: false, ...options });
  },

  getStudyTime: (options = {}) => {
    return get('/study/time', {}, { showLoading: false, ...options });
  },

  getTodayStudyTime: (options = {}) => {
    return get('/study/today-time', {}, { showLoading: false, ...options });
  },

  updateDailyGoal: (goal) => {
    return put('/study/daily-goal', { goal });
  }
};

/**
 * 评论相关 API
 */
const commentAPI = {
  // 获取评论列表
  getList: (cardId, params = {}) => {
    return get(`/cards/${cardId}/comments`, params);
  },

  // 发表评论
  create: (cardId, data) => {
    return post(`/cards/${cardId}/comments`, data);
  },

  // 删除评论
  delete: (id) => {
    return del(`/comments/${id}`);
  },

  // 点赞评论
  like: (id) => {
    return post(`/comments/${id}/like`);
  }
};

/**
 * 收藏相关 API
 */
const favoriteAPI = {
  getList: (params = {}) => {
    return get('/favorites', params);
  },

  getLibraries: (params = {}) => {
    return get('/favorites/libraries', params);
  },

  add: (targetType, targetId) => {
    return post('/favorites', { targetType, targetId });
  },

  remove: (targetType, targetId) => {
    return del('/favorites', { targetType, targetId });
  },

  check: (targetType, targetId) => {
    return get('/favorites/check', { targetType, targetId });
  },

  toggle: (targetType, targetId) => {
    return post('/favorites/toggle', { targetType, targetId });
  }
};

/**
 * 考试相关 API
 */
const examAPI = {
  generate: (params = {}) => {
    return post('/exam/generate', params);
  },

  submit: (data = {}) => {
    return post('/exam/submit', data);
  }
};

const adminAPI = {
  getStats: () => {
    return get('/admin/stats');
  },

  getLibraries: (params = {}) => {
    return get('/admin/libraries', params);
  },

  createLibrary: (data) => {
    return post('/admin/libraries', data);
  },

  updateLibrary: (id, data) => {
    return put(`/admin/libraries/${id}`, data);
  },

  deleteLibrary: (id) => {
    return del(`/admin/libraries/${id}`);
  },

  getCards: (params = {}) => {
    return get('/admin/cards', params);
  },

  createCard: (data) => {
    return post('/admin/cards', data);
  },

  updateCard: (id, data) => {
    return put(`/admin/cards/${id}`, data);
  },

  deleteCard: (id) => {
    return del(`/admin/cards/${id}`);
  },

  getComments: (params = {}) => {
    return get('/admin/comments', params);
  },

  deleteComment: (id) => {
    return del(`/admin/comments/${id}`);
  }
};

const messageAPI = {
  getList: (params = {}) => {
    return get('/messages', params);
  },

  getUnreadCount: () => {
    return get('/messages/unread-count', {}, { showLoading: false });
  },

  markAsRead: (id) => {
    return put(`/messages/${id}/read`);
  },

  markAllAsRead: () => {
    return put('/messages/read-all');
  },

  delete: (id) => {
    return del(`/messages/${id}`);
  },

  broadcast: (data) => {
    return post('/messages/broadcast', data);
  }
};

module.exports = {
  request,
  get,
  post,
  put,
  del,
  upload,
  isLoggedIn,
  authAPI,
  libraryAPI,
  cardAPI,
  chapterAPI,
  studyAPI,
  commentAPI,
  favoriteAPI,
  examAPI,
  adminAPI,
  messageAPI
};

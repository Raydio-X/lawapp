/**
 * 登录守卫中间件
 * 用于保护需要登录才能访问的页面
 */

const { checkLoginStatus } = require('../utils/auth');

/**
 * 页面登录守卫
 * 在页面onLoad时调用，检查用户是否已登录
 * @param {Object} options - 配置选项
 * @param {boolean} options.redirect - 是否自动跳转到登录页，默认为true
 * @param {string} options.redirectUrl - 登录成功后跳转回的页面，默认为当前页面
 * @returns {Promise<boolean>} - 是否已登录
 */
const authGuard = (options = {}) => {
  const { redirect = true, redirectUrl = '' } = options;

  return new Promise((resolve) => {
    const isLogin = checkLoginStatus();

    if (isLogin) {
      // 已登录，允许访问
      resolve(true);
    } else {
      // 未登录
      if (redirect) {
        // 获取当前页面路径作为回调地址
        const pages = getCurrentPages();
        const currentPage = pages[pages.length - 1];
        const currentRoute = currentPage ? currentPage.route : '';
        
        // 构建登录页URL，包含回调地址
        const loginUrl = `/pages/login/login?redirect=${encodeURIComponent(redirectUrl || currentRoute)}`;
        
        // 跳转到登录页
        wx.redirectTo({
          url: loginUrl,
          complete: () => {
            resolve(false);
          }
        });
      } else {
        resolve(false);
      }
    }
  });
};

/**
 * 需要登录的操作守卫
 * 用于保护特定操作（如提交、收藏等）
 * @param {Function} action - 需要登录才能执行的操作
 * @param {Object} options - 配置选项
 * @returns {Promise<any>}
 */
const actionGuard = async (action, options = {}) => {
  const isLogin = checkLoginStatus();

  if (!isLogin) {
    // 未登录，提示用户
    const { showModal = true } = options;
    
    if (showModal) {
      const modalRes = await wx.showModal({
        title: '需要登录',
        content: '该功能需要登录后才能使用，是否立即登录？',
        confirmText: '去登录',
        cancelText: '取消'
      });

      if (modalRes.confirm) {
        // 用户确认登录
        const pages = getCurrentPages();
        const currentPage = pages[pages.length - 1];
        const currentRoute = currentPage ? currentPage.route : '';
        
        wx.navigateTo({
          url: `/pages/login/login?redirect=${encodeURIComponent(currentRoute)}`
        });
      }
    }
    
    return null;
  }

  // 已登录，执行操作
  return await action();
};

/**
 * TabBar页面登录守卫
 * 用于TabBar页面的登录检查（使用switchTab跳转）
 */
const tabBarAuthGuard = () => {
  const isLogin = checkLoginStatus();

  if (!isLogin) {
    // 未登录，跳转到登录页
    wx.redirectTo({
      url: '/pages/login/login?redirect=tabBar'
    });
    return false;
  }

  return true;
};

/**
 * 页面Mixin - 用于页面的登录守卫
 * 在页面配置中混入此对象即可实现自动登录检查
 */
const authGuardMixin = {
  onLoad(options) {
    // 检查是否需要登录
    const needAuth = this.data?.needAuth !== false; // 默认需要登录
    
    if (needAuth) {
      authGuard({
        redirect: true,
        redirectUrl: options.redirect || ''
      });
    }
  }
};

module.exports = {
  authGuard,
  actionGuard,
  tabBarAuthGuard,
  authGuardMixin
};

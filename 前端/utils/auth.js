/**
 * 认证相关工具函数
 * 处理微信登录、Token 管理等
 */

import { authAPI } from './api';

const TOKEN_KEY = 'access_token';
const USER_INFO_KEY = 'userInfo';
const IS_GUEST_KEY = 'isGuest';

/**
 * 微信登录（推荐使用 getUserProfile 方式）
 * @param {Object} userInfo 用户信息（可选，旧版方式传入）
 * @returns {Promise<Object>}
 */
export const login = async (userInfo = null) => {
  try {
    // 1. 获取微信登录凭证
    const { code } = await wx.login();
    
    if (!code) {
      throw new Error('获取微信登录凭证失败');
    }

    // 2. 获取用户信息（如果未传入）
    let userProfile = userInfo;
    if (!userProfile) {
      try {
        const { userInfo: profile } = await wx.getUserProfile({
          desc: '用于完善用户资料'
        });
        userProfile = profile;
      } catch (err) {
        console.warn('获取用户信息失败:', err);
        // 用户拒绝授权，继续使用默认信息
        userProfile = {
          nickName: '微信用户',
          avatarUrl: ''
        };
      }
    }

    // 3. 调用后端登录接口
    const response = await authAPI.login(code, userProfile);

    if (response.success) {
      const { token, userInfo: serverUserInfo } = response.data;
      
      // 4. 保存 Token 和用户信息
      wx.setStorageSync(TOKEN_KEY, token);
      wx.setStorageSync(USER_INFO_KEY, serverUserInfo);
      wx.removeStorageSync(IS_GUEST_KEY);

      return {
        success: true,
        token,
        userInfo: serverUserInfo
      };
    } else {
      throw new Error(response.message || '登录失败');
    }
  } catch (error) {
    console.error('登录失败:', error);
    return {
      success: false,
      message: error.message || '登录失败，请重试'
    };
  }
};

/**
 * 检查登录状态
 * @returns {boolean}
 */
export const checkLoginStatus = () => {
  const token = wx.getStorageSync(TOKEN_KEY);
  const userInfo = wx.getStorageSync(USER_INFO_KEY);
  return !!(token && userInfo);
};

/**
 * 检查是否是游客模式
 * @returns {boolean}
 */
export const isGuest = () => {
  return wx.getStorageSync(IS_GUEST_KEY) === true;
};

/**
 * 获取当前用户信息
 * @returns {Object|null}
 */
export const getCurrentUser = () => {
  return wx.getStorageSync(USER_INFO_KEY) || null;
};

/**
 * 获取 Token
 * @returns {string|null}
 */
export const getToken = () => {
  return wx.getStorageSync(TOKEN_KEY) || null;
};

/**
 * 退出登录
 */
export const logout = () => {
  wx.removeStorageSync(TOKEN_KEY);
  wx.removeStorageSync(USER_INFO_KEY);
  wx.removeStorageSync(IS_GUEST_KEY);
  
  // 跳转到登录页
  wx.redirectTo({
    url: '/pages/login/login'
  });
};

/**
 * 更新用户信息
 * @param {Object} data 更新的数据
 * @returns {Promise<Object>}
 */
export const updateUserProfile = async (data) => {
  try {
    const response = await authAPI.updateProfile(data);
    
    if (response.success) {
      // 更新本地存储
      const currentUser = getCurrentUser();
      const updatedUser = { ...currentUser, ...response.data };
      wx.setStorageSync(USER_INFO_KEY, updatedUser);
      
      return {
        success: true,
        userInfo: updatedUser
      };
    } else {
      throw new Error(response.message || '更新失败');
    }
  } catch (error) {
    console.error('更新用户信息失败:', error);
    return {
      success: false,
      message: error.message || '更新失败'
    };
  }
};

/**
 * 刷新用户信息
 * @returns {Promise<Object>}
 */
export const refreshUserInfo = async () => {
  try {
    const response = await authAPI.getCurrentUser();
    
    if (response.success) {
      wx.setStorageSync(USER_INFO_KEY, response.data);
      return {
        success: true,
        userInfo: response.data
      };
    } else {
      throw new Error(response.message || '获取用户信息失败');
    }
  } catch (error) {
    console.error('刷新用户信息失败:', error);
    return {
      success: false,
      message: error.message || '获取用户信息失败'
    };
  }
};

/**
 * 刷新 Token
 * @returns {Promise<boolean>}
 */
export const refreshToken = async () => {
  try {
    const response = await authAPI.refreshToken();
    
    if (response.success && response.data.token) {
      wx.setStorageSync(TOKEN_KEY, response.data.token);
      return true;
    }
    return false;
  } catch (error) {
    console.error('刷新 Token 失败:', error);
    return false;
  }
};

/**
 * 要求登录（用于需要登录才能访问的页面）
 * @param {string} redirectUrl 登录成功后跳转的页面
 * @returns {boolean} 是否已登录
 */
export const requireLogin = (redirectUrl = '') => {
  if (!checkLoginStatus()) {
    const url = redirectUrl 
      ? `/pages/login/login?redirect=${encodeURIComponent(redirectUrl)}`
      : '/pages/login/login';
    
    wx.navigateTo({ url });
    return false;
  }
  return true;
};

/**
 * 获取微信用户信息（getUserProfile 封装）
 * @returns {Promise<Object>}
 */
export const getUserProfile = () => {
  return new Promise((resolve, reject) => {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        resolve(res.userInfo);
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
};

/**
 * 静默登录（不获取用户信息，仅获取 openid）
 * @returns {Promise<Object>}
 */
export const silentLogin = async () => {
  try {
    const { code } = await wx.login();
    
    if (!code) {
      throw new Error('获取登录凭证失败');
    }

    const response = await authAPI.login(code, null);

    if (response.success) {
      const { token, userInfo } = response.data;
      
      wx.setStorageSync(TOKEN_KEY, token);
      wx.setStorageSync(USER_INFO_KEY, userInfo);
      wx.removeStorageSync(IS_GUEST_KEY);

      return {
        success: true,
        token,
        userInfo
      };
    } else {
      throw new Error(response.message || '登录失败');
    }
  } catch (error) {
    console.error('静默登录失败:', error);
    return {
      success: false,
      message: error.message || '登录失败'
    };
  }
};

// 默认导出
export default {
  login,
  checkLoginStatus,
  isGuest,
  getCurrentUser,
  getToken,
  logout,
  updateUserProfile,
  refreshUserInfo,
  refreshToken,
  requireLogin,
  getUserProfile,
  silentLogin
};

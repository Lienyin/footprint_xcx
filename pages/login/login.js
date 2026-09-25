var util = require('../../utils/util.js');
var api = require('../../config/api.js');
const app = getApp()
Page({
  data: {
    referrerId: 0,
    packageId: 0,
    orderId: 0,
    couponUserId: 0,
    storeId: 0,
    route: 0,
    isNew: 0
  },

  onLoad: function (options) {
    var that = this;
    that.setData({
      referrerId: options.referrerId || 0,
      storeId: options.storeId || 0,
      orderId: options.orderId || 0,
      couponUserId: options.couponUserId || 0,
      packageId: options.packageId || 0,
      route: options.route || 0
    });
  },

  onShow: function () {
    console.log('开始登录检查');
    this.handleLogin();
  },

  handleLogin: function () {
    var that = this;
    let token = wx.getStorageSync('token');

    if (!token) {
      this.weixinLogin();
    } else {
      this.validateToken();
    }
  },

  weixinLogin: function () {
    var that = this;
    wx.login({
      success: function (res) {
        if (res.code) {
          util.request(api.AuthLoginByWeixin, {
            code: res.code,
            referrerId: that.data.referrerId,
            route: that.data.route,
            storeId: that.data.storeId
          }, 'POST').then(function (res) {
            if (res.code === 200) {
              wx.setStorageSync('userInfo', res.data.user);
              wx.setStorageSync('token', res.data.token);

              that.setData({
                isNew: res.data.isNew || 0
              });
              that.navigateToTarget();
            } else {
              console.error('微信登录失败:', res);
              that.showError('登录失败，请重试');
            }
          }).catch((error) => {
            console.error('微信登录请求失败:', error);
            that.showError('网络异常，请重试');
          });
        } else {
          console.log('获取微信code失败：' + res.errMsg);
          that.showError('微信授权失败');
        }
      },
      fail: function (err) {
        console.error('微信登录调用失败:', err);
        that.showError('微信登录失败');
      }
    })
  },

  validateToken: function () {
    var that = this;
    util.request(api.AuthLogin, {
      referrerId: that.data.referrerId
    }, 'POST').then(function (res) {
      console.log('token验证结果:', res);
      if (res.code === 200) {
        that.navigateToTarget();
      } else {
        wx.removeStorageSync('token');
        wx.removeStorageSync('userInfo');
        that.weixinLogin();
      }
    }).catch((error) => {
      console.error('token验证失败:', error);
      wx.removeStorageSync('token');
      wx.removeStorageSync('userInfo');
      that.weixinLogin();
    });
  },

  navigateToTarget: function () {
    var that = this;
    if (that.data.orderId && that.data.orderId != 0) {
      wx.redirectTo({
        url: "/pages/orderPay/pay?orderId=" + that.data.orderId,
        fail: function (err) {
          console.error('跳转订单页失败:', err);
          that.fallbackNavigation();
        }
      })
    } else if (that.data.packageId && that.data.packageId != 0) {
      wx.redirectTo({
        url: "/pages/packageDetail/index?packageId=" + that.data.packageId,
        fail: function (err) {
          console.error('跳转套餐页失败:', err);
          that.fallbackNavigation();
        }
      })
    } else if (that.data.couponUserId && that.data.couponUserId != 0) {
      wx.redirectTo({
        url: "/pages/couponDetail/couponDetail?couponUserId=" + that.data.couponUserId,
        fail: function (err) {
          console.error('跳转优惠券页失败:', err);
          that.fallbackNavigation();
        }
      })
    } else if ((that.data.route && that.data.route == 1) || (that.data.isNew && that.data.isNew == 1)) {
      wx.redirectTo({
        url: "/pages/couponPackage/couponPackage",
        fail: function (err) {
          console.error('跳转限时优惠券领取页失败:', err);
          that.fallbackNavigation();
        }
      })
    } else {
      that.fallbackNavigation();
    }
  },

  fallbackNavigation: function () {
    wx.switchTab({
      url: '/pages/store/store',
      fail: function (err) {
        console.error('跳转首页失败:', err);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },

  showError: function (message) {
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    });
    setTimeout(() => {
      this.fallbackNavigation();
    }, 2000);
  }
})
const util = require('../../utils/util.js');
const api = require('../../config/api.js');
Page({
  data: {
    activeTab: 0,
    coupons: [],
    unusedCount: 0,
    loading: false,
    shareCoupon: {},
    floatingBtnState: 'expand',
    scrollTop: 0,
    lastScrollTop: 0,
    scrollTimer: null,
  },

  onLoad: function (options) {
    if (options.status) {
      this.setData({
        activeTab: parseInt(options.status)
      });
    }
    this.loadCoupons();
  },

  onShow: function () {
  },
  onPageScroll: function (e) {
    const currentScrollTop = e.scrollTop;
    const lastScrollTop = this.data.lastScrollTop;
    if (this.data.floatingBtnState !== 'collapse') {
      this.setData({
        floatingBtnState: 'collapse'
      });
    }
    if (this.data.scrollTimer) {
      clearTimeout(this.data.scrollTimer);
    }
    const scrollTimer = setTimeout(() => {
      this.setData({
        floatingBtnState: 'expand'
      });
    }, 500);
    
    this.setData({
      scrollTop: currentScrollTop,
      lastScrollTop: currentScrollTop,
      scrollTimer: scrollTimer
    });
  },

  switchTab: function (e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: parseInt(tab)
    });
    this.loadCoupons();
  },

  loadCoupons: function () {
    this.setData({ loading: true });
    wx.showLoading({ title: '加载中...' });
    
    util.request(api.CouponList, { status: this.data.activeTab, page: 1, pageSize: 999 }).then(res => {
      if (res.code === 200) {
        const coupons = res.data.map(coupon => {
          coupon.showFullDesc = false;
          return coupon;
        });
        this.setData({
          coupons: coupons
        });
      } else {
        wx.showToast({
          title: res.msg || '加载失败',
          icon: 'none'
        });
      }
      wx.hideLoading();
      this.setData({ loading: false });
      this.getUnusedCount();
    }).catch(err => {
      console.error(err);
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      });
      wx.hideLoading();
      this.setData({ loading: false });
    });
  },

  getUnusedCount: function () {
  },

  setShareCoupon(e) {
    const coupon = e.currentTarget.dataset.coupon;
    this.setData({
      shareCoupon: coupon
    });
  },

  onShareAppMessage: function () {
    let that = this;
    if (that.data.shareCoupon && that.data.shareCoupon.couponUserId)
      return util.getShareCouponConfig(that.data.shareCoupon.couponUserId);
    else
      return util.getShareInviteConfig();
  },

  inflateCoupon: function (e) {
    const couponId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '优惠券膨胀',
      content: '确定要膨胀此优惠券吗？膨胀后金额将随机生成！',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '膨胀中...' });
          util.request(api.CouponInflate, { couponUserId: couponId }, 'POST').then(res => {
            if (res.code === 200) {
              wx.showToast({
                title: '膨胀成功！',
                icon: 'success'
              });
              this.loadCoupons();
            } else {
              wx.showToast({
                title: res.msg || '膨胀失败',
                icon: 'none'
              });
            }
            wx.hideLoading();
          }).catch(err => {
            console.error(err);
            wx.showToast({
              title: '网络错误，请重试',
              icon: 'none'
            });
            wx.hideLoading();
          });
        }
      }
    });
  },

  toc: function (e) {
    const couponUserId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/couponDetail/couponDetail?couponUserId=' + couponUserId
    });
  },

  toggleDescExpand: function (e) {
    const index = e.currentTarget.dataset.index;
    const coupons = this.data.coupons;
    coupons[index].showFullDesc = !coupons[index].showFullDesc;
    this.setData({
      [`coupons[${index}].showFullDesc`]: coupons[index].showFullDesc
    });
  },

  goToCouponCenter: function () {
    wx.navigateTo({
      url: '/pages/couponPackage/couponPackage'
    });
  },

  toggleFloatingBtn: function () {
    const newState = this.data.floatingBtnState === 'expand' ? 'collapse' : 'expand';
    this.setData({
      floatingBtnState: newState
    });
  },

  onUnload: function () {
    if (this.data.scrollTimer) {
      clearTimeout(this.data.scrollTimer);
    }
  }
});
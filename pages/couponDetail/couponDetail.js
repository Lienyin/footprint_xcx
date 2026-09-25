const util = require('../../utils/util.js');
const api = require('../../config/api.js');
Page({
  data: {
    couponId: null,
    coupon: null,
    couponTypeText: '',
    couponTypeClass: '',
    showSuccessPopup: false,
    showFullDesc: false
  },
  onLoad: function (options) {
    if (options.couponUserId) {
      this.setData({
        couponId: options.couponUserId
      });
      this.getCouponDetail(options.couponUserId);
    } else {
      wx.showToast({
        title: '优惠券不存在',
        icon: 'none',
        duration: 2000,
        complete: function () {
          setTimeout(function () {
            wx.navigateBack({
              delta: 1
            });
          }, 2000);
        }
      });
    }
  },
  getCouponDetail: function (id) {
    wx.showLoading({
      title: '加载中...',
    });
    util.request(api.CouponDetail + id, {}, 'POST').then(res => {
      wx.hideLoading();
      if (res.code === 200) {
        const coupon = res.data;
        let typeText = '';
        let typeClass = '';

        switch (coupon.couponType) {
          case 0:
            typeText = '满减券';
            typeClass = '';
            break;
          case 1:
            typeText = '折扣券';
            typeClass = 'discount';
            break;
          case 2:
            typeText = '无门槛券';
            typeClass = 'free';
            break;
          case 3:
            typeText = '膨胀券';
            typeClass = 'inflate';
            break;
          default:
            typeText = '优惠券';
        }

        this.setData({
          coupon: coupon,
          couponTypeText: typeText,
          couponTypeClass: typeClass
        });
      } else {
        wx.showToast({
          title: res.msg || '获取优惠券失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('获取优惠券详情失败:', err);
      wx.hideLoading();
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      });
    });
  },
  closeSuccessPopup: function() {  
    this.setData({  
      showSuccessPopup: false  
    });  
  },  
  claimCoupon: function () {
    wx.showLoading({
      title: '领取中...',
    });

    util.request(api.CouponClaim, { couponUserId: this.data.couponId }, 'POST').then(res => {
      wx.hideLoading();
      if (res.code === 200) {
        this.setData({
          showSuccessPopup: true
        });
      } else {
        wx.showToast({
          title: res.msg || '领取失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      console.error('领取优惠券失败:', err);
      wx.hideLoading();
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      });
    });
  },
  toggleDescExpand: function () {
    this.setData({
      showFullDesc: !this.data.showFullDesc
    });
  },
});
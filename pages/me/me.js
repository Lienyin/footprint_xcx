const util = require('../../utils/util.js');
const api = require('../../config/api.js');
Page({
  data: {
    showBindWx: false,
    balance: {},
    userDetail: {
    },
    couponNum: 0,
    weComTimeout: null
  },
  onLoad: function (options) {
    var that = this;
    wx.showShareMenu({
      withShareTicket: true
    });

  },
  onShow: function () {
    var that = this;
    util.request(api.CouponUsableCount, {
    }).then(function (res) {
      if (res.code === 200) {
        that.setData({
          couponNum: res.data
        })
      }
    }).catch((error) => { });

    util.request(api.UserDetail, {
    }).then(function (res) {
      if (res.code === 200) {
        wx.setStorageSync('userInfo', res.data);
        util.request(api.UserBalance, {
        }).then(function (res) {
          if (res.code === 200) {
            const formattedData = {
              pendingSettlement: parseFloat(res.data.pendingSettlement).toFixed(2),
              settledAmount: parseFloat(res.data.settledAmount).toFixed(2),
              withdrawnAmount: parseFloat(res.data.withdrawnAmount).toFixed(2),
              availableBalance: parseFloat(res.data.availableBalance).toFixed(2)
            };

            that.setData({
              balance: formattedData
            })
          }
        }).catch((error) => { });
        if (res.data.phoneNumber == '' || res.data.phoneNumber == null) {
          wx.setStorageSync('isPhoneNumber', 0);
        } else {
          wx.setStorageSync('isPhoneNumber', 1);
          // 格式化手机号，中间4位用****遮挡
          res.data.formattedPhone = res.data.phoneNumber.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
        }
        that.setData({
          userDetail: res.data
        })
        console.log('userDetail:', JSON.stringify(res.data));
        console.log('phoneNumber:', res.data.phoneNumber);
      }
    }).catch((error) => { });
  },
  toSet: function (e) {
    wx.navigateTo({
      url: "/pages/set/set",
    })
  },
  goTxjl: function (e) {
    wx.navigateTo({
      url: "/pages/withdLog/withdLog",
    })
  },
  toWithd: function (e) {
    wx.navigateTo({
      url: "/pages/withd/withd",
    })
  },
  toReferralLog: function (e) {
    wx.navigateTo({
      url: '/pages/referralLog/referralLog?filter=pending'
    });
  },
  onShareAppMessage: function () {
    return util.getShareInviteConfig();
  },

  toRules: function (e) {
    wx.navigateTo({
      url: "/pages/inviteRules/inviteRules",
    })
  },
  toOrders: function (e) {
    wx.navigateTo({
      url: "/pages/order/order",
    })
  },
  toUsers: function (e) {
    wx.navigateTo({
      url: "/pages/user/user",
    })
  },
  toTech: function (e) {
    wx.navigateTo({
      url: "/pages/tech/tech",
    })
  },
  toCoupons: function (e) {
    wx.navigateTo({
      url: "/pages/coupon/coupon",
    })
  },
  toActivity: function (e) {
    wx.navigateTo({
      url: '/pages/activity-list/activity-list',
    })
  },
  toInvitaionActivity: function (e) {
    wx.navigateTo({
      url: '/pages/referral/referral',
    })
  },
  toBalanceDetail: function (e) {
    wx.navigateTo({
      url: '/pages/balance/balance',
    })
  },
  formatPhone: function (phone) {
    if (!phone) return '';
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  },
  showWechatQRCode: function () {
    wx.previewImage({
      current: 'https://www.lianzhenkj.com/img/qrcode_wxgzh.png',
      urls: ['https://www.lianzhenkj.com/img/qrcode_wxgzh.png']
    });
  },
  showTechQRCode: function (e) {
    var that = this;
    util.request(api.UserQrcode, {
    }).then(function (res) {
      if (res.code === 200 && res.data.qrcode) {
        wx.previewImage({
          urls: [res.data.qrcode]
        });
      } else if (res.code === 400) {
        wx.showModal({
          title: '提示',
          content: '未设置技师编号，是否前往设置？',
          success(result) {
            if (result.confirm) {
              wx.navigateTo({
                url: "/pages/set/set",
              });
            }
          }
        });
      } else {
        util.showErrorToast(res.msg);
      }
    }).catch((error) => {
      util.showErrorToast('获取二维码失败，请重试');
    });
  },

  onChooseAvatar(e) {
    var that = this;
    const { avatarUrl } = e.detail

    wx.getFileSystemManager().readFile({
      filePath: avatarUrl, //选择图片返回的相对路径
      encoding: 'base64', //编码格式
      success: res => {
        util.request(api.UserUpdate, {
          avatar: res.data
        }).then(function (res) {
          if (res.code === 200) {
            util.showSuccessToast('头像修改成功')
            that.data.userDetail.avatar = avatarUrl
            that.setData({
              userDetail: that.data.userDetail
            })
          }
        }).catch((error) => {
          util.showErrorToast('头像修改失败')
        });
      },
      fail: res => {
        util.showErrorToast('头像修改失败')
      }
    })

  },
  stopPropagation(e) {
  },
  showQiWeiQRCode: function () {

    wx.navigateTo({
      url: '/pages/weCom/weCom',
    })
  },
  closeQiWeiModal: function () {
    this.setData({
      showQiWeiModal: false
    });
  },
  startmessage: function (e) {
    console.log('开始添加企业微信联系人', e);
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    // 设置超时处理，5秒后自动跳转到二维码页面
    var that = this;
    this.data.weComTimeout = setTimeout(function () {
      console.log('企业微信插件超时，跳转到二维码页面');
      wx.hideLoading();
      wx.navigateTo({
        url: '/pages/weCom/weCom'
      });
    }, 5000);
  },
  completemessage: function (e) {
    console.log('完成添加企业微信联系人', e);
    // 清除超时定时器
    if (this.data.weComTimeout) {
      clearTimeout(this.data.weComTimeout);
      this.data.weComTimeout = null;
    }
    wx.hideLoading();
    if (e.detail && e.detail.errcode === 0) {
      wx.showToast({
        title: '添加成功',
        icon: 'success'
      });
    } else if (e.detail && e.detail.errcode === -3006) {
      console.log('已是好友关系', e.detail);
    } else if (e.detail && e.detail.errcode) {
      console.error('添加失败，错误码:', e.detail.errcode);
      wx.navigateTo({
        url: '/pages/weCom/weCom'
      });
    }
  },
  preventTap: function () { },
})
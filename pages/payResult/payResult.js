var util = require('../../utils/util.js');
var api = require('../../config/api.js');

var app = getApp();
Page({
  data: {
    status: 0,
    orderId: 0,
    is_over: 0,
    price: 0,
    productId: 0,
    imageUrl: '',
    activity: {}
  },
  onLoad: function (options) {
    var that = this;
    that.setData({
      orderId: options.orderId,
      price: options.price,
      status: options.status
    })
    
    util.request(api.ActivityWxApp, {
    }).then(function (res) {
      if (res.code === 200 && res.data != null) {
        that.setData({
          activity: res.data,
        });
      }
    }).catch((error) => { });
  },
  toOrderListPage: function (event) {
    wx.redirectTo({
      url: '/pages/order/order',
      success(res) {
      },
      fail(err) {
      }
    });
  },
  toIndex: function () {
    wx.redirectTo({
      url: '/pages/home/home',
    });
  },
  onShareAppMessage: function () {
    let that = this;
    if (that.data.status == 1) {
      return util.getShareInviteConfig();
    } else {
      return util.getShareConfig(that.data.orderId, null);
    }
  },
  goToOfficialAccount: function () {
    var that = this;
    const articleUrl = 'https://mp.weixin.qq.com/s/' + that.data.activity.articleId;
    wx.navigateTo({
      url: '/pages/webview/webview?url=' + encodeURIComponent(articleUrl),
      fail: function (err) {
        console.error('跳转失败', err);
        wx.setClipboardData({
          data: articleUrl,
          success: function () {
            wx.showToast({
              title: '链接已复制，请在微信中打开',
              icon: 'none'
            });
          }
        });
      }
    });
  },
  saveQrcode: function() {
    wx.showLoading({
      title: '保存中...',
    });
    
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.writePhotosAlbum']) {
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: () => {
              this.downloadAndSaveImage();
            },
            fail: () => {
              wx.hideLoading();
              wx.showModal({
                title: '提示',
                content: '需要您授权保存图片到相册',
                showCancel: false,
                success: (res) => {
                  if (res.confirm) {
                    wx.openSetting();
                  }
                }
              });
            }
          });
        } else {
          this.downloadAndSaveImage();
        }
      }
    });
  },
  downloadAndSaveImage: function() {
    wx.downloadFile({
      url: 'https://www.lianzhenkj.com/img/qywx.png',
      success: (res) => {
        if (res.statusCode === 200) {
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.hideLoading();
              wx.showToast({
                title: '已保存到相册',
                icon: 'success',
                duration: 2000
              });
            },
            fail: () => {
              wx.hideLoading();
              wx.showToast({
                title: '保存失败',
                icon: 'none',
                duration: 2000
              });
            }
          });
        } else {
          wx.hideLoading();
          wx.showToast({
            title: '图片下载失败',
            icon: 'none',
            duration: 2000
          });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({
          title: '图片下载失败',
          icon: 'none',
          duration: 2000
        });
      }
    });
  }
})
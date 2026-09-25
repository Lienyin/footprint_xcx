const util = require('../../utils/util.js');
const api = require('../../config/api.js');
const app = getApp()

Page({
  data: {
    package: {},
    packageId: 0,
    galleryImages: []
  },
  onLoad: function (options) {
    let packageId = decodeURIComponent(options.packageId)
    let that = this;
    that.setData({
      packageId: packageId
    });
    util.request(api.PackageDetail + packageId, {
    }).then(function (res) {
      if (res.code === 200) {
        let savePrice = Number(res.data.originalPrice - res.data.price).toFixed(2);
        const urlArray = res.data.detailImg.split(',');
        const formattedArray = urlArray.map(url => {
          return { "imageUrl": url.trim() }; // trim()用于去除可能存在的空格  
        });
        that.setData({
          package: res.data,
          savePrice: savePrice,
          galleryImages: formattedArray
        });
      }
    }).catch((error) => { });
  },
  onShareAppMessage: function () {
    let that = this;
    return util.getShareConfig(null, that.data.packageId);
  },
  onShow: function () { },
  goHome: function () {
    wx.navigateBack({  
      delta: 1,  // 返回上一页  
      success: function() {  
        console.log('返回成功');  
      },  
      fail: function(error) {  
        console.log('返回失败，尝试reLaunch', error);  
        wx.reLaunch({  
          url: '/pages/home/home',  
          fail: function(reLaunchError) {  
            console.error('reLaunch也失败了', reLaunchError);  
          }  
        });  
      }  
    });
  },
  addCart: function () {
    let that = this;
    that.updateCartApi(that.data.packageId, 1)
  },
  updateCartApi(id, count) {
    let that = this;
    wx.showLoading({
      title: '',
      mask: true
    })
    util.request(api.CartAddByPid, {
      num: count,
      packageId: id
    }, 'POST').then(function (res) {
      wx.hideLoading()
      if (res.code === 200) {
        that.goHome()
      }
    });
  },
   goToOrder: function (e) {
    const selectedData = [{
      coverImg: this.data.package.coverImg,
      originalPrice: this.data.package.originalPrice,
      price: this.data.package.price,
      storeId: this.data.package.storeId,
      packageId: this.data.package.packageId,
      num: 1
    }];
    const data = encodeURIComponent(JSON.stringify(selectedData));
    wx.navigateTo({
      url: '/pages/orderCheck/check?isNotCart=1&data=' + data
    });
  },
});
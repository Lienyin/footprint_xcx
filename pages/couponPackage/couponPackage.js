
const util = require('../../utils/util.js');
const api = require('../../config/api.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.receiveNewMemberCoupon();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },
  receiveNewMemberCoupon: function () {
    util.request(api.ReceiveNewMemberCoupon, {}, 'POST')
      .then(res => {
        if (res.code != 200) {
          util.showErrorToast(res.msg)
        }
      })
      .catch(error => {
        console.error('领券接口错误：', error);
        this.showErrorToast('网络错误，请稍后重试');
      })
      .finally(() => {
        this.setData({ isLoading: false });
      });
  },
  goToHome: function () {
    wx.switchTab({
      url: '/pages/store/store',
      fail: err => {
        console.error('跳转到店铺选择页失败:', err);
        this.showErrorToast('页面跳转失败');
      }
    });
  },
  onShareAppMessage: function () {
    return util.getShareInviteConfig();
  },
})
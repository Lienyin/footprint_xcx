const util = require('../../utils/util.js');
const api = require('../../config/api.js');
const app = getApp()

Page({
  data: {
    rules:[]
  },
  onLoad: function (options) {
    var that = this;
    wx.showShareMenu({
      withShareTicket: true
    });
    util.request(api.ActivityInviteRules, {
    }).then(function (res) {
      if (res.code === 200&&res.data!=null) {
        that.setData({
          rules: res.data,
        });
      }
    }).catch((error) => { });
  },
  onShareAppMessage: function () {
    return util.getShareInviteConfig();
  },
  onShow: function () {
    var that = this;
  },
})
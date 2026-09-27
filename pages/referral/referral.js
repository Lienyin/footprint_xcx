
const util = require('../../utils/util.js');
const api = require('../../config/api.js');

Page({
  data: {
    totalCommission: '0.00',
    customerCount: 0,
    availableAmount: '0.00'
  },

  onLoad() {
    this.loadBalanceData();
  },

  onPullDownRefresh() {
    this.loadBalanceData().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  loadBalanceData() {
    return util.request(api.UserBalance, {}).then((res) => {
      if (res.code === 200) {
        const data = res.data;
        // 累计佣金 = 已提现金额 + 可提现金额
        const totalCommission = (parseFloat(data.withdrawnAmount || 0) + parseFloat(data.availableBalance || 0)).toFixed(2);
        const customerCount = data.totalAllTimeCount || 0;
        const availableAmount = parseFloat(data.availableBalance || 0).toFixed(2);

        this.setData({
          totalCommission,
          customerCount,
          availableAmount
        });
      }
    }).catch((error) => {
      console.error('加载余额数据失败', error);
    });
  },

  showPromoCode() {
    util.request(api.UserQrcode, {}).then((res) => {
      if (res.code === 200 && res.data.qrcode) {
        wx.previewImage({
          urls: [res.data.qrcode]
        });
      } else if (res.code === 400) {
        wx.showModal({
          title: '提示',
          content: '未设置推广编号，是否前往设置？',
          success(result) {
            if (result.confirm) {
              wx.navigateTo({
                url: '/pages/set/set'
              });
            }
          }
        });
      } else {
        wx.showToast({
          title: res.msg || '获取二维码失败',
          icon: 'none'
        });
      }
    }).catch((error) => {
      console.error('获取二维码失败', error);
      wx.showToast({
        title: '获取二维码失败，请重试',
        icon: 'none'
      });
    });
  },

  onShareAppMessage() {
    return util.getShareInviteConfig();
  }
});

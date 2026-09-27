const util = require('../../utils/util.js');
const api = require('../../config/api.js');
const app = getApp()

Page({
  data: {
    accountDetail: {},
    moneyVal: "",
    isDisabel: false,
    bigMoney: 200, // 最大提现金额200元
    smallMoney: 0.01 // 最小提现金额0.01元
  },
  onLoad: function (options) {
    var that = this;
  },
  onShow: function () {
    var that = this;
    util.request(api.UserBalanceDetail, {
    }).then(function (res) {
      if (res.code === 200) {
        that.setData({
          accountDetail: res.data
        })
      }
    }).catch((error) => { });
  },
  inputChange: function(e) {
    var that = this;
    let value = e.detail.value;
    if (value && /^\d+(?:\.\d{0,2})?$/.test(value)) {
      let amount = parseFloat(value);
      if (amount > that.data.bigMoney) {
        that.setData({
          moneyVal: that.data.bigMoney.toString()
        });
      }
    }
  },
  allTx: function () {
    var that = this;
    if (that.data.accountDetail.balance > that.data.bigMoney) {
      that.setData({
        moneyVal: that.data.bigMoney
      })
    } else {
      that.setData({
        moneyVal: that.data.accountDetail.balance
      })
    }
  },
  goWithd: function () {
    var that = this;
    if (that.data.moneyVal) {
      if (/^\d+(?:\.\d{0,2})?$/.exec(that.data.moneyVal)) {
        if (that.data.moneyVal > that.data.bigMoney) {
          that.setData({
            moneyVal: that.data.bigMoney
          });
          that.processWithdraw();
        }
        else {
          if (that.data.moneyVal < that.data.smallMoney) {
            util.showErrorToast("最低提现" + that.data.smallMoney + "元")
          } else {
            that.processWithdraw();
          }
        }
      } else {
        util.showErrorToast('仅可输入含小数点数字，至多2位小数')
      }
    } else {
      util.showErrorToast('请输入提现金额')
    };
  },
  processWithdraw: function() {
    var that = this;
    if (that.data.accountDetail.balance < that.data.moneyVal) {
      util.showErrorToast("提现金额不可大于可提现金额")
    } else if (!that.data.isDisabel) {
      that.setData({
        isDisabel: true
      })
      util.request(api.UserWithdraw, {
        amount: that.data.moneyVal
      }).then(function (res) {
        that.setData({
          isDisabel: false
        })
        if (res.code === 200) {
          if (wx.canIUse('requestMerchantTransfer')) {
            wx.requestMerchantTransfer({
              mchId: res.data.merchantId,
              appId: wx.getAccountInfoSync().miniProgram.appId,
              package: res.data.packageInfo,
              success: (res) => {
                console.log('success:', res);
              },
              fail: (res) => {
                console.log('fail:', res);
              },
            });
          } else {
            wx.showModal({
              content: '你的微信版本过低，请更新至最新版本。',
              showCancel: false,
            });
          }
        } else {
          util.showErrorToast(res.msg)
        }
      }).catch((error) => {
        util.showErrorToast(error.msg)
        that.setData({
          isDisabel: false
        })
      });
    }
  },
  goToWithdLog() {
    wx.navigateTo({
      url: '/pages/withdLog/withdLog'
    })
  },
  goToWithdRules() {
    wx.navigateTo({
      url: '/pages/withdRules/withdRules'
    })
  }
})
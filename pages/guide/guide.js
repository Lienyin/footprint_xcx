Page({
  data: {
    current: 0,
    guideImages: [
      'https://www.lianzhenkj.com/img/guide1.png',
      'https://www.lianzhenkj.com/img/guide2.png',
      'https://www.lianzhenkj.com/img/guide3.png',
      'https://www.lianzhenkj.com/img/guide4.png',
      'https://www.lianzhenkj.com/img/guide5.png',
      'https://www.lianzhenkj.com/img/guide6.png'
    ],
    guideSteps: [
      {
        title: '第 1 步:授权位置',
        content: '首次进入小程序，点击「允许」获取位置信息，首页会默认展示离您最近的店铺。'
      },
      {
        title: '第 2 步:选择新艺烫染名店',
        content: '授权后，「推荐门店」会按距离展示附近合作店。以新艺烫染名店为例，点击门店即可查看套餐并下单。'
      },
      {
        title: '第 3 步:填写房间号',
        content: '到店消费的客户一定要填写房间号，方便商家核对订单，这一步非常重要。'
      },
      {
        title: '第 4 步:授权手机号',
        content: '支付前需要授权手机号，仅用于订单核实和异常处理，平台不会泄露您的信息。'
      },
      {
        title: '第 5 步:等待商家确认',
        content: '支付成功后，耐心等待商家确认即可。您不需要自己去核销，系统会自动完成整个流程。'
      },
      {
        title: '第 6 步:确认后可直接离店',
        content: '商家确认后订单已完成结算，您可以直接离店。若长时间未确认，请点击联系在线客服。'
      }
    ]
  },

  onSwiperChange(e) {
    this.setData({
      current: e.detail.current
    });
  },

  nextStep() {
    if (this.data.current < this.data.guideSteps.length - 1) {
      this.setData({
        current: this.data.current + 1
      });
    }
  },

  finishGuide() {
    wx.setStorageSync('hasSeenGuide', true);
    wx.reLaunch({
      url: '/pages/login/login'
    });
  }
});

App({
  onLaunch: function () {
    // 检查是否已看过引导页
    const hasSeenGuide = wx.getStorageSync('hasSeenGuide');
    if (!hasSeenGuide) {
      // 第一次进入，显示引导页
      wx.reLaunch({
        url: '/pages/guide/guide'
      });
    } else {
      // 已看过引导页，正常进入首页
      wx.reLaunch({
        url: '/pages/login/login'
      });
    }
  }
})

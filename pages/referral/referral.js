
const util = require('../../utils/util.js');
const api = require('../../config/api.js');

Page({
  data: {
    stats: {
      invited: 0,           // 累计邀请数 (totalAllTimeCount)
      pending: '0',         // 待结算金额 (pendingSettlement)
      received: '0',        // 已结算金额 (settledAmount)
      shareCount: 0         // 分享人数 (newUserCount)
    },
    bgHeight: 0,
    reportMarginTop: 20,
    statsLoaded: false,
    loadingError: false
  },

  onLoad() {
    this.calculateBgHeight();
    this.fetchUserStats();
  },

  /**
   * 计算背景图实际高度（适配屏幕宽度）
   */
  calculateBgHeight: function() {
    const sysInfo = wx.getSystemInfoSync();
    const screenWidth = sysInfo.windowWidth;
    const designWidth = 1500;
    const designBgHeight = 1573;
    const bgHeight = screenWidth * (designBgHeight / designWidth);
    
    this.setData({ bgHeight });
  },

  /**
   * 获取用户统计数据
   */
  fetchUserStats: function() {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });

    util.request(api.UserBalance).then(res => {
      wx.hideLoading();
      
      if (res.code === 200 && res.data) {
        this.updateStats(res.data);
      } else {
        wx.showToast({
          title: res.msg || '获取数据失败',
          icon: 'none'
        });
        this.setData({ loadingError: true });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('获取统计数据失败', err);
      wx.showToast({
        title: '获取数据失败，请重试',
        icon: 'none'
      });
      this.setData({ loadingError: true });
    });
  },

  /**
   * 更新统计数据映射
   */
  updateStats: function(data) {
    const stats = {
      invited: data.totalAllTimeCount || 0,          // 累计邀请数
      pending: (data.pendingSettlement || 0).toFixed(2),  // 待结算金额，保留两位小数
      received: (data.availableBalance+data.pendingSettlement || 0).toFixed(2),     // 已结算金额，保留两位小数
      shareCount: data.newUserCount || 0             // 分享人数
    };

    this.setData({
      stats: stats,
      statsLoaded: true,
      loadingError: false
    });
  },
  onShareAppMessage: function () {
    return util.getShareInviteConfig();
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh: function() {
    this.fetchUserStats().then(() => {
      wx.stopPullDownRefresh();
    }).catch(() => {
      wx.stopPullDownRefresh();
    });
  }
});
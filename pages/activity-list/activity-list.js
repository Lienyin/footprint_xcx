const util = require('../../utils/util.js');
const api = require('../../config/api.js');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    activities: [],
    currentShareId: '' // 当前要分享的活动ID
  },

  /**
   * 前往活动详情或链接
   */
  goToDetail: function(e) {
    const id = e.currentTarget.dataset.id;
    const activity = this.data.activities.find(item => item.bannerId === id);
    
    if (!activity) return;

    switch (activity.linkType) {
      case 4: // 外部链接(公众号文章)

        wx.navigateTo({
          url: `/pages/webview/webview?url=${encodeURIComponent(activity.linkValue)}`
        });
        break;
      
      case 5: // 小程序内部页面
        wx.navigateTo({
          url: activity.linkValue
        });
        break;
      default:
        break;
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {
    return util.getShareInviteConfig();
  },

  /**
   * 获取活动状态
   */
  getActivityStatus: function(activity) {
    const now = new Date().getTime();

    if (!activity.startTime && !activity.endTime) {
      return 'ongoing';
    }

    if (activity.startTime && now < activity.startTime) {
      return 'upcoming';
    }

    if (activity.endTime && now > activity.endTime) {
      return 'ended';
    }

    return 'ongoing';
  },

  /**
   * 格式化日期
   */
  formatDate: function(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.loadActivities();
  },

  /**
   * 从服务器加载活动数据
   */
  loadActivities: function() {
    wx.showLoading({
      title: '加载中...'
    });

    let that = this;
    util.request(api.ActivityList, {}).then(function(res) {
      if (res.code === 200 && res.data) {

        const activities = res.data.map(item => {

          const status = that.getActivityStatus(item);

          const startDate = that.formatDate(item.startTime);
          const endDate = that.formatDate(item.endTime);
          
          return {
            ...item,
            status: status,
            startDate: startDate || '长期',
            endDate: endDate || '有效'
          };
        });
        
        that.setData({
          activities: activities
        });
      } else {
        wx.showToast({
          title: res.msg || '获取活动失败',
          icon: 'none'
        });
      }
      wx.hideLoading();
    }).catch(function(error) {
      console.error('获取活动信息失败', error);
      wx.hideLoading();
      wx.showToast({
        title: '网络异常，请稍后重试',
        icon: 'none'
      });
    });
  },
  
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {
    this.loadActivities();
    wx.stopPullDownRefresh();
  }
})
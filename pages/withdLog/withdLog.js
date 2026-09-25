const util = require('../../utils/util.js');
const api = require('../../config/api.js');
const app = getApp()

Page({
  data: {
    listStatus: [
      { name: "全部", type: "-1" },
      { name: "打款中", type: "0" },
      { name: "提现成功", type: "1" },
      { name: "提现失败", type: "2" },
    ],
    current: 0, // 默认选择第一项
    log: [],
    pageSize: 20,
    page: 1,
    loadStatus: "loading",
    isLoading: false, // 防止重复加载
  },
  
  onLoad: function (options) {
    this.getWithdList();
  },
  onPullDownRefresh: function() {
    console.log('下拉刷新');
    this.setData({
      page: 1,
      log: []
    });
    this.getWithdList().then(() => {
      wx.stopPullDownRefresh();
    });
  },
  onReachBottom: function () {
    console.log('上拉加载更多');
    if (this.data.loadStatus !== 'noMore' && !this.data.isLoading) {
      this.setData({
        page: this.data.page + 1
      });
      this.getWithdList();
    }
  },
  changeStatus: function (e) {
    const index = e.currentTarget.dataset.index;
    const type = e.currentTarget.dataset.type;
    
    console.log('切换标签:', index, type);
    
    if (this.data.current === index) {
      return; // 防止重复点击
    }
    
    this.setData({
      page: 1,
      log: [],
      current: index
    });
    this.getWithdList();
  },
  getWithdList: function () {
    if (this.data.isLoading) {
      return Promise.resolve();
    }
    
    const that = this;
    that.setData({
      loadStatus: "loading",
      isLoading: true
    });
    const currentStatus = that.data.listStatus[that.data.current].type;
    
    console.log('加载提现列表, 页码:', that.data.page, '状态:', currentStatus);
    
    return new Promise((resolve, reject) => {
      util.request(api.UserWithdrawList, {
        status: currentStatus,
        pageSize: that.data.pageSize,
        page: that.data.page,
      }).then(function (res) {
        let loadStatus = "loadmore";
        
        if (res.code === 200) {
          if (res.data && res.data.length > 0) {
            if (res.data.length < that.data.pageSize) {
              loadStatus = "noMore";
              console.log('没有更多数据了');
            } else {
              console.log('加载成功，还有更多数据');
            }
            
            that.setData({
              log: that.data.page === 1 ? res.data : that.data.log.concat(res.data),
              loadStatus: loadStatus,
              isLoading: false
            });
          } else {
            console.log('没有数据');
            that.setData({
              loadStatus: "noMore",
              isLoading: false
            });
          }
        } else {
          console.error('接口返回错误:', res);
          wx.showToast({
            title: res.msg || '加载失败',
            icon: 'none'
          });
          that.setData({
            loadStatus: "noMore",
            isLoading: false
          });
        }
        resolve();
      }).catch((error) => {
        console.error('网络请求失败:', error);
        wx.showToast({
          title: '网络异常，请稍后再试',
          icon: 'none'
        });
        that.setData({
          loadStatus: "noMore",
          isLoading: false
        });
        reject(error);
      });
    });
  }
});
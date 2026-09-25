
const util = require('../../utils/util.js');
const api = require('../../config/api.js');

Page({
  data: {
    records: [], // 余额记录列表
    totalBalance: '0.00', // 总余额
    pageNum: 1, // 当前页码
    pageSize: 10, // 每页数量
    isLoading: false, // 是否正在加载
    hasMore: true // 是否有更多数据
  },

  onLoad() {
    this.getUserBalance();
    this.getBalanceLogs();
  },
  getUserBalance() {
    util.request(api.UserBalance, {}).then((res) => {
      if (res.code === 200) {
        const formattedBalance = parseFloat(res.data.availableBalance).toFixed(2);
        this.setData({
          totalBalance: formattedBalance
        });
      }
    }).catch((error) => {
    });
  },
  getBalanceLogs(isLoadMore = false) {
    if (this.data.isLoading) return;

    this.setData({
      isLoading: true
    });

    let params = {
      pageNum: this.data.pageNum,
      pageSize: this.data.pageSize
    };

    util.request(api.BalanceLogList, params).then((res) => {
      if (res.code === 200) {
        const newRecords = res.data.records || [];
        newRecords.forEach(record => {
          if (record.createTime && typeof record.createTime === 'number') {
            record.createTime = this.formatTime(record.createTime);
          }
        });
        
        this.setData({
          records: isLoadMore ? [...this.data.records, ...newRecords] : newRecords,
          hasMore: newRecords.length === this.data.pageSize
        });
      } else {
        util.showErrorToast(res.msg || '加载余额记录失败');
      }
    }).catch((error) => {
      util.showErrorToast('获取余额记录失败');
    }).finally(() => {
      this.setData({
        isLoading: false
      });
      wx.stopPullDownRefresh();
    });
  },
  loadMore() {
    if (!this.data.hasMore || this.data.isLoading) return;
    
    this.setData({
      pageNum: this.data.pageNum + 1
    });
    
    this.getBalanceLogs(true);
  },
  onPullDownRefresh() {
    this.setData({
      pageNum: 1,
      records: [],
      hasMore: true
    });
    
    this.getUserBalance();
    this.getBalanceLogs();
  },
  onReachBottom() {
    this.loadMore();
  },
  formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },
  onShareAppMessage() {
    return util.getShareInviteConfig();
  }
});
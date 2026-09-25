
const util = require('../../utils/util.js');
const api = require('../../config/api.js');

Page({
  data: {
    records: [], // 拉新记录列表
    pageNum: 1, // 当前页码
    pageSize: 10, // 每页数量
    isLoading: false, // 是否正在加载
    hasMore: true, // 是否有更多数据
    isNewUser: null,
    isOrdered: null,
    rewardStatus: null,
    isFilterExpanded: false,
    tempFilters: {
      isNewUser: null,
      isOrdered: null,
      rewardStatus: null
    }
  },

  onLoad(options) {
    if (options) {
      if (options.isNewUser !== undefined) {
        this.setData({ isNewUser: parseInt(options.isNewUser) });
      }
      
      if (options.isOrdered !== undefined) {
        this.setData({ isOrdered: parseInt(options.isOrdered) });
      }
      
      if (options.rewardStatus !== undefined) {
        this.setData({ rewardStatus: parseInt(options.rewardStatus) });
      }
      if (options.filter) {
        switch (options.filter) {
          case 'newUser':
            this.setData({ isNewUser: 1 });
            break;
          case 'ordered':
            this.setData({ isNewUser: 1, isOrdered: 1 });
            break;
          case 'pending':
            this.setData({ isNewUser: 1, isOrdered: 1, rewardStatus: 0 });
            break;
          case 'settled':
            this.setData({ isNewUser: 1, isOrdered: 1, rewardStatus: 1 });
            break;
        }
      }
      this.syncTempFilters();
    }
    this.getReferralList();
  },
  getFilterCount() {
    let count = 0;
    if (this.data.isNewUser !== null) count++;
    if (this.data.isOrdered !== null) count++;
    if (this.data.rewardStatus !== null) count++;
    return count;
  },
  syncTempFilters() {
    this.setData({
      'tempFilters.isNewUser': this.data.isNewUser,
      'tempFilters.isOrdered': this.data.isOrdered,
      'tempFilters.rewardStatus': this.data.rewardStatus
    });
  },
  toggleFilterPanel() {
    if (!this.data.isFilterExpanded) {
      this.syncTempFilters();
    }
    
    this.setData({
      isFilterExpanded: !this.data.isFilterExpanded
    });
  },
  applyFilters() {
    this.setData({
      isFilterExpanded: false,
      isNewUser: this.data.tempFilters.isNewUser,
      isOrdered: this.data.tempFilters.isOrdered,
      rewardStatus: this.data.tempFilters.rewardStatus,
      pageNum: 1,
      records: [],
      hasMore: true
    });
    
    this.getReferralList();
  },
  toggleNewUserFilter() {
    this.setData({
      'tempFilters.isNewUser': this.data.tempFilters.isNewUser === 1 ? null : 1
    });
  },
  
  toggleOrderedFilter() {
    const newIsOrdered = this.data.tempFilters.isOrdered === 1 ? null : 1;
    const newRewardStatus = newIsOrdered === 1 ? 
      this.data.tempFilters.rewardStatus : 
      null;
    
    this.setData({
      'tempFilters.isOrdered': newIsOrdered,
      'tempFilters.rewardStatus': newRewardStatus
    });
  },
  
  toggleNotOrderedFilter() {
    const newIsOrdered = this.data.tempFilters.isOrdered === 0 ? null : 0;
    this.setData({
      'tempFilters.isOrdered': newIsOrdered,
      'tempFilters.rewardStatus': null
    });
  },
  
  togglePendingFilter() {
    const newRewardStatus = this.data.tempFilters.rewardStatus === 0 ? null : 0;
    
    this.setData({
      'tempFilters.rewardStatus': newRewardStatus,
      'tempFilters.isOrdered': newRewardStatus === null ? this.data.tempFilters.isOrdered : 1
    });
  },
  
  toggleSettledFilter() {
    const newRewardStatus = this.data.tempFilters.rewardStatus === 1 ? null : 1;
    
    this.setData({
      'tempFilters.rewardStatus': newRewardStatus,
      'tempFilters.isOrdered': newRewardStatus === null ? this.data.tempFilters.isOrdered : 1
    });
  },
  
  toggleFailedFilter() {
    const newRewardStatus = this.data.tempFilters.rewardStatus === 2 ? null : 2;
    
    this.setData({
      'tempFilters.rewardStatus': newRewardStatus,
      'tempFilters.isOrdered': newRewardStatus === null ? this.data.tempFilters.isOrdered : 1
    });
  },
  clearAllFilters() {
    this.setData({
      isFilterExpanded: false,
      isNewUser: null,
      isOrdered: null,
      rewardStatus: null,
      'tempFilters.isNewUser': null,
      'tempFilters.isOrdered': null,
      'tempFilters.rewardStatus': null,
      pageNum: 1,
      records: [],
      hasMore: true
    });
    
    this.getReferralList();
  },
  getReferralList(isLoadMore = false) {
    if (this.data.isLoading) return;

    this.setData({
      isLoading: true
    });

    let params = {
      pageNum: this.data.pageNum,
      pageSize: this.data.pageSize,
      isNewUser: this.data.isNewUser,
      isOrdered: this.data.isOrdered,
      rewardStatus: this.data.rewardStatus
    };

    util.request(api.ReferralList, params).then((res) => {
      if (res.code === 200) {
        const newRecords = res.data || [];
        
        this.setData({
          records: isLoadMore ? [...this.data.records, ...newRecords] : newRecords,
          hasMore: newRecords.length === this.data.pageSize
        });
      } else {
        util.showErrorToast(res.msg || '加载拉新记录失败');
      }
    }).catch((error) => {
    }).finally(() => {
      this.setData({
        isLoading: false
      });
      wx.stopPullDownRefresh();
    });
  },
  formatRewardTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },
  getEmptyTipText() {
    let tipText = '';
    
    if (this.data.isNewUser === 1) {
      tipText += '新客';
    } else if (this.data.isNewUser === 0) {
      tipText += '非新客';
    }
    
    if (this.data.isOrdered === 1) {
      tipText += '已下单';
    } else if (this.data.isOrdered === 0) {
      tipText += '未下单';
    }
    
    if (this.data.isOrdered === 1) { // 只有已下单才考虑奖励状态
      if (this.data.rewardStatus === 0) {
        tipText += '待结算';
      } else if (this.data.rewardStatus === 1) {
        tipText += '已结算';
      } else if (this.data.rewardStatus === 2) {
        tipText += '不符合条件';
      }
    }
    
    return tipText;
  },
  loadMore() {
    if (!this.data.hasMore || this.data.isLoading) return;
    
    this.setData({
      pageNum: this.data.pageNum + 1
    });
    
    this.getReferralList(true);
  },
  onPullDownRefresh() {
    this.setData({
      pageNum: 1,
      records: [],
      hasMore: true
    });
    
    this.getReferralList();
  },
  onReachBottom() {
    this.loadMore();
  },
  onShareAppMessage() {
    return util.getShareInviteConfig();
  },
clearTempFilters() {
  this.setData({
    'tempFilters.isNewUser': null,
    'tempFilters.isOrdered': null,
    'tempFilters.rewardStatus': null
  });
},
});
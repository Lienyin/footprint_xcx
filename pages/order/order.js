const util = require('../../utils/util.js');
const api = require('../../config/api.js');
const app = getApp()

Page({
  data: {
    current: 0,
    identityFlag: 0,
    bind_wxid: true,
    showTips: true,
    columnsPlat: [
      [{
        name: "全门店",
        id: "-1"
      }]
    ],
    columnsType: [
      [{
          name: "全部",
          id: "-1"
        },
        {
          name: "待付款",
          id: "0"
        },
        {
          name: "待确认",
          id: "1"
        },
        {
          name: "确认完成",
          id: "2"
        },
        {
          name: "售后中",
          id: "3"
        },
        {
          name: "已退款",
          id: "4"
        },
      ]
    ],
    list: [],
    loadStatus: "loading",
    showLoading: false,
    showCate: false,
    searchForm: {
      platName: "全门店",
      platValue: "-1",
      platIndex: 0, // 新增：用于picker的value
      statusName: "订单状态",
      statusValue: "-1",
      statusIndex: 0, // 新增：用于picker的value
      time: "选择时间",
      order_main: "",
      page: 1,
      pageSize: 20
    },
    startX: 0,
    startY: 0
  },
  onLoad: function (options) {
    var that = this;
    util.request(api.StoreList, {  
    }).then(function (res) {  
      if (res.code === 200) {  
        if (res.data && Array.isArray(res.data)) {  
          const formattedStores = res.data.map(store => ({  
            id: store.storeId,   
            name: store.storeName  
          }));  
          const columnsFormat = [formattedStores];  
          that.setData({  
            columnsPlat: columnsFormat  
          });  
        }
      } 
    }).catch((error) => {  
    });
  },
  onShow: function () {
    var that = this;
    let userInfo = wx.getStorageSync('userInfo')
    that.setData({
      identityFlag: userInfo.identityFlag,
      list: []
    })
    that.getOrderList();
  },
  onPlatChange: function (e) {
    const index = e.detail.value;
    this.setData({
      'searchForm.platIndex': index,
      'searchForm.platValue': this.data.columnsPlat[0][index].id,
      'searchForm.platName': this.data.columnsPlat[0][index].name,
      'searchForm.page': 1,
      list: []
    });
    this.getOrderList();
  },
  onStatusChange: function (e) {
    const index = e.detail.value;
    this.setData({
      'searchForm.statusIndex': index,
      'searchForm.statusValue': this.data.columnsType[0][index].id,
      'searchForm.statusName': this.data.columnsType[0][index].name,
      'searchForm.page': 1,
      list: []
    });
    this.getOrderList();
  },
  onReachBottom: function () {
    let that = this;
    if (that.data.loadStatus == 'noMore') {
      return;
    } else {
      that.data.searchForm.page = that.data.searchForm.page + 1;
      that.setData({
        searchForm: that.data.searchForm
      });
      that.getOrderList();
    }
  },
  getOrderList() {
    let that = this;
    that.setData({
      showCate: true,
      showLoading: true,
      loadStatus: "loading"
    })
    util.request(api.OrderList, {
      orderStatus: that.data.searchForm.statusValue,
      storeId: that.data.searchForm.platValue,
      pageSize: that.data.searchForm.pageSize,
      page: that.data.searchForm.page,
    }).then(function (res) {

      let showLoading = false;
      let loadStatus = "loadmore";
      if (res.code === 200) {
        if (res.data != null && res.data.length != 0) {
          if (res.data.length < 20) {
            showLoading = true;
            loadStatus = "noMore"
          }
          const list = res.data.map(item => {
            item.isTouchMove = false;
            if (item.orderType == 1 && item.finalReservationTime) {
              const timeStr = item.finalReservationTime;
              const timeParts = timeStr.split(' ');
              
              if (timeParts.length === 2) {
                const datePart = timeParts[0]; // "2025-07-15"
                const timePart = timeParts[1]; // "00:30"
                const timeComponents = timePart.split(':');
                if (timeComponents.length === 2) {
                  let hours = parseInt(timeComponents[0]);
                  let minutes = parseInt(timeComponents[1]);
                  let endHours = hours;
                  let endMinutes = minutes + 30;
                  if (endMinutes >= 60) {
                    endHours = (endHours + 1) % 24;
                    endMinutes = endMinutes - 60;
                  }
                  const endTimeStr = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
                  item.finalReservationTime = `${datePart} ${timePart}~${endTimeStr}`;
                }
              }
            }
            
            return item;
          });
          that.setData({
            list: that.data.list.concat(list),
            showCate: false,
            loadStatus: loadStatus,
            showLoading: showLoading
          })
        } else {

          that.setData({
            showCate: true,
            showLoading: true,
            loadStatus: "noMore"
          })
        }
      } else {

        that.setData({
          showCate: true,
          showLoading: true,
          loadStatus: "noMore"
        })
        util.showErrorToast(res.msg);
      }
    }).catch((error) => {
      that.setData({
        showCate: true,
        showLoading: true,
        loadStatus: "noMore"
      })
    });
  },
  toDetail: function (e) {
    var data = e.currentTarget.dataset.pack
    wx.navigateTo({
      url: "/pages/orderDetail/detail?orderId=" + data.orderId+"&orderType="+data.orderType,
    })
  },
  touchStart: function (e) {
    const touchPoint = e.touches[0];
    this.setData({
      startX: touchPoint.clientX,
      startY: touchPoint.clientY
    });
  },
  touchMove: function (e) {
    const index = e.currentTarget.dataset.index;
    const touchPoint = e.touches[0];
    const startX = this.data.startX;
    const startY = this.data.startY;
    const touchMoveX = touchPoint.clientX;
    const touchMoveY = touchPoint.clientY;
    const angle = this.angle({
      X: startX,
      Y: startY
    }, {
      X: touchMoveX,
      Y: touchMoveY
    });
    if (Math.abs(angle) > 30) return;

    const list = [...this.data.list];
    list.forEach((item, i) => {
      if (i !== index) {
        item.isTouchMove = false;
      } else {
        if (touchMoveX < startX - 30) {
          item.isTouchMove = true; // 左滑超过30px  
        } else {
          item.isTouchMove = false; // 右滑或小距离滑动  
        }
      }
    });
    this.setData({
      list
    });
  },
  deleteOrder: function (e) {
    let that = this;
    const item = e.currentTarget.dataset.item;

    wx.showModal({
      title: '提示',
      content: '确定要删除此订单吗？',
      success: res => {
        if (res.confirm) {
          
          const hideApi =item.orderType == 1 ? api.ReservationOrderHide : api.OrderHide;
          util.request(hideApi, {
            orderId: item.orderId,
          }, 'POST').then(function (res) {
            if (res.code === 200) {

              that.setData({
                list: []
              });

              that.getOrderList();

              util.showSuccessToast('删除成功');
            } else {

              util.showErrorToast(res.msg);
            }
          });

        } else {
          let list = [...that.data.list];
          list[index].isTouchMove = false;
          that.setData({
            list
          });
        }
      }
    });
  },
  angle: function (start, end) {
    const _X = end.X - start.X;
    const _Y = end.Y - start.Y;
    return 360 * Math.atan(_Y / _X) / (2 * Math.PI);
  },
  clearOrders: function () {

    let that = this;
    wx.showModal({
      title: '提示',
      content: '确定要清除所有订单吗？',
      success: res => {
        if (res.confirm) {

          util.request(api.ReservationOrderHide, {
            orderId: -1,
          }, 'POST').then(function (res) {
          });
          util.request(api.OrderHide, {
            orderId: -1,
          }, 'POST').then(function (res) {
            if (res.code === 200) {
              that.setData({
                list: []
              });
              that.getOrderList();
              util.showSuccessToast('删除成功');
            } else {
              util.showErrorToast(res.msg);
            }
          });
        } 
      }
    });
  },
  onShareAppMessage: function () {
    return util.getShareInviteConfig();
  },
});
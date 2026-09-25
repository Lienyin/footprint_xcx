var util = require('../../utils/util.js');
var api = require('../../config/api.js');
const app = getApp()

Page({
  data: {
    pack: {},
    orderId: 0,
    flag: 0,
    orderType: 0,
    isPhoneNumber: 0,
    identityFlag: 0,
    showPhoneModal: false, // 控制手机号授权弹窗  
    phoneAuthLoading: false, // 授权加载状态  
    couponUserIds: [],
    showCouponDetails: false,
    savePrice: 0,
    showTimeSelectionModal: false, // 控制时间选择弹窗  
    selectedTimeOption: 1, // 默认选择主要预约时间  

    showRejectModal: false,
    rejectOption: 'reschedule', // 'direct' or 'reschedule'  
    rejectReason: '预约时间冲突',
    availableTimes: [], // Will be populated when modal opens  
    availableTimesStatus: {},
    alternativeTimes: [],
  roomNumber: '', 
  },
  onRoomInput: function(e) {
    this.setData({
      roomNumber: e.detail.value
    });
  },
  onLoad: function (options) {
    let that = this;
    that.setData({
      orderId: options.orderId,
      orderType: options.orderType ? options.orderType : 0,
      flag: options.flag,
      goodsCount: 1
    })

    wx.showLoading({
      title: '',
      mask: true
    })
    let url = options.orderType != null && options.orderType == 1 ? api.ReservationOrderDetail : api.OrderDetail;
    util.request(url + options.orderId, {}, 'POST').then(res => {
      wx.hideLoading()
      if (res.code === 200) {
        if (res.data) {
          if (res.data.couponDiscountDetails && res.data.couponDiscountDetails.length > 0) {
            const ids = res.data.couponDiscountDetails.map(item => item.couponUserId).filter(id => id);
            let totalCouponDiscount = res.data.couponDiscountDetails.reduce((sum, coupon) => sum + (parseFloat(coupon.discountAmount) || 0), 0);
            const originalPrice = parseFloat(res.data.totalAmount) || 0;
            const finalPrice = parseFloat(res.data.payAmount) || 0;
            const storeDiscount = originalPrice - finalPrice - totalCouponDiscount;
            const savePrice = originalPrice - finalPrice;
            if (storeDiscount > 0) {
              let couponDiscountDetail = {
                couponName: "会员专享优惠",
                discountAmount: storeDiscount.toFixed(2), // 保留两位小数  
                couponUserId: null // 由于这不是实际的优惠券，可以设为null  
              };
              res.data.couponDiscountDetails.push(couponDiscountDetail);
            }

            that.setData({
              couponUserIds: ids,
              savePrice: savePrice.toFixed(2)
            });
          } else {
            const originalPrice = parseFloat(res.data.totalAmount) || 0;
            const finalPrice = parseFloat(res.data.payAmount) || 0;
            const storeDiscount = originalPrice - finalPrice;
            const savePrice = originalPrice - finalPrice;
            if (storeDiscount > 0) {
              let couponDiscountDetails = [];
              let couponDiscountDetail = {
                couponName: "会员专享优惠",
                discountAmount: storeDiscount.toFixed(2), // 保留两位小数  
                couponUserId: null // 由于这不是实际的优惠券，可以设为null  
              };
              couponDiscountDetails.push(couponDiscountDetail)
              res.data.couponDiscountDetails = couponDiscountDetails;
            }

            that.setData({
              savePrice: savePrice.toFixed(2)
            });
          }
        if (res.data.finalReservationTime) {
          res.data.finalReservationTime = formatReservationTime(res.data.finalReservationTime);
        }
        
        if (res.data.backupReservationTime) {
          res.data.backupReservationTime = formatReservationTime(res.data.backupReservationTime);
        }
        }
        that.setData({
          pack: res.data
        })
      }
    }).catch((error) => {
      wx.hideLoading()
    });function formatReservationTime(timeStr) {
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
          return `${datePart} ${timePart}~${endTimeStr}`;
        }
      }
      return timeStr;
    }
  },
  onShow: function () {
    var that = this;
    let userInfo = wx.getStorageSync('userInfo')
    let isPhoneNumber = wx.getStorageSync('isPhoneNumber') || 0;
    that.setData({
      identityFlag: userInfo.identityFlag || 0,
      isPhoneNumber: isPhoneNumber
    })
  },
  confirm: function (e) {
    let that = this;
    wx.showLoading({
      title: '',
      mask: true
    })
    util.request(api.OrderConfirm, {
      orderId: that.data.pack.orderId
    }, 'POST').then(res => {
      if (res.code === 200) {
        util.showSuccessToast('确认成功');
        wx.hideLoading()
        setTimeout(() => {
          wx.navigateBack({
            delta: 1, // 返回上一页  
            success: function () {
            },
            fail: function () {
              wx.reLaunch({
                url: '/pages/order/order'
              });
            }
          });
        }, 1000); // 1000ms = 1s  
      } else {
        util.showErrorToast(res.msg);
        wx.hideLoading()
      }
    })
  },
  refund: function (e) {
    let that = this;
    wx.showModal({
      title: '确认退款',
      content: '您确定要处理此订单的退款申请吗？',
      confirmColor: '#f59e0b',
      success: function(res) {
        if (res.confirm) {
          if (that.data.pack.userId !== 1 && that.data.pack.userId !== 3) {
            wx.showModal({
              title: '二次确认',
              content: '注意：非内部订单，请再次确认是否处理退款？',
              confirmColor: '#f59e0b',
              success: function(innerRes) {
                if (innerRes.confirm) {
                  processRefund();
                }
              }
            });
          } else {
            processRefund();
          }
        }
      }
    });
    function processRefund() {
      wx.showLoading({
        title: '',
        mask: true
      })
      util.request(api.OrderRefund, {
        orderId: that.data.pack.orderId
      }, 'POST').then(res => {
        if (res.code === 200) {
          util.showSuccessToast('退款成功');
          wx.hideLoading()
          setTimeout(() => {
            wx.navigateBack({
              delta: 1, // 返回上一页  
              success: function () {
              },
              fail: function () {
                wx.reLaunch({
                  url: '/pages/order/order'
                });
              }
            });
          }, 1000); // 1000ms = 1s  
        } else {
          wx.hideLoading()
          util.showErrorToast(res.msg);
        }
      })
    }
},
  reminder: function (e) {
    let that = this;
    wx.showLoading({
      title: '',
      mask: true
    })
    util.request(api.OrderReminder, {
      orderId: that.data.pack.orderId
    }, 'POST').then(res => {
      if (res.code === 200) {
        util.showSuccessToast('已通知商家');
      } else {
        console.log(res.msg)
        util.showErrorToast(res.msg);
      }
      wx.hideLoading()
    })
  },showCancelConfirm: function() {
    let that = this;
    wx.showModal({
      title: '确认取消',
      content: '确定要取消此预约吗？取消后无法恢复。',
      confirmColor: '#FF4D4F',
      success: function(res) {
        if (res.confirm) {
          that.cancelOrder();
        }
      }
    });
  },
  cancelOrder: function (e) {
    let that = this;
    wx.showLoading({
      title: '',
      mask: true
    })
    const cancelApi = that.data.orderType == 1 ? api.ReservationOrderCancel : api.OrderCancel;

    util.request(cancelApi, {
      orderId: that.data.pack.orderId
    }, 'POST').then(res => {
      if (res.code === 200) {
        util.showSuccessToast('取消成功');
        wx.hideLoading()
        setTimeout(() => {
          wx.navigateBack({
            delta: 1 // 返回上一页  
          });
        }, 1000); // 1000ms = 1s  
      } else {
        util.showErrorToast('取消失败:'+res.msg);
        wx.hideLoading()
      }
    })
  },
  pay: function (e) {
    let that = this;
    if (that.data.isPhoneNumber == 1) {
      wx.showLoading({
        title: '',
        mask: true
      })
      const payApi = that.data.orderType == 1 ? api.ReservationOrderPay : api.OrderPay;
      util.request(payApi, {
        orderId: that.data.pack.orderId,
        couponUserIds: that.data.couponUserIds // 修改为传递优惠券ID数组  
      }, 'POST').then(res => {
        if (res.code === 200) {
          if (that.data.pack.payAmount > 0) {
            wx.requestPayment({
              timeStamp: res.data.timeStamp,
              nonceStr: res.data.nonceStr,
              package: res.data.prepayId,
              signType: res.data.signType,
              paySign: res.data.paySign,
              success(res) {
                wx.hideLoading()
                setTimeout(() => {
                  wx.navigateBack({
                    delta: 1 // 返回上一页  
                  });
                }, 1000); // 1000ms = 1s  
              },
              fail(err) {
                util.showErrorToast('支付失败');
              },
              complete() {
                wx.hideLoading()
              }
            });
          } else {
            util.showSuccessToast('预约已确认');
            setTimeout(() => {
              wx.navigateBack({
                delta: 1 // 返回上一页  
              });
            }, 1000); // 1000ms = 1s  
          }
        } else {
          util.showErrorToast(res.msg);
        }
      })
    } else {
      this.setData({
        showPhoneModal: true
      });
    }
  },
  onShareAppMessage: function () {
    let that = this;
    if (that.data.pack.orderStatus == 0) {
      return util.getShareConfig(that.data.pack.orderId, null);
    } else {
      return util.getShareInviteConfig();
    }
  },
  closePhoneModal() {
    this.setData({
      showPhoneModal: false
    });
  },
  onGetPhoneNumber(e) {
    if (e.detail.errMsg !== "getPhoneNumber:ok") {
      return;
    }

    this.setData({
      phoneAuthLoading: true
    });

    util.request(api.GetAndUpdPhoneNumber, {
      code: e.detail.code
    }, 'POST').then(res => {
      if (res.code === 200) {
        wx.setStorageSync('isPhoneNumber', 1);

        this.setData({
          isPhoneNumber: 1,
          showPhoneModal: false,
          phoneAuthLoading: false
        });
      } else {
        this.setData({
          phoneAuthLoading: false
        });
        util.showErrorToast(res.msg || '获取手机号失败');
      }
    }).catch(err => {
      this.setData({
        phoneAuthLoading: false
      });
      util.showErrorToast('获取手机号失败');
    });
  },
  toggleCouponDetails: function () {
    this.setData({
      showCouponDetails: !this.data.showCouponDetails
    });
  },
  confirmReservation: function () {
    
    this.setData({
      showTimeSelectionModal: true,
      hasBackupTime: !!this.data.pack.backupReservationTime && this.data.pack.orderStatus == 0
    });
  },
  handleTimeSelection: function (e) {
    const timeOption = parseInt(e.currentTarget.dataset.option);
    this.setData({
      selectedTimeOption: timeOption
    });
  },
  closeTimeSelectionModal: function () {
    this.setData({
      showTimeSelectionModal: false
    });
  },
  confirmTimeSelection: function() {
    if (!this.data.roomNumber) {
      wx.showToast({
        title: '请输入房间号',
        icon: 'none'
      });
      return;
    }
    const timeOption = this.data.hasBackupTime ? this.data.selectedTimeOption : 1;
    
    this.submitReservationConfirmation(timeOption);
    this.closeTimeSelectionModal();
  },
  submitReservationConfirmation: function(timeOption) {
    const that = this;
    if (!that.data.roomNumber) {
      wx.showToast({
        title: '请输入房间号',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({
      title: '',
      mask: true
    });
    util.request(api.ReservationOrderConfirm, {
      orderId: that.data.pack.orderId,
      timeOption: timeOption, // 1=主要预约时间，2=备选预约时间
      room: that.data.roomNumber // 添加房间号
    }, 'POST').then(res => {
      wx.hideLoading();
      if (res.code === 200) {
        util.showSuccessToast('预约已确认');
        let updatedPack = that.data.pack;
        updatedPack.orderStatus = 1; // 更新为已确认状态
        updatedPack.orderStatusName = "已确认";
        updatedPack.room = that.data.roomNumber; // 更新房间号
        if (timeOption === 2 && updatedPack.backupReservationTime) {
          updatedPack.finalReservationTime = updatedPack.backupReservationTime;
        }
  
        that.setData({
          pack: updatedPack
        });
  
        setTimeout(() => {
          wx.navigateBack({
            delta: 1,
            fail: function() {
              wx.reLaunch({
                url: '/pages/order/order'
              });
            }
          });
        }, 1000);
      } else {
        util.showErrorToast(res.msg || '确认失败');
      }
    }).catch(err => {
      wx.hideLoading();
      util.showErrorToast('网络异常，请重试');
    });
  },
  showRejectOptions: function () {
    this.generateAvailableTimes();

    this.setData({
      showRejectModal: true,
      rejectOption: 'reschedule',
      rejectReason: '预约时间冲突',
      alternativeTimes: []
    });
  },
  closeRejectModal: function () {
    this.setData({
      showRejectModal: false
    });
  },
  selectRejectOption: function (e) {
    const option = e.currentTarget.dataset.option;
    this.setData({
      rejectOption: option
    });
  },
  onReasonInput: function (e) {
    this.setData({
      rejectReason: e.detail.value
    });
  },
  onSelectAlternativeTime: function (e) {
    const time = e.currentTarget.dataset.time;
    let alternativeTimes = [...this.data.alternativeTimes];

    if (alternativeTimes.includes(time)) {
      alternativeTimes = alternativeTimes.filter(t => t !== time);
    } else {
      if (alternativeTimes.length < 1) {
        alternativeTimes.push(time);
        alternativeTimes.sort();
      } else {
        wx.showToast({
          title: '最多选择1个时间',
          icon: 'none'
        });
        return;
      }
    }
    const timesStatus = {};
    for (const t of this.data.availableTimes) {
      timesStatus[t] = alternativeTimes.includes(t);
    }

    this.setData({
      alternativeTimes,
      availableTimesStatus: timesStatus
    });
  },
  removeAlternativeTime: function (e) {
    const time = e.currentTarget.dataset.time;
    const alternativeTimes = this.data.alternativeTimes.filter(t => t !== time);
    const timesStatus = {};
    for (const t of this.data.availableTimes) {
      timesStatus[t] = alternativeTimes.includes(t);
    }

    this.setData({
      alternativeTimes,
      availableTimesStatus: timesStatus
    });
  },
  generateAvailableTimes: function () {
    const businessHours = this.data.pack.businessHours || "14:00-02:00";
    const [startTime, endTime] = businessHours.split('-');
    const slots = [];
    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]);
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    let minHour = currentHour;
    let minMinute = currentMinute + 60;
    if (startHour < endHour) {
      for (let hour = startHour; hour <= endHour; hour++) {
        slots.push(`${hour.toString().padStart(2, '0')}:00`);
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    } else {
      for (let hour = startHour; hour <= 23; hour++) {
        slots.push(`${hour.toString().padStart(2, '0')}:00`);
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
      for (let hour = 0; hour <= endHour; hour++) {
        slots.push(`${hour.toString().padStart(2, '0')}:00`);
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    const filteredTimes = slots.filter(time => {
      const [hour, minute] = time.split(':').map(Number);
      if (startHour > endHour) {
        if (hour >= startHour || hour <= endHour) {
          if (minHour < 5) {
            if (hour < 5 && (hour > minHour || (hour === minHour && minute >= minMinute) && hour < endHour)) {
              return true;
            }

          } else {
            if (hour > minHour || (hour === minHour && minute >= minMinute)) {
              return true;
            }
            if (hour < endHour) {
              return true;
            }
          }
        }
      } else {
        return hour > minHour || (hour === minHour && minute >= minMinute);
      }

      return false;
    });
    const timesStatus = slots.reduce((acc, time) => {
      acc[time] = false;
      return acc;
    }, {});

    this.setData({
      availableTimes: filteredTimes,
      availableTimesStatus: timesStatus
    });
  },
  submitRejection: function() {
    const that = this;
    if (!that.data.rejectReason) {
      wx.showToast({
        title: '请输入处理原因',
        icon: 'none'
      });
      return;
    }
    if (!that.data.roomNumber) {
      wx.showToast({
        title: '请输入房间号',
        icon: 'none'
      });
      return;
    }
    if (that.data.rejectOption === 'reschedule' && that.data.alternativeTimes.length === 0) {
      wx.showToast({
        title: '请至少选择一个建议时间',
        icon: 'none'
      });
      return;
    }
  
    wx.showLoading({
      title: '处理中',
      mask: true
    });
    const rejectData = {
      orderId: that.data.pack.orderId,
      result: that.data.rejectOption === 'direct' ? 1 : 2, // 1=直接拒绝, 2=建议调整
      reason: that.data.rejectReason,
      adjustTime: that.data.rejectOption === 'reschedule' ? that.data.alternativeTimes[0] : '',
      room: that.data.roomNumber // 添加房间号
    };
    util.request(api.ReservationOrderAdjust, rejectData)
      .then(res => {
        wx.hideLoading();
        if (res.code === 200) {
          wx.showToast({
            title: that.data.rejectOption === 'direct' ? '已拒绝预约' : '已发送调整建议',
            icon: 'success',
            duration: 1500
          });
          let updatedPack = that.data.pack;
          updatedPack.room = that.data.roomNumber;
          
          that.setData({
            showRejectModal: false,
            pack: updatedPack
          });
          setTimeout(() => {
            wx.navigateBack({
              delta: 1,
              fail: function() {
                wx.reLaunch({
                  url: '/pages/order/order'
                });
              }
            });
          }, 1500);
        } else {
          wx.showToast({
            title: res.msg || '操作失败',
            icon: 'none'
          });
        }
      })
      .catch(err => {
        wx.hideLoading();
        wx.showToast({
          title: '网络异常，请重试',
          icon: 'none'
        });
      });
  },
  makePhoneCall: function(e) {
    const phoneNumber = e.currentTarget.dataset.phone;
    if (!phoneNumber) {
      wx.showToast({
        title: '无效的电话号码',
        icon: 'none'
      });
      return;
    }
    
    wx.makePhoneCall({
      phoneNumber: phoneNumber,
      success: () => {
        console.log('Phone call initiated');
      },
      fail: (err) => {
        if (err.errMsg !== "makePhoneCall:fail cancel") {
          wx.showToast({
            title: '拨打电话失败',
            icon: 'none'
          });
        }
      }
    });
  },
})

var util = require('../../utils/util.js');
var api = require('../../config/api.js');
const app = getApp()

Page({
  data: {
    packs: [],
    technicianCode: '',
    room: '',
    phoneNumber: '',
    isPhoneNumber: 0,
    identityFlag: 0,
    originalPrice: 0.00, //订单总价  
    price: 0.00, //实际需要支付的总价  
    savePrice: 0.00,
    goodsCount: 0,
    orderId: 0,
    goodsTotalPrice: 0.00, //商品总价  
    outStock: 0,
    payMethodItems: [
      {
        name: 'online',
        value: '微信支付',
        checked: true
      },
    ],
    payMethod: 1,
    showPhoneModal: false,  // 控制手机号授权弹窗  
    phoneAuthLoading: false, // 授权加载状态  
    showCouponModal: false,
    couponTabActive: 'usable',
    bestCoupon: null, // 最佳优惠券  
    allCoupons: [], // 所有优惠券  
    usableCoupons: [], // 可用优惠券列表  
    unusableCoupons: [], // 不可用优惠券列表  
    selectedCoupons: [], // 已选择的优惠券列表（多选）  
    totalCouponDiscount: '0.00', // 总优惠金额  
    couponDiscountAmount: '0.00', // 添加显示在页面上的优惠金额  
    isNotCart: 0,
    packageInfos: [],
    isShare: 0,
    reservationData: {},
    reservationtAmount: 0.0,
    baseDiscountAmount: 0.0
  },

  onLoad: function (options) {
    let data = JSON.parse(decodeURIComponent(options.data));
    const sum = data.reduce((total, item) => total + (item.num || 0), 0);
    let originalPrice = data.reduce((total, item) => total + (item.originalPrice * item.num || 0), 0);
    let price = data.reduce((total, item) => total + (item.price * item.num || 0), 0);
    originalPrice = Number(originalPrice).toFixed(2);
    price = Number(price).toFixed(2);
    let savePrice = Number(originalPrice - price).toFixed(2);
    let baseDiscountAmount = Number(originalPrice - price).toFixed(2);
    let packageInfos = [];
    if (options.isNotCart && options.isNotCart == 1) {
      console.log("来自详情")
      wx.setStorageSync('storeId', data[0].storeId);
      let packageInfo = { packageId: data[0].packageId, num: data[0].num }
      packageInfos.push(packageInfo)
    }
    this.setData({
      packs: data,
      packageInfos: packageInfos,
      isNotCart: options.isNotCart,
      goodsCount: sum,
      originalPrice: originalPrice,
      price: price,
      savePrice: savePrice,
      baseDiscountAmount: baseDiscountAmount,
      goodsTotalPrice: price // 初始化商品总价，用于后续优惠券计算  
    });

    this.fetchReservationData();
    this.getStoreDetail();
    this.fetchCouponData();
  },

  onShow: function () {
    let userInfo = wx.getStorageSync('userInfo') || {};
    let isPhoneNumber = wx.getStorageSync('isPhoneNumber') || 0;

    this.setData({
      identityFlag: userInfo.identityFlag || 0,
      isPhoneNumber: isPhoneNumber
    });
  },
  fetchCouponData: function () {
    const that = this;

    util.request(api.CouponUsable, {
      orderAmount: that.data.goodsTotalPrice
    }, 'POST').then(res => {
      if (res.code === 200) {
        const couponData = res.data;
        that.processCouponData(couponData);
      }
    }).catch(err => {
      console.error('获取优惠券错误:', err);
    });
  },
  fetchReservationData: function () {
    const that = this;

    util.request(api.ReservationGetLatestOrder, {
    }, 'POST').then(res => {
      if (res.code === 200 && res.data) {
        const reservationData = res.data;
        that.setData({
          reservationData: reservationData,
          reservationtAmount: reservationData.payAmount ? reservationData.payAmount : 0.0
        });
      }
    }).catch(err => {
      console.error('获取优惠券错误:', err);
    });
  },
  getStoreDetail: function () {
    const that = this;
    let storeId = wx.getStorageSync('storeId');
    if (storeId) {
      util.request(api.StoreDetail + storeId, {
      }, 'POST').then(res => {
        if (res.code === 200 && res.data) {
          that.setData({
            isShare: res.data.isShare
          });
        }
      }).catch(err => {
        console.error('获取门店异常:', err);
      });
    }
  },
  processCouponData: function (couponData) {
    const bestCoupon = couponData.bestCoupon || null;
    const allCoupons = couponData.allCoupons || [];
    let hasDisabledCoupons = couponData.unusableCoupons || false;
    const usableCoupons = allCoupons.filter(coupon => coupon.usable).map(coupon => {
      return { ...coupon, selected: false };
    });
    const unusableCoupons = allCoupons.filter(coupon => !coupon.usable);
    let selectedCoupons = [];
    if (bestCoupon) {
      selectedCoupons = [bestCoupon];
      const bestCouponIndex = usableCoupons.findIndex(c => c.couponUserId === bestCoupon.couponUserId);
      if (bestCouponIndex >= 0) {
        usableCoupons[bestCouponIndex].selected = true;
      }
      const totalDiscount = this.calculateTotalDiscount(selectedCoupons);
      this.setData({
        couponDiscountAmount: totalDiscount.toFixed(2)
      });
      this.calculatePriceWithCoupons(selectedCoupons);
    }
    this.setData({
      bestCoupon,
      allCoupons,
      usableCoupons,
      unusableCoupons,
      selectedCoupons,
      hasDisabledCoupons
    });
    if (selectedCoupons.length > 0) {
      this.updateTotalCouponDiscount();
    } else {
      this.setData({
        totalCouponDiscount: '0.00',
        couponDiscountAmount: '0.00'
      });
    }
  },
  isCouponSelected: function (couponUserId) {
    return this.data.selectedCoupons.some(coupon => coupon.couponUserId === couponUserId);
  },
  selectNoCoupon: function () {
    const updatedUsableCoupons = this.data.usableCoupons.map(coupon => {
      return { ...coupon, selected: false };
    });

    this.setData({
      selectedCoupons: [],
      totalCouponDiscount: '0.00',
      couponDiscountAmount: '0.00',
      usableCoupons: updatedUsableCoupons
    });
    this.calculatePriceWithCoupons([]);
  },
  selectCoupon: function (e) {
    const couponId = e.currentTarget.dataset.id;
    const isStack = e.currentTarget.dataset.stack === 1; // 是否可叠加  
    const coupon = this.data.usableCoupons.find(item => item.couponUserId === couponId);

    if (!coupon) return;

    let selectedCoupons = [...this.data.selectedCoupons];
    const isSelected = this.isCouponSelected(couponId);
    let updatedUsableCoupons = [...this.data.usableCoupons];

    if (isSelected) {
      selectedCoupons = selectedCoupons.filter(item => item.couponUserId !== couponId);
      const couponIndex = updatedUsableCoupons.findIndex(c => c.couponUserId === couponId);
      if (couponIndex >= 0) {
        updatedUsableCoupons[couponIndex].selected = false;
      }
    } else {
      if (selectedCoupons.length === 0) {
        selectedCoupons.push(coupon);
        const couponIndex = updatedUsableCoupons.findIndex(c => c.couponUserId === couponId);
        if (couponIndex >= 0) {
          updatedUsableCoupons[couponIndex].selected = true;
        }
      } else if (isStack) {
        const canStack = selectedCoupons.every(item => item.isStack === 1);
        if (canStack) {
          selectedCoupons.push(coupon);
          const couponIndex = updatedUsableCoupons.findIndex(c => c.couponUserId === couponId);
          if (couponIndex >= 0) {
            updatedUsableCoupons[couponIndex].selected = true;
          }
        } else {
          updatedUsableCoupons = updatedUsableCoupons.map(c => ({ ...c, selected: false }));
          const couponIndex = updatedUsableCoupons.findIndex(c => c.couponUserId === couponId);
          if (couponIndex >= 0) {
            updatedUsableCoupons[couponIndex].selected = true;
          }

          selectedCoupons = [coupon];
        }
      } else {
        updatedUsableCoupons = updatedUsableCoupons.map(c => ({ ...c, selected: false }));
        const couponIndex = updatedUsableCoupons.findIndex(c => c.couponUserId === couponId);
        if (couponIndex >= 0) {
          updatedUsableCoupons[couponIndex].selected = true;
        }

        selectedCoupons = [coupon];
      }
    }

    this.setData({
      selectedCoupons,
      usableCoupons: updatedUsableCoupons
    });
    this.updateTotalCouponDiscount();
  },
  confirmCouponSelection: function () {
    this.updateTotalCouponDiscount();
    this.calculatePriceWithCoupons(this.data.selectedCoupons);
    this.closeCouponModal();
  },
  updateTotalCouponDiscount: function () {
    const totalDiscount = this.calculateTotalDiscount(this.data.selectedCoupons);
    this.setData({
      totalCouponDiscount: totalDiscount.toFixed(2),
      couponDiscountAmount: totalDiscount.toFixed(2)  // 更新显示在页面上的优惠金额  
    });
  },
  calculateTotalDiscount: function (coupons) {
    if (!coupons || coupons.length === 0) return 0;

    const goodsPrice = parseFloat(this.data.goodsTotalPrice);
    let remainingPrice = goodsPrice;
    let totalDiscount = 0;
    const sortedCoupons = [...coupons].sort((a, b) => {
      const discountA = this.estimateCouponDiscount(a, goodsPrice);
      const discountB = this.estimateCouponDiscount(b, goodsPrice);
      return discountB - discountA;
    });
    for (let coupon of sortedCoupons) {
      if (remainingPrice <= 0) break;

      let currentDiscount = 0;

      switch (coupon.couponType) {
        case 0: // 满减券  
          if (remainingPrice >= parseFloat(coupon.minAmount)) {
            currentDiscount = Math.min(remainingPrice, parseFloat(coupon.discountAmount));
          }
          break;
        case 1: // 折扣券  
          currentDiscount = remainingPrice * (1 - parseFloat(coupon.discountRate) / 10);
          break;
        case 2: // 无门槛券  
          currentDiscount = Math.min(remainingPrice, parseFloat(coupon.discountAmount));
          break;
        case 3: // 可膨胀优惠券  
          const discountAmount = coupon.isInflated === 1 ?
            parseFloat(coupon.inflateAmount) :
            parseFloat(coupon.discountAmount);
          currentDiscount = Math.min(remainingPrice, discountAmount);
          break;
      }

      totalDiscount += currentDiscount;
      remainingPrice -= currentDiscount;
      remainingPrice = Math.max(0, remainingPrice);
    }

    return totalDiscount;
  },
  estimateCouponDiscount: function (coupon, price) {
    let discount = 0;

    switch (coupon.couponType) {
      case 0: // 满减券  
        if (price >= parseFloat(coupon.minAmount)) {
          discount = parseFloat(coupon.discountAmount);
        }
        break;
      case 1: // 折扣券  
        discount = price * (1 - parseFloat(coupon.discountRate) / 10);
        break;
      case 2: // 无门槛券  
        discount = parseFloat(coupon.discountAmount);
        break;
      case 3: // 可膨胀优惠券  
        discount = coupon.isInflated === 1 ?
          parseFloat(coupon.inflateAmount) :
          parseFloat(coupon.discountAmount);
        break;
    }

    return discount;
  },
  calculatePriceWithCoupons: function (coupons) {
    if (!coupons || coupons.length === 0) {
      let originalPrice = parseFloat(this.data.originalPrice);
      let goodsPrice = parseFloat(this.data.goodsTotalPrice) - this.data.reservationtAmount;

      this.setData({
        price: goodsPrice.toFixed(2),
        savePrice: (originalPrice - goodsPrice).toFixed(2),
        couponDiscountAmount: '0.00'
      });
      return;
    }
    const goodsPrice = parseFloat(this.data.goodsTotalPrice);
    const originalPrice = parseFloat(this.data.originalPrice);
    let remainingPrice = goodsPrice;
    const sortedCoupons = [...coupons].sort((a, b) => {
      const discountA = this.estimateCouponDiscount(a, goodsPrice);
      const discountB = this.estimateCouponDiscount(b, goodsPrice);
      return discountB - discountA;
    });
    for (let coupon of sortedCoupons) {
      if (remainingPrice <= 0) break;

      switch (coupon.couponType) {
        case 0: // 满减券  
          if (remainingPrice >= parseFloat(coupon.minAmount)) {
            remainingPrice = Math.max(0, remainingPrice - parseFloat(coupon.discountAmount));
          }
          break;
        case 1: // 折扣券  
          remainingPrice = remainingPrice * (parseFloat(coupon.discountRate) / 10);
          break;
        case 2: // 无门槛券  
          remainingPrice = Math.max(0, remainingPrice - parseFloat(coupon.discountAmount));
          break;
        case 3: // 可膨胀优惠券  
          const discountAmount = coupon.isInflated === 1 ?
            parseFloat(coupon.inflateAmount) :
            parseFloat(coupon.discountAmount);
          remainingPrice = Math.max(0, remainingPrice - discountAmount);
          break;
      }
    }
    const finalPrice = Math.max(0.01, remainingPrice - this.data.reservationtAmount);
    const savePrice = originalPrice - finalPrice;
    const discountAmount = goodsPrice - finalPrice;

    this.setData({
      price: finalPrice.toFixed(2),
      savePrice: savePrice.toFixed(2),
      couponDiscountAmount: discountAmount.toFixed(2)
    });
  },
  showCouponModal: function () {
    let updatedUsableCoupons = [...this.data.usableCoupons];
    const selectedIds = this.data.selectedCoupons.map(c => c.couponUserId);

    updatedUsableCoupons = updatedUsableCoupons.map(coupon => {
      return {
        ...coupon,
        selected: selectedIds.includes(coupon.couponUserId)
      };
    });

    this.setData({
      usableCoupons: updatedUsableCoupons,
      showCouponModal: true
    });
  },
  closeCouponModal: function () {
    this.setData({
      showCouponModal: false
    });
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
        this.continueOrderProcess();
      } else {
        this.setData({
          phoneAuthLoading: false
        });
        util.showErrorToast(res.msg || '获取手机号失败');
      }
    }).catch(err => {
      console.error('获取手机号错误:', err);
      this.setData({
        phoneAuthLoading: false
      });
      util.showErrorToast('获取手机号失败');
    });
  },
  continueOrderProcess() {
  },

  checkOrder: function () {
    if (!this.data.room) {
      util.showErrorToast('请填写房间号');
      return Promise.resolve(0);
    }
    // 暂时跳过手机号授权检查
    // if (this.data.isPhoneNumber == 1) {
    //   return Promise.resolve(1);
    // } else {
    //   this.setData({
    //     showPhoneModal: true
    //   });
    //   return Promise.resolve(0);
    // }
    return Promise.resolve(1);
  },
  handleWxPay: function (payData) {
    return new Promise((resolve, reject) => {
      wx.requestPayment({
        timeStamp: payData.timeStamp,
        nonceStr: payData.nonceStr,
        package: payData.prepayId,
        signType: payData.signType,
        paySign: payData.paySign,
        success(res) {
          resolve(res);
        },
        fail(err) {
          reject(err);
        }
      });
    });
  },

  payOrder: function () {
    let that = this;

    that.checkOrder().then(res => {
      if (res !== 1) return;

      wx.showLoading({
        title: '',
        mask: true
      });

      const storeId = wx.getStorageSync('storeId');
      const couponUserIds = that.data.selectedCoupons.map(coupon => coupon.couponUserId);

      const requestPromise = !that.data.orderId
        ? util.request(api.OrderSubmitAndPay + storeId, {
          room: that.data.room,
          packageInfos: that.data.packageInfos,
          technicianCode: that.data.technicianCode,
          couponUserIds: couponUserIds  // 修改为传递优惠券ID数组  
        }, 'POST')
        : util.request(api.OrderPay, {
          orderId: that.data.orderId,
          couponUserIds: couponUserIds  // 修改为传递优惠券ID数组  
        }, 'POST');

      requestPromise.then(res => {
        if (res.code === 200) {
          if (!that.data.orderId) {
            that.setData({
              orderId: res.data.orderId
            });
          }

          return that.handleWxPay(res.data);
        } else {
          throw new Error(res.msg);
        }
      })
        .then(() => {
          wx.redirectTo({
            url: '/pages/payResult/payResult?status=1&orderId=' + that.data.orderId
          });
        })
        .catch(err => {
          util.showErrorToast(err.message);
        })
        .finally(() => {
          wx.hideLoading();
        });
    }).catch(error => {
      wx.hideLoading();
    });
  },

  submitOrder: function () {
    let that = this;

    that.checkOrder().then(res => {
      if (res !== 1) return;
      if (that.data.orderId) {
        wx.redirectTo({
          url: '/pages/payResult/payResult?status=2&orderId=' + that.data.orderId + '&price=' + that.data.goodsTotalPrice
        });
        return;
      }

      wx.showLoading({
        title: '',
        mask: true
      });

      const storeId = wx.getStorageSync('storeId');
      const couponUserIds = that.data.selectedCoupons.map(coupon => coupon.couponUserId);

      util.request(api.OrderSubmit + storeId, {
        room: that.data.room,
        packageInfos: that.data.packageInfos,
        technicianCode: that.data.technicianCode,
        couponUserIds: couponUserIds  // 修改为传递优惠券ID数组  
      }, 'POST')
        .then(res => {
          if (res.code === 200) {
            let orderId = res.data;
            that.setData({ orderId: orderId });
            wx.redirectTo({
              url: '/pages/payResult/payResult?status=2&orderId=' + orderId + '&price=' + that.data.goodsTotalPrice
            });
          } else {
            throw new Error(res.msg || '提交订单失败');
          }
        })
        .catch(err => {
          util.showErrorToast(err.message);
        })
        .finally(() => {
          wx.hideLoading();
        });
    }).catch(error => {
      wx.hideLoading();
    });
  }
})
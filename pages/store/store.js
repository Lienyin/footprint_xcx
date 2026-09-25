const util = require('../../utils/util.js');
const api = require('../../config/api.js');

Page({
  /**
   * 页面的初始数据
   */
  data: {
    bookingNotices: [],
    technicians: [],// 技师数据
    longitude: 0,
    latitude: 0,
    bannerList: [],
    shopList: [],
    scrollTimers: {},
    showActivityModal: true
  },
  onLoad: function () {
    this.getShopList();
    this.getBannerList();
    this.loadTechInfo();
  },
  loadTechInfo: function (storeId) {
    let that = this;
    util.request(api.ReservationGetTechList, {
    }).then(function (res) {
      if (res.code === 200 && res.data && res.data.length > 0) {
        const infoList = res.data.map((info, index) => {
          let photoVO = {};
          let photos = [];
          try {
            photoVO = info.photo ? JSON.parse(info.photo) : {};
            photos = Object.values(photoVO)
              .filter(url =>
                url &&
                typeof url === 'string' &&
                url.trim() !== '' &&
                /^https?:\/\//.test(url)
              );
          } catch (error) {
            console.error('解析照片失败', error);
          }
          return {
            ...info,
            photoVO: photoVO,   // 保留原始照片对象
            photos: photos      // 所有照片 URL 数组
          };
        });

        that.setData({
          technicians: infoList
        });
      }
    }).catch(function (error) {
      console.error('获取预约信息失败', error);
    });
  },
  startAllPackageScroll() {
    this.data.shopList.forEach((shop, index) => {
      if (shop.packageList && shop.packageList.length > 1) {
        this.startPackageCarousel(index);
      }
    });
  },
  startPackageCarousel(shopIndex) {
    const shop = this.data.shopList[shopIndex];
    if (!shop || !shop.packageList || shop.packageList.length <= 1) {
      return;
    }
    if (this.data.scrollTimers[shopIndex]) {
      clearInterval(this.data.scrollTimers[shopIndex]);
    }

    let currentIndex = 0;
    const packageCount = shop.packageList.length;
    const rowHeight = 50; // 每行高度 50rpx  
    const containerHeight = 100; // 容器高度，根据实际情况调整

    const timer = setInterval(() => {
      currentIndex++;
      const scrollOffset = currentIndex * rowHeight;
      const maxScrollOffset = (packageCount - 1) * rowHeight;
      const newShopList = [...this.data.shopList];
      newShopList[shopIndex] = {
        ...newShopList[shopIndex],
        currentScrollOffset: scrollOffset,
        currentIndex: currentIndex,
        isTransitioning: true
      };

      this.setData({
        shopList: newShopList
      });
      if (currentIndex >= packageCount) {
        setTimeout(() => {
          currentIndex = 0; // 重置索引  
          const resetShopList = [...this.data.shopList];
          resetShopList[shopIndex] = {
            ...resetShopList[shopIndex],
            currentScrollOffset: 0,
            currentIndex: 0,
            isTransitioning: false
          };

          this.setData({
            shopList: resetShopList
          });

        }, 500); // 等待过渡动画完成  
      }

    }, 3000); // 每3秒滚动一行  
    this.data.scrollTimers[shopIndex] = timer;
  },
  getShopList: function () {
    var that = this;

    wx.getLocation({
      type: 'wgs84',
      success(res) {
        that.setData({
          longitude: res.longitude,
          latitude: res.latitude
        });
      },
      fail(res) {
        console.log(res)
      },
      complete() {
        util.request(api.StoreGetByLocation, {
          longitude: that.data.longitude,
          latitude: that.data.latitude
        }).then(function (res) {
          if (res.code === 200 && res.data.length > 0) {
            const shopList = res.data.map((shop, index) => {
              const processedShop = {
                ...shop,
                currentScrollOffset: 0,
                currentIndex: 0,
                isTransitioning: false
              };

              if (shop.packageList && shop.packageList.length > 0) {
                processedShop.packageList = shop.packageList.map((item, idx) => {
                  const priceStr = item.price.toFixed(2);
                  let discountText = '';
                  if (item.originalPrice > 0) {
                    const discount = (item.price / item.originalPrice * 10).toFixed(1);
                    discountText = discount === '10.0' ? '' : discount + '折';
                  }

                  return {
                    ...item,
                    uniqueId: `${item.packageId}_${idx}`,
                    discount: discountText,
                    priceInteger: priceStr.split('.')[0],
                    priceDecimal: priceStr.split('.')[1]
                  };
                });
                if (processedShop.packageList.length > 1) {
                  const duplicateCount = Math.min(2, processedShop.packageList.length);
                  const duplicates = processedShop.packageList.slice(0, duplicateCount).map((item, idx) => ({
                    ...item,
                    uniqueId: `${item.packageId}_copy_${idx}`
                  }));

                  processedShop.allPackagesForCarousel = [
                    ...processedShop.packageList,
                    ...duplicates
                  ];
                } else {
                  processedShop.allPackagesForCarousel = processedShop.packageList;
                }

              }

              return processedShop;
            });

            that.setData({
              shopList: shopList
            }, () => {
              setTimeout(() => {
                that.startAllPackageScroll();
              }, 1000);
            });
          } else {
            util.showErrorToast("附近暂无门店");
          }
        }).catch(function (error) {
          console.error("获取门店列表失败", error);
          util.showErrorToast("获取门店列表失败");
        });
      }
    })
  },
  clearAllScrollTimers() {
    Object.values(this.data.scrollTimers).forEach(timer => {
      if (timer) {
        clearInterval(timer);
      }
    });
    this.data.scrollTimers = {};
  },

  onShow() {
    if (this.data.shopList.length > 0) {
      this.startAllPackageScroll();
    }
  },

  onHide() {
    this.clearAllScrollTimers();
  },

  onUnload() {
    this.clearAllScrollTimers();
  },

  getBannerList: function () {
    var that = this;
    util.request(api.BannerList, {
    }).then(function (res) {
      if (res.code === 200 && res.data.length > 0) {
        that.setData({
          bannerList: res.data
        });
      }
    })
  },

  navigateTo: function (url) {
    wx.navigateTo({
      url: url,
      fail: (err) => {
        console.error('页面跳转失败', err);
        wx.switchTab({
          url: url,
          fail: (switchErr) => {
            console.error('switchTab也失败了', switchErr);
            wx.showToast({
              title: '页面跳转失败',
              icon: 'none'
            });
          }
        });
      }
    });
  },
  goToShopDetail: function (e) {
    const storeId = e.currentTarget.dataset.id;
    const shopData = this.data.shopList.find(shop => shop.storeId === storeId);
    var data = encodeURIComponent(JSON.stringify(shopData));
    wx.navigateTo({
      url: '/pages/home/home?store=' + data,
      success: () => {
        console.log('成功跳转到店铺详情页');
      },
      fail: (err) => {
        console.error('跳转失败', err);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },

  onPullDownRefresh: function () {
    console.log('触发下拉刷新');
    this.clearAllScrollTimers();
    this.getShopList();
    this.getBannerList();
    wx.stopPullDownRefresh();
  },

  onReachBottom: function () {
    console.log('触发上拉加载更多');
  },

  onShareAppMessage: function () {
    return util.getShareInviteConfig();
  },

  onPageScroll: function (e) {
  },

  backToTop: function () {
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    });
  },
  onTechnicianTap: function () {
    this.navigateTo(`/pages/reservation/reservation`);
  },

  /**
   * 礼品按钮点击事件
   */
  onGiftTap: function () {
    wx.navigateTo({
      url: '/pages/activity-list/activity-list',
    })
  },

  onBannerTap: function (e) {
    const index = e.currentTarget.dataset.index;
    const banner = this.data.bannerList[index];

    if (!banner) {
      console.error('Banner数据不存在');
      return;
    }

    const linkType = banner.linkType;
    const linkValue = banner.linkValue;
    switch (linkType) {
      case 1: // 店铺详情  
        this.navigateTo(`/pages/home/home?storeId=${linkValue}`);
        break;

      case 2: // 套餐详情  
        this.navigateTo(`/pages/packageDetail/index?packageId=${linkValue}`);
        break;

      case 3: // 指定页面  
      case 5: // 指定页面(与3相同处理)  
        this.navigateTo(linkValue);
        break;

      case 4: // 网页  
        const encodedUrl = encodeURIComponent(linkValue);
        this.navigateTo(`/pages/webview/webview?url=${encodedUrl}`);
        break;

      default:
        console.warn('未知的Banner链接类型:', linkType);
        break;
    }
  },
  onTechnicianClick: function (e) {
    const technician = e.currentTarget.dataset.technician;

    if (!technician || !technician.userId) {
      wx.showToast({
        title: '技师信息不完整',
        icon: 'none'
      });
      return;
    }
    wx.navigateTo({
      url: `/pages/reservation/reservation?technicianId=${technician.userId}&autoOpenBooking=true`
    });
  },
  openLocation: function (e) {
    const storeId = e.currentTarget.dataset.id;
    const shop = this.data.shopList.find(shop => shop.storeId === storeId);

    if (!shop || !shop.longitude || !shop.latitude) {
      wx.showToast({
        title: '无法获取门店位置信息',
        icon: 'none'
      });
      return;
    }
    let longitude = parseFloat(shop.longitude);
    let latitude = parseFloat(shop.latitude);
    const gcjCoord = this.wgs84togcj02(longitude, latitude);
    wx.openLocation({
      latitude: gcjCoord.lat,
      longitude: gcjCoord.lng,
      name: shop.storeName,
      address: shop.address,
      scale: 18,
      fail: function (err) {
        console.error('打开位置失败', err);
        wx.showToast({
          title: '导航失败，请重试',
          icon: 'none'
        });
      }
    });
  },
  /**
  * WGS84坐标转换为GCJ02坐标
  * @param {number} lng WGS84经度
  * @param {number} lat WGS84纬度
  * @returns {Object} 返回GCJ02坐标对象 {lng, lat}
  */
  wgs84togcj02: function (lng, lat) {
    if (this.outOfChina(lng, lat)) {
      return { lng: lng, lat: lat };
    }

    var dlat = this.transformlat(lng - 105.0, lat - 35.0);
    var dlng = this.transformlng(lng - 105.0, lat - 35.0);

    var radlat = lat / 180.0 * Math.PI;
    var magic = Math.sin(radlat);
    magic = 1 - 0.00669342162296594323 * magic * magic;

    var sqrtmagic = Math.sqrt(magic);
    dlat = (dlat * 180.0) / ((6378245.0 * (1 - 0.00669342162296594323)) / (magic * sqrtmagic) * Math.PI);
    dlng = (dlng * 180.0) / (6378245.0 / sqrtmagic * Math.cos(radlat) * Math.PI);

    var mglat = lat + dlat;
    var mglng = lng + dlng;

    return { lng: mglng, lat: mglat };
  },

  /**
   * 判断坐标是否在中国境外
   * @param {number} lng 经度
   * @param {number} lat 纬度
   * @returns {boolean} 是否在中国境外
   */
  outOfChina: function (lng, lat) {
    return (lng < 72.004 || lng > 137.8347) || (lat < 0.8293 || lat > 55.8271);
  },

  /**
   * 经度转换辅助函数
   */
  transformlng: function (lng, lat) {
    var ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
    ret += (20.0 * Math.sin(6.0 * lng * Math.PI) + 20.0 * Math.sin(2.0 * lng * Math.PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(lng * Math.PI) + 40.0 * Math.sin(lng / 3.0 * Math.PI)) * 2.0 / 3.0;
    ret += (150.0 * Math.sin(lng / 12.0 * Math.PI) + 300.0 * Math.sin(lng / 30.0 * Math.PI)) * 2.0 / 3.0;
    return ret;
  },

  /**
   * 纬度转换辅助函数
   */
  transformlat: function (lng, lat) {
    var ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
    ret += (20.0 * Math.sin(6.0 * lng * Math.PI) + 20.0 * Math.sin(2.0 * lng * Math.PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(lat * Math.PI) + 40.0 * Math.sin(lat / 3.0 * Math.PI)) * 2.0 / 3.0;
    ret += (160.0 * Math.sin(lat / 12.0 * Math.PI) + 320.0 * Math.sin(lat * Math.PI / 30.0)) * 2.0 / 3.0;
    return ret;
  },
  handleModalClose(e) {
    this.setData({ showActivityModal: false });
  },
  handleRecommendAction(e) {
    wx.navigateTo({
      url: '/pages/referral/referral'
    });
  }
});
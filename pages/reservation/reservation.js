const util = require('../../utils/util.js');
const api = require('../../config/api.js');
Page({
  data: {
    storeInfo: {},
    technicians: [
    ],
    rules: [],
    packages: [
    ],
    selectedTechnician: {
      userId: null,
      businessHours: "14:00-02:00",
      photoVO: {},
      photos: []
    },
    selectedPackage: {},
    depositAmount: 50,
    showImageModal: false,
    previewPhotos: [],
    currentImageIndex: 0,

    showBookingPopup: false,
    selectedPeople: 1,
    selectedTimes: [],
    timeIndex: [0],
    availableTimes: [],
    availableTimesStatus: {},
    currentPhotoIndex: 0,
    photoHeights: [], // 存储每张照片加载后的高度
    photoSwiperHeight: 700, // 默认高度
    scrollPosition: 0,
    arrowsVisible: true,
    arrowsTimer: null,
    showPhoneModal: false,  // 控制手机号授权弹窗
    phoneAuthLoading: false, // 授权加载状态
    isPhoneNumber: 0, // 是否已授权手机号
    title:""
  },
  onLoad: function (options) {
    const storeId = options.storeId || 1;
    this.loadTechInfo(storeId);
    this.showArrows();
    this.data.selectedTechnicianId = options.technicianId || null;
    this.data.autoOpenBooking = options.autoOpenBooking === 'true';
    let isPhoneNumber = wx.getStorageSync('isPhoneNumber') || 0;
    this.setData({
      isPhoneNumber: isPhoneNumber
    });
  },
  generateAvailableTimes() {
    const businessHours = this.data.selectedTechnician.businessHours || "14:00-02:00";
    const [startTime, endTime] = businessHours.split('-');

    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]);

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    let minHour = currentHour;
    let minMinute = currentMinute + 30;

    if (minMinute >= 60) {
      minHour += Math.floor(minMinute / 60);
      minMinute %= 60;
    }
    minHour %= 24;
    const generateTimeSlots = () => {
      const slots = [];
      if (startHour > endHour) {
        for (let hour = startHour; hour < 24; hour++) {
          slots.push(`${hour.toString().padStart(2, '0')}:00`);
          slots.push(`${hour.toString().padStart(2, '0')}:30`);
        }
        for (let hour = 0; hour <= endHour; hour++) {
          slots.push(`${hour.toString().padStart(2, '0')}:00`);
          slots.push(`${hour.toString().padStart(2, '0')}:30`);
        }
      } else {
        for (let hour = startHour; hour <= endHour; hour++) {
          slots.push(`${hour.toString().padStart(2, '0')}:00`);
          slots.push(`${hour.toString().padStart(2, '0')}:30`);
        }
      }

      return slots;
    };
    const allTimeSlots = generateTimeSlots();
    const filteredTimes = allTimeSlots.filter(time => {
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
    const timesStatus = filteredTimes.reduce((acc, time) => {
      acc[time] = false;
      return acc;
    }, {});

    this.setData({
      availableTimes: filteredTimes,
      availableTimesStatus: timesStatus,
      selectedTime: filteredTimes[0] || allTimeSlots[0],
      timeIndex: [0]
    });
  },
  onSelectTime(e) {
    const time = e.currentTarget.dataset.time;
    const currentStatus = { ...this.data.availableTimesStatus };
    const currentSelectedTimes = this.data.selectedTimes;
    const selectedCount = Object.values(currentStatus).filter(status => status).length;

    if (currentStatus[time]) {
      currentStatus[time] = false;
    } else {
      if (selectedCount === 0) {
        currentStatus[time] = true;
      }
      else if (selectedCount === 1) {
        if (selectedCount >= 2) {
          wx.showToast({
            title: '最多选择两个时间',
            icon: 'none'
          });
          return;
        }
        currentStatus[time] = true;
      }
    }
    const selectedTimes = Object.keys(currentStatus).filter(key => currentStatus[key]);

    this.setData({
      availableTimesStatus: currentStatus,
      selectedTimes: selectedTimes
    });
  },
  generateTimeSlots(startTime, endTime) {
    const times = [];
    let currentTime = this.parseTime(startTime);
    const endTimeObj = this.parseTime(endTime);
    let loopCount = 0;
    const maxLoops = 48; // 防止无限循环，最多生成48个时间槽（24小时 * 2）

    while (loopCount < maxLoops) {
      const formattedTime = this.formatTime(currentTime);
      times.push(formattedTime);
      currentTime = this.addMinutes(currentTime, 30);
      if (this.isTimeGreaterThan(currentTime, endTimeObj) &&
        this.isTimeGreaterThan(endTimeObj, currentTime)) {
        break;
      }
      if (currentTime.hours < this.parseTime(startTime).hours) {
        currentTime.hours = this.parseTime(startTime).hours;
        currentTime.minutes = 0;
      }

      loopCount++;
    }

    return times;
  },
  isTimeGreaterThan(time1, time2) {
    if (time1.hours < time2.hours) {
      return false;
    } else if (time1.hours > time2.hours) {
      return true;
    } else {
      return time1.minutes > time2.minutes;
    }
  },

  parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
  },

  formatTime(timeObj) {
    const hours = timeObj.hours.toString().padStart(2, '0');
    const minutes = timeObj.minutes.toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  addMinutes(timeObj, minutes) {
    let newHours = timeObj.hours;
    let newMinutes = timeObj.minutes + minutes;

    if (newMinutes >= 60) {
      newHours += Math.floor(newMinutes / 60);
      newMinutes %= 60;
    }
    newHours %= 24;

    return { hours: newHours, minutes: newMinutes };
  },

  compareTime(time1, time2) {
    if (time1.hours !== time2.hours) {
      return time1.hours - time2.hours;
    }
    return time1.minutes - time2.minutes;
  },
  onConfirmBooking: function () {
    this.generateAvailableTimes();
    this.setData({
      showBookingPopup: true,
      selectedPeople: 1,
      selectedTime: null
    });
  },
  onSelectPeople(e) {
    const people = e.currentTarget.dataset.people;
    this.setData({
      selectedPeople: people
    });
  },
  onTimeChange(e) {
    const index = e.detail.value[0];
    this.setData({
      timeIndex: [index],
      selectedTime: this.data.availableTimes[index]
    });
  },
  onConfirmBookingDetail: function() {
    let that = this;
    
    if (!that.data.selectedTechnician || !that.data.selectedTechnician.userId) {
      wx.showToast({
        title: '请选择技师',
        icon: 'none'
      });
      return;
    }
    if (!that.data.selectedPeople) {
      wx.showToast({
        title: '请选择同行人数',
        icon: 'none'
      });
      return;
    }
    if (that.data.selectedTimes.length === 0) {
      wx.showToast({
        title: '请选择到店时间',
        icon: 'none'
      });
      return;
    }
    that.checkPhoneAuth().then(hasAuth => {
      if (hasAuth) {
        that.submitReservation();
      }
    });
  },

  onCloseBookingPopup() {
    this.setData({
      showBookingPopup: false,
      selectedTimes: []
    });
  },
  preventTouchMove() {
    return false;
  },
  loadTechInfo: function (storeId) {
    let that = this;
    util.request(api.ReservationInfo, {
    }).then(function (res) {
      that.setData({
        rules: res.data.rules || [],
        title: res.data.title || "服务专员"
      });
  
      if (res.code === 200 && res.data.list && res.data.list.length > 0) {
        const infoList = res.data.list.map((info, index) => {
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
        let selectedTechnician = infoList[0];
        if (that.data.selectedTechnicianId) {
          const targetTech = infoList.find(tech => 
            tech.userId == that.data.selectedTechnicianId);
          if (targetTech) {
            selectedTechnician = targetTech;
          }
        }
  
        that.setData({
          technicians: infoList,
          selectedTechnician: selectedTechnician
        });
        if (that.data.autoOpenBooking) {
          setTimeout(() => {
            that.onConfirmBooking();
          }, 300);
        }
      }
    }).catch(function (error) {
      console.error('获取预约信息失败', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    });
  },

  /**
   * 选择技师
   */
  onSelectTechnician: function (e) {
    const technician = e.currentTarget.dataset.technician;
    this.setData({
      selectedTechnician: technician
    });
  },

  /**
   * 选择套餐
   */
  onSelectPackage: function (e) {
    const packageInfo = e.currentTarget.dataset.package;
    this.setData({
      selectedPackage: packageInfo
    });
  },

  /**
   * 照片预览
   */
  onPhotoPreview: function (e) {
    const photos = e.currentTarget.dataset.photos;
    const index = e.currentTarget.dataset.index;
    this.setData({
      showImageModal: true,
      previewPhotos: photos,
      currentImageIndex: index
    });
  },

  /**
   * 关闭图片预览
   */
  onCloseImageModal: function () {
    this.setData({
      showImageModal: false
    });
  },

  /**
   * 图片切换
   */
  onImageChange: function (e) {
    this.setData({
      currentImageIndex: e.detail.current
    });
  },
  onPhotoLoad: function (e) {
    const { index } = e.currentTarget.dataset;
    const { width, height } = e.detail;
    const viewWidth = wx.getSystemInfoSync().windowWidth * 0.9;
    const scaledHeight = (height / width) * viewWidth;
    let photoHeights = this.data.photoHeights;
    photoHeights[index] = scaledHeight;

    this.setData({
      photoHeights
    });
    if (index === this.data.currentPhotoIndex) {
      this.adjustSwiperHeight(index);
    }
  },
  onSwiperChange: function (e) {
    const current = e.detail.current;
    this.setData({ currentPhotoIndex: current });
    this.adjustSwiperHeight(current);
  },
  goToSlide: function (e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      currentPhotoIndex: index
    });
  },

  adjustSwiperHeight: function (index) {
    if (this.data.photoHeights[index]) {
      const photoHeight = this.data.photoHeights[index];
      const verticalPadding = 48; // 上下内边距各24rpx
      const indicatorHeight = 200; // 估计值，根据实际情况调整
      console.log(photoHeight)
      const totalHeight = photoHeight + verticalPadding + indicatorHeight;

      this.setData({
        photoSwiperHeight: Math.max(totalHeight, 400)
      });
    }
  },
  scrollLeft: function() {
    const newPosition = Math.max(0, this.data.scrollPosition - 160);
    this.setData({
      scrollPosition: newPosition
    });
  },
  
  scrollRight: function() {
    const newPosition = this.data.scrollPosition + 160;
    this.setData({
      scrollPosition: newPosition
    });
  },showArrows: function() {
    if (this.data.arrowsTimer) {
      clearTimeout(this.data.arrowsTimer);
    }
    this.setData({ arrowsVisible: true });
    const timer = setTimeout(() => {
      this.setData({ arrowsVisible: false });
    }, 2000);
    
    this.setData({ arrowsTimer: timer });
  },onUnload: function() {
    if (this.data.arrowsTimer) {
      clearTimeout(this.data.arrowsTimer);
    }
  },
  checkPhoneAuth: function() {
    if (this.data.isPhoneNumber == 1) {
      return Promise.resolve(true);
    } else {
      this.setData({
        showPhoneModal: true
      });
      return Promise.resolve(false);
    }
  },
  closePhoneModal: function() {
    this.setData({
      showPhoneModal: false
    });
  },
  onGetPhoneNumber: function(e) {
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
        this.submitReservation();
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
  submitReservation: function() {
    let that = this;
    wx.getLocation({
        type: 'wgs84',
        success: function(locationRes) {
            proceedWithSubmission(locationRes.latitude, locationRes.longitude);
        },
        fail: function(err) {
            console.error('获取位置失败', err);
            proceedWithSubmission(0, 0);
        }
    });
    function proceedWithSubmission(lat, lng) {
        util.subMessage()
          .then((res) => { console.log(res) })
          .catch((err) => { console.log(err) })
          .finally(() => {
            const bookingData = {
              technicianId: that.data.selectedTechnician.userId,
              peopleCount: that.data.selectedPeople,
              primaryTime: that.data.selectedTimes[0],
              backupTime: that.data.selectedTimes[1] || null,
              latitude: lat,
              longitude: lng
            };
      
            wx.showLoading({ title: '预约中...' });
      
            util.request(api.ReservationCreate, bookingData)
              .then(res => {
                wx.hideLoading();
                if (res.code === 200) {
                  wx.showToast({
                    title: '预约成功',
                    icon: 'success',
                    duration: 1500
                  });
                  that.setData({
                    showBookingPopup: false
                  });
      
                  setTimeout(() => {
                    wx.redirectTo({
                      url: '/pages/payResult/payResult?status=3&orderId=' + that.data.orderId
                    });
                  }, 500);
                } else {
                  wx.showToast({
                    title: res.msg || '预约失败',
                    icon: 'none'
                  });
                }
              })
              .catch(err => {
                wx.hideLoading();
                console.error('预约失败', err);
                wx.showToast({
                  title: '预约失败，请重试',
                  icon: 'none'
                });
              });
          });
    }
}
});
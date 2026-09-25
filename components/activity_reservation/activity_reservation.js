Component({
  /**
   * 组件的属性列表
   */
  properties: {

    visible: {
      type: Boolean,
      value: false
    },

    title: {
      type: String,
      value: '预约顶级技师'
    },

    subtitle: {
      type: String,
      value: '享受专属服务'
    },

    featureTags: {
      type: Array,
      value: [
        { icon: '👑', text: '顶级技师甄选' },
        { icon: '🛡️', text: '新客零风险' },
        { icon: '⏰', text: '免排队直达' }
      ]
    },

    promotionTag: {
      type: Object,
      value: { icon: '🎁', text: '立减50元' }
    },

    benefits: {
      type: Array,
      value: [
        { 
          icon: '✨', 
          title: '精英技师服务', 
          desc: '店内百里挑一，服务品质有保障' 
        }
      ]
    },

    technicians: {
      type: Array,
      value: []
    },

    techSectionTitle: {
      type: String,
      value: '热门技师'
    },

    techSectionBadge: {
      type: String,
      value: '实时推荐'
    },

    buttonText: {
      type: String,
      value: '立即预约·抢占名额'
    },

    guaranteeText: {
      type: String,
      value: '🔒 平台保障·售后无忧'
    },

    bookingUrl: {
      type: String,
      value: '/pages/reservation/reservation'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的生命周期
   */
  lifetimes: {
    attached() {

    },
    detached() {

    }
  },

  /**
   * 组件的方法列表
   */
  methods: {

    show() {
      this.setData({ visible: true });
    },

    closeModal() {
      this.setData({ visible: false });
      this.triggerEvent('close');
    },

    confirmBooking() {
      wx.showLoading({ title: '正在跳转...' });
      
      setTimeout(() => {
        wx.hideLoading();
        this.closeModal();

        wx.navigateTo({
          url: this.data.bookingUrl
        });
      }, 500);
    },

    preventMove() {
      return false;
    }
  }
})
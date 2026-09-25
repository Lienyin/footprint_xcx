Component({
  properties: {
    data: {
      type: Object,
      value: {}
    },
    visible: {
      type: Boolean,
      value: false,
      observer: function(newVal) {

        if (newVal) {
          this.showPopup();
        } else {
          this.setData({ show: false });
        }
      }
    }
  },
  data: {
    show: false
  },
  methods: {

    stopEvent() {},

    onClose() {
      this.setData({ show: false });
      this.triggerEvent('close');
    },

    onBtnClick() {

      this.triggerEvent('action');
      this.onClose();
    },

    showPopup() {
      this.setData({ show: true });
    }
  }
});
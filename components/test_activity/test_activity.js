Component({
  properties: {
    src: { type: String, value: '' },
    scale: { type: Number, value: 0.55 },
    animate: { type: Boolean, value: true },
    imageNavUrl: { type: String, value: '' },
    closeOnMask: { type: Boolean, value: true },
    visible: { type: Boolean, value: false } 
  },
  data: {
    imageWidth: 0,
    imageHeight: 0
  },
  attached() {
    this.updateSize();
    if (wx.onWindowResize) {
      this._onResize = () => this.updateSize();
      wx.onWindowResize(this._onResize);
    }
  },
  detached() {
    if (this._onResize && wx.offWindowResize) {
      wx.offWindowResize(this._onResize);
    }
  },
  methods: {
    updateSize() {
      const baseW = 500;
      const baseH = 889;
      try {
        const sys = wx.getSystemInfoSync();
        const w = sys.windowWidth;
        const h = sys.windowHeight;
        const fitScale = Math.min(w / baseW, h / baseH);
        const finalScale = Math.max(0, Math.min(this.data.scale, fitScale));
        this.setData({
          imageWidth: Math.floor(baseW * finalScale),
          imageHeight: Math.floor(baseH * finalScale)
        });
      } catch (e) {
        this.setData({ imageWidth: baseW, imageHeight: baseH });
      }
    },
    onMaskTap() {
      if (this.data.closeOnMask) {
        this.triggerEvent("close", { reason: "mask" });
      }
    },
    onCloseTap() {
      this.triggerEvent("close", { reason: "x" });
    },
    onPrimaryTap() {
      this.triggerEvent("primary");
    },
    onImageTap() {
      this.triggerEvent("imageTap", { url: this.data.imageNavUrl });
      if (this.data.imageNavUrl) {
        try {
          wx.navigateTo({ url: this.data.imageNavUrl });
        } catch (err) {
        }
      }
    },
    onImgError() {
      this.triggerEvent("imageTap", { url: '' });
    }
  }
});
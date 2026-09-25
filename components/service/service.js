
Component({
  options: {
    addGlobalClass: true,
    multipleSlots: true
  },
  properties: {
    customerQrCode: {
      type: String,
      value: 'https://www.lianzhenkj.com/img/qywx.png'
    }
  },

  data: {
    showCustomerModal: false
  },

  methods: {
    showCustomerQrCode() {
      this.setData({
        showCustomerModal: true
      })
    },
    closeCustomerModal() {
      this.setData({
        showCustomerModal: false
      })
    },
    saveCustomerQrCode() {
      wx.downloadFile({
        url: this.properties.customerQrCode,
        success: (res) => {
          if (res.statusCode === 200) {
            wx.saveImageToPhotosAlbum({
              filePath: res.tempFilePath,
              success: () => {
                wx.showToast({
                  title: '保存成功，请打开微信扫码添加',
                  icon: 'none',
                  duration: 2000
                })
                this.closeCustomerModal()
              },
              fail: (err) => {
                wx.showToast({
                  title: '保存失败',
                  icon: 'none'
                })
              }
            })
          }
        },
        fail: () => {
          wx.showToast({
            title: '下载二维码失败',
            icon: 'none'
          })
        }
      })
    },
    preventTap() {}
  }
})
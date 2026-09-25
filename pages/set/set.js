const util = require('../../utils/util.js');  
const api = require('../../config/api.js');  
const app = getApp()  

Page({  
  data: {  
    customerDetail: {  
    },  
    nickname: '',  
    technicianCode: '',  
    phoneNumber: '',  
    showPhone: false,  
    phoneAuthLoading: false // 新增授权加载状态  
  },  
  onLoad: function (options) {  
    var that = this;  
  },  
  onShow: function () {  
    var that = this;  
    util.request(api.UserDetail, {  
    }).then(function (res) {  
      if (res.code === 200) {  
        that.setData({  
          nickname: res.data.nickname,  
          technicianCode: res.data.technicianCode,  
          customerDetail: res.data,  
          phoneNumber: res.data.phoneNumber  
        })  
      }  
    }).catch((error) => { });  
  },  
  base64(url) {  
    return new Promise((resolve, reject) => {  
      wx.getFileSystemManager().readFile({  
        filePath: url, //选择图片返回的相对路径  
        encoding: 'base64', //编码格式  
        success: res => {  
          resolve(res.data)  
        },  
        fail: res => reject(res.errMsg)  
      })  
    })  
  },  
  onChooseAvatar(e) {  
    var that = this;  
    const { avatarUrl } = e.detail  

    wx.getFileSystemManager().readFile({  
      filePath: avatarUrl, //选择图片返回的相对路径  
      encoding: 'base64', //编码格式  
      success: res => {  
          util.request(api.updateCustomer, {  
            avatar: res.data  
          }).then(function (res) {  
            if (res.code === 200) {  
              util.showSuccessToast('头像修改成功')  
              that.data.customerDetail.avatar = avatarUrl  
              that.setData({  
                customerDetail: that.data.customerDetail  
              })  
            }  
          }).catch((error) => {  
            util.showErrorToast('头像修改失败')  
          });  
      },  
      fail: res => {  
        util.showErrorToast('头像修改失败')  
      }  
    })  

  },  
  setNickname: function () {  
    var that = this;  
    if (that.data.nickname != that.data.customerDetail.nickname) {  
      util.request(api.UserUpdate, {  
        nickname: that.data.nickname  
      }).then(function (res) {  
        if (res.code === 200) {  
          util.showSuccessToast('昵称修改成功')  
          that.data.customerDetail.nickname = that.data.nickname  
          that.setData({  
            customerDetail: that.data.customerDetail  
          })  
        }  
      }).catch((error) => {  
        util.showErrorToast('昵称修改失败')  
      });  
    }  
  },  
  setTechnicianCode: function () {  
    var that = this;  
    if (that.data.technicianCode != that.data.customerDetail.technicianCode) {  
      util.request(api.UserUpdate, {  
        technicianCode: that.data.technicianCode  
      }).then(function (res) {  
        if (res.code === 200) {  
          util.showSuccessToast('技师编码修改成功')  
          that.data.customerDetail.technicianCode = that.data.technicianCode  
          that.setData({  
            customerDetail: that.data.customerDetail  
          })  
        }  
      }).catch((error) => {  
        util.showErrorToast('技师编码修改失败')  
      });  
    }  
  },  
  setPhone: function () {  
    if(!this.data.customerDetail.phoneNumber){  
      this.setData({  
        showPhone: true  
      })  
    }  
  },  
  closePhone: function () {  
    this.setData({  
      showPhone: false,  
      phoneNumber: ''  
    })  
  },  
  onGetPhoneNumber(e) {  
    var that = this;  
    if (e.detail.errMsg !== "getPhoneNumber:ok") {  
      return;  
    }  
    this.setData({  
      phoneAuthLoading: true  
    });  
    
    util.request(api.GetAndUpdPhoneNumber, {  
      code: e.detail.code  
    }, 'POST').then(function (res) {  
      if (res.code === 200) {  
        that.data.customerDetail.phoneNumber = res.data.phoneNumber  
        that.setData({  
          customerDetail: that.data.customerDetail,  
          showPhone: false,  
          phoneAuthLoading: false // 恢复状态  
        });  
        wx.setStorageSync('isPhoneNumber', 1);  
        util.showSuccessToast('手机号绑定成功');  
      } else {  
        that.setData({  
          phoneAuthLoading: false  
        });  
        util.showErrorToast(res.msg || '手机号绑定失败');  
      }  
    }).catch((error) => {  
      that.setData({  
        phoneAuthLoading: false  
      });  
      util.showErrorToast('手机号绑定失败');  
    });  
  },  
  preventTouchMove() {  
    return false;  
  }  
})
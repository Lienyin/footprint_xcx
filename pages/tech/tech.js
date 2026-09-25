const util = require('../../utils/util.js');
const api = require('../../config/api.js');

Page({
  data: {
    serviceTypes: [], // 存储服务类型和选中状态
    techDetail: {}, 
    technicianName: '',
    technicianCode: '',
    workExperience: '',
    uploadedPhotos: [], // 上传的照片
    headUrl: '', // 头部照  
    upperBodyUrl: '', // 上半身照  
    wholeBodyUrl: '', // 全身照  
    lifeUrl: '', // 生活照  
    professionUrl: '', // 职业照  
  },

  onLoad: function(options) {
    this.loadServiceTypes();
    this.loadTechDetail();
  },
  bindWorkExperienceInput: function(e) {
    const value = e.detail.value.replace(/[^\d]/g, '');
    this.setData({
      workExperience: value
    });
  },
  getPhotoByType: function(type) {
    const photo = this.data.uploadedPhotos.find(p => p.type === type);
    return photo ? photo.url : null;
  },
  loadServiceTypes: function() {
    util.request(api.TechServiceType)
      .then(res => {
        if (res.code === 200) {
          const serviceTypesWithSelection = (res.data || []).map(item => ({
            ...item,
            selected: false
          }));

          this.setData({
            serviceTypes: serviceTypesWithSelection
          });
        }
      })
      .catch(error => {
        wx.showToast({
          title: '加载服务类型失败',
          icon: 'none'
        });
      });
  },

  loadTechDetail: function() {
    util.request(api.TechDetail)
      .then(res => {
        if (res.code === 200) {
          const detail = res.data || {};
          const selectedServiceCodes = detail.serviceType ? 
            detail.serviceType.split(',') : []; 
          const updatedServiceTypes = this.data.serviceTypes.map(item => ({
            ...item,
            selected: selectedServiceCodes.includes(item.code.toString())
          }));
          let photoObj = {};
          try {
            photoObj = JSON.parse(detail.photo || '{}');
          } catch (error) {
            console.error('解析照片失败', error);
          }

          this.setData({
            techDetail: detail,
            technicianName: detail.technicianName || '',
            technicianCode: detail.technicianCode || '',
            workExperience: detail.workExperience || '',
            serviceTypes: updatedServiceTypes,
            headUrl: photoObj.headUrl || '',
            upperBodyUrl: photoObj.upperBodyUrl || '',
            wholeBodyUrl: photoObj.wholeBodyUrl || '',
            lifeUrl: photoObj.lifeUrl || '',
            professionUrl: photoObj.professionUrl || ''
          });
        }
      })
      .catch(error => {
        wx.showToast({
          title: '加载技师详情失败',
          icon: 'none'
        });
      });
  },
  selectTag: function(event) {
    const code = event.currentTarget.dataset.code;
    const updatedServiceTypes = this.data.serviceTypes.map(item => 
      item.code === code ? { ...item, selected: !item.selected } : item
    );

    this.setData({
      serviceTypes: updatedServiceTypes
    });
  },
  bindNameInput: function(e) {
    this.setData({
      technicianName: e.detail.value
    });
  },

  bindCodeInput: function(e) {
    this.setData({
      technicianCode: e.detail.value
    });
  },

  bindExperienceInput: function(e) {
    this.setData({
      workExperience: e.detail.value
    });
  },
uploadImage: function(event) {
  const type = event.currentTarget.dataset.type; // 现在直接是 URL 属性名
  const that = this;

  wx.chooseImage({
    count: 1,
    success: function(res) {
      const photoUrl = res.tempFilePaths[0];
      wx.uploadFile({
        url: api.FileUpload,
        filePath: photoUrl,
        name: 'file',
        success: function(uploadRes) {
          const data = JSON.parse(uploadRes.data);
          if (data.code === 200) {
            that.setData({
              [type]: data.data.url
            });
          } else {
            wx.showToast({
              title: '上传失败',
              icon: 'none'
            });
          }
        },
        fail: function() {
          wx.showToast({
            title: '上传失败',
            icon: 'none'
          });
        }
      });
    }
  });
},
  submitForm: function() {
    const { 
      technicianName, 
      technicianCode, 
      serviceTypes, 
      headUrl,
      upperBodyUrl,
      wholeBodyUrl,
      lifeUrl,
      professionUrl,
      workExperience
    } = this.data;
    const selectedServiceCodes = serviceTypes
      .filter(item => item.selected)
      .map(item => item.code.toString());
    const photoVo = {
      headUrl: headUrl || '',
      upperBodyUrl: upperBodyUrl || '',
      wholeBodyUrl: wholeBodyUrl || '',
      lifeUrl: lifeUrl || '',
      professionUrl: professionUrl || ''
    };
    if (!technicianName) {
      wx.showToast({
        title: '请输入技师昵称',
        icon: 'none'
      });
      return;
    }

    if (!technicianCode) {
      wx.showToast({
        title: '请输入技师编号',
        icon: 'none'
      });
      return;
    }
    if (selectedServiceCodes.length === 0) {
      wx.showToast({
        title: '请选择至少一个服务类型',
        icon: 'none'
      });
      return;
    }
    if (!workExperience) {
      wx.showToast({
        title: '请输入工作年限',
        icon: 'none'
      });
      return;
    }
    const submitData = {
      technicianName,
      technicianCode,
      serviceType: selectedServiceCodes.join(','), // 传递选中的 code
      photoVo: photoVo, 
      workExperience: workExperience || ''
    };
    util.request(api.TechUpdate, submitData, 'POST')
      .then(res => {
        if (res.code === 200) {
          wx.showToast({
            title: '提交成功',
            icon: 'success',
            duration: 1500
          });
          setTimeout(() => {
            wx.navigateBack({
              delta: 1
            });
          }, 1500);
        } else {
          wx.showToast({
            title: res.msg || '提交失败',
            icon: 'none'
          });
        }
      })
      .catch(error => {
        wx.showToast({
          title: '提交失败',
          icon: 'none'
        });
        console.error('提交错误', error);
      });
  }
});
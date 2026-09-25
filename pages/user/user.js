const util = require('../../utils/util.js');
const api = require('../../config/api.js');
Page({
  data: {
    storeIndex: 0,
    stores:[],
    roleIndex: 0, 
    roles: [{
        id: -1,
        name: '全部角色'
      },
      {
        id: 0,
        name: '客户'
      },
      {
        id: 1,
        name: '客服'
      },
      {
        id: 2,
        name: '技师'
      },
      {
        id: 3,
        name: '超管'
      }
    ],
    rolesForModal: [ // 修改角色弹窗中的选项（不包含全部角色）  
      {
        id: 0,
        name: '客户'
      },
      {
        id: 1,
        name: '客服'
      },
      {
        id: 2,
        name: '技师'
      },
      {
        id: 3,
        name: '超管'
      }
    ],
    storesForModal:[],
    searchText: '',
    userList: [],
    showRoleModal: false,
    currentUserId: null,
    modalRoleIndex: 0,
    modalStoreIndex: 0,

    loadStatus: "loading",
    showLoading: false,
    showCate: false,
    page: 1,
    pageSize: 20,
    storeId: 0,
    keywords: '',
    technicianCode:'',
  commissionRates: ['0.00', '0.01', '0.02', '0.03', '0.04', '0.05'],
  commissionRateIndex: 0,
  },

  onLoad: function () {
    let that = this;
    that.loadUserData();
    util.request(api.StoreList, {
    }).then(function (res) {
      if (res.code === 200) {
        const storesForPicker = res.data.slice(1); // 移除第一项  
        that.setData({
          stores:res.data,
          storesForModal:storesForPicker
        });
      }
    }).catch((error) => {
    });
  },

  loadUserData: function () {
    this.getUserList()
  },

  onRoleChange: function (e) {
    const roleIndex = parseInt(e.detail.value);
    this.setData({
      roleIndex,
      page: 1,
      pageSize: 20,
      userList:[]
    });
    this.getUserList();
  },

  onStoreChange: function (e) {
    let that = this;
    const storeIndex = parseInt(e.detail.value);
    that.setData({
      storeIndex,
      storeId:that.data.stores[storeIndex].storeId,
      page: 1,
      pageSize: 20,
      userList:[]
    });
    that.getUserList();
  },

  onSearchInput: function (e) {
    this.setData({
      searchText: e.detail.value,
      page: 1,
      pageSize: 20,
      userList:[]
    });
    this.getUserList();
  },
  getRoleName: function (roleId) {
    const role = this.data.rolesForModal.find(r => r.id === roleId);
    return role ? role.name : '';
  },
  onCommissionRateChange: function(e) {
    this.setData({
      commissionRateIndex: e.detail.value
    });
  },
  showRoleChangeModal: function (e) {
    const userId = e.currentTarget.dataset.id;
    const user = this.data.userList.find(u => u.userId === userId);
    const modalRoleIndex = this.data.rolesForModal.findIndex(r => r.id === user.identityFlag);
    const modalStoreIndex = this.data.storesForModal.findIndex(r => r.storeId === user.storeId);
    let commissionRateIndex = 0;
    if (user.commissionRate !== null && user.commissionRate !== undefined) {
      const formattedRate = parseFloat(user.commissionRate).toFixed(2);
      console.log(formattedRate)
      const foundIndex = this.data.commissionRates.findIndex(rate => rate === formattedRate);
      if (foundIndex !== -1) {
        commissionRateIndex = foundIndex;
      }
    }
    
    this.setData({
      showRoleModal: true,
      currentUserId: userId,
      technicianCode: user.technicianCode,
      modalRoleIndex: modalRoleIndex >= 0 ? modalRoleIndex : 0,
      modalStoreIndex: modalStoreIndex >= 0 ? modalStoreIndex : 0,
      commissionRateIndex: commissionRateIndex
    });
  },

  onTechCodeInput(e) {  
    this.setData({  
      technicianCode: e.detail.value  
    });  
  },  
  hideRoleModal: function () {
    this.setData({
      showRoleModal: false
    });
  },

  onModalRoleChange: function (e) {
    this.setData({
      modalRoleIndex: e.detail.value
    });
  },

  onModalStoreChange: function (e) {
    this.setData({
      modalStoreIndex: e.detail.value
    });
  },

  confirmRoleChange: function () {
    let that = this;
    const newRoleId = that.data.rolesForModal[that.data.modalRoleIndex].id;
    const newStoreId = that.data.storesForModal[that.data.modalStoreIndex].storeId;

    util.request(api.UserUpdateRole, {  
      userId: that.data.currentUserId,  
      technicianCode: that.data.technicianCode,  
      identityFlag: newRoleId,  
      storeId: newStoreId,  
    commissionRate: parseFloat(that.data.commissionRates[that.data.commissionRateIndex])
    }).then(function (res) {  
      if (res.code === 200) {  
        util.showSuccessToast('修改成功');  
        const updatedUserList = that.data.userList.map(user => {  
          if (user.userId === that.data.currentUserId) {  
            return {  
              ...user, // 保留用户的其他属性  
              technicianCode: that.data.technicianCode,  
              identityFlag: newRoleId,  
              storeId: newStoreId,  
              commissionRate:parseFloat(that.data.commissionRates[that.data.commissionRateIndex]),
              roleName: that.data.rolesForModal.find(r => r.id === newRoleId)?.name || user.roleName,  
              storeName: newStoreId ? that.data.storesForModal.find(s => s.storeId === newStoreId)?.storeName || user.storeName : '全门店'  
            };  
          }  
          return user; // 其他用户保持不变  
        });  
        
        that.setData({  
          showRoleModal: false,  
          userList: updatedUserList,  
          technicianCode: '',  
          currentUserId: null  
        });  
        
      } else {  
        util.showErrorToast(res.msg || '修改失败');  
      }  
    }).catch((error) => {  
      util.showErrorToast('网络异常，请重试');  
    });

  },
  loadMore: function () {
    let that = this;
    if (that.data.loadStatus === 'noMore') {
      return;
    } else {
      that.data.page = that.data.page + 1;
      that.getUserList();
    }
  },
  getUserList() {
    let that = this;
    wx.showLoading({
      title: '',
      mask: true
    });
    that.setData({
      showCate: true,
      showLoading: true,
      loadStatus: "loading"
    })
    let showLoading = false;
    let loadStatus = "loadmore";
    util.request(api.UserList, {
      keywords: that.data.searchText,
      storeId: that.data.storeId,
      identityFlag: that.data.roles[that.data.roleIndex].id,
      pageSize: that.data.pageSize,
      page: that.data.page,
    }).then(function (res) {
      if (res.code === 200) {
        if (res.data != null && res.data.length != 0) {
          if (res.data.length < 20) {
            showLoading = true;
            loadStatus = "noMore"
          }
          const list = res.data.map(item => {
            item.roleName = that.getRoleName(item.identityFlag);
            return item;
          });
          that.setData({
            userList: that.data.userList.concat(list),
          })
        }
      }
    }).catch((error) => {

    }).finally(() => {
      wx.hideLoading();
      that.setData({
        showCate: true,
        showLoading: showLoading,
        loadStatus: loadStatus
      })
    });
  },
});
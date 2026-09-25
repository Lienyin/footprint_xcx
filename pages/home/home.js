const util = require('../../utils/util.js');
const api = require('../../config/api.js');
Page({
  data: {
    currentCategory: 0,
    storeId: 0,
    showShopList: false,
    shops: [],
    currentShop: null,
    categories: [],
    products: [],
    currentProducts: [],
    shareProduct: null,
    identityFlag: 0,
    showNumEditor: false,  // 是否显示数量编辑器
    editingNum: 1,         // 正在编辑的数量
    editingIndex: -1,      // 正在编辑的商品索引
  },
  onLoad: function (options) {
    let that = this;
    console.log('页面加载参数:', options);
    if (options && options.store) {
      try {
        const store = JSON.parse(decodeURIComponent(options.store));
        if (store && store.storeId && store.storeId > 0) {
          that.initWithStoreData(store);
        } else {
          console.warn('传入的店铺数据无效:', store);
          this.redirectToStoreSelection();
        }
      } catch (error) {
        console.error('解析店铺数据失败:', error);
        this.redirectToStoreSelection();
      }
    } else if (options && options.storeId) {
      try {
        if (options.storeId && options.storeId > 0) {

          util.request(api.StoreDetail + options.storeId, {
          }).then(function (res) {
            if (res.code === 200 && res.data) {
              that.initWithStoreData(res.data);
            }
          }).catch((error) => { });
        } else {
          console.warn('传入的店铺数据无效:', store);
          this.redirectToStoreSelection();
        }
      } catch (error) {
        console.error('解析店铺数据失败:', error);
        this.redirectToStoreSelection();
      }
    } else {
      const storeId = wx.getStorageSync('storeId');
      const store = wx.getStorageSync('store');

      if (storeId && store) {
        this.initWithStoreData(store);
      } else {
        console.warn('未找到有效的店铺信息，跳转到店铺选择页');
        this.redirectToStoreSelection();
      }
    }
  },

  /**  
   * 使用店铺数据初始化页面  
   * @param {Object} store - 店铺数据  
   */
  initWithStoreData: function (store) {
    wx.setStorageSync('storeId', store.storeId);
    wx.setStorageSync('store', store);
    this.setData({
      storeId: store.storeId,
      currentShop: store
    });

  },

  /**  
   * 重定向到店铺选择页面  
   */
  redirectToStoreSelection: function () {
    wx.switchTab({
      url: '/pages/store/store',
      fail: (err) => {
        console.error('跳转到店铺选择页失败:', err);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },
  onShow: function () {
    this.loadPackage();
  },

  loadPackage() {
    var that = this;
    util.request(api.CategoryList + that.data.storeId, {}).then(function (res) {
      if (res.code === 200) {
        that.setData({
          currentCategory: 0,
          categories: res.data
        })
        util.request(api.PackageList + that.data.storeId, {}).then(function (res) {
          if (res.code === 200) {
            if (res.data && Array.isArray(res.data) && res.data.length > 0) {
              const formattedItems = res.data.map(item => {
                const priceStr = item.price.toFixed(2);

                let discountText = '';
                if (item.originalPrice > 0) {
                  const discount = (item.price / item.originalPrice * 10).toFixed(1);
                  discountText = discount === '10.0' ? '' : discount + '折';
                }
                return {
                  ...item,
                  discount: discountText,
                  priceInteger: priceStr.split('.')[0],
                  priceDecimal: priceStr.split('.')[1]
                };
              });

              that.setData({
                products: formattedItems
              });
              if (that.data.categories && Array.isArray(that.data.categories) && that.data.categories.length > 0) {
                that.filterProductsByCategory(that.data.categories[0].categoryId);
              } else {
                that.setData({
                  currentProducts: []
                });
              }
            } else {
              that.setData({
                products: [],
                currentProducts: []
              });
            }
          }
        })
      }
    })
    that.refreshCart();
  },

  switchCategory(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      currentCategory: index
    });
    this.filterProductsByCategory(this.data.categories[index].categoryId);
  },

  filterProductsByCategory(categoryIndex) {
    const filteredProducts = this.data.products
      .filter(item => item.categoryId === categoryIndex)
      .sort((a, b) => {
        return (a.sort || 0) - (b.sort || 0);
      });

    this.setData({
      currentProducts: filteredProducts
    });
  },

  showShopSelector() {
    this.setData({
      showShopList: true
    });
  },

  refreshCart() {
    const floatingCart = this.selectComponent('#floatingCart');
    if (floatingCart) {
      floatingCart.refreshCart(this.data.storeId);
    }
  },
  cartMinus(e) {
    var that = this;
    const index = e.currentTarget.dataset.index;
    let currentProducts = that.data.currentProducts;
    let products = that.data.products;
    if (currentProducts[index].num > 0) {
      currentProducts[index].num--;
      for (let i = 0; i < products.length; i++) {
        if (products[i].packageId === currentProducts[index].packageId) {
          products[i].num = currentProducts[index].num;
        }
      }
      that.setData({
        currentProducts,
        products
      });
      that.updateCartApi(currentProducts[index].packageId, currentProducts[index].num);
    }
  },
  cartAdd: function (e) {

    var that = this;
    const index = e.currentTarget.dataset.index;
    let currentProducts = that.data.currentProducts;
    let products = that.data.products;
    currentProducts[index].num++;
    for (let i = 0; i < products.length; i++) {
      if (products[i].packageId === currentProducts[index].packageId) {
        products[i].num = currentProducts[index].num;
      }
    }
    that.setData({
      currentProducts,
      products
    });
    that.updateCartApi(currentProducts[index].packageId, currentProducts[index].num);
  },
  clearCart() {
    let that = this;
    let products = that.data.products;
    let currentProducts = that.data.currentProducts;
    for (let i = 0; i < products.length; i++) {
      products[i].num = 0;
    }

    for (let i = 0; i < currentProducts.length; i++) {
      currentProducts[i].num = 0;
    }
    that.setData({
      products,
      currentProducts
    });
  },
  handleCart(e) {
    let that = this;
    const receivedData = e.detail;

    let products = that.data.products;
    let currentProducts = that.data.currentProducts;
    for (let i = 0; i < products.length; i++) {
      if (products[i].packageId === receivedData.packageId) {
        products[i].num = receivedData.num;
      }
    }
    for (let i = 0; i < currentProducts.length; i++) {
      if (currentProducts[i].packageId === receivedData.packageId) {
        currentProducts[i].num = receivedData.num;
      }
    }
    that.setData({
      products,
      currentProducts
    });
  },
  updateCartApi(id, count) {
    let that = this;
    wx.showLoading({
      title: '',
      mask: true
    })
    util.request(api.CartUpdByPid, {
      num: count,
      packageId: id
    }, 'POST').then(function (res) {
      if (res.code === 200) {
        that.refreshCart();
      }
      wx.hideLoading()
    });
  },
  setShareProduct(e) {
    const product = e.currentTarget.dataset.product;
    this.setData({
      shareProduct: product
    });
  },
  onShareAppMessage: function () {
    let that = this;
    if (that.data.shareProduct && that.data.shareProduct.packageId)
      return util.getShareConfig(null, that.data.shareProduct.packageId);
    else
      return util.getShareInviteConfig();
  },
  toPackageDetail: function (e) {
    const packageId = e.currentTarget.dataset.package_id;
    wx.navigateTo({
      url: "/pages/packageDetail/index?packageId=" + packageId
    });
  },// 在你的 Page 对象中添加这个空函数  
  doNothing: function () {
  },
  showNumEditor: function (e) {
    const index = e.currentTarget.dataset.index;
    const num = e.currentTarget.dataset.num;

    this.setData({
      showNumEditor: true,
      editingNum: num,
      editingIndex: index
    });
  },
  hideNumEditor: function () {
    this.setData({
      showNumEditor: false,
      editingIndex: -1
    });
  },
  stopPropagation: function () {
  },
  decreaseEditorNum: function () {
    let num = this.data.editingNum;
    if (num > 1) {
      this.setData({
        editingNum: num - 1
      });
    }
  },
  increaseEditorNum: function () {
    let num = this.data.editingNum;
    if (num < 99) {
      this.setData({
        editingNum: num + 1
      });
    }
  },
  onNumInput: function (e) {
    let value = e.detail.value;
    if (value === '') {
      this.setData({
        editingNum: value
      });
      return;
    }

    let num = parseInt(value);
    if (isNaN(num)) {
      num = 1;
    } else if (num < 1) {
      num = 1;
    } else if (num > 99) {
      num = 99;
    }

    this.setData({
      editingNum: num
    });
  },
  confirmNumEdit: function () {
    const index = this.data.editingIndex;
    let num = this.data.editingNum;
    if (num === '' || isNaN(parseInt(num))) {
      num = 1;
    } else {
      num = parseInt(num);
      if (num < 1) num = 1;
      if (num > 99) num = 99;
    }

    if (index >= 0 && index < this.data.currentProducts.length) {
      let currentProducts = this.data.currentProducts;
      let products = this.data.products;
      let oldNum = currentProducts[index].num;
      if (oldNum === num) {
        this.hideNumEditor();
        return;
      }
      currentProducts[index].num = num;
      for (let i = 0; i < products.length; i++) {
        if (products[i].packageId === currentProducts[index].packageId) {
          products[i].num = num;
        }
      }
      this.setData({
        currentProducts,
        products
      });
      this.updateCartApi(currentProducts[index].packageId, num);
    }
    this.hideNumEditor();
  },navigateToStore: function() {
  const that = this;
  if (!that.data.currentShop || !that.data.currentShop.latitude || !that.data.currentShop.longitude) {
    wx.showToast({
      title: '店铺位置信息不完整',
      icon: 'none'
    });
    return;
  }
  wx.getLocation({
    type: 'wgs84', // 使用国测局坐标系
    success: function(res) {
      wx.openLocation({
        latitude: parseFloat(that.data.currentShop.latitude),
        longitude: parseFloat(that.data.currentShop.longitude),
        name: that.data.currentShop.storeName,
        address: that.data.currentShop.address,
        scale: 18
      });
    },
    fail: function(error) {
      console.error('获取位置失败:', error);
      wx.showModal({
        title: '提示',
        content: '无法获取您的位置信息，是否仍然导航到店铺？',
        success: function(res) {
          if (res.confirm) {
            wx.openLocation({
              latitude: parseFloat(that.data.currentShop.latitude),
              longitude: parseFloat(that.data.currentShop.longitude),
              name: that.data.currentShop.storeName,
              address: that.data.currentShop.address,
              scale: 18
            });
          }
        }
      });
    }
  });
}
});
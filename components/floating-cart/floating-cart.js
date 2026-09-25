
const util = require('../../utils/util.js');
const api = require('../../config/api.js');

Component({
  properties: {

  },

  data: {
    isCartOpen: false,
    cartItems: [],
    totalPrice: 0,
    totalDiscount: 0,
    totalCount: 0
  },

  lifetimes: {
    attached() {


    }
  },

  methods: {

    fetchCartData(storeId) {
      const that = this;
      util.request(api.CartList + storeId).then(function (res) {
        if (res.code === 200) {
          that.updateCart(res.data);
        }
      });
    },

    updateCart(data) {
      let totalCount = 0;
      let totalPrice = 0;
      let totalDiscount = 0;

      if (data) {
        data.forEach(item => {
          totalCount += item.num;
          totalPrice += item.price * item.num;
          if (item.originalPrice && item.originalPrice > item.price) {
            totalDiscount += (item.originalPrice - item.price) * item.num;
          }
        });
        const formattedItems = data.map(item => {
          const priceStr = item.price.toFixed(2);

          return {
            ...item,
            priceInteger: priceStr.split('.')[0],
            priceDecimal: priceStr.split('.')[1],
          };
        });

        this.setData({
          cartItems: formattedItems,
          totalCount: totalCount,
          totalPrice: totalPrice.toFixed(2),
          totalDiscount: totalDiscount.toFixed(2)
        });
      }
    },

    toggleCart() {
      this.setData({
        isCartOpen: !this.data.isCartOpen
      });
    },

    clearCart() {
      const that = this;
      wx.showModal({
        title: '提示',
        content: '确定要清空购物车吗？',
        success: (res) => {
          if (res.confirm) {


            let storeId = wx.getStorageSync('storeId');
            util.request(api.CartClear + storeId, {
            }, 'POST').then(function (res) {
              if (res.code === 200) {
                that.setData({
                  cartItems: [],
                  totalCount: 0,
                  totalPrice: '0.00',
                  totalDiscount: 0
                });
                that.toggleCart();
                
          that.triggerEvent('clearCart');




              }
            });
          }
        }
      });
    },

    decreaseItem(e) {
      const id = e.currentTarget.dataset.id;
      const cartItems = this.data.cartItems;
      let totalCount = this.data.totalCount;
      let totalDiscount = parseFloat(this.data.totalDiscount);
      let totalPrice = parseFloat(this.data.totalPrice);

      const index = cartItems.findIndex(item => item.cartId === id);
      if (index !== -1) {
        if (cartItems[index].num > 1) {
          cartItems[index].num--;
          totalCount--;
          totalPrice -= cartItems[index].price;
          if (cartItems[index].originalPrice && cartItems[index].originalPrice > cartItems[index].price) {
            totalDiscount -= (cartItems[index].originalPrice - cartItems[index].price);
          }
          this.setData({
            cartItems: cartItems,
            totalCount: totalCount,
            totalDiscount: totalDiscount.toFixed(2),
            totalPrice: totalPrice.toFixed(2)
          });

          this.updateCartApi(id, cartItems[index].num, cartItems[index].packageId);
        } else {

          wx.showModal({
            title: '提示',
            content: '确定要移除该商品吗？',
            success: (res) => {
              if (res.confirm) {
                totalCount -= cartItems[index].num;
                totalPrice -= cartItems[index].price * cartItems[index].num;
                if (cartItems[index].originalPrice && cartItems[index].originalPrice > cartItems[index].price) {
                  totalDiscount -= (cartItems[index].originalPrice - cartItems[index].price)
                }

                this.removeCartItemApi(id,cartItems[index].packageId);
                cartItems.splice(index, 1);

                this.setData({
                  cartItems: cartItems,
                  totalCount: totalCount,
                  totalDiscount: totalDiscount.toFixed(2),
                  totalPrice: totalPrice.toFixed(2)
                });
              }
            }
          });
        }
      }
    },

    increaseItem(e) {
      const id = e.currentTarget.dataset.id;
      const cartItems = this.data.cartItems;
      let totalCount = this.data.totalCount;
      let totalDiscount = parseFloat(this.data.totalDiscount);
      let totalPrice = parseFloat(this.data.totalPrice);

      const index = cartItems.findIndex(item => item.cartId === id);
      if (index !== -1) {
        cartItems[index].num++;
        totalCount++;
        totalPrice += cartItems[index].price;

        if (cartItems[index].originalPrice && cartItems[index].originalPrice > cartItems[index].price) {
          totalDiscount += (cartItems[index].originalPrice - cartItems[index].price);
        }
        this.setData({
          cartItems: cartItems,
          totalCount: totalCount,
          totalDiscount: totalDiscount.toFixed(2),
          totalPrice: totalPrice.toFixed(2)
        });

        this.updateCartApi(id, cartItems[index].num, cartItems[index].packageId);
      }
    },

    updateCartApi(id, count, packageId) {
      let that = this;
      wx.showLoading({
        title: '',
        mask: true
      })
      util.request(api.CartUpd, {
        num: count,
        cartId: id
      }, 'POST').then(function (res) {
        if (res.code === 200) {
          const dataToSend = { packageId: packageId, num: count };
          that.triggerEvent('customEvent', dataToSend);
        } else {
        }
        wx.hideLoading()
      });
    },

    removeCartItemApi(id,packageId) {
      let that = this;
      util.request(api.CartDel, {
        cartIds: [id]
      }, 'POST').then(function (res) {
        if (res.code === 200) {
          const dataToSend = { packageId: packageId, num: 0 };
          that.triggerEvent('customEvent', dataToSend);
        }
      });
    },

    goToOrder() {

      let that = this;
      if (that.data.totalCount <= 0) {
        wx.showToast({
          title: '购物车是空的',
          icon: 'none'
        });
        return;
      } else {
        var data = encodeURIComponent(JSON.stringify(that.data.cartItems));
        wx.navigateTo({
          url: '/pages/orderCheck/check?data=' + data
        })
      }
    },

    refreshCart(storeId) {
      this.fetchCartData(storeId);
    }
  }
});
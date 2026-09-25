Page({  
  data: {  
    url: ''  
  },  
  
  onLoad: function(options) {  
    if (options.url) {  
      const decodedUrl = decodeURIComponent(options.url);  
      this.setData({  
        url: decodedUrl  
      });  
    } else {  
      wx.showToast({  
        title: '链接无效',  
        icon: 'none',  
        complete: () => {  
          setTimeout(() => {  
            wx.navigateBack({  
              delta: 1  
            });  
          }, 2000);  
        }  
      });  
    }  
  },  
  binderror: function(e) {  
    console.error('web-view加载错误', e.detail);  
    wx.showToast({  
      title: '页面加载失败',  
      icon: 'none'  
    });  
  }  
});
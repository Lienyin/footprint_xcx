var api = require('../config/api.js');
let isRedirectingToLogin = false;

/**
 * 封装微信的request
 */
function request(url, data = {}, method = "POST") {
  return new Promise(function (resolve, rejected) {
    if (isRedirectingToLogin && !url.includes('/auth/login')) {
      console.log('已在跳转登录页，取消请求:', url);
      rejected({message: 'Request cancelled: redirecting to login'});
      return;
    }
    
    try {
      const accountInfo = wx.getAccountInfoSync();
      const requestOptions = {
        url: url,
        data: data,
        method: method,
        header: {
          'Content-Type': 'application/json',
          'App-Id': accountInfo.miniProgram.appId,
          'Token': wx.getStorageSync('token')
        }
      };
      
      wx.request({
        ...requestOptions,
        success: function (res) {
          if (res.statusCode == 200) {
            if (res.data.code == 401 || res.data.code == 403) {
              if (!isRedirectingToLogin) {
                isRedirectingToLogin = true;
                console.log('检测到未授权状态，准备跳转到登录页');
                wx.removeStorageSync('userInfo');
                wx.removeStorageSync('token');
                setTimeout(function() {
                  console.log('执行跳转到登录页');
                  wx.reLaunch({
                    url: '/pages/login/login',
                    complete: function() {
                      setTimeout(function() {
                        isRedirectingToLogin = false;
                      }, 2000);
                    }
                  });
                }, 500);
              } else {
                console.log('已经在跳转到登录页，忽略重复跳转');
              }
              resolve(res.data);
            } else {
              resolve(res.data);
            }
          } else {
            rejected(res.errMsg);
          }
        },
        fail: function (err) {
          console.log('请求失败:', err);
          rejected(err);
          wx.hideLoading({});
        }
      });
    } catch (e) {
      console.error('请求预处理异常:', e);
      rejected(e);
    }
  });
}

/**
 * 重置登录跳转状态
 * 在登录页面onLoad时调用此函数
 */
function resetRedirectStatus() {
  if (isRedirectingToLogin) {
    console.log('手动重置登录跳转状态');
    isRedirectingToLogin = false;
  }
}

function showErrorToast(msg) {
  wx.showToast({
    title: msg,
    icon: 'none',
  });
}

function showSuccessToast(msg) {
  wx.showToast({
    title: msg,
    icon: 'success',
  });
}

/**  
 * 通用分享方法  
 * @param {String} orderId - 订单ID(可选)  
 * @returns {Object} 分享配置对象  
 */
const getShareConfig = function (orderId, packageId) {
  let userInfo = wx.getStorageSync('userInfo') || {};
  const userId = userInfo.userId || '';
  let title = orderId ? '限时特惠,买单立减超划算' : '速来查看,解锁超值优惠,畅享便捷买单';
  let path = '/pages/login/login';
  if (userId) {
    path += '?referrerId=' + userId;
  }

  if (orderId) {
    path += (userId ? '&' : '?') + 'orderId=' + orderId;
  }
  if (packageId) {
    path += (userId ? '&' : '?') + 'packageId=' + packageId;
  }

  return {
    title: title,
    path: path
  };
};

const getShareCouponConfig = function (couponUserId) {
  let userInfo = wx.getStorageSync('userInfo') || {};
  const userId = userInfo.userId || '';
  let title = '叮！您的好友给您投喂了一张优惠券，请及时查收！';
  let path = '/pages/login/login';
  if (userId) {
    path += '?referrerId=' + userId;
  }

  if (couponUserId) {
    path += (userId ? '&' : '?') + 'couponUserId=' + couponUserId;
  }
  return {
    title: title,
    path: path,
    imageUrl: 'https://www.lianzhenkj.com/img/couponShare.png',
  };
};
const getShareInviteConfig = function () {
  let userInfo = wx.getStorageSync('userInfo') || {};
  const userId = userInfo.userId || '';
  const shareTitles = [
    "新用户领现金红包 58元",
    "我在足惠多赚佣金 你也可以",
    "朋友都用这个省钱",
	"专属福利 首单58元现金抵用",
	"仅限今天 新用户领58元",
  ];
  const randomIndex = Math.floor(Math.random() * shareTitles.length);
  const title = shareTitles[randomIndex];
  
  let path = '/pages/login/login';
  if (userId) {
    path += '?route=1&referrerId=' + userId;
  }
  
  return {
    title: title,
    path: path,
    imageUrl: 'https://www.lianzhenkj.com/img/reservationShare_newYear.png',
  };
};
function subMessage(tmplIds = [
  'nrrjgy0HPJSKOaY9VsI6iGCmB3RQ3GrQ6xc4X1KOUZY'
]) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(tmplIds)) {
      reject({ success: false, error: '参数必须为数组', code: 400 });
      return;
    }

    if (tmplIds.length === 0) {
      reject({ success: false, error: '模板ID不能为空', code: 400 });
      return;
    }

    let userInfo = wx.getStorageSync('userInfo') || {};
    if (userInfo.identityFlag == 1 || userInfo.identityFlag == 3) {
      wx.requestSubscribeMessage({
        tmplIds,
        success(res) {
          const response = {
            success: tmplIds.every(id => res[id] === 'accept'),
            result: res,
            detail: tmplIds.map(id => ({
              tmplId: id,
              status: res[id] || 'reject' // 微信未返回的字段默认为拒绝
            }))
          };
          resolve(response);
        },
        fail(err) {
          const errorMap = {
            '10002': '网络错误',
            '10003': '用户取消'
          };
          reject({
            success: false,
            error: err.errMsg || '未知错误',
            code: err.errCode || 500,
            solution: errorMap[err.errCode] || '请检查网络后重试'
          });
        }
      });
    } else {
      resolve(1);
    }
  });
}
function checkNetworkStatus() {
  return new Promise((resolve) => {
    wx.getNetworkType({
      success(res) {
        const networkType = res.networkType;
        resolve({
          connected: networkType !== 'none',
          networkType: networkType
        });
      },
      fail() {
        resolve({
          connected: false,
          networkType: 'unknown'
        });
      }
    });
  });
}

module.exports = {
  request,
  showErrorToast,
  showSuccessToast,
  subMessage,
  getShareConfig,
  getShareCouponConfig,
  getShareInviteConfig,
  resetRedirectStatus,
  checkNetworkStatus
};
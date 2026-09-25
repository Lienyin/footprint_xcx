const util = require('../../utils/util.js');
const api = require('../../config/api.js');

Page({
  data: {
    articleId: null,
    article: null,
    loading: true,
    selectedFeedback: null,
    userFeedback: null,
    submitting: false,
    feedbackRemark: ''
  },

  onLoad: function (options) {
    if (options.id) {
      this.setData({ articleId: options.id });
      wx.setNavigationBarTitle({
        title: options.title ? decodeURIComponent(options.title) : '文章详情'
      });
      this.loadArticleDetail();
    } else {
      wx.showToast({ title: '参数错误', icon: 'none' });
      setTimeout(function () {
        wx.navigateBack();
      }, 1500);
    }
  },

  loadArticleDetail: function () {
    var that = this;
    that.setData({ loading: true });

    var userInfo = wx.getStorageSync('userInfo') || {};
    var userId = userInfo.userId || '';
    console.log('userID===' + userId);

    var url = api.HelpArticle + that.data.articleId;

    var params = {};
    if (userId) {
      params.userId = userId;
    }

    util.request(url, params, 'GET').then(function (res) {
      console.log('文章详情响应：', JSON.stringify(res));
      var articleData = null;
      if (res.code === 200) {
        articleData = res.data;
      }
      console.log('文章数据：', articleData);

      if (articleData) {
        that.setData({ article: articleData });
      } else {
        wx.showToast({ title: '文章不存在', icon: 'none' });
      }
    }).catch(function (err) {
      console.error('加载文章详情失败', err);
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
    }).finally(function () {
      that.setData({ loading: false });
    });
  },

  goBack: function () {
    wx.navigateBack();
  },

  selectFeedback: function (e) {
    var feedbackType = parseInt(e.currentTarget.dataset.type);
    console.log('点击评价，type:', feedbackType, 'typeof:', typeof feedbackType);
    this.setData({ selectedFeedback: feedbackType });
  },

  onRemarkInput: function (e) {
    this.setData({ feedbackRemark: e.detail.value });
  },

  submitFeedback: function () {
    var that = this;

    if (that.data.selectedFeedback === null || that.data.selectedFeedback === undefined) {
      wx.showToast({ title: '请先选择评价', icon: 'none' });
      return;
    }

    var userInfo = wx.getStorageSync('userInfo') || {};
    var userId = userInfo.userId || '';
    if (!userId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    if (that.data.submitting) {
      return;
    }

    that.setData({ submitting: true });

    var requestData = {
      articleId: parseInt(that.data.articleId),
      isHelpful: that.data.selectedFeedback,
      remark: that.data.feedbackRemark || '',
      userId: userId
    };

    console.log('提交反馈请求数据：', JSON.stringify(requestData));

    util.request(api.HelpFeedback, requestData, 'POST').then(function (res) {
      console.log('提交反馈响应：', res);

      if (res.code === 200 || res.success) {
        that.setData({ userFeedback: that.data.selectedFeedback });
        wx.showToast({
          title: that.data.selectedFeedback == 1 ? '感谢您的认可！' : '我们会继续改进！',
          icon: 'success'
        });
      } else {
        wx.showToast({ title: res.msg || '提交失败，请重试', icon: 'none' });
      }
    }).catch(function (err) {
      console.error('提交反馈失败', err);
      wx.showToast({ title: '提交失败，请重试', icon: 'none' });
    }).finally(function () {
      that.setData({ submitting: false });
    });
  }
});

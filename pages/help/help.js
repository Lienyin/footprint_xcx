const util = require('../../utils/util.js');
const api = require('../../config/api.js');

Page({
  data: {
    searchKeyword: '',
    categories: [],
    faqList: [],
    showServiceModal: false,
    customerQrCode: 'https://www.lianzhenkj.com/img/qywx.png',
    loading: false
  },

  onLoad: function () {
    this.loadHelpData();
  },

  onShow: function () {
  },

  onPullDownRefresh: function () {
    var that = this;
    this.loadHelpData().finally(function () {
      wx.stopPullDownRefresh();
    });
  },

  onShareAppMessage: function () {
    return util.getShareInviteConfig();
  },

  loadHelpData: function () {
    var that = this;
    that.setData({ loading: true });

    return new Promise(function (resolve, reject) {
      util.request(api.HelpHome, {}, 'GET').then(function (res) {
        console.log('HelpHome 完整响应:', JSON.stringify(res));
        console.log('HelpHome res.code:', res.code);
        console.log('HelpHome res.data:', res.data);
        console.log('HelpHome res.data 类型:', typeof res.data, Array.isArray(res.data) ? 'Array' : 'not Array');

        var apiData = null;
        if (Array.isArray(res.data)) {
          apiData = res.data;
        } else if (res.data && typeof res.data === 'object') {
          apiData = res.data.categories || res.data.list || res.data.data || null;
          if (apiData && !Array.isArray(apiData)) apiData = null;
        }

        if (!apiData || (Array.isArray(apiData) && apiData.length === 0)) {
          that.setData({ categories: [], faqList: [] });
          console.log('数据为空，apiData=', apiData);
          wx.showToast({ title: '暂无数据', icon: 'none' });
          resolve();
          return;
        }

        var apiCategories = apiData;
        console.log('分类数量:', apiCategories.length);

        var bgColors = ['#fff3e0', '#e3f2fd', '#f3e5f5', '#e8f5e9'];
        var categories = apiCategories.map(function (cat, index) {
          return {
            id: cat.id,
            name: cat.name,
            emoji: cat.icon || '',
            bgColor: bgColors[index % bgColors.length],
            categoryId: cat.id,
            articles: cat.articles || []
          };
        });

        var allFaqs = [];
        apiCategories.forEach(function (cat) {
          if (cat.articles && cat.articles.length > 0) {
            cat.articles.forEach(function (article) {
              allFaqs.push({
                id: article.id,
                title: article.title,
                content: article.content,
                categoryId: article.categoryId,
                articleType: article.articleType,
                viewCount: article.viewCount
              });
            });
          }
        });

        that.setData({
          categories: categories,
          faqList: allFaqs
        });
        resolve();
      }).catch(function (err) {
        console.error('加载帮助中心数据失败', err);
        that.setData({ faqList: [], categories: [] });
        wx.showToast({ title: '加载失败，请重试', icon: 'none' });
        reject(err);
      }).finally(function () {
        that.setData({ loading: false });
      });
    });
  },

  onSearchInput: function (e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  clearSearch: function () {
    this.setData({ searchKeyword: '' });
    this.loadHelpData();
  },

  onSearchConfirm: function (e) {
    var keyword = (e.detail.value || this.data.searchKeyword).trim();
    if (!keyword) {
      wx.showToast({ title: '请输入搜索关键词', icon: 'none' });
      return;
    }

    var that = this;
    util.request(api.HelpSearch, { keyword: keyword }, 'GET').then(function (res) {
      console.log('搜索响应数据：', JSON.stringify(res));
      var searchResults = null;

      if (res.code === 200 && res.data) {
        searchResults = res.data;
      } else {
        searchResults = res.msg;
      }

      if (searchResults && Array.isArray(searchResults) && searchResults.length > 0) {
        var faqList = searchResults.map(function (item) {
          return {
            id: item.id,
            title: item.title,
            content: item.snippet || '',
            categoryId: item.categoryId,
            articleType: item.articleType,
            viewCount: item.viewCount
          };
        });

        that.setData({ faqList: faqList });
        wx.showToast({ title: '找到 ' + faqList.length + ' 个相关问题', icon: 'success' });
      } else {
        that.loadHelpData();
        wx.showToast({ title: '未找到相关问题', icon: 'none' });
      }
    }).catch(function (err) {
      console.error('搜索失败', err);
      that.loadHelpData();
      wx.showToast({ title: '搜索失败，请重试', icon: 'none' });
    });
  },

  onCategoryTap: function (e) {
    var category = e.currentTarget.dataset.category;
    var articles = category.articles || [];

    if (articles.length > 0) {
      var faqList = articles.map(function (article) {
        return {
          id: article.id,
          title: article.title,
          content: article.content || '',
          categoryId: article.categoryId,
          articleType: article.articleType,
          viewCount: article.viewCount
        };
      });

      this.setData({ faqList: faqList });
    } else {
      this.setData({ faqList: [] });
      wx.showToast({ title: '该分类下暂无问题', icon: 'none' });
    }
  },

  onFaqTap: function (e) {
    var faq = e.currentTarget.dataset.faq;
    wx.navigateTo({
      url: '/pages/helpDetail/detail?id=' + faq.id + '&title=' + encodeURIComponent(faq.title)
    });
  },

  openServiceModal: function () {
    this.setData({ showServiceModal: true });
  },

  closeServiceModal: function () {
    this.setData({ showServiceModal: false });
  },

  preventTap: function () {}
});

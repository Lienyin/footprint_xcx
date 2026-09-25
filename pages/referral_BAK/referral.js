
const util = require('../../utils/util.js');
const api = require('../../config/api.js');
Page({
  data: {
    statistics: {},
    showPendingInfo: false,
    showQrCode: false,
    showRules: false,  // New property for rules popup  
    qrCodeUrl: '',
    milestoneProgressWidth: '0%',  // 注意这里包含了单位  
    currentTierClass: '',
    currentTierIcon: '',
    currentTierText: '',
    currentTierDescription: '',
    nextTierThreshold: 0,
    nextTierText: '',
    activityTitle: '',
    activityBanner: '',
    monthlyRewardTiers: [],
    milestones: [],
    userCurrentCount: 0,
    userLastMilestoneLevel: 0,
    userNextMilestoneLevel: null,
    userNextMilestoneTarget: null,
    rules: [],
    notice: '',
    disclaimer: '',
    nextMilestone: null,
    configLoaded: false,
    leaderboard: [
    ]
  },

  onLoad: function (options) {
    this.fetchReferralConfig().then(() => {
      this.fetchBalance();
      this.fetchLeaderboard();
    }).catch(() => {
      this.fetchBalance();
      this.fetchLeaderboard();
    });
  },
  fetchBalance: function () {
    return new Promise((resolve, reject) => {
      util.request(api.UserBalance).then(res => {
        if (res.code === 200) {
          this.setData({
            statistics: res.data
          });
          if (this.data.configLoaded) {
            this.calculateMilestoneProgress();
            this.calculateCurrentTier();
            this.updateNextMilestone(); // 更新下一个里程碑  
          }
          resolve(res.data);
        } else {
          wx.showToast({
            title: res.msg || '获取统计信息失败',
            icon: 'none'
          });
          reject(new Error(res.msg || '获取统计信息失败'));
        }
      }).catch(err => {
        console.error('获取余额信息失败', err);
        wx.showToast({
          title: '获取统计信息失败',
          icon: 'none'
        });
        reject(err);
      });
    });
  },
  fetchLeaderboard: function() {
    wx.showLoading({
      title: '加载排行榜...',
      mask: true
    });

    util.request(api.ReferralLeaderboard).then(res => {
      wx.hideLoading();
      if (res.code === 200) {
        const leaderboardData = res.data || [];
        const formattedData = leaderboardData.map((item, index) => {
          return {
            ...item,
            rank: index + 1,
            name: item.userName || item.realName || item.nickname || '匿名用户',
            orderedCount: item.totalIncome || item.count || 0
          };
        });
        
        this.setData({
          leaderboard: formattedData.slice(0, 3) // 只取前3名
        });
      } else {
        console.error('获取排行榜失败:', res.msg);
        wx.showToast({
          title: res.msg || '获取排行榜失败',
          icon: 'none',
          duration: 2000
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('获取排行榜错误:', err);
      wx.showToast({
        title: '网络错误，获取排行榜失败',
        icon: 'none',
        duration: 2000
      });
    });
  },
  fetchReferralConfig: function () {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });

    return new Promise((resolve, reject) => {
      util.request(api.ReferralConfig).then(res => {
        wx.hideLoading();
        if (res.code === 200) {
          const data = res.data;
          if (data.milestones && data.milestones.length > 0) {
            data.milestones.sort((a, b) => a.requiredCount - b.requiredCount);
          }
          if (data.monthlyRewardTiers && data.monthlyRewardTiers.length > 0) {
            data.monthlyRewardTiers.sort((a, b) => a.minCount - b.minCount);
          }
          this.setData({
            activityTitle: data.activityTitle || '拉新奖励活动',
            activityBanner: data.activityBanner || '',
            monthlyRewardTiers: data.monthlyRewardTiers || [],
            milestones: data.milestones || [],
            userCurrentCount: data.userCurrentCount || 0,
            userLastMilestoneLevel: data.userLastMilestoneLevel || 0,
            userNextMilestoneLevel: data.userNextMilestoneLevel,
            userNextMilestoneTarget: data.userNextMilestoneTarget,
            rules: data.rules || [],
            notice: data.notice || '',
            disclaimer: data.disclaimer || '',
            configLoaded: true
          });
          if (this.data.statistics.totalAllTimeCount !== undefined) {
            this.calculateMilestoneProgress();
            this.calculateCurrentTier();
            this.updateNextMilestone(); // 更新下一个里程碑  
          }

          resolve(data);
        } else {
          this.setData({ configLoaded: false });
          wx.showToast({
            title: res.msg || '获取配置失败，请重试',
            icon: 'none'
          });
          reject(new Error(res.msg || '获取配置失败'));
        }
      }).catch(err => {
        wx.hideLoading();
        this.setData({ configLoaded: false });
        reject(err);
      });
    });
  },
  updateNextMilestone: function () {
    const totalCount = this.data.statistics.totalAllTimeCount || 0;
    const milestones = this.data.milestones || [];
    let nextMilestone = null;
    if (milestones && milestones.length > 0) {
      for (let milestone of milestones) {
        if (totalCount < milestone.requiredCount) {
          nextMilestone = milestone;
          break;
        }
      }
    }

    this.setData({ nextMilestone: nextMilestone });
    return nextMilestone;
  },
  calculateMilestoneProgress: function () {
    if (!this.data.configLoaded) {
      return;
    }

    const totalCount = this.data.statistics.totalAllTimeCount || 0;
    const milestones = this.data.milestones || [];
    if (!milestones || milestones.length === 0) {
      console.error('未找到里程碑配置');
      this.setData({
        milestoneProgressWidth: '0%'
      });
      return;
    }
    let progressPercent = 0;
    const lastMilestone = milestones[milestones.length - 1];
    if (totalCount >= lastMilestone.requiredCount) {
      progressPercent = 100;
    } else {
      let prevMilestone = null;
      let nextMilestone = null;

      for (let i = 0; i < milestones.length; i++) {
        if (totalCount < milestones[i].requiredCount) {
          nextMilestone = milestones[i];
          if (i > 0) {
            prevMilestone = milestones[i - 1];
          }
          break;
        }
      }

      if (nextMilestone) {
        if (prevMilestone) {
          const prevCount = prevMilestone.requiredCount;
          const prevPos = prevMilestone.positionPercent || 0;
          const nextCount = nextMilestone.requiredCount;
          const nextPos = nextMilestone.positionPercent || 100;
          const progress = (totalCount - prevCount) / (nextCount - prevCount);
          progressPercent = prevPos + progress * (nextPos - prevPos);
        } else {
          const firstPos = nextMilestone.positionPercent || 10;
          progressPercent = (totalCount / nextMilestone.requiredCount) * firstPos;
        }
      }
    }
    progressPercent = Math.min(100, Math.max(0, progressPercent));
    this.setData({
      milestoneProgressWidth: progressPercent + '%'
    });
  },
  calculateCurrentTier: function () {
    if (!this.data.configLoaded) {
      return;
    }

    const orderedCount = this.data.statistics.orderedCount || 0;
    const tiers = this.data.monthlyRewardTiers || [];
    if (!tiers || tiers.length === 0) {
      console.error('未找到奖励档位配置');
      return;
    }
    let currentTier = null;
    let nextTier = null;

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      const isMinMatched = orderedCount >= tier.minCount - 1;
      const isMaxMatched = tier.maxCount === null || tier.maxCount === undefined || orderedCount < tier.maxCount;

      if (isMinMatched && isMaxMatched) {
        currentTier = tier;
        if (i < tiers.length - 1) {
          nextTier = tiers[i + 1];
        }
        break;
      }
    }
    if (!currentTier && tiers.length > 0) {
      currentTier = tiers[0];
      if (tiers.length > 1) {
        nextTier = tiers[1];
      }
    }
    if (currentTier) {
      this.setData({
        currentTierIcon: currentTier.icon,
        currentTierClass: currentTier.tierClass || 'tier-basic',
        currentTierText: currentTier.tierText || '青铜',
        currentTierDescription: `${currentTier.rewardAmount}元/人`,
        nextTierThreshold: nextTier ? nextTier.minCount - 1 : 0,
        nextTierText: nextTier ? (nextTier.tierText || '下一级') : ''
      });
    } else {
      console.error('无法确定奖励档位');
    }
  },
  goToReferralLog: function (e) {
    const type = e.currentTarget.dataset.type || 'newUser';

    let params = {};
    switch (type) {
      case 'newUser':
        params = { filter: 'newUser' };
        break;
      case 'ordered':
        params = { filter: 'ordered' };
        break;
      case 'pending':
        params = { filter: 'pending' };
        break;
      case 'settled':
        params = { filter: 'settled' };
        break;
    }
    const paramsStr = Object.keys(params)
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');
    wx.navigateTo({
      url: `/pages/referralLog/referralLog?${paramsStr}`
    });
  },
  showTotalCountInfo: function () {
    wx.showModal({
      title: '当月推广人数',
      content: '本月内通过您的推广码访问的总人数，包含新客和非新客。每月1日重新计算。',
      showCancel: false,
      confirmText: '知道了'
    });
  },
  showNewUserInfo: function (e) {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }

    wx.showModal({
      title: '新客数量',
      content: '当月推广注册人数',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  showOrderedInfo: function (e) {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    wx.showModal({
      title: '下单人数',
      content: '当月有效下单人数',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  showSettledInfo: function (e) {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    wx.showModal({
      title: '已结算奖励',
      content: '当月根据有效拉新人数和阶梯奖励已完成的结算累计金额',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  showPendingInfo: function (e) {
    wx.showModal({
      title: '已结算奖励',
      content: '未到结算周期，系统根据有效拉新人数及当前阶梯奖励预估结算金额',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  showMilestoneInfo: function () {
    const milestones = this.data.milestones || [];
    if (!this.data.configLoaded || milestones.length === 0) {
      wx.showToast({
        title: '加载配置中，请稍后再试',
        icon: 'none'
      });
      this.fetchReferralConfig();
      return;
    }
    let content = '根据累计总推广人数可获得额外奖励：\n\n';
    milestones.forEach(milestone => {
      content += `• 累计达到${milestone.requiredCount}人：奖励${milestone.rewardAmount}元\n`;
    });

    content += '\n里程碑奖励一次性发放，达成后自动结算。';
    content += '\n\n注意：里程碑数据每天更新一次，可能存在延迟。';

    wx.showModal({
      title: '里程碑奖励说明',
      content: '历史累计推广的有效人数',
      showCancel: false,
      confirmText: '我知道了'
    });
  },

  showTierInfo: function () {
    const tiers = this.data.monthlyRewardTiers || [];
    if (!this.data.configLoaded || tiers.length === 0) {
      wx.showToast({
        title: '加载配置中，请稍后再试',
        icon: 'none'
      });
      this.fetchReferralConfig();
      return;
    }
    let content = '根据当月成功下单的新客人数确定奖励档位：\n\n';
    tiers.forEach(tier => {
      const maxText = tier.maxCount ? `-${tier.maxCount}` : '人以上';
      const tierText = tier.tierText || '';
      content += `• ${tier.minCount}${maxText}：${tierText}档，每人奖励${tier.rewardAmount}元\n`;
    });

    content += '\n档位每月重新计算，上月档位不影响本月奖励。';

    wx.showModal({
      title: '奖励档位说明',
      content: content,
      showCancel: false,
      confirmText: '知道了'
    });
  },
  getQrCode: function () {
    wx.showLoading({
      title: '获取中...',
      mask: true
    });

    util.request(api.UserQrcode, {}).then(res => {
      if (res.code === 200 && res.data && res.data.qrcode) {
        this.setData({
          showQrCode: true,
          qrCodeUrl: res.data.qrcode
        });
      } else {
        wx.showToast({
          title: res.msg || '获取二维码失败',
          icon: 'none'
        });
      }
      wx.hideLoading();
    }).catch(err => {
      console.error('获取二维码失败', err);
      wx.hideLoading();
      wx.showToast({
        title: '获取二维码失败',
        icon: 'none'
      });
    });
  },
  hideQrCode: function () {
    this.setData({ showQrCode: false });
  },
  showReferralRules: function () {
    this.setData({ showRules: true });
  },
  hideReferralRules: function () {
    this.setData({ showRules: false });
  },
  hidePendingInfo: function () {
    this.setData({ showPendingInfo: false });
  },
  stopPropagation: function (e) {
  },
  onShareAppMessage: function () {
    return util.getShareInviteConfig();
  },
  onPullDownRefresh: function () {
    this.fetchReferralConfig().then(() => {
      return this.fetchBalance();
    }).then(() => {
      return this.fetchLeaderboard();
    }).finally(() => {
      wx.stopPullDownRefresh();
    });
  }
});
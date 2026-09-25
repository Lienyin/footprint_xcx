const ApiRootUrl = 'https://www.lianzhenkj.com/v2/';


module.exports = {

  AuthLoginByWeixin: ApiRootUrl + 'auth/loginByWeixin',
  AuthLogin: ApiRootUrl + 'auth/login',
  GetAndUpdPhoneNumber: ApiRootUrl + 'auth/getAndUpdPhoneNumber',

  StoreGetByLocation: ApiRootUrl + 'store/getByLocation',
  StoreList: ApiRootUrl + 'store/list',
  StoreDetail: ApiRootUrl + 'store/detail/',

  CategoryList: ApiRootUrl + 'category/list/',

  PackageDetail: ApiRootUrl + 'package/detail/',
  PackageList: ApiRootUrl + 'package/list/',

  OrderSubmitAndPay: ApiRootUrl + 'order/createAndPay/',
  OrderSubmit: ApiRootUrl + 'order/create/',
  OrderList: ApiRootUrl + 'order/list',
  OrderConfirm: ApiRootUrl + 'order/confirm',
  OrderPay: ApiRootUrl + 'order/pay',
  OrderDetail: ApiRootUrl + 'order/detail/',
  OrderHide: ApiRootUrl + 'order/hide',
  OrderCancel:ApiRootUrl + 'order/cancel',
  OrderDetailNotPay: ApiRootUrl + 'order/detailNotPay/',
  OrderReminder: ApiRootUrl + 'order/reminder',
  OrderRefund: ApiRootUrl + 'order/refund',

  UserDetail: ApiRootUrl + 'user/detail',
  UserUpdate: ApiRootUrl + 'user/update',
  UserUpdateRole: ApiRootUrl + 'user/updateRole',
  UserBalance: ApiRootUrl + 'user/balance',
  UserWithdrawList: ApiRootUrl + 'user/queryWithdrawList',
  UserBalanceDetail: ApiRootUrl + 'user/getBalanceDetail',
  UserWithdraw: ApiRootUrl + 'user/withdraw',

  UserList: ApiRootUrl + 'user/list',
  UserQrcode: ApiRootUrl + 'user/getTechQrcode',
  UserCurrentMonthlyTier: ApiRootUrl + 'user/currentMonthlyTier',

  CartList:ApiRootUrl + 'cart/list/',
  CartUpdByPid:ApiRootUrl + 'cart/updateByPackageId',
  CartAddByPid:ApiRootUrl + 'cart/addByPackageId',
  CartUpd:ApiRootUrl + 'cart/update',
  CartDel:ApiRootUrl + 'cart/delete',
  CartClear:ApiRootUrl + 'cart/clear/',
  CartGetNum:ApiRootUrl + 'cart/getNum',

  CouponList:ApiRootUrl + 'coupon/list',
  CouponUsableCount:ApiRootUrl + 'coupon/usableCount',
  CouponUsable:ApiRootUrl + 'coupon/usable',
  CouponInflate:ApiRootUrl + 'coupon/inflate',
  CouponDetail:ApiRootUrl + 'coupon/detail/',
  CouponClaim:ApiRootUrl + 'coupon/claim',

  ActivityWxApp:ApiRootUrl + 'activity/wxApp',
  ActivityList:ApiRootUrl + 'activity/list',
  ActivityInviteRules:ApiRootUrl + 'activity/inviteRules',
  CheckNewMemberCoupon:ApiRootUrl + 'activity/checkNewMemberCoupon',
  ReceiveNewMemberCoupon:ApiRootUrl + 'activity/receiveNewMemberCoupon',

  BannerList:ApiRootUrl + 'banner/list',
  TechServiceType: ApiRootUrl + 'tech/techServiceType',
  TechDetail: ApiRootUrl + 'tech/detail',
  TechUpdate: ApiRootUrl + 'tech/update',

  FileUpload:ApiRootUrl + 'common/upload',

  ReservationInfo: ApiRootUrl + 'reservation/info',
  ReservationCreate: ApiRootUrl + 'reservation/create',
  ReservationOrderDetail: ApiRootUrl + 'reservation/detail/',
  ReservationOrderCancel: ApiRootUrl + 'reservation/cancel',
  ReservationOrderConfirm: ApiRootUrl + 'reservation/confirm',
  ReservationOrderAdjust: ApiRootUrl + 'reservation/adjust',
  ReservationOrderHide: ApiRootUrl + 'reservation/hide',
  ReservationOrderPay: ApiRootUrl + 'reservation/pay',
  ReservationGetLatestOrder: ApiRootUrl + 'reservation/getLatestOrder',
  ReservationGetTechList: ApiRootUrl + 'reservation/techList',
  ReservationActivityConfig: ApiRootUrl + 'reservation/activityConfig',
  RecommendActivityConfig: ApiRootUrl + 'activity/recommend/activityConfig',
  
  ReferralList: ApiRootUrl + 'referral/list',
  BalanceLogList: ApiRootUrl + 'balanceLog/list',
  ReferralLeaderboard: ApiRootUrl + 'balanceLog/top3Income',
  ReferralConfig: ApiRootUrl + 'activity/config', // 获取推荐奖励规则配置
  //帮助中心
  HelpHome: ApiRootUrl + 'help-center/home', // 帮助中心首页
  HelpArticle: ApiRootUrl + 'help-center/article/', // 文章详情（需要拼接 articleId）
  HelpFeedback: ApiRootUrl + 'help-center/feedback', // 提交反馈
  HelpSearch: ApiRootUrl + 'help-center/search', // 关键词搜索
};
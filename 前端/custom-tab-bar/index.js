Component({
  data: {
    selected: 0,
    color: "#999999",
    selectedColor: "#3B82F6",
    list: [
      {
        pagePath: "/pages/home/home",
        text: "社区",
        iconPath: "http://114.55.39.57:3000/icons/home.png",
        selectedIconPath: "http://114.55.39.57:3000/icons/home-active.png"
      },
      {
        pagePath: "/pages/study/index",
        text: "学习",
        iconPath: "http://114.55.39.57:3000/icons/study.png",
        selectedIconPath: "http://114.55.39.57:3000/icons/study-active.png"
      },
      {
        pagePath: "/pages/create/create",
        text: "创作",
        iconPath: "http://114.55.39.57:3000/icons/create.png",
        selectedIconPath: "http://114.55.39.57:3000/icons/create-active.png"
      },
      {
        pagePath: "/pages/profile/profile",
        text: "我的",
        iconPath: "http://114.55.39.57:3000/icons/profile.png",
        selectedIconPath: "http://114.55.39.57:3000/icons/profile-active.png"
      }
    ]
  },

  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset;
      const url = data.path;
      wx.switchTab({ url });
    }
  }
});

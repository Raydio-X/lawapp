const { studyAPI } = require('../../../utils/api');

Page({
  data: {
    currentYear: 2024,
    currentMonth: 1,
    updateDate: '',
    heatmapDays: [],
    monthStats: {
      totalDays: 0,
      totalTime: '0h',
      avgTime: '0min',
      maxTime: '0min'
    },
    radarDimensions: [
      { name: '学习天数', min: 30, format: 'number', unit: '天' },
      { name: '总时长', min: 60, format: 'hours' },
      { name: '日均时长', min: 30, format: 'minutes' },
      { name: '最长单日', min: 30, format: 'minutes' },
      { name: '学习卡片', min: 10, format: 'number', unit: '张' }
    ],
    radarUserData: [0, 0, 0, 0, 0],
    radarAvgData: [0, 0, 0, 0, 0],
    selectedDay: null,
    studyData: {}
  },

  onLoad() {
    const now = new Date();
    const updateDate = `${now.getMonth() + 1}月${now.getDate()}日`;
    
    this.setData({
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1,
      updateDate
    });
    this.loadStudyData();
  },

  async loadStudyData() {
    const { currentYear, currentMonth } = this.data;

    try {
      const res = await studyAPI.getMonthlyStats(currentYear, currentMonth);
      const rawData = res.data || {};

      const studyData = {};
      Object.keys(rawData).forEach(dateStr => {
        studyData[dateStr] = {
          duration: Math.floor((rawData[dateStr].duration || 0) / 60),
          cards: rawData[dateStr].cards || 0
        };
      });

      this.setData({ studyData });
      this.generateHeatmap();
      this.calculateMonthStats();
    } catch (error) {
      console.error('加载学习数据失败:', error);
      this.generateHeatmap();
    }

    this.loadAvgStats();
  },

  async loadAvgStats() {
    const { currentYear, currentMonth } = this.data;
    try {
      const res = await studyAPI.getMonthlyAvgStats(currentYear, currentMonth);
      const avgData = res.data || {};
      this.setData({
        radarAvgData: [
          avgData.avgStudyDays || 0,
          avgData.avgTotalTime || 0,
          avgData.avgDailyTime || 0,
          avgData.avgMaxDailyTime || 0,
          avgData.avgTotalCards || 0
        ]
      });
    } catch (error) {
      console.error('加载平均数据失败:', error);
    }
  },

  generateHeatmap() {
    const { currentYear, currentMonth, studyData } = this.data;
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    const daysInMonth = lastDay.getDate();
    const startWeekday = firstDay.getDay();

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === currentYear && today.getMonth() === currentMonth - 1;

    const heatmapDays = [];

    for (let i = 0; i < startWeekday; i++) {
      heatmapDays.push({
        day: 0,
        isEmpty: true,
        level: 'empty'
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayData = studyData[dateStr] || { duration: 0, cards: 0 };
      const level = this.getLevel(dayData.duration);
      const isToday = isCurrentMonth && day === today.getDate();

      heatmapDays.push({
        day,
        date: `${currentMonth}月${day}日`,
        dateStr,
        level: `level-${level}`,
        duration: dayData.duration,
        cards: dayData.cards,
        isToday,
        isEmpty: false
      });
    }

    this.setData({ heatmapDays });
  },

  getLevel(duration) {
    if (duration === 0) return 0;
    if (duration <= 45) return 1;
    if (duration <= 90) return 2;
    if (duration <= 135) return 3;
    return 4;
  },

  calculateMonthStats() {
    const { studyData, currentYear, currentMonth } = this.data;
    const days = Object.values(studyData);

    let totalDays = 0;
    let totalMinutes = 0;
    let maxMinutes = 0;
    let totalCards = 0;

    days.forEach(day => {
      if (day.duration > 0) {
        totalDays++;
        totalMinutes += day.duration;
        if (day.duration > maxMinutes) {
          maxMinutes = day.duration;
        }
      }
      totalCards += day.cards || 0;
    });

    const avgMinutes = totalDays > 0 ? Math.round(totalMinutes / totalDays) : 0;
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

    this.setData({
      monthStats: {
        totalDays,
        totalTime: this.formatTime(totalMinutes),
        avgTime: `${avgMinutes}min`,
        maxTime: `${maxMinutes}min`
      },
      radarDimensions: [
        { name: '学习天数', min: daysInMonth, format: 'number', unit: '天' },
        { name: '总时长', min: 60, format: 'hours' },
        { name: '日均时长', min: 30, format: 'minutes' },
        { name: '最长单日', min: 30, format: 'minutes' },
        { name: '学习卡片', min: 10, format: 'number', unit: '张' }
      ],
      radarUserData: [totalDays, totalMinutes, avgMinutes, maxMinutes, totalCards]
    });
  },

  formatTime(minutes) {
    if (minutes < 60) return `${minutes}min`;
    const hours = (minutes / 60).toFixed(1);
    return `${hours}h`;
  },

  onPrevMonth() {
    const now = new Date();
    const currentYearNow = now.getFullYear();
    let { currentYear, currentMonth } = this.data;
    currentMonth--;
    if (currentMonth < 1) {
      currentMonth = 12;
      currentYear--;
    }
    if (currentYear < currentYearNow) return;
    this.setData({ currentYear, currentMonth, selectedDay: null });
    this.loadStudyData();
  },

  onNextMonth() {
    const now = new Date();
    const currentYearNow = now.getFullYear();
    const currentMonthNow = now.getMonth() + 1;
    let { currentYear, currentMonth } = this.data;
    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
    if (currentYear > currentYearNow) return;
    if (currentYear === currentYearNow && currentMonth > currentMonthNow) return;
    this.setData({ currentYear, currentMonth, selectedDay: null });
    this.loadStudyData();
  },

  onCellTap(e) {
    const day = e.currentTarget.dataset.day;
    if (!day || day.isEmpty) return;

    this.setData({
      selectedDay: {
        date: day.date,
        duration: day.duration || 0,
        cards: day.cards || 0
      }
    });
  },

  onCloseDetail() {
    this.setData({ selectedDay: null });
  },

  preventClose() {}
});
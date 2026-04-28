<template>
  <div class="container">
    <div class="custom-nav">
      <div class="nav-content">
        <div class="nav-left">
          <div class="back-btn" @click="router.back()">
            <t-icon name="chevron-left" size="20px" color="#333" />
          </div>
        </div>
        <div class="nav-title">学习统计</div>
        <div class="nav-right"></div>
      </div>
    </div>

    <div class="content">
      <div class="month-selector">
        <div class="month-btn" @click="onPrevMonth">
          <t-icon name="chevron-left" size="18px" color="#666" />
        </div>
        <span class="month-text">{{ currentYear }}年{{ currentMonth }}月</span>
        <div class="month-btn" @click="onNextMonth">
          <t-icon name="chevron-right" size="18px" color="#666" />
        </div>
      </div>

      <div class="heatmap-section">
        <div class="section-header">
          <span class="section-title">学习热力图</span>
          <span class="section-subtitle">每日学习时长统计</span>
        </div>
        
        <div class="heatmap-container">
          <div class="weekday-labels">
            <span class="weekday-label" v-for="day in weekdays" :key="day">{{ day }}</span>
          </div>
          
          <div class="heatmap-grid">
            <div 
              v-for="(day, index) in heatmapDays" 
              :key="index"
              class="heatmap-cell"
              :class="[day.level, { today: day.isToday, selected: selectedDay?.dateStr === day.dateStr, empty: day.isEmpty }]"
              @click="onCellTap(day, $event)"
            >
              <span class="cell-day" v-if="!day.isEmpty">{{ day.day }}</span>
            </div>
          </div>
        </div>
        
        <div class="heatmap-legend">
          <span class="legend-label">少</span>
          <div class="legend-cells">
            <div class="legend-cell level-0"></div>
            <div class="legend-cell level-1"></div>
            <div class="legend-cell level-2"></div>
            <div class="legend-cell level-3"></div>
            <div class="legend-cell level-4"></div>
          </div>
          <span class="legend-label">多</span>
        </div>
      </div>

      <div class="stats-section">
        <div class="stats-title">
          <span class="stats-title-text">本月数据</span>
          <span class="stats-update">数据更新至{{ updateDate }}0点</span>
        </div>
        
        <RadarChart 
          :dimensions="radarDimensions" 
          :userData="radarUserData" 
          :avgData="radarAvgData"
        />
      </div>
    </div>

    <div class="tooltip-mask" v-if="selectedDay" @click="selectedDay = null"></div>
    <div 
      class="day-tooltip" 
      :class="{ 'arrow-bottom': !showArrowTop }"
      v-if="selectedDay" 
      :style="{ top: tooltipTop + 'px', left: tooltipLeft + 'px' }"
    >
      <div class="tooltip-content">
        <span class="tooltip-date">{{ selectedDay.date }}</span>
        <span class="tooltip-duration">学习 {{ selectedDay.duration }} 分钟</span>
      </div>
      <div class="tooltip-arrow" :style="{ left: arrowOffset + 'px' }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { studyAPI } from '@/utils/api'
import RadarChart from '@/components/RadarChart.vue'

const router = useRouter()

const weekdays = ['日', '一', '二', '三', '四', '五', '六']

const currentYear = ref(2024)
const currentMonth = ref(1)
const updateDate = ref('')
const heatmapDays = ref<any[]>([])
const studyData = ref<Record<string, { duration: number; cards: number }>>({})
const selectedDay = ref<any>(null)
const tooltipTop = ref(0)
const tooltipLeft = ref(0)
const arrowOffset = ref(50)
const showArrowTop = ref(true)

const monthStats = ref({
  totalDays: 0,
  totalTime: '0h',
  avgTime: '0min',
  maxTime: '0min',
  totalCards: 0
})

const radarUserData = ref<number[]>([0, 0, 0, 0, 0])
const radarAvgData = ref<number[]>([0, 0, 0, 0, 0])

const daysInMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value, 0).getDate()
})

const radarDimensions = computed(() => [
  { name: '学习天数', min: daysInMonth.value, format: 'number', unit: '天' },
  { name: '总时长', min: 60, format: 'hours' },
  { name: '日均时长', min: 30, format: 'minutes' },
  { name: '最长单日', min: 30, format: 'minutes' },
  { name: '学习卡片', min: 10, format: 'number', unit: '张' }
])

onMounted(() => {
  const now = new Date()
  currentYear.value = now.getFullYear()
  currentMonth.value = now.getMonth() + 1
  updateDate.value = `${now.getMonth() + 1}月${now.getDate()}日`
  
  loadStudyData()
})

const loadStudyData = async () => {
  try {
    const res = await studyAPI.getMonthlyStats(currentYear.value, currentMonth.value)
    const rawData = res.data || {}

    studyData.value = {}
    Object.keys(rawData).forEach(dateStr => {
      studyData.value[dateStr] = {
        duration: Math.floor((rawData[dateStr].duration || 0) / 60),
        cards: rawData[dateStr].cards || 0
      }
    })

    generateHeatmap()
    calculateMonthStats()
    loadAvgStats()
  } catch (error) {
    console.error('加载学习数据失败:', error)
    generateHeatmap()
  }
}

const loadAvgStats = async () => {
  try {
    const res = await studyAPI.getMonthlyAvgStats(currentYear.value, currentMonth.value)
    const avgData = res.data || {}
    radarAvgData.value = [
      avgData.avgStudyDays || 0,
      avgData.avgTotalTime || 0,
      avgData.avgDailyTime || 0,
      avgData.avgMaxDailyTime || 0,
      avgData.avgTotalCards || 0
    ]
  } catch (error) {
    console.error('加载平均数据失败:', error)
  }
}

const generateHeatmap = () => {
  const firstDay = new Date(currentYear.value, currentMonth.value - 1, 1)
  const lastDay = new Date(currentYear.value, currentMonth.value, 0)
  const daysInMonthVal = lastDay.getDate()
  const startWeekday = firstDay.getDay()

  const today = new Date()
  const isCurrentMonth = today.getFullYear() === currentYear.value && today.getMonth() === currentMonth.value - 1

  const days: any[] = []

  for (let i = 0; i < startWeekday; i++) {
    days.push({
      day: 0,
      isEmpty: true,
      level: 'empty'
    })
  }

  for (let day = 1; day <= daysInMonthVal; day++) {
    const dateStr = `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const dayData = studyData.value[dateStr] || { duration: 0, cards: 0 }
    const level = getLevel(dayData.duration)
    const isToday = isCurrentMonth && day === today.getDate()

    days.push({
      day,
      date: `${currentMonth.value}月${day}日`,
      dateStr,
      level: `level-${level}`,
      duration: dayData.duration,
      cards: dayData.cards,
      isToday,
      isEmpty: false
    })
  }

  heatmapDays.value = days
}

const getLevel = (duration: number) => {
  if (duration === 0) return 0
  if (duration <= 45) return 1
  if (duration <= 90) return 2
  if (duration <= 135) return 3
  return 4
}

const calculateMonthStats = () => {
  const days = Object.values(studyData.value)

  let totalDays = 0
  let totalMinutes = 0
  let maxMinutes = 0
  let totalCards = 0

  days.forEach(day => {
    if (day.duration > 0) {
      totalDays++
      totalMinutes += day.duration
      if (day.duration > maxMinutes) {
        maxMinutes = day.duration
      }
    }
    totalCards += day.cards || 0
  })

  const avgMinutes = totalDays > 0 ? Math.round(totalMinutes / totalDays) : 0

  monthStats.value = {
    totalDays,
    totalTime: formatTime(totalMinutes),
    avgTime: `${avgMinutes}min`,
    maxTime: `${maxMinutes}min`,
    totalCards
  }
  
  radarUserData.value = [totalDays, totalMinutes, avgMinutes, maxMinutes, totalCards]
}

const formatTime = (minutes: number) => {
  if (minutes < 60) return `${minutes}min`
  const hours = (minutes / 60).toFixed(1)
  return `${hours}h`
}

const onPrevMonth = () => {
  const now = new Date()
  const currentYearNow = now.getFullYear()
  
  if (currentMonth.value === 1) {
    if (currentYear.value <= currentYearNow - 1) return
    currentMonth.value = 12
    currentYear.value--
  } else {
    currentMonth.value--
  }
  
  selectedDay.value = null
  loadStudyData()
}

const onNextMonth = () => {
  const now = new Date()
  const currentYearNow = now.getFullYear()
  const currentMonthNow = now.getMonth() + 1
  
  if (currentMonth.value === 12) {
    if (currentYear.value >= currentYearNow) return
    currentMonth.value = 1
    currentYear.value++
  } else {
    if (currentYear.value === currentYearNow && currentMonth.value >= currentMonthNow) return
    currentMonth.value++
  }
  
  selectedDay.value = null
  loadStudyData()
}

const onCellTap = (day: any, event: MouseEvent) => {
  if (!day || day.isEmpty) return
  
  const cell = (event.target as HTMLElement)?.closest('.heatmap-cell')
  if (cell) {
    const rect = cell.getBoundingClientRect()
    const tooltipWidth = 100
    const tooltipHeight = 50
    
    let tooltipLeftVal = rect.left + rect.width / 2 - tooltipWidth / 2
    let tooltipTopVal = rect.top - tooltipHeight - 10
    let showArrowTopVal = true
    
    if (tooltipLeftVal < 10) {
      tooltipLeftVal = 10
    }
    if (tooltipLeftVal + tooltipWidth > window.innerWidth - 10) {
      tooltipLeftVal = window.innerWidth - tooltipWidth - 10
    }
    if (tooltipTopVal < 10) {
      tooltipTopVal = rect.bottom + 10
      showArrowTopVal = false
    }
    
    const cellCenterX = rect.left + rect.width / 2
    const arrowOffsetVal = cellCenterX - tooltipLeftVal
    
    tooltipTop.value = tooltipTopVal
    tooltipLeft.value = tooltipLeftVal
    arrowOffset.value = arrowOffsetVal
    showArrowTop.value = showArrowTopVal
  }
  
  selectedDay.value = {
    date: day.date,
    dateStr: day.dateStr,
    duration: day.duration || 0,
    cards: day.cards || 0
  }
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: #f5f7fa;
  padding-top: 44px;
}

.custom-nav {
  background: #fff;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.nav-content {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}

.nav-left, .nav-right {
  width: 40px;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  
  &:active {
    background: #f5f6fa;
  }
}

.nav-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.content {
  padding: 12px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
}

.month-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
}

.month-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f5f7fa;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:active {
    background: #e8e9eb;
    transform: scale(0.95);
  }
}

.month-text {
  font-size: 17px;
  font-weight: 600;
  color: #333;
  margin: 0 24px;
}

.heatmap-section {
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.section-header {
  margin-bottom: 14px;
  display: flex;
  align-items: center;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.section-subtitle {
  font-size: 12px;
  color: #999;
  margin-left: 8px;
}

.heatmap-container {
  margin-bottom: 12px;
}

.weekday-labels {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 8px;
}

.weekday-label {
  font-size: 11px;
  color: #999;
  text-align: center;
}

.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.heatmap-cell {
  aspect-ratio: 1;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:active {
    transform: scale(0.92);
  }
}

.cell-day {
  font-size: 11px;
  font-weight: 500;
  color: #666;
}

.heatmap-cell.empty {
  background: transparent;
  cursor: default;
  aspect-ratio: 1;
  pointer-events: none;
  visibility: hidden;
}

.level-0 {
  background: #f0f0f0;
  
  .cell-day {
    color: #999;
  }
}

.level-1 {
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  
  .cell-day {
    color: #155724;
  }
}

.level-2 {
  background: linear-gradient(135deg, #81c784 0%, #66bb6a 100%);
  
  .cell-day {
    color: #fff;
  }
}

.level-3 {
  background: linear-gradient(135deg, #4caf50 0%, #43a047 100%);
  
  .cell-day {
    color: #fff;
  }
}

.level-4 {
  background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
  
  .cell-day {
    color: #fff;
    font-weight: 600;
  }
}

.heatmap-cell.today {
  box-shadow: 0 0 0 1.5px #3B82F6, 0 2px 6px rgba(0, 82, 217, 0.3);
}

.heatmap-cell.today .cell-day {
  color: #3B82F6;
  font-weight: 700;
}

.level-1.today .cell-day,
.level-2.today .cell-day,
.level-3.today .cell-day,
.level-4.today .cell-day {
  color: #fff;
}

.heatmap-cell.selected {
  transform: scale(1.1);
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.heatmap-legend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding-top: 10px;
  border-top: 0.5px solid #f0f0f0;
}

.legend-label {
  font-size: 11px;
  color: #999;
}

.legend-cells {
  display: flex;
  gap: 4px;
}

.legend-cell {
  width: 14px;
  height: 14px;
  border-radius: 3px;
}

.stats-section {
  background: #fff;
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.stats-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.stats-title-text {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.stats-update {
  font-size: 11px;
  color: #999;
}

.tooltip-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}

.day-tooltip {
  position: fixed;
  z-index: 1000;
  animation: tooltipFadeIn 0.2s ease;
}

.day-tooltip.arrow-bottom {
  animation: tooltipFadeInUp 0.2s ease;
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes tooltipFadeInUp {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tooltip-content {
  background: rgba(0, 0, 0, 0.85);
  border-radius: 6px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.tooltip-date {
  font-size: 12px;
  color: #fff;
  font-weight: 500;
  margin-bottom: 3px;
}

.tooltip-duration {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
}

.tooltip-arrow {
  position: absolute;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 6px solid rgba(0, 0, 0, 0.85);
  bottom: -5px;
  transform: translateX(-50%);
}

.day-tooltip.arrow-bottom .tooltip-arrow {
  border-top: none;
  border-bottom: 6px solid rgba(0, 0, 0, 0.85);
  bottom: auto;
  top: -5px;
}
</style>

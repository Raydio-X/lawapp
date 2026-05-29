<template>
  <div class="daily-users-chart">
    <div class="chart-header">
      <h3 class="chart-title">每日新增用户趋势</h3>
      <div class="chart-controls">
        <div class="view-toggle">
          <button 
            class="toggle-btn" 
            :class="{ active: chartType === 'line' }"
            @click="chartType = 'line'"
          >
            <t-icon name="chart" size="16px" />
            <span class="toggle-text">折线图</span>
          </button>
          <button 
            class="toggle-btn" 
            :class="{ active: chartType === 'bar' }"
            @click="chartType = 'bar'"
          >
            <t-icon name="chart-bar" size="16px" />
            <span class="toggle-text">柱状图</span>
          </button>
        </div>
        <select v-model="selectedDays" class="days-select" @change="onDaysChange">
          <option :value="7">近7天</option>
          <option :value="30">近30天</option>
        </select>
      </div>
    </div>
    
    <div class="chart-body" v-if="!loading">
      <div ref="chartRef" class="chart-container"></div>
      <div class="chart-summary">
        <div class="summary-item">
          <span class="summary-label">总计新增</span>
          <span class="summary-value">{{ totalNewUsers }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">日均新增</span>
          <span class="summary-value">{{ avgNewUsers }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">最高单日</span>
          <span class="summary-value">{{ maxNewUsers }}</span>
        </div>
      </div>
    </div>
    
    <div class="chart-loading" v-else>
      <t-icon name="loading" size="32px" color="#3B82F6" />
      <span>加载中...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import * as echarts from 'echarts'
import { adminAPI } from '@/utils/api'
import { MessagePlugin } from 'tdesign-vue-next'

interface DailyData {
  date: string
  count: number
}

const chartRef = ref<HTMLDivElement | null>(null)
const chartData = ref<DailyData[]>([])
const loading = ref(false)
const chartType = ref<'line' | 'bar'>('line')
const selectedDays = ref(30)
let chartInstance: echarts.ECharts | null = null

const getCacheKey = (days: number) => `daily_users_chart_cache_${days}`
const cacheExpiry = 5 * 60 * 1000

const isMobile = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

const totalNewUsers = computed(() => {
  return chartData.value.reduce((sum, item) => sum + item.count, 0)
})

const avgNewUsers = computed(() => {
  if (chartData.value.length === 0) return 0
  return Math.round(totalNewUsers.value / chartData.value.length)
})

const maxNewUsers = computed(() => {
  if (chartData.value.length === 0) return 0
  return Math.max(...chartData.value.map(item => item.count))
})

const loadCache = (days: number): { data: DailyData[]; timestamp: number } | null => {
  try {
    const cacheKey = getCacheKey(days)
    const cached = localStorage.getItem(cacheKey)
    if (!cached) return null
    
    const parsed = JSON.parse(cached)
    const now = Date.now()
    
    if (now - parsed.timestamp > cacheExpiry) {
      localStorage.removeItem(cacheKey)
      return null
    }
    
    return parsed
  } catch {
    return null
  }
}

const saveCache = (data: DailyData[], days: number) => {
  try {
    const cacheKey = getCacheKey(days)
    localStorage.setItem(cacheKey, JSON.stringify({
      data,
      timestamp: Date.now(),
      days
    }))
  } catch (error) {
    console.error('Cache save error:', error)
  }
}

const fetchData = async (forceRefresh = false) => {
  loading.value = true
  
  try {
    const days = selectedDays.value
    
    if (!forceRefresh) {
      const cached = loadCache(days)
      if (cached && cached.data) {
        chartData.value = cached.data
        loading.value = false
        await nextTick()
        initChart()
        return
      }
    }
    
    const response = await adminAPI.getDailyUsersStats(days)
    chartData.value = response.data || []
    
    saveCache(chartData.value, days)
  } catch (error: any) {
    console.error('Failed to fetch daily users stats:', error)
    MessagePlugin.error(error.message || '获取数据失败')
  } finally {
    loading.value = false
  }
  
  await nextTick()
  initChart()
}

const onDaysChange = () => {
  fetchData(true)
}

const initChart = () => {
  if (!chartRef.value || chartData.value.length === 0) return
  
  if (chartInstance) {
    chartInstance.dispose()
  }
  
  chartInstance = echarts.init(chartRef.value)
  
  const dates = chartData.value.map(item => {
    const date = new Date(item.date)
    return `${date.getMonth() + 1}/${date.getDate()}`
  })
  const counts = chartData.value.map(item => item.count)
  
  const mobileConfig = isMobile.value ? {
    fontSize: 10,
    gridLeft: '12%',
    gridRight: '5%',
    gridTop: '15%',
    gridBottom: '18%',
    symbolSize: 6,
    barWidth: '60%',
    tooltipFontSize: 12
  } : {
    fontSize: 12,
    gridLeft: '8%',
    gridRight: '5%',
    gridTop: '12%',
    gridBottom: '15%',
    symbolSize: 8,
    barWidth: '50%',
    tooltipFontSize: 14
  }
  
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e0e0e0',
      borderWidth: 1,
      textStyle: {
        color: '#333',
        fontSize: mobileConfig.tooltipFontSize
      },
      formatter: (params: any) => {
        const data = params[0]
        return `
          <div style="padding: 4px 8px;">
            <div style="font-weight: 600; margin-bottom: 4px;">${data.axisValue}</div>
            <div style="color: #3B82F6;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #3B82F6; margin-right: 6px;"></span>
              新增用户: <strong>${data.value}</strong> 人
            </div>
          </div>
        `
      }
    },
    grid: {
      left: mobileConfig.gridLeft,
      right: mobileConfig.gridRight,
      top: mobileConfig.gridTop,
      bottom: mobileConfig.gridBottom,
      containLabel: false
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: {
        lineStyle: {
          color: '#e0e0e0'
        }
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: '#666',
        fontSize: mobileConfig.fontSize,
        interval: isMobile.value ? 'auto' : 0,
        rotate: isMobile.value ? 45 : 0,
        margin: isMobile.value ? 12 : 8
      },
      splitLine: {
        show: false
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: '#666',
        fontSize: mobileConfig.fontSize,
        margin: 8
      },
      splitLine: {
        lineStyle: {
          color: '#f0f0f0',
          type: 'dashed'
        }
      },
      minInterval: 1
    },
    series: chartType.value === 'line' ? [
      {
        name: '新增用户',
        type: 'line',
        data: counts,
        smooth: true,
        symbol: 'circle',
        symbolSize: mobileConfig.symbolSize,
        lineStyle: {
          color: '#3B82F6',
          width: 2
        },
        itemStyle: {
          color: '#3B82F6',
          borderColor: '#fff',
          borderWidth: 2
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
            ]
          }
        },
        emphasis: {
          itemStyle: {
            color: '#3B82F6',
            borderColor: '#fff',
            borderWidth: 3,
            shadowBlur: 10,
            shadowColor: 'rgba(59, 130, 246, 0.5)'
          }
        }
      }
    ] : [
      {
        name: '新增用户',
        type: 'bar',
        data: counts,
        barWidth: mobileConfig.barWidth,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#3B82F6' },
              { offset: 1, color: '#60A5FA' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        },
        emphasis: {
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#2563EB' },
                { offset: 1, color: '#3B82F6' }
              ]
            },
            shadowBlur: 10,
            shadowColor: 'rgba(59, 130, 246, 0.5)'
          }
        }
      }
    ]
  }
  
  chartInstance.setOption(option)
}

const handleResize = () => {
  checkMobile()
  if (chartInstance) {
    chartInstance.resize()
    initChart()
  }
}

onMounted(() => {
  checkMobile()
  fetchData()
  
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})

watch(chartType, () => {
  if (chartData.value.length > 0) {
    initChart()
  }
})
</script>

<style lang="scss" scoped>
.daily-users-chart {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.chart-controls {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.view-toggle {
  display: flex;
  gap: 4px;
  background: #f5f5f5;
  border-radius: 6px;
  padding: 2px;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: none;
  background: transparent;
  border-radius: 4px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    color: #333;
  }
  
  &.active {
    background: #fff;
    color: #3B82F6;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
}

.toggle-text {
  @media (max-width: 768px) {
    display: none;
  }
}

.days-select {
  padding: 6px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 13px;
  color: #333;
  background: #fff;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #3B82F6;
  }
}

.chart-body {
  position: relative;
}

.chart-container {
  width: 100%;
  height: 280px;
  
  @media (max-width: 768px) {
    height: 250px;
  }
}

.chart-summary {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
  
  @media (max-width: 768px) {
    flex-wrap: wrap;
    gap: 16px;
  }
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  
  @media (max-width: 768px) {
    min-width: 80px;
  }
}

.summary-label {
  font-size: 12px;
  color: #999;
  
  @media (max-width: 768px) {
    font-size: 11px;
  }
}

.summary-value {
  font-size: 20px;
  font-weight: 600;
  color: #3B82F6;
  
  @media (max-width: 768px) {
    font-size: 18px;
  }
}

.chart-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 280px;
  gap: 12px;
  color: #999;
  font-size: 14px;
}
</style>

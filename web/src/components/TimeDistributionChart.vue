<template>
  <div class="time-distribution-chart">
    <div class="chart-container" ref="chartRef"></div>
    <div class="chart-legend">
      <div class="legend-item">
        <div class="legend-color"></div>
        <span class="legend-text">学习时长（分钟）</span>
      </div>
      <div class="peak-time" v-if="peakTimeInfo">
        <t-icon name="time" size="14px" color="#3B82F6" />
        <span>最佳学习时段：{{ peakTimeInfo }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import * as echarts from 'echarts'

interface Props {
  data: number[]
}

const props = defineProps<Props>()

const chartRef = ref<HTMLDivElement | null>(null)
let chartInstance: echarts.ECharts | null = null

const isMobile = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

const peakTimeInfo = computed(() => {
  if (!props.data || !Array.isArray(props.data) || props.data.length === 0) {
    return null
  }
  
  const max = Math.max(...props.data)
  if (max === 0) return null
  
  const peakHour = props.data.indexOf(max)
  const formatHour = (hour: number) => {
    if (hour === 0) return '凌晨0点'
    if (hour < 6) return `凌晨${hour}点`
    if (hour < 12) return `上午${hour}点`
    if (hour === 12) return '中午12点'
    return `下午${hour - 12}点`
  }
  return `${formatHour(peakHour)}（${max}分钟）`
})

const validateData = (data: number[]): number[] => {
  if (!Array.isArray(data) || data.length !== 24) {
    return Array(24).fill(0)
  }
  return data.map(val => {
    const num = Number(val)
    return isNaN(num) || num < 0 ? 0 : Math.round(num)
  })
}

const initChart = () => {
  if (!chartRef.value) {
    console.warn('Chart container not found')
    return
  }
  
  const validatedData = validateData(props.data)
  console.log('Initializing chart with data:', validatedData)
  
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }
  
  const hours = Array.from({ length: 24 }, (_, i) => i)
  
  const mobileConfig = isMobile.value ? {
    fontSize: 10,
    gridLeft: '12%',
    gridRight: '5%',
    gridTop: '15%',
    gridBottom: '18%',
    barWidth: '60%',
    tooltipFontSize: 12,
    labelFontSize: 9
  } : {
    fontSize: 12,
    gridLeft: '8%',
    gridRight: '5%',
    gridTop: '12%',
    gridBottom: '15%',
    barWidth: '50%',
    tooltipFontSize: 14,
    labelFontSize: 11
  }
  
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e0e0e0',
      borderWidth: 1,
      textStyle: {
        color: '#333',
        fontSize: mobileConfig.tooltipFontSize
      },
      formatter: (params: any) => {
        const data = params[0]
        const hour = data.dataIndex
        const timeLabel = hour < 12 ? `上午${hour}点` : (hour === 12 ? '中午12点' : `下午${hour - 12}点`)
        return `
          <div style="padding: 4px 8px;">
            <div style="font-weight: 600; margin-bottom: 4px;">${timeLabel}</div>
            <div style="color: #3B82F6;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #3B82F6; margin-right: 6px;"></span>
              学习时长: <strong>${data.value}</strong> 分钟
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
      data: hours,
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
        fontSize: mobileConfig.labelFontSize,
        interval: isMobile.value ? 2 : 0,
        margin: 8
      },
      splitLine: {
        show: false
      },
      name: '时间段(小时)',
      nameLocation: 'middle',
      nameGap: 30,
      nameTextStyle: {
        color: '#666',
        fontSize: mobileConfig.fontSize
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
        fontSize: mobileConfig.labelFontSize,
        margin: 8
      },
      splitLine: {
        lineStyle: {
          color: '#f0f0f0',
          type: 'dashed'
        }
      },
      minInterval: 1,
      name: '学习时长(分钟)',
      nameLocation: 'middle',
      nameGap: 40,
      nameTextStyle: {
        color: '#666',
        fontSize: mobileConfig.fontSize
      },
      nameRotate: 90
    },
    series: [
      {
        name: '学习时长',
        type: 'bar',
        data: validateData(props.data),
        barWidth: mobileConfig.barWidth,
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#60A5FA' },
              { offset: 1, color: '#3B82F6' }
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
                { offset: 0, color: '#3B82F6' },
                { offset: 1, color: '#2563EB' }
              ]
            },
            shadowBlur: 10,
            shadowColor: 'rgba(59, 130, 246, 0.5)'
          }
        },
        label: {
          show: !isMobile.value,
          position: 'top',
          color: '#666',
          fontSize: 10,
          formatter: (params: any) => {
            return params.value > 0 ? params.value : ''
          }
        }
      }
    ]
  }
  
  chartInstance.setOption(option, { notMerge: true })
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
  
  nextTick(() => {
    setTimeout(() => {
      initChart()
    }, 100)
  })
  
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})

watch(() => props.data, (newData, oldData) => {
  console.log('Data changed:', { newData, oldData })
  
  if (!chartInstance) {
    initChart()
    return
  }
  
  const newDataStr = JSON.stringify(newData)
  const oldDataStr = JSON.stringify(oldData)
  
  if (newDataStr !== oldDataStr) {
    initChart()
  }
}, { deep: true, immediate: false })
</script>

<style lang="scss" scoped>
.time-distribution-chart {
  width: 100%;
}

.chart-container {
  width: 100%;
  height: 280px;
  
  @media (max-width: 768px) {
    height: 250px;
  }
}

.chart-legend {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-color {
  width: 12px;
  height: 12px;
  background: linear-gradient(180deg, #60A5FA 0%, #3B82F6 100%);
  border-radius: 2px;
}

.legend-text {
  font-size: 12px;
  color: #666;
  
  @media (max-width: 768px) {
    font-size: 11px;
  }
}

.peak-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #3B82F6;
  
  @media (max-width: 768px) {
    font-size: 11px;
  }
}
</style>

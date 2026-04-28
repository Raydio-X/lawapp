<template>
  <div class="radar-chart">
    <canvas ref="canvasRef" class="radar-canvas"></canvas>
    <div class="radar-legend">
      <div class="legend-item">
        <div class="legend-line user-line"></div>
        <span class="legend-text">我的数据</span>
      </div>
      <div class="legend-item">
        <div class="legend-line avg-line"></div>
        <span class="legend-text">平均数据</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'

interface Dimension {
  name: string
  min: number
  format: string
  unit?: string
}

const props = defineProps<{
  dimensions: Dimension[]
  userData: number[]
  avgData: number[]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let displayWidth = 0
let displayHeight = 0

const formatValue = (val: number, dim: Dimension) => {
  if (dim.format === 'hours') {
    if (!val) return { value: '0', unit: 'h' }
    if (val < 60) return { value: String(val), unit: 'min' }
    return { value: (val / 60).toFixed(1), unit: 'h' }
  }
  if (dim.format === 'minutes') {
    return { value: String(val || 0), unit: 'min' }
  }
  return { value: String(val || 0), unit: dim.unit || '' }
}

const initCanvas = () => {
  if (!canvasRef.value) return
  
  const canvas = canvasRef.value
  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  
  displayWidth = rect.width
  displayHeight = rect.height
  
  canvas.width = displayWidth * dpr
  canvas.height = displayHeight * dpr
  
  ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.scale(dpr, dpr)
    drawChart()
  }
}

const drawChart = () => {
  if (!ctx || !props.dimensions.length) return
  
  const { dimensions, userData, avgData } = props
  const w = displayWidth
  const h = displayHeight
  const centerX = w / 2
  const centerY = h / 2
  const radius = Math.min(w, h) / 2 - 28
  const n = dimensions.length
  
  ctx.clearRect(0, 0, w, h)
  
  const maxValues = dimensions.map((dim, i) => {
    const userVal = userData[i] || 0
    const avgVal = avgData[i] || 0
    const maxVal = Math.max(userVal, avgVal)
    return Math.max(maxVal * 1.3, dim.min || 1)
  })
  
  drawGrid(centerX, centerY, radius, n)
  drawAxes(centerX, centerY, radius, n)
  drawPolygon(centerX, centerY, radius, avgData, maxValues, n, 'rgba(255,159,64,0.10)', 'rgba(255,159,64,0.7)', 2)
  drawPolygon(centerX, centerY, radius, userData, maxValues, n, 'rgba(91,143,249,0.10)', 'rgba(91,143,249,0.6)', 2)
  drawDataPoints(centerX, centerY, radius, avgData, maxValues, n, '#FF9500')
  drawDataPoints(centerX, centerY, radius, userData, maxValues, n, '#5B8FF9')
  drawLabels(centerX, centerY, radius, dimensions, userData, avgData, n)
}

const drawGrid = (centerX: number, centerY: number, radius: number, n: number) => {
  if (!ctx) return
  const levels = 4
  for (let l = 1; l <= levels; l++) {
    const r = (radius * l) / levels
    ctx.beginPath()
    for (let i = 0; i <= n; i++) {
      const angle = (Math.PI * 2 * (i % n)) / n - Math.PI / 2
      const x = centerX + r * Math.cos(angle)
      const y = centerY + r * Math.sin(angle)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.strokeStyle = l === levels ? '#d0d0d0' : '#e8e8e8'
    ctx.lineWidth = 1
    ctx.stroke()
  }
}

const drawAxes = (centerX: number, centerY: number, radius: number, n: number) => {
  if (!ctx) return
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.lineTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle))
    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 1
    ctx.stroke()
  }
}

const drawPolygon = (
  centerX: number,
  centerY: number,
  radius: number,
  data: number[],
  maxValues: number[],
  n: number,
  fillColor: string,
  strokeColor: string,
  lineWidth: number
) => {
  if (!ctx) return
  const hasData = data.some(v => v > 0)
  if (!hasData) return
  
  ctx.beginPath()
  for (let i = 0; i <= n; i++) {
    const idx = i % n
    const angle = (Math.PI * 2 * idx) / n - Math.PI / 2
    const val = Math.min((data[idx] || 0) / maxValues[idx], 1)
    const r = radius * val
    const x = centerX + r * Math.cos(angle)
    const y = centerY + r * Math.sin(angle)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fillStyle = fillColor
  ctx.fill()
  ctx.strokeStyle = strokeColor
  ctx.lineWidth = lineWidth
  ctx.stroke()
}

const drawDataPoints = (
  centerX: number,
  centerY: number,
  radius: number,
  data: number[],
  maxValues: number[],
  n: number,
  color: string
) => {
  if (!ctx) return
  for (let i = 0; i < n; i++) {
    if (!(data[i] > 0)) continue
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2
    const val = Math.min((data[i] || 0) / maxValues[i], 1)
    const r = radius * val
    const x = centerX + r * Math.cos(angle)
    const y = centerY + r * Math.sin(angle)
    
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1.5
    ctx.stroke()
  }
}

const drawLabels = (
  centerX: number,
  centerY: number,
  radius: number,
  dimensions: Dimension[],
  userData: number[],
  avgData: number[],
  n: number
) => {
  if (!ctx) return
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2
    const labelR = radius + 18
    const x = centerX + labelR * Math.cos(angle)
    const y = centerY + labelR * Math.sin(angle)
    
    const cosA = Math.cos(angle)
    let textAlign: CanvasTextAlign
    if (Math.abs(cosA) < 0.15) {
      textAlign = 'center'
    } else if (cosA > 0) {
      textAlign = 'left'
    } else {
      textAlign = 'right'
    }
    
    ctx.textAlign = textAlign
    ctx.textBaseline = 'bottom'
    
    ctx.fillStyle = '#555'
    ctx.font = 'bold 12px sans-serif'
    ctx.fillText(dimensions[i].name, x, y)
    
    const userFormatted = formatValue(userData[i] || 0, dimensions[i])
    const avgFormatted = formatValue(avgData[i] || 0, dimensions[i])
    
    ctx.font = 'bold 10px sans-serif'
    ctx.textBaseline = 'top'
    
    const userText = String(userFormatted.value)
    const slashText = '/'
    const avgText = avgFormatted.value + userFormatted.unit
    
    const userWidth = ctx.measureText(userText).width
    const slashWidth = ctx.measureText(slashText).width
    
    let startX: number
    if (textAlign === 'center') {
      const totalWidth = userWidth + slashWidth + ctx.measureText(avgText).width
      startX = x - totalWidth / 2
    } else if (textAlign === 'right') {
      const totalWidth = userWidth + slashWidth + ctx.measureText(avgText).width
      startX = x - totalWidth
    } else {
      startX = x
    }
    
    ctx.fillStyle = '#5B8FF9'
    ctx.textAlign = 'left'
    ctx.fillText(userText, startX, y + 2)
    
    ctx.fillStyle = '#999'
    ctx.fillText(slashText, startX + userWidth, y + 2)
    
    ctx.fillStyle = '#FF9500'
    ctx.fillText(avgText, startX + userWidth + slashWidth, y + 2)
  }
}

onMounted(() => {
  nextTick(() => {
    initCanvas()
  })
})

watch(
  () => [props.dimensions, props.userData, props.avgData],
  () => {
    if (ctx) {
      drawChart()
    }
  },
  { deep: true }
)
</script>

<style lang="scss" scoped>
.radar-chart {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.radar-canvas {
  width: 100%;
  height: 270px;
}

.radar-legend {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.legend-line {
  width: 16px;
  height: 3px;
  border-radius: 1.5px;
}

.user-line {
  background: #5B8FF9;
}

.avg-line {
  background: #FF9500;
}

.legend-text {
  font-size: 12px;
  color: #666;
}
</style>

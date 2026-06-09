<template>
  <div class="mindmap-container" ref="containerRef">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="zoom-controls">
          <button class="tool-btn" @click="zoomOut" title="缩小">
            <t-icon name="remove" size="16px" />
          </button>
          <span class="zoom-level">{{ Math.round(zoom * 100) }}%</span>
          <button class="tool-btn" @click="zoomIn" title="放大">
            <t-icon name="add" size="16px" />
          </button>
          <button class="tool-btn" @click="resetZoom" title="重置">
            <t-icon name="refresh" size="16px" />
          </button>
        </div>
      </div>
    </div>

    <!-- 脑图画布 -->
    <div 
      class="mindmap-canvas" 
      ref="canvasRef"
      @mousedown="onCanvasMouseDown"
      @mousemove="onCanvasMouseMove"
      @mouseup="onCanvasMouseUp"
      @mouseleave="onCanvasMouseUp"
      @wheel="onWheel"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
      @touchcancel="onTouchCancel"
    >
      <div 
        class="mindmap-content"
        :style="contentStyle"
      >
        <!-- 连接线 -->
        <svg class="connections-layer" :style="svgStyle">
          <g v-for="link in links" :key="link.id">
            <path
              :d="link.path"
              class="connection-line"
              :class="{ highlighted: link.highlighted }"
            />
          </g>
        </svg>

        <!-- 节点 -->
        <div 
          v-for="node in visibleNodes" 
          :key="node.id"
          class="mindmap-node"
          :class="{
            root: node.isRoot,
            collapsed: node.collapsed,
            selected: selectedNodeId === node.id
          }"
          :style="getNodeStyle(node)"
          @click.stop="onNodeClick(node)"
          @mousedown.stop="onNodeMouseDown($event, node)"
        >
          <div class="node-content">
            <div class="node-header">
              <div class="node-icon" :class="getNodeIconClass(node)">
                <t-icon :name="getNodeIcon(node)" size="14px" />
              </div>
              <span class="node-title">{{ node.title }}</span>
            </div>
            <div class="node-info" v-if="node.libraryName">
              <span class="node-library">{{ node.libraryName }}</span>
            </div>
          </div>
          
          <!-- 展开/折叠按钮 -->
          <button 
            v-if="node.children && node.children.length > 0"
            class="collapse-btn"
            @click.stop="toggleCollapse(node)"
          >
            <t-icon :name="node.collapsed ? 'add' : 'remove'" size="12px" />
          </button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div class="empty-state" v-if="nodes.length === 0 && !loading">
      <t-icon name="link-1" size="48px" color="#ddd" />
      <p class="empty-text">暂无关联卡片</p>
      <p class="empty-hint">在卡片学习页面添加关联后，这里将显示脑图</p>
    </div>

    <!-- 加载状态 -->
    <div class="loading-state" v-if="loading">
      <t-loading size="large" />
      <p class="loading-text">加载中...</p>
    </div>

    <!-- 卡片详情弹窗 -->
    <t-dialog
      v-model:visible="showDetailDialog"
      header="卡片详情"
      :footer="false"
      width="600px"
    >
      <div class="card-detail" v-if="selectedCard">
        <div class="detail-section">
          <div class="detail-label">问题</div>
          <div class="detail-content question" v-html="selectedCard.question"></div>
        </div>
        <div class="detail-section">
          <div class="detail-label">答案</div>
          <div class="detail-content answer" v-html="selectedCard.answer"></div>
        </div>
        <div class="detail-section" v-if="selectedCard.tags && selectedCard.tags.length > 0">
          <div class="detail-label">标签</div>
          <div class="detail-tags">
            <span class="tag" v-for="tag in selectedCard.tags" :key="tag">{{ tag }}</span>
          </div>
        </div>
        <div class="detail-actions">
          <button class="action-btn primary" @click="goToCard">
            <t-icon name="book" size="16px" />
            <span>去学习</span>
          </button>
          <button class="action-btn" @click="showDetailDialog = false">
            <t-icon name="close" size="16px" />
            <span>关闭</span>
          </button>
        </div>
      </div>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { cardAPI, isLoggedIn } from '@/utils/api'

interface MindMapNode {
  id: number
  title: string
  libraryName?: string
  isRoot: boolean
  collapsed: boolean
  x: number
  y: number
  width: number
  height: number
  children: MindMapNode[]
  parent?: MindMapNode
  cardData?: any
}

interface Link {
  id: string
  path: string
  highlighted: boolean
}

const props = defineProps<{
  userId?: number
}>()

const router = useRouter()

// 状态
const containerRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLElement | null>(null)
const loading = ref(false)
const nodes = ref<MindMapNode[]>([])
const selectedNodeId = ref<number | null>(null)
const selectedCard = ref<any>(null)
const showDetailDialog = ref(false)

// 缩放和平移
const zoom = ref(1)
const panX = ref(0)
const panY = ref(0)

// 拖拽状态
const isDraggingCanvas = ref(false)
const isDraggingNode = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const dragNode = ref<MindMapNode | null>(null)

// 布局配置
const NODE_WIDTH = 180
const NODE_HEIGHT = 60
const HORIZONTAL_GAP = 80
const VERTICAL_GAP = 30
const ROOT_OFFSET = 100

// 计算样式
const contentStyle = computed(() => ({
  transform: `translate(${panX.value}px, ${panY.value}px) scale(${zoom.value})`,
  transformOrigin: '0 0'
}))

const svgStyle = computed(() => ({
  width: '100%',
  height: '100%',
  overflow: 'visible'
}))

// 获取可见节点
const visibleNodes = computed(() => {
  const result: MindMapNode[] = []
  
  const addNode = (node: MindMapNode) => {
    result.push(node)
    if (!node.collapsed && node.children.length > 0) {
      node.children.forEach(child => addNode(child))
    }
  }
  
  nodes.value.forEach(node => addNode(node))
  return result
})

// 计算连接线
const links = computed(() => {
  const result: Link[] = []
  
  const addLinks = (node: MindMapNode) => {
    if (node.collapsed) return
    
    node.children.forEach(child => {
      const path = createLinkPath(node, child)
      result.push({
        id: `${node.id}-${child.id}`,
        path,
        highlighted: selectedNodeId.value === node.id || selectedNodeId.value === child.id
      })
      addLinks(child)
    })
  }
  
  nodes.value.forEach(node => addLinks(node))
  return result
})

// 创建连接线路径
const createLinkPath = (parent: MindMapNode, child: MindMapNode): string => {
  const startX = parent.x + NODE_WIDTH
  const startY = parent.y + NODE_HEIGHT / 2
  const endX = child.x
  const endY = child.y + NODE_HEIGHT / 2

  // 水平布局的贝塞尔曲线
  const midX = (startX + endX) / 2
  return `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`
}

// 获取节点样式
const getNodeStyle = (node: MindMapNode) => ({
  left: `${node.x}px`,
  top: `${node.y}px`,
  width: `${NODE_WIDTH}px`,
  height: `${NODE_HEIGHT}px`
})

// 获取节点图标
const getNodeIcon = (node: MindMapNode): string => {
  if (node.isRoot) return 'star'
  return 'file'
}

const getNodeIconClass = (node: MindMapNode): string => {
  if (node.isRoot) return 'root-icon'
  return 'child-icon'
}

// 加载数据
const loadData = async () => {
  if (!isLoggedIn()) {
    return
  }

  loading.value = true
  try {
    // 获取用户所有卡片关联数据
    const res = await cardAPI.getAllLinkedCards()
    if (res.success && res.data) {
      buildMindMap(res.data)
    }
  } catch (error) {
    console.error('加载脑图数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 构建脑图数据结构
const buildMindMap = (data: any[]) => {
  nodes.value = []
  
  if (!data || data.length === 0) {
    return
  }

  // 构建节点映射
  const nodeMap = new Map<number, MindMapNode>()
  const rootNodes: MindMapNode[] = []

  // 创建所有节点
  data.forEach(item => {
    // 主卡片
    if (!nodeMap.has(item.card_id)) {
      const node: MindMapNode = {
        id: item.card_id,
        title: truncateTitle(item.card_question || '未命名'),
        libraryName: item.card_library_name,
        isRoot: true,
        collapsed: false,
        x: 0,
        y: 0,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        children: [],
        cardData: {
          id: item.card_id,
          question: item.card_question,
          answer: item.card_answer,
          tags: item.card_tags,
          libraryName: item.card_library_name
        }
      }
      nodeMap.set(item.card_id, node)
      rootNodes.push(node)
    }

    // 关联卡片
    if (!nodeMap.has(item.linked_card_id)) {
      const linkedNode: MindMapNode = {
        id: item.linked_card_id,
        title: truncateTitle(item.linked_card_question || '未命名'),
        libraryName: item.linked_library_name,
        isRoot: false,
        collapsed: false,
        x: 0,
        y: 0,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        children: [],
        cardData: {
          id: item.linked_card_id,
          question: item.linked_card_question,
          answer: item.linked_card_answer,
          tags: item.linked_card_tags,
          libraryName: item.linked_library_name
        }
      }
      nodeMap.set(item.linked_card_id, linkedNode)
    }
  })

  // 建立父子关系
  data.forEach(item => {
    const parentNode = nodeMap.get(item.card_id)
    const childNode = nodeMap.get(item.linked_card_id)
    
    if (parentNode && childNode) {
      // 检查是否已经添加过
      if (!parentNode.children.find(c => c.id === childNode.id)) {
        parentNode.children.push(childNode)
        childNode.parent = parentNode
        childNode.isRoot = false
      }
    }
  })

  // 过滤出真正的根节点（没有父节点的节点）
  const realRootNodes = rootNodes.filter(node => !node.parent)
  
  nodes.value = realRootNodes
  
  // 计算布局
  nextTick(() => {
    calculateLayout()
    // 等待 canvas 渲染完成后再居中
    setTimeout(() => {
      centerView()
    }, 100)
  })
}

// 截断标题
const truncateTitle = (title: string): string => {
  if (!title) return '未命名'
  const plainText = title.replace(/<[^>]+>/g, '')
  return plainText.length > 20 ? plainText.substring(0, 20) + '...' : plainText
}

// 计算布局
const calculateLayout = () => {
  let currentY = 0

  nodes.value.forEach(rootNode => {
    layoutSubtree(rootNode, 0, currentY)
    const subtreeHeight = getSubtreeHeight(rootNode)
    currentY += subtreeHeight + VERTICAL_GAP * 3
  })
}

// 布局子树（水平布局）
const layoutSubtree = (node: MindMapNode, depth: number, startY: number): number => {
  node.x = depth * (NODE_WIDTH + HORIZONTAL_GAP)
  node.y = startY

  if (node.collapsed || node.children.length === 0) {
    return NODE_HEIGHT
  }

  let currentY = startY
  node.children.forEach(child => {
    const childHeight = layoutSubtree(child, depth + 1, currentY)
    currentY += childHeight + VERTICAL_GAP
  })

  // 垂直居中父节点
  const firstChild = node.children[0]
  const lastChild = node.children[node.children.length - 1]
  node.y = (firstChild.y + lastChild.y) / 2

  return currentY - startY - VERTICAL_GAP
}

// 获取子树高度
const getSubtreeHeight = (node: MindMapNode): number => {
  if (node.collapsed || node.children.length === 0) {
    return NODE_HEIGHT
  }

  let totalHeight = 0
  node.children.forEach(child => {
    totalHeight += getSubtreeHeight(child) + VERTICAL_GAP
  })
  return Math.max(NODE_HEIGHT, totalHeight - VERTICAL_GAP)
}

// 居中视图
const centerView = () => {
  if (!canvasRef.value || visibleNodes.value.length === 0) return

  const canvas = canvasRef.value
  const canvasWidth = canvas.clientWidth
  const canvasHeight = canvas.clientHeight

  // 确保 canvas 有正确的尺寸
  if (canvasWidth === 0 || canvasHeight === 0) {
    setTimeout(centerView, 100)
    return
  }

  // 计算边界
  let minX = Infinity, maxX = -Infinity
  let minY = Infinity, maxY = -Infinity

  visibleNodes.value.forEach(node => {
    minX = Math.min(minX, node.x)
    maxX = Math.max(maxX, node.x + NODE_WIDTH)
    minY = Math.min(minY, node.y)
    maxY = Math.max(maxY, node.y + NODE_HEIGHT)
  })

  const contentWidth = maxX - minX
  const contentHeight = maxY - minY
  // 内容中心点（相对于内容左上角）
  const contentCenterX = minX + contentWidth / 2
  const contentCenterY = minY + contentHeight / 2

  // 设置缩放以适应画布，初始缩放放大一些
  const scaleX = (canvasWidth - 100) / contentWidth
  const scaleY = (canvasHeight - 100) / contentHeight
  const baseZoom = Math.min(scaleX, scaleY)
  // 初始缩放放大到1.2倍，但不超过1.5
  zoom.value = Math.min(1.5, Math.max(0.8, baseZoom * 1.2))

  // 居中：让内容中心对齐画布中心
  // 内容中心在缩放后的位置：(contentCenterX * zoom, contentCenterY * zoom)
  // 平移后：(contentCenterX * zoom + panX, contentCenterY * zoom + panY)
  // 目标：(canvasWidth / 2, canvasHeight / 2)
  panX.value = canvasWidth / 2 - contentCenterX * zoom.value
  panY.value = canvasHeight / 2 - contentCenterY * zoom.value
}

// 缩放控制
const zoomIn = () => {
  zoom.value = Math.min(2, zoom.value + 0.1)
}

const zoomOut = () => {
  zoom.value = Math.max(0.3, zoom.value - 0.1)
}

const resetZoom = () => {
  zoom.value = 1
  centerView()
}

const onWheel = (e: WheelEvent) => {
  e.preventDefault()
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  zoom.value = Math.max(0.3, Math.min(2, zoom.value + delta))
}

// 展开/折叠
const toggleCollapse = (node: MindMapNode) => {
  node.collapsed = !node.collapsed
  nextTick(() => {
    calculateLayout()
  })
}

// 画布拖拽
const onCanvasMouseDown = (e: MouseEvent) => {
  isDraggingCanvas.value = true
  dragStartX.value = e.clientX - panX.value
  dragStartY.value = e.clientY - panY.value
}

const onCanvasMouseMove = (e: MouseEvent) => {
  if (isDraggingCanvas.value) {
    panX.value = e.clientX - dragStartX.value
    panY.value = e.clientY - dragStartY.value
  } else if (isDraggingNode.value && dragNode.value) {
    // 节点拖拽（可选功能）
  }
}

const onCanvasMouseUp = () => {
  isDraggingCanvas.value = false
  isDraggingNode.value = false
  dragNode.value = null
}

// 节点拖拽
const onNodeMouseDown = (e: MouseEvent, node: MindMapNode) => {
  isDraggingNode.value = true
  dragNode.value = node
  dragStartX.value = e.clientX
  dragStartY.value = e.clientY
}

// ============ 触摸事件处理 ============
// 触摸状态
const touchStartPanX = ref(0)
const touchStartPanY = ref(0)
const touchStartZoom = ref(1)
const initialPinchDistance = ref(0)
const initialPinchCenterX = ref(0)
const initialPinchCenterY = ref(0)
const lastTouchTime = ref(0)
const isTouchDragging = ref(false)

// 计算两指距离
const getPinchDistance = (touches: TouchList): number => {
  if (touches.length < 2) return 0
  const dx = touches[0].clientX - touches[1].clientX
  const dy = touches[0].clientY - touches[1].clientY
  return Math.sqrt(dx * dx + dy * dy)
}

// 计算两指中心点
const getPinchCenter = (touches: TouchList): { x: number; y: number } => {
  if (touches.length < 2) {
    return { x: touches[0].clientX, y: touches[0].clientY }
  }
  return {
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2
  }
}

// 触摸开始
const onTouchStart = (e: TouchEvent) => {
  const now = Date.now()
  
  // 防止快速连续触发
  if (now - lastTouchTime.value < 16) return
  lastTouchTime.value = now
  
  const touches = e.touches
  
  // 检查是否触摸在节点上
  const target = e.target as HTMLElement
  const isNodeTouch = target.closest('.mindmap-node') !== null
  
  if (touches.length === 1) {
    // 如果触摸在节点上，不启动拖动（让节点点击事件处理）
    if (isNodeTouch) {
      isTouchDragging.value = false
      return
    }
    
    // 单指拖动
    isTouchDragging.value = true
    touchStartPanX.value = panX.value
    touchStartPanY.value = panY.value
    dragStartX.value = touches[0].clientX
    dragStartY.value = touches[0].clientY
  } else if (touches.length === 2) {
    // 双指缩放
    isTouchDragging.value = false
    initialPinchDistance.value = getPinchDistance(touches)
    touchStartZoom.value = zoom.value
    
    const center = getPinchCenter(touches)
    initialPinchCenterX.value = center.x
    initialPinchCenterY.value = center.y
    touchStartPanX.value = panX.value
    touchStartPanY.value = panY.value
  }
}

// 触摸移动
const onTouchMove = (e: TouchEvent) => {
  e.preventDefault() // 阻止页面滚动
  
  const touches = e.touches
  
  if (touches.length === 1 && isTouchDragging.value) {
    // 单指拖动 - 平移画布
    const deltaX = touches[0].clientX - dragStartX.value
    const deltaY = touches[0].clientY - dragStartY.value
    
    // 直接更新位置，确保响应及时
    panX.value = touchStartPanX.value + deltaX
    panY.value = touchStartPanY.value + deltaY
  } else if (touches.length === 2) {
    // 双指缩放
    const currentDistance = getPinchDistance(touches)
    
    if (initialPinchDistance.value > 0) {
      // 计算新的缩放比例
      const scale = currentDistance / initialPinchDistance.value
      const newZoom = Math.max(0.3, Math.min(2, touchStartZoom.value * scale))
      
      // 计算缩放中心点
      const center = getPinchCenter(touches)
      
      // 以两指中心为缩放中心调整位置
      // 缩放前的点在画布中的位置
      const beforeX = (center.x - touchStartPanX.value) / zoom.value
      const beforeY = (center.y - touchStartPanY.value) / zoom.value
      
      // 更新缩放
      zoom.value = newZoom
      
      // 调整平移以保持缩放中心不变
      panX.value = center.x - beforeX * newZoom
      panY.value = center.y - beforeY * newZoom
    }
  }
}

// 触摸结束
const onTouchEnd = (e: TouchEvent) => {
  const touches = e.touches
  
  if (touches.length === 0) {
    // 所有手指离开
    isTouchDragging.value = false
    initialPinchDistance.value = 0
  } else if (touches.length === 1) {
    // 从双指变为单指，切换到拖动模式
    isTouchDragging.value = true
    touchStartPanX.value = panX.value
    touchStartPanY.value = panY.value
    dragStartX.value = touches[0].clientX
    dragStartY.value = touches[0].clientY
    initialPinchDistance.value = 0
  }
}

// 触摸取消
const onTouchCancel = (e: TouchEvent) => {
  isTouchDragging.value = false
  initialPinchDistance.value = 0
}

// 节点点击 - 跳转到卡片详情页面
const onNodeClick = (node: MindMapNode) => {
  selectedNodeId.value = node.id
  selectedCard.value = node.cardData
  
  // 跳转到卡片学习页面
  router.push({
    path: '/card/study',
    query: {
      cardId: node.id
    }
  })
}

// 跳转到卡片学习
const goToCard = () => {
  if (selectedCard.value) {
    showDetailDialog.value = false
    router.push({
      path: '/card/study',
      query: {
        cardId: selectedCard.value.id,
        libraryId: selectedCard.value.libraryId
      }
    })
  }
}

// 监听窗口大小变化
const handleResize = () => {
  centerView()
}

onMounted(() => {
  loadData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// 暴露方法
defineExpose({
  loadData
})
</script>

<style lang="scss" scoped>
.mindmap-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: #f8fafc;
  border-radius: 12px;
  overflow: hidden;
}

.toolbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 44px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 10;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tool-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
  }

  &:active {
    background: #e5e7eb;
  }
}

.zoom-level {
  min-width: 50px;
  text-align: center;
  font-size: 12px;
  color: #6b7280;
}

.mindmap-canvas {
  width: 100%;
  height: calc(100% - 44px);
  margin-top: 44px;
  overflow: hidden;
  cursor: grab;
  // 触摸优化
  touch-action: none; // 禁用浏览器默认触摸行为
  -webkit-touch-callout: none; // 禁用长按菜单
  user-select: none; // 禁用文本选择

  &:active {
    cursor: grabbing;
  }
}

.mindmap-content {
  width: 100%;
  height: 100%;
  position: relative;
}

.connections-layer {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.connection-line {
  fill: none;
  stroke: #d1d5db;
  stroke-width: 2;
  transition: stroke 0.2s;

  &.highlighted {
    stroke: #3B82F6;
    stroke-width: 2.5;
  }
}

.mindmap-node {
  position: absolute;
  background: #fff;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  // 触摸优化
  touch-action: manipulation; // 允许点击但禁用双击缩放

  &:hover {
    border-color: #3B82F6;
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.15);
  }

  &:active {
    transform: scale(0.98); // 触摸反馈
  }

  &.root {
    border-color: #3B82F6;
    background: linear-gradient(135deg, #eff6ff 0%, #fff 100%);

    .node-icon {
      background: #3B82F6;
      color: #fff;
    }
  }

  &.selected {
    border-color: #3B82F6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }

  &.collapsed {
    opacity: 0.9;
  }
}

.node-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.node-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.node-icon {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  color: #6b7280;
  flex-shrink: 0;

  &.root-icon {
    background: #3B82F6;
    color: #fff;
  }

  &.child-icon {
    background: #f3f4f6;
    color: #6b7280;
  }
}

.node-title {
  font-size: 13px;
  font-weight: 500;
  color: #1f2937;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-info {
  display: flex;
  align-items: center;
}

.node-library {
  font-size: 11px;
  color: #9ca3af;
}

.collapse-btn {
  position: absolute;
  right: -10px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 5;

  &:hover {
    background: #f3f4f6;
    border-color: #3B82F6;
  }
}

.empty-state,
.loading-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

.empty-text,
.loading-text {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
}

.empty-hint {
  font-size: 13px;
  color: #9ca3af;
  margin: 0;
}

// 卡片详情弹窗
.card-detail {
  padding: 16px;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-label {
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 8px;
}

.detail-content {
  font-size: 14px;
  color: #1f2937;
  line-height: 1.6;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;

  &.question {
    border-left: 3px solid #3B82F6;
  }

  &.answer {
    border-left: 3px solid #10B981;
  }
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  padding: 4px 10px;
  background: #eff6ff;
  color: #3B82F6;
  border-radius: 12px;
  font-size: 12px;
}

.detail-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.action-btn {
  flex: 1;
  height: 40px;
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 14px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
  }

  &.primary {
    background: #3B82F6;
    border-color: #3B82F6;
    color: #fff;

    &:hover {
      background: #2563eb;
    }
  }
}
</style>

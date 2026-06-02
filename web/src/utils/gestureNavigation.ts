import { Capacitor, PluginListenerHandle } from '@capacitor/core'
import { App } from '@capacitor/app'
import { useRouter } from 'vue-router'

interface TouchPoint {
  x: number
  y: number
  time: number
}

interface SwipeGestureOptions {
  threshold?: number
  velocityThreshold?: number
  edgeThreshold?: number
}

const defaultOptions: SwipeGestureOptions = {
  threshold: 50,
  velocityThreshold: 0.3,
  edgeThreshold: 50
}

class GestureNavigation {
  private router: ReturnType<typeof useRouter> | null = null
  private touchStart: TouchPoint | null = null
  private options: SwipeGestureOptions
  private backButtonListener: PluginListenerHandle | null = null
  private isInitialized = false

  constructor(options: SwipeGestureOptions = {}) {
    this.options = { ...defaultOptions, ...options }
  }

  init(router: ReturnType<typeof useRouter>) {
    if (this.isInitialized) return
    this.router = router
    this.isInitialized = true

    if (Capacitor.isNativePlatform()) {
      this.setupHardwareBackButton()
      this.setupSwipeGesture()
    }
  }

  private setupHardwareBackButton() {
    if (Capacitor.getPlatform() === 'android') {
      this.backButtonListener = App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          this.goBack()
        } else {
          App.exitApp()
        }
      })
    }
  }

  private setupSwipeGesture() {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      this.touchStart = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!this.touchStart) return

      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - this.touchStart.x
      const deltaY = touch.clientY - this.touchStart.y
      const deltaTime = Date.now() - this.touchStart.time
      const velocity = Math.abs(deltaX) / deltaTime

      const isValidHorizontalSwipe = 
        Math.abs(deltaX) > Math.abs(deltaY) &&
        Math.abs(deltaX) > (this.options.threshold || 50) &&
        velocity > (this.options.velocityThreshold || 0.3)

      const isEdgeSwipe = 
        this.touchStart.x < (this.options.edgeThreshold || 50)

      if (isValidHorizontalSwipe && deltaX > 0 && isEdgeSwipe) {
        this.goBack()
      }

      this.touchStart = null
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })
  }

  private goBack() {
    if (!this.router) return

    const currentPath = this.router.currentRoute.value.path
    const noBackPaths = ['/', '/login']
    
    if (noBackPaths.includes(currentPath)) {
      if (Capacitor.isNativePlatform()) {
        App.exitApp()
      }
      return
    }

    this.router.back()
  }

  destroy() {
    if (this.backButtonListener) {
      this.backButtonListener.remove()
      this.backButtonListener = null
    }
    this.isInitialized = false
  }
}

export const gestureNavigation = new GestureNavigation()

export const useGestureNavigation = (router: ReturnType<typeof useRouter>) => {
  gestureNavigation.init(router)
  return gestureNavigation
}

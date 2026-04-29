import { defineStore } from 'pinia'
import { ref } from 'vue'

interface CardItem {
  id: number
  question: string
  answer: string
  tags?: string[]
  library_id?: number
  library_name?: string
  is_favorite?: boolean
  learned?: boolean
}

interface CommentItem {
  id: number
  avatar: string
  username: string
  time: string
  content: string
  likeCount: number
  liked: boolean
}

interface CardStudyState {
  cardId: number
  answerRevealed: boolean
  currentIndex: number
  totalCards: number
  libraryId: number | string | null
  libraryName: string
  mode: string
  cardList: CardItem[]
  comments: CommentItem[]
  isFavorite: boolean
  relatedCards: CardItem[]
  timestamp: number
}

export const useCardStudyStore = defineStore('cardStudy', () => {
  const savedStates = ref<Map<string, CardStudyState>>(new Map())
  const maxSavedStates = 5

  const saveState = (key: string, state: CardStudyState) => {
    if (savedStates.value.size >= maxSavedStates) {
      const oldestKey = Array.from(savedStates.value.keys())[0]
      savedStates.value.delete(oldestKey)
    }
    savedStates.value.set(key, { ...state, timestamp: Date.now() })
  }

  const getState = (key: string): CardStudyState | null => {
    return savedStates.value.get(key) || null
  }

  const removeState = (key: string) => {
    savedStates.value.delete(key)
  }

  const clearAllStates = () => {
    savedStates.value.clear()
  }

  return {
    savedStates,
    saveState,
    getState,
    removeState,
    clearAllStates
  }
})

export type { CardStudyState, CardItem, CommentItem }

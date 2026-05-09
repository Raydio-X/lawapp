<template>
  <div class="container">
    <div class="header-decoration"></div>
    
    <div class="loading-container" v-if="loading">
      <t-icon name="loading" size="40px" color="#3B82F6" />
      <span class="loading-text">加载中...</span>
    </div>
    
    <template v-else-if="!loading && libraries.length > 0">
      <div class="form-card">
        <div class="card-header">
          <div class="header-icon">
            <t-icon name="edit-1" size="20px" color="#fff" />
          </div>
          <div class="header-text">
            <span class="header-title">{{ isEdit ? '编辑卡片' : '创建新卡片' }}</span>
            <span class="header-subtitle">记录知识点，构建你的法律知识体系</span>
          </div>
        </div>

        <div class="form-body">
          <div class="form-item">
            <div class="form-label">
              <span class="label-text">所属知识库</span>
              <span class="label-required">*</span>
            </div>
            <div class="picker-card" @click="onSelectLibrary">
              <span class="picker-value" :class="{ active: selectedLibrary }">{{ selectedLibrary ? selectedLibrary.name : '选择知识库' }}</span>
              <t-icon name="chevron-right" size="16px" color="#c0c4cc" />
            </div>
          </div>

          <div class="form-item" v-if="selectedLibrary">
            <div class="form-label">
              <span class="label-text">所属章节</span>
            </div>
            <div class="picker-card" @click="onSelectChapter">
              <span class="picker-value" :class="{ active: selectedChapter }">{{ selectedChapter ? selectedChapter.name : '选择章节（可选）' }}</span>
              <t-icon name="chevron-right" size="16px" color="#c0c4cc" />
            </div>
          </div>

          <div class="divider"></div>

          <div class="form-item">
            <div class="form-label">
              <span class="label-text">题目</span>
              <span class="label-required">*</span>
            </div>
            <div class="textarea-card question-card" :class="{ focused: questionFocused }">
              <textarea
                class="form-textarea"
                placeholder="输入法律问题或考点..."
                v-model="question"
                maxlength="100"
                @focus="questionFocused = true"
                @blur="questionFocused = false"
              ></textarea>
              <div class="textarea-footer">
                <span class="hint-text">简洁明了，突出核心考点</span>
                <span class="char-count">{{ question.length }}/100</span>
              </div>
            </div>
          </div>

          <div class="form-item">
            <div class="form-label">
              <span class="label-text">关键词</span>
              <span class="label-hint">可选</span>
            </div>
            <div class="keywords-input-container">
              <div class="keywords-list-horizontal">
                <div class="keyword-item-horizontal" v-for="(keyword, index) in keywords" :key="index">
                  <input 
                    class="keyword-input-horizontal" 
                    v-model="keywords[index]" 
                    :placeholder="'关键词' + (index + 1)"
                    maxlength="10"
                  />
                  <div class="keyword-remove-horizontal" @click="removeKeyword(index)">
                    <t-icon name="close" size="12px" color="#999" />
                  </div>
                </div>
                <div class="keyword-add-btn-horizontal" @click="addKeywordSlot">
                  <t-icon name="add" size="14px" color="#3B82F6" />
                </div>
              </div>
            </div>
          </div>

          <div class="form-item">
            <div class="form-label">
              <span class="label-text">答案</span>
              <span class="label-required">*</span>
            </div>
            <div class="editor-card" :class="{ focused: answerFocused }">
              <div class="editor-toolbar" ref="toolbarRef">
                <div class="toolbar-group">
                  <button class="toolbar-btn" title="有序列表" @click="formatOrderedList">
                    <t-icon name="order-list" size="16px" />
                  </button>
                  <button class="toolbar-btn" title="无序列表" @click="formatBulletList">
                    <t-icon name="bulletpoint" size="16px" />
                  </button>
                </div>
                <div class="toolbar-divider"></div>
                <div class="toolbar-group">
                  <button class="toolbar-btn" title="增加缩进" @click="formatIndent">
                    <t-icon name="indent-right" size="16px" />
                  </button>
                  <button class="toolbar-btn" title="减少缩进" @click="formatOutdent">
                    <t-icon name="indent-left" size="16px" />
                  </button>
                </div>
                <div class="toolbar-divider"></div>
                <div class="toolbar-group">
                  <button class="toolbar-btn" title="首行缩进" @click="formatTextIndent">
                    <span class="indent-icon">⇥</span>
                  </button>
                </div>
                <div class="toolbar-divider"></div>
                <div class="toolbar-group">
                  <button class="toolbar-btn" ref="tableBtnRef" title="插入表格" @click="onShowTableSelector">
                    <t-icon name="table" size="16px" />
                  </button>
                </div>
                <div class="toolbar-divider"></div>
                <div class="toolbar-group">
                  <button class="toolbar-btn" title="加粗" @click="formatBold">
                    <t-icon name="textformat-bold" size="16px" />
                  </button>
                  <button class="toolbar-btn" title="斜体" @click="formatItalic">
                    <t-icon name="textformat-italic" size="16px" />
                  </button>
                  <button class="toolbar-btn" title="下划线" @click="formatUnderline">
                    <t-icon name="textformat-underline" size="16px" />
                  </button>
                </div>
              </div>
              <div class="editor-content" ref="editorRef"></div>
              <div class="editor-footer">
                <span class="hint-text">详细解析，加深理解记忆</span>
                <span class="char-count">{{ answerCharCount }}/500</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="table-selector-popup" v-if="showTableDialog" :style="tableSelectorStyle">
        <div class="table-grid-selector">
          <div 
            v-for="(row, rowIndex) in 5" 
            :key="'row-' + rowIndex"
            class="table-grid-row"
          >
            <div
              v-for="(col, colIndex) in 5"
              :key="'cell-' + rowIndex + '-' + colIndex"
              class="table-grid-cell"
              :class="{ active: hoveredRow >= rowIndex && hoveredCol >= colIndex }"
              @mouseenter="onGridHover(rowIndex, colIndex)"
              @click="onGridSelect(rowIndex, colIndex)"
            ></div>
          </div>
        </div>
        <div class="table-grid-info">{{ gridDisplayText }}</div>
      </div>

      <div class="footer">
        <div class="btn-cancel" @click="onCancel">取消</div>
        <div class="btn-submit" :class="{ disabled: !canSubmit }" @click="onSubmitClick">
          <t-icon name="check" size="16px" color="#fff" />
          <span>{{ isEdit ? '保存修改' : '创建卡片' }}</span>
        </div>
      </div>

      <Picker
        v-model:visible="showLibraryPicker"
        title="选择知识库"
        :options="libraryOptions"
        :value="selectedLibraryIndex"
        @confirm="onLibraryConfirm"
      />

      <Picker
        v-model:visible="showChapterPicker"
        title="选择章节"
        :options="chapterOptions"
        :value="selectedChapterIndex"
        @confirm="onChapterConfirm"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, onBeforeUnmount, shallowRef } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next'
import { cardAPI, libraryAPI, chapterAPI, studyAPI } from '@/utils/api'
import { usePermission } from '@/composables/usePermission'
import Picker from '@/components/Picker.vue'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import QuillBetterTable from 'quill-better-table'
import 'quill-better-table/dist/quill-better-table.css'

interface Library {
  id: number
  name: string
}

interface Chapter {
  id: number
  name: string
}

interface PickerOption {
  label: string
  value: string | number
}

const router = useRouter()
const route = useRoute()
const { canCreateCard, isVip, limits } = usePermission()

const loading = ref(true)
const isEdit = ref(false)
const cardId = ref(0)
const question = ref('')
const answer = ref('')
const questionFocused = ref(false)
const answerFocused = ref(false)

const selectedLibrary = ref<Library | null>(null)
const selectedChapter = ref<Chapter | null>(null)
const selectedLibraryIndex = ref<(string | number)[]>([])
const selectedChapterIndex = ref<(string | number)[]>([])

const libraries = ref<Library[]>([])
const chapters = ref<Chapter[]>([])
const showLibraryPicker = ref(false)
const showChapterPicker = ref(false)

const editorRef = ref<HTMLElement | null>(null)
const toolbarRef = ref<HTMLElement | null>(null)
const quillInstance = shallowRef<Quill | null>(null)
const answerText = ref('')

const showTableDialog = ref(false)
const tableRows = ref(3)
const tableCols = ref(3)
const hoveredRow = ref(-1)
const hoveredCol = ref(-1)
const tableBtnRef = ref<HTMLElement | null>(null)
const tableSelectorPosition = ref({ top: 0, left: 0 })

const tableSelectorStyle = computed(() => ({
  top: `${tableSelectorPosition.value.top}px`,
  left: `${tableSelectorPosition.value.left}px`
}))

const gridDisplayText = computed(() => {
  if (hoveredRow.value >= 0 && hoveredCol.value >= 0) {
    return `${hoveredRow.value + 1} × ${hoveredCol.value + 1}`
  }
  return '选择表格大小'
})

const onShowTableSelector = () => {
  if (tableBtnRef.value) {
    const rect = tableBtnRef.value.getBoundingClientRect()
    tableSelectorPosition.value = {
      top: rect.bottom + 4,
      left: rect.left
    }
  }
  showTableDialog.value = true
}

const onGridHover = (row: number, col: number) => {
  hoveredRow.value = row
  hoveredCol.value = col
}

const onGridSelect = (row: number, col: number) => {
  tableRows.value = row + 1
  tableCols.value = col + 1
  insertTable()
}

const keywords = ref<string[]>([])

const answerCharCount = computed(() => {
  return answerText.value.length
})

const libraryOptions = computed<PickerOption[]>(() => {
  return libraries.value.map(lib => ({
    label: lib.name,
    value: lib.id
  }))
})

const chapterOptions = computed<PickerOption[]>(() => {
  return chapters.value.map(ch => ({
    label: ch.name,
    value: ch.id
  }))
})

const canSubmit = computed(() => {
  const text = answerText.value.replace(/\s/g, '')
  const result = question.value.trim() && text && selectedLibrary.value
  console.log('canSubmit:', {
    question: question.value.trim(),
    text: text,
    selectedLibrary: selectedLibrary.value,
    result: result
  })
  return result
})

const initQuill = () => {
  if (!editorRef.value) {
    console.log('initQuill: editorRef is null')
    return
  }
  
  Quill.register({
    'modules/better-table': QuillBetterTable
  }, true)
  
  console.log('initQuill: initializing Quill')
  quillInstance.value = new Quill(editorRef.value, {
    theme: 'snow',
    placeholder: '输入答案解析，支持分点作答...',
    modules: {
      toolbar: false,
      'better-table': {
        operationMenu: {
          items: {
            insertColumnRight: { text: '右侧插入列' },
            insertColumnLeft: { text: '左侧插入列' },
            insertRowUp: { text: '上方插入行' },
            insertRowDown: { text: '下方插入行' },
            mergeCells: { text: '合并单元格' },
            unmergeCells: { text: '取消合并' },
            deleteColumn: { text: '删除列' },
            deleteRow: { text: '删除行' },
            deleteTable: { text: '删除表格' }
          },
          visibility: {
            insertColumnRight: true,
            insertColumnLeft: true,
            insertRowUp: true,
            insertRowDown: true,
            mergeCells: true,
            unmergeCells: true,
            deleteColumn: true,
            deleteRow: true,
            deleteTable: true
          }
        },
        keyboardShortcuts: {
          tableAddRowAbove: false,
          tableAddRowBelow: false,
          tableAddColumnLeft: false,
          tableAddColumnRight: false,
          tableDeleteRow: false,
          tableDeleteColumn: false
        },
        colTool: false,
        rowTool: false
      },
      table: false
    }
  })
  
  console.log('initQuill: Quill initialized', quillInstance.value)

  if (answer.value) {
    quillInstance.value.root.innerHTML = answer.value
    answerText.value = quillInstance.value.getText().replace(/\s/g, '')
  }

  quillInstance.value.on('text-change', () => {
    const html = quillInstance.value!.root.innerHTML
    const text = quillInstance.value!.getText().replace(/\s/g, '')
    console.log('Quill text-change:', { html: html.substring(0, 50), text: text.substring(0, 50) })
    answer.value = html
    answerText.value = text
  })

  quillInstance.value.on('selection-change', (range) => {
    answerFocused.value = !!range
  })
  
  setupMobileTableMenu()
  setupTableResize()
}

const setupMobileTableMenu = () => {
  if (!editorRef.value) return
  
  let longPressTimer: number | null = null
  let touchStartX = 0
  let touchStartY = 0
  
  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0]
    touchStartX = touch.clientX
    touchStartY = touch.clientY
    
    longPressTimer = window.setTimeout(() => {
      const target = e.target as HTMLElement
      const tableCell = target.closest('td, th')
      
      if (tableCell && quillInstance.value) {
        const tableModule = quillInstance.value.getModule('better-table') as any
        if (tableModule) {
          const rect = tableCell.getBoundingClientRect()
          const fakeEvent = {
            clientX: touchStartX,
            clientY: touchStartY,
            target: tableCell,
            preventDefault: () => {},
            stopPropagation: () => {}
          } as unknown as MouseEvent
          
          const table = tableCell.closest('table')
          if (table) {
            const tableBlot = Quill.find(table) as any
            if (tableBlot && tableModule.operationMenu) {
              tableModule.operationMenu.table = tableBlot
              tableModule.showOperationMenu(fakeEvent)
            }
          }
        }
      }
    }, 500)
  }
  
  const handleTouchMove = (e: TouchEvent) => {
    if (longPressTimer) {
      const touch = e.touches[0]
      const moveX = Math.abs(touch.clientX - touchStartX)
      const moveY = Math.abs(touch.clientY - touchStartY)
      
      if (moveX > 10 || moveY > 10) {
        clearTimeout(longPressTimer)
        longPressTimer = null
      }
    }
  }
  
  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }
  }
  
  editorRef.value.addEventListener('touchstart', handleTouchStart, { passive: true })
  editorRef.value.addEventListener('touchmove', handleTouchMove, { passive: true })
  editorRef.value.addEventListener('touchend', handleTouchEnd, { passive: true })
}

const setupTableResize = () => {
  if (!editorRef.value) return
  
  let isResizing = false
  let resizeType: 'col' | 'row' | null = null
  let currentCell: HTMLElement | null = null
  let startX = 0
  let startY = 0
  let startWidth = 0
  let startHeight = 0
  let currentTable: HTMLTableElement | null = null
  let currentColIndex = -1
  
  const getResizeHandle = (e: MouseEvent | TouchEvent): { type: 'col' | 'row', cell: HTMLElement } | null => {
    const target = e.target as HTMLElement
    const cell = target.closest('td, th') as HTMLElement | null
    if (!cell) return null
    
    const rect = cell.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
    const margin = 8
    
    if (clientX >= rect.right - margin && clientX <= rect.right + margin) {
      return { type: 'col', cell }
    }
    
    if (clientY >= rect.bottom - margin && clientY <= rect.bottom + margin) {
      return { type: 'row', cell }
    }
    
    return null
  }
  
  const handleMouseDown = (e: MouseEvent | TouchEvent) => {
    const handle = getResizeHandle(e)
    if (!handle) return
    
    e.preventDefault()
    isResizing = true
    resizeType = handle.type
    currentCell = handle.cell
    currentTable = handle.cell.closest('table')
    
    const rect = handle.cell.getBoundingClientRect()
    
    if (handle.type === 'col') {
      startX = 'touches' in e ? e.touches[0].clientX : e.clientX
      startWidth = rect.width
      
      const row = handle.cell.parentElement
      if (row) {
        currentColIndex = Array.from(row.children).indexOf(handle.cell)
      }
    } else {
      startY = 'touches' in e ? e.touches[0].clientY : e.clientY
      startHeight = rect.height
    }
    
    document.body.style.cursor = handle.type === 'col' ? 'col-resize' : 'row-resize'
    document.body.style.userSelect = 'none'
  }
  
  const handleMouseMove = (e: MouseEvent | TouchEvent) => {
    if (!isResizing || !currentCell || !currentTable) return
    
    e.preventDefault()
    
    if (resizeType === 'col') {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
      const diff = clientX - startX
      const newWidth = Math.max(40, startWidth + diff)
      
      const rows = currentTable.querySelectorAll('tr')
      rows.forEach(row => {
        const cell = row.children[currentColIndex] as HTMLElement
        if (cell) {
          cell.style.width = `${newWidth}px`
          cell.style.minWidth = `${newWidth}px`
        }
      })
    } else {
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      const diff = clientY - startY
      const newHeight = Math.max(24, startHeight + diff)
      currentCell.style.height = `${newHeight}px`
      currentCell.style.minHeight = `${newHeight}px`
    }
    
    if (quillInstance.value) {
      answer.value = quillInstance.value.root.innerHTML
    }
  }
  
  const handleMouseUp = () => {
    if (isResizing) {
      isResizing = false
      resizeType = null
      currentCell = null
      currentTable = null
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }
  
  const handleMouseOver = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    const cell = target.closest('td, th') as HTMLElement | null
    if (!cell) return
    
    const rect = cell.getBoundingClientRect()
    const clientX = e.clientX
    const clientY = e.clientY
    const margin = 8
    
    if (clientX >= rect.right - margin && clientX <= rect.right + margin) {
      cell.style.cursor = 'col-resize'
    } else if (clientY >= rect.bottom - margin && clientY <= rect.bottom + margin) {
      cell.style.cursor = 'row-resize'
    } else {
      cell.style.cursor = 'text'
    }
  }
  
  editorRef.value.addEventListener('mousedown', handleMouseDown as EventListener)
  editorRef.value.addEventListener('touchstart', handleMouseDown as EventListener, { passive: false })
  editorRef.value.addEventListener('mousemove', handleMouseMove as EventListener)
  editorRef.value.addEventListener('touchmove', handleMouseMove as EventListener, { passive: false })
  editorRef.value.addEventListener('mouseover', handleMouseOver as EventListener)
  
  document.addEventListener('mouseup', handleMouseUp)
  document.addEventListener('touchend', handleMouseUp)
}

const formatOrderedList = () => {
  if (!quillInstance.value) return
  quillInstance.value.format('list', 'ordered')
}

const formatBulletList = () => {
  if (!quillInstance.value) return
  quillInstance.value.format('list', 'bullet')
}

const formatIndent = () => {
  if (!quillInstance.value) return
  const format = quillInstance.value.getFormat()
  const currentIndent = (format.indent as number) || 0
  if (currentIndent < 4) {
    quillInstance.value.format('indent', currentIndent + 1)
  }
}

const formatOutdent = () => {
  if (!quillInstance.value) return
  const format = quillInstance.value.getFormat()
  const currentIndent = (format.indent as number) || 0
  if (currentIndent > 0) {
    quillInstance.value.format('indent', currentIndent - 1)
  }
}

const formatTextIndent = () => {
  if (!quillInstance.value) return
  const selection = quillInstance.value.getSelection()
  if (selection) {
    const currentFormat = quillInstance.value.getFormat(selection.index, selection.length)
    const indentStyle = currentFormat.indent ? '0em' : '2em'
    quillInstance.value.format('indent', currentFormat.indent ? false : 1)
    
    const [block] = quillInstance.value.getLine(selection.index)
    if (block) {
      const blot = block.domNode as HTMLElement
      if (indentStyle === '2em') {
        blot.style.textIndent = '2em'
      } else {
        blot.style.textIndent = ''
      }
    }
  }
}

const formatBold = () => {
  if (!quillInstance.value) return
  quillInstance.value.format('bold', !quillInstance.value.getFormat().bold)
}

const formatItalic = () => {
  if (!quillInstance.value) return
  quillInstance.value.format('italic', !quillInstance.value.getFormat().italic)
}

const formatUnderline = () => {
  if (!quillInstance.value) return
  quillInstance.value.format('underline', !quillInstance.value.getFormat().underline)
}

const insertTable = () => {
  if (!quillInstance.value) return
  
  const rows = tableRows.value
  const cols = tableCols.value
  
  const tableModule = quillInstance.value.getModule('better-table') as any
  if (tableModule && tableModule.insertTable) {
    tableModule.insertTable(rows, cols)
  } else {
    let tableHtml = '<table style="border-collapse: collapse; width: 100%; margin: 8px 0;">'
    for (let i = 0; i < rows; i++) {
      tableHtml += '<tr>'
      for (let j = 0; j < cols; j++) {
        tableHtml += '<td style="border: 1px solid #ddd; padding: 8px; min-width: 50px;">&nbsp;</td>'
      }
      tableHtml += '</tr>'
    }
    tableHtml += '</table><p><br></p>'
    
    const selection = quillInstance.value.getSelection(true)
    quillInstance.value.clipboard.dangerouslyPasteHTML(selection.index, tableHtml)
  }
  
  showTableDialog.value = false
  hoveredRow.value = -1
  hoveredCol.value = -1
}

const addKeywordSlot = () => {
  keywords.value.push('')
}

const removeKeyword = (index: number) => {
  keywords.value.splice(index, 1)
}

onMounted(async () => {
  const q = route.query.question as string
  const a = route.query.answer as string
  const editId = route.query.id as string
  const libraryId = route.query.libraryId as string
  const libraryName = route.query.libraryName as string
  
  document.addEventListener('click', handleTableSelectorOutsideClick)
  
  if (editId) {
    isEdit.value = true
    cardId.value = parseInt(editId)
    await loadCardData()
  } else {
    if (q) question.value = decodeURIComponent(q)
    if (a) answer.value = decodeURIComponent(a)
  }
  
  await loadLibraries()
})

onBeforeUnmount(() => {
  quillInstance.value = null
  document.removeEventListener('click', handleTableSelectorOutsideClick)
})

const handleTableSelectorOutsideClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (showTableDialog.value && tableBtnRef.value && !tableBtnRef.value.contains(target)) {
    const popup = document.querySelector('.table-selector-popup')
    if (popup && !popup.contains(target)) {
      showTableDialog.value = false
      hoveredRow.value = -1
      hoveredCol.value = -1
    }
  }
}

const loadCardData = async () => {
  try {
    const res = await cardAPI.getDetail(cardId.value)
    if (res.success && res.data) {
      question.value = res.data.question
      answer.value = res.data.answer
      if (res.data.tags && Array.isArray(res.data.tags)) {
        keywords.value = res.data.tags
      }
    }
  } catch (error) {
    console.error('加载卡片失败:', error)
    MessagePlugin.error('加载失败')
  }
}

const loadLibraries = async () => {
  loading.value = true
  try {
    const res = await libraryAPI.getMyLibraries({ page: 1, pageSize: 100 })
    console.log('loadLibraries response:', res)
    console.log('res.data:', res.data)
    console.log('res.data type:', typeof res.data, Array.isArray(res.data))
    
    if (res.success && res.data) {
      let list = []
      if (Array.isArray(res.data)) {
        list = res.data
      } else if (res.data.list && Array.isArray(res.data.list)) {
        list = res.data.list
      } else if (res.data.data && Array.isArray(res.data.data)) {
        list = res.data.data
      }
      
      console.log('list:', list)
      
      libraries.value = list.map((lib: any) => ({
        id: lib.id,
        name: lib.name
      }))
      
      console.log('libraries:', libraries.value)
      
      if (libraries.value.length === 0) {
        MessagePlugin.warning('请先创建知识库')
        loading.value = false
        setTimeout(() => router.back(), 1500)
        return
      }
      
      const libraryId = route.query.libraryId as string
      if (libraryId) {
        const lib = libraries.value.find(l => l.id === parseInt(libraryId))
        if (lib) {
          selectedLibrary.value = lib
          selectedLibraryIndex.value = [lib.id]
          loadChapters(lib.id)
        } else {
          selectedLibrary.value = libraries.value[0]
          selectedLibraryIndex.value = [libraries.value[0].id]
          loadChapters(libraries.value[0].id)
        }
      } else {
        selectedLibrary.value = libraries.value[0]
        selectedLibraryIndex.value = [libraries.value[0].id]
        loadChapters(libraries.value[0].id)
      }
      
      console.log('selectedLibrary:', selectedLibrary.value)
    }
  } catch (error) {
    console.error('加载知识库失败:', error)
    MessagePlugin.error('加载失败')
    setTimeout(() => router.back(), 1500)
  } finally {
    loading.value = false
    await nextTick()
    initQuill()
  }
}

const loadChapters = async (libraryId: number) => {
  try {
    const res = await chapterAPI.getList(libraryId)
    if (res.success && res.data) {
      chapters.value = res.data || []
      
      if (chapters.value.length > 0) {
        selectedChapter.value = chapters.value[0]
        selectedChapterIndex.value = [chapters.value[0].id]
      } else {
        selectedChapter.value = null
        selectedChapterIndex.value = []
      }
    }
  } catch (error) {
    console.error('加载章节失败:', error)
    chapters.value = []
    selectedChapter.value = null
    selectedChapterIndex.value = []
  }
}

const onSelectLibrary = () => {
  showLibraryPicker.value = true
}

const onSelectChapter = () => {
  if (!selectedLibrary.value) {
    MessagePlugin.warning('请先选择知识库')
    return
  }
  showChapterPicker.value = true
}

const onLibraryConfirm = (value: (string | number)[]) => {
  const libraryId = value[0]
  const library = libraries.value.find(lib => lib.id === libraryId)
  
  if (!library) return
  
  selectedLibrary.value = library
  selectedLibraryIndex.value = value
  showLibraryPicker.value = false
  
  selectedChapter.value = null
  selectedChapterIndex.value = []
  
  loadChapters(library.id)
}

const onChapterConfirm = (value: (string | number)[]) => {
  const chapterId = value[0]
  const chapter = chapters.value.find(ch => ch.id === chapterId)
  
  if (!chapter) return
  
  selectedChapter.value = chapter
  selectedChapterIndex.value = value
  showChapterPicker.value = false
}

const onCancel = () => {
  if (question.value.trim() || answerText.value) {
    const confirmDialog = DialogPlugin.confirm({
      header: '确认取消',
      body: '确定要放弃当前编辑的内容吗？',
      confirmBtn: '确定',
      theme: 'danger',
      onConfirm: () => {
        router.back()
        confirmDialog.hide()
      }
    })
  } else {
    router.back()
  }
}

const onSubmitClick = () => {
  console.log('onSubmitClick called, canSubmit:', canSubmit.value)
  
  if (!selectedLibrary.value) {
    MessagePlugin.warning('请选择知识库')
    return
  }
  
  if (!question.value.trim()) {
    MessagePlugin.warning('请输入题目')
    return
  }
  
  const text = answerText.value.replace(/\s/g, '')
  console.log('onSubmitClick text:', text)
  if (!text) {
    MessagePlugin.warning('请输入答案')
    return
  }
  
  onSubmit()
}

const onSubmit = async () => {
  if (!canSubmit.value) return

  if (!isEdit.value) {
    try {
      const statsRes = await studyAPI.getStats()
      if (statsRes.success && statsRes.data) {
        const currentCardCount = statsRes.data.cardCount || 0
        const canCreate = await canCreateCard(currentCardCount)
        if (!canCreate) return
      }
    } catch (error) {
      console.error('获取卡片数量失败:', error)
    }
  }

  try {
    const html = quillInstance.value ? quillInstance.value.root.innerHTML : answer.value
    
    const data = {
      library_id: selectedLibrary.value!.id,
      chapter_id: selectedChapter.value?.id || null,
      question: question.value.trim(),
      answer: html,
      tags: keywords.value.filter(k => k.trim()),
      is_public: 1
    }

    let res
    if (isEdit.value) {
      res = await cardAPI.update(cardId.value, data)
    } else {
      res = await cardAPI.create(data)
    }

    if (res.success) {
      MessagePlugin.success(isEdit.value ? '保存成功' : '创建成功')
      setTimeout(() => router.back(), 1500)
    }
  } catch (error: any) {
    console.error('保存失败:', error)
    MessagePlugin.error(error.message || '保存失败')
  }
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f4f8 0%, #f8fafc 100%);
  padding: 16px;
  padding-bottom: 100px;
  box-sizing: border-box;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 100px;
}

.loading-text {
  margin-top: 12px;
  font-size: 14px;
  color: #999;
}

.header-decoration {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 120px;
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 50%, #93C5FD 100%);
  border-radius: 0 0 30px 30px;
  z-index: 0;
}

.form-card {
  position: relative;
  z-index: 1;
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.12);
}

.card-header {
  display: flex;
  align-items: center;
  padding: 18px 16px;
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  margin: 12px;
  border-radius: 8px;
}

.header-icon {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.header-text {
  flex: 1;
}

.header-title {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: 0.5px;
}

.header-subtitle {
  display: block;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
  margin-top: 4px;
}

.form-body {
  padding: 8px 16px 16px;
}

.form-item {
  margin-bottom: 18px;
}

.form-item:last-child {
  margin-bottom: 0;
}

.form-label {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.label-text {
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
}

.label-required {
  font-size: 14px;
  color: #e74c3c;
  margin-left: 4px;
}

.label-hint {
  font-size: 13px;
  color: #95a5a6;
  margin-left: 4px;
}

.divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, #e8ecf0, transparent);
  margin: 16px 0;
}

.keywords-input-container {
  width: 100%;
}

.keywords-list-horizontal {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.keyword-item-horizontal {
  display: flex;
  align-items: center;
  background-color: #f5f6fa;
  border-radius: 6px;
  padding: 0 4px 0 8px;
  height: 36px;
}

.keyword-input-horizontal {
  width: 60px;
  height: 32px;
  font-size: 13px;
  color: #333;
  background: transparent;
  border: none;
  outline: none;
}

.keyword-remove-horizontal {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;

  &:active {
    background-color: rgba(0, 0, 0, 0.05);
  }
}

.keyword-add-btn-horizontal {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px dashed #ddd;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;

  &:active {
    background-color: rgba(0, 82, 217, 0.04);
    border-color: #3B82F6;
  }
}

.picker-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e8ecf0;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:active {
    background: #f0f4f8;
    border-color: #3B82F6;
  }
}

.picker-value {
  font-size: 15px;
  color: #95a5a6;
  
  &.active {
    color: #2c3e50;
    font-weight: 500;
  }
}

.textarea-card {
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e8ecf0;
  padding: 12px;
  transition: all 0.3s ease;
  
  &.focused {
    background: #ffffff;
    box-shadow: 0 2px 10px rgba(59, 130, 246, 0.08);
  }
}

.question-card {
  border-left: 3px solid #3B82F6;
  
  &.focused {
    border-color: #3B82F6;
  }
}

.answer-card {
  border-left: 3px solid #10B981;
  
  &.focused {
    border-color: #10B981;
    box-shadow: 0 2px 10px rgba(16, 185, 129, 0.08);
  }
}

.form-textarea {
  width: 100%;
  min-height: 60px;
  font-size: 15px;
  line-height: 1.7;
  color: #2c3e50;
  border: none;
  outline: none;
  background: transparent;
  resize: none;
}

.answer-textarea {
  min-height: 100px;
}

.textarea-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e8ecf0;
}

.hint-text {
  font-size: 12px;
  color: #95a5a6;
}

.char-count {
  font-size: 12px;
  color: #95a5a6;
  font-weight: 500;
}

.editor-card {
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e8ecf0;
  border-left: 3px solid #10B981;
  transition: all 0.3s ease;
  overflow: hidden;
  
  &.focused {
    background: #ffffff;
    border-color: #10B981;
    box-shadow: 0 2px 10px rgba(16, 185, 129, 0.08);
  }
}

.editor-toolbar {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #f0f4f8;
  border-bottom: 1px solid #e8ecf0;
  flex-wrap: wrap;
  gap: 4px;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 2px;
}

.toolbar-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: #2c3e50;
  transition: all 0.2s ease;
  
  &:hover {
    background: #e8ecf0;
  }
  
  &:active {
    background: #d4d9e0;
  }
}

.indent-icon {
  font-size: 16px;
  font-weight: bold;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: #d4d9e0;
  margin: 0 6px;
}

.editor-content {
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
  padding: 12px;
  
  :deep(.qlbt-col-tool-cell),
  :deep(.qlbt-row-tool-cell),
  :deep(.qlbt-col-tool-cell-holder),
  :deep(.qlbt-selection-line),
  :deep(.qlbt-col-tool-cell-menu),
  :deep(.qlbt-row-tool-cell-menu) {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    height: 0 !important;
    width: 0 !important;
    overflow: hidden !important;
  }
  
  :deep(.ql-editor) {
    font-size: 15px;
    line-height: 1.7;
    color: #2c3e50;
    padding: 0;
    min-height: 180px;
    
    &.ql-blank::before {
      font-style: normal;
      color: #95a5a6;
    }
    
    p {
      margin: 0 0 8px 0;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
    
    ul, ol {
      margin: 0 0 8px 0;
    }
    
    li {
      margin-bottom: 4px;
    }
    
    li > .ql-ui:before {
      font-size: 15px;
    }
    
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 12px 0;
      
      td, th {
        border: 1px solid #d1d5db;
        padding: 10px 14px;
        min-width: 60px;
        vertical-align: top;
        
        &.selected {
          outline: 2px solid #3b82f6;
          outline-offset: -1px;
        }
      }
      
      tr:hover td {
        background-color: #f9fafb;
      }
      
      thead th {
        background-color: #f3f4f6;
        font-weight: 600;
        color: #374151;
      }
    }
  }

  :deep(table.ql-better-table) {
    border-collapse: collapse;
    margin: 0 auto;
    
    td, th {
      border: 1px solid #d1d5db;
      padding: 10px 14px;
      min-width: 80px;
      vertical-align: top;
      position: relative;
      
      &::after {
        content: '';
        position: absolute;
        right: -4px;
        bottom: -4px;
        width: 8px;
        height: 8px;
        background: transparent;
        border-radius: 2px;
        transition: background 0.2s ease;
        pointer-events: none;
      }
      
      &.cell-selected {
        background-color: #e6f0ff !important;
        box-shadow: inset 0 0 0 2px #3b82f6;
      }
      
      &:hover::after {
        background: #3b82f6;
      }
    }
    
    tr.selected-row > td,
    tr.selected-row > th {
      background-color: #f0f7ff;
    }
    
    td.selected-column,
    th.selected-column {
      background-color: #f0f7ff;
    }
    
    & + .ql-better-table-toolbar {
      display: none;
    }
  }

  :deep(.ql-better-table-wrapper) {
    overflow-x: auto;
    margin: 12px 0;
    border: none;
    outline: none;
    
    .ql-better-table-toolbar {
      display: none !important;
    }
    
    .ql-better-table-add-row, 
    .ql-better-table-add-col {
      display: none !important;
    }
    
    .ql-better-table-selection-line {
      display: none !important;
    }
    
    .qlbt-col-tool-cell {
      display: none !important;
    }
    
    .qlbt-row-tool-cell {
      display: none !important;
    }
    
    .qlbt-col-tool-cell-holder {
      display: none !important;
    }
  }

  :deep(.ql-better-table-tooltip) {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    padding: 8px;
    
    .ql-better-table-tooltip-main {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      max-width: 280px;
    }
    
    .ql-better-table-tooltip-button {
      padding: 10px 14px;
      font-size: 14px;
      color: #374151;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
      min-height: 44px;
      
      &:hover, &:active {
        background: #3b82f6;
        color: white;
        border-color: #3b82f6;
      }
    }
  }
  
  @media (max-width: 768px) {
    :deep(.ql-better-table-tooltip) {
      .ql-better-table-tooltip-main {
        flex-direction: column;
        max-width: 200px;
      }
      
      .ql-better-table-tooltip-button {
        width: 100%;
        text-align: center;
      }
    }
    
    :deep(table.ql-better-table) {
      td, th {
        min-width: 40px;
        padding: 8px 10px;
        
        &.cell-selected {
          background-color: #e6f0ff !important;
          box-shadow: inset 0 0 0 3px #3b82f6;
        }
      }
    }
  }
}

.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-top: 1px solid #e8ecf0;
  background: #fafbfc;
}

.table-selector-popup {
  position: fixed;
  z-index: 1000;
  background: #ffffff;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid #e8ecf0;
}

.table-grid-selector {
  display: grid;
  grid-template-columns: repeat(5, 24px);
  grid-template-rows: repeat(5, 24px);
  gap: 2px;
}

.table-grid-row {
  display: contents;
}

.table-grid-cell {
  width: 24px;
  height: 24px;
  border: 1px solid #d1d5db;
  border-radius: 2px;
  background: #f9fafb;
  cursor: pointer;
  transition: all 0.1s ease;
  
  &:hover {
    border-color: #3B82F6;
    background: #eff6ff;
  }
  
  &.active {
    background: #3B82F6;
    border-color: #3B82F6;
  }
}

.table-grid-info {
  text-align: center;
  margin-top: 8px;
  font-size: 12px;
  color: #6b7280;
}

.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  background: #ffffff;
  box-shadow: 0 -2px 12px rgba(59, 130, 246, 0.08);
}

.btn-cancel {
  flex: 1;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  color: #7f8c8d;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e8ecf0;
  cursor: pointer;
  
  &:active {
    background: #e8ecf0;
  }
}

.btn-submit {
  flex: 2;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  cursor: pointer;
  
  &:active {
    opacity: 0.9;
    transform: scale(0.98);
  }
  
  &.disabled {
    background: linear-gradient(135deg, #bdc3c7 0%, #95a5a6 100%);
    box-shadow: none;
  }
}
</style>

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
            <span class="header-title">{{ isEdit ? '编辑卡片' : isHot ? '添加热门卡片' : '创建新卡片' }}</span>
            <span class="header-subtitle">记录知识点，构建你的法律知识体系</span>
          </div>
        </div>

        <div class="form-body">
          <div class="form-item" v-if="!isHot">
            <div class="form-label">
              <span class="label-text">所属知识库</span>
              <span class="label-required">*</span>
            </div>
            <div class="picker-card" @click="onSelectLibrary">
              <span class="picker-value" :class="{ active: selectedLibrary }">{{ selectedLibrary ? selectedLibrary.name : '选择知识库' }}</span>
              <t-icon name="chevron-right" size="16px" color="#c0c4cc" />
            </div>
          </div>

          <div class="form-item" v-if="selectedLibrary && !isHot">
            <div class="form-label">
              <span class="label-text">所属章节</span>
            </div>
            <div class="picker-card" @click="onSelectChapter">
              <span class="picker-value" :class="{ active: selectedChapter }">{{ selectedChapter ? selectedChapter.name : '选择章节（可选）' }}</span>
              <t-icon name="chevron-right" size="16px" color="#c0c4cc" />
            </div>
          </div>

          <div class="divider" v-if="!isHot"></div>

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
                  <button class="toolbar-btn" title="插入表格" @click="showTableDialog = true">
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

      <div class="table-dialog" v-if="showTableDialog">
        <div class="table-dialog-mask" @click="showTableDialog = false"></div>
        <div class="table-dialog-content">
          <div class="table-dialog-header">
            <span class="table-dialog-title">插入表格</span>
            <t-icon name="close" size="20px" class="close-btn" @click="showTableDialog = false" />
          </div>
          <div class="table-dialog-body">
            <div class="table-input-row">
              <span class="table-label">行数</span>
              <input type="number" v-model="tableRows" min="1" max="10" class="table-input" />
            </div>
            <div class="table-input-row">
              <span class="table-label">列数</span>
              <input type="number" v-model="tableCols" min="1" max="6" class="table-input" />
            </div>
          </div>
          <div class="table-dialog-footer">
            <button class="table-btn cancel" @click="showTableDialog = false">取消</button>
            <button class="table-btn confirm" @click="insertTable">确定</button>
          </div>
        </div>
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

    <div class="empty-state" v-else-if="!loading && libraries.length === 0">
      <t-icon name="folder-open" size="48px" color="#ccc" />
      <span class="empty-text">请先创建知识库</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, onBeforeUnmount, shallowRef } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next'
import { cardAPI, libraryAPI, chapterAPI } from '@/utils/api'
import Picker from '@/components/Picker.vue'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'

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

const loading = ref(true)
const isEdit = ref(false)
const isHot = ref(false)
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
  if (isHot.value) {
    return question.value.trim() && text
  }
  return question.value.trim() && text && selectedLibrary.value
})

const initQuill = () => {
  if (!editorRef.value) return
  
  quillInstance.value = new Quill(editorRef.value, {
    theme: 'snow',
    placeholder: '输入答案解析，支持分点作答...',
    modules: {
      toolbar: false
    }
  })

  if (answer.value) {
    quillInstance.value.root.innerHTML = answer.value
    answerText.value = quillInstance.value.getText().replace(/\s/g, '')
  }

  quillInstance.value.on('text-change', () => {
    const html = quillInstance.value!.root.innerHTML
    const text = quillInstance.value!.getText().replace(/\s/g, '')
    answer.value = html
    answerText.value = text
  })

  quillInstance.value.on('selection-change', (range) => {
    answerFocused.value = !!range
  })
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
    quillInstance.value.format('indent', currentFormat.indent ? false : 1)
    
    const [block] = quillInstance.value.getLine(selection.index)
    if (block) {
      const blot = block.domNode as HTMLElement
      if (!currentFormat.indent) {
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
  
  showTableDialog.value = false
}

const addKeywordSlot = () => {
  keywords.value.push('')
}

const removeKeyword = (index: number) => {
  keywords.value.splice(index, 1)
}

onMounted(async () => {
  const editId = route.query.id as string
  const hotFlag = route.query.isHot as string
  
  isHot.value = hotFlag === 'true'
  
  if (editId) {
    isEdit.value = true
    cardId.value = parseInt(editId)
    await loadCardData()
  }
  
  await loadLibraries()
})

onBeforeUnmount(() => {
  quillInstance.value = null
})

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
    const res = await libraryAPI.getList({ page: 1, pageSize: 100 })
    
    if (res.success && res.data) {
      let list = []
      if (Array.isArray(res.data)) {
        list = res.data
      } else if (res.data.list && Array.isArray(res.data.list)) {
        list = res.data.list
      } else if (res.data.data && Array.isArray(res.data.data)) {
        list = res.data.data
      }
      
      libraries.value = list.map((lib: any) => ({
        id: lib.id,
        name: lib.name
      }))
      
      if (libraries.value.length === 0 && !isHot.value) {
        MessagePlugin.warning('请先创建知识库')
        loading.value = false
        setTimeout(() => router.push('/admin'), 1500)
        return
      }
      
      if (libraries.value.length > 0 && !isHot.value) {
        selectedLibrary.value = libraries.value[0]
        selectedLibraryIndex.value = [libraries.value[0].id]
        loadChapters(libraries.value[0].id)
      }
    }
  } catch (error) {
    console.error('加载知识库失败:', error)
    MessagePlugin.error('加载失败')
    setTimeout(() => router.push('/admin'), 1500)
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
        router.push('/admin')
        confirmDialog.hide()
      }
    })
  } else {
    router.push('/admin')
  }
}

const onSubmitClick = () => {
  if (!isHot.value && !selectedLibrary.value) {
    MessagePlugin.warning('请选择知识库')
    return
  }
  
  if (!question.value.trim()) {
    MessagePlugin.warning('请输入题目')
    return
  }
  
  const text = answerText.value.replace(/\s/g, '')
  if (!text) {
    MessagePlugin.warning('请输入答案')
    return
  }
  
  onSubmit()
}

const onSubmit = async () => {
  if (!canSubmit.value) return

  try {
    const html = quillInstance.value ? quillInstance.value.root.innerHTML : answer.value
    
    const data: any = {
      question: question.value.trim(),
      answer: html,
      tags: keywords.value.filter(k => k.trim()),
      is_hot: isHot.value
    }
    
    if (!isHot.value && selectedLibrary.value) {
      data.library_id = selectedLibrary.value.id
      if (selectedChapter.value) {
        data.chapter_id = selectedChapter.value.id
      }
    }

    let res
    if (isEdit.value) {
      res = await cardAPI.update(cardId.value, data)
    } else {
      res = await cardAPI.create(data)
    }

    if (res.success) {
      MessagePlugin.success(isEdit.value ? '保存成功' : '创建成功')
      router.push('/admin')
    } else {
      MessagePlugin.error(res.message || '操作失败')
    }
  } catch (error) {
    MessagePlugin.error('操作失败，请重试')
  }
}
</script>

<style lang="scss" scoped>
.container {
  min-height: 100vh;
  background-color: #f5f6fa;
  padding-bottom: 100px;
}

.header-decoration {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 200px;
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  z-index: 0;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 12px;
}

.loading-text {
  font-size: 14px;
  color: #64748B;
}

.form-card {
  position: relative;
  margin: 16px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  z-index: 1;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #fff 100%);
  border-bottom: 1px solid #f1f5f9;
}

.header-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-text {
  flex: 1;
}

.header-title {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: #1E293B;
}

.header-subtitle {
  display: block;
  font-size: 12px;
  color: #94A3B8;
  margin-top: 2px;
}

.form-body {
  padding: 20px;
}

.form-item {
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.form-label {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.label-text {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

.label-required {
  font-size: 14px;
  color: #EF4444;
  margin-left: 4px;
}

.label-hint {
  font-size: 12px;
  color: #94A3B8;
  margin-left: 8px;
}

.picker-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #E2E8F0;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:active {
    background: #f1f5f9;
  }
}

.picker-value {
  font-size: 14px;
  color: #94A3B8;
  
  &.active {
    color: #334155;
  }
}

.divider {
  height: 1px;
  background: #E2E8F0;
  margin: 20px 0;
}

.textarea-card {
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #E2E8F0;
  padding: 14px;
  transition: all 0.2s ease;
  
  &.focused {
    border-color: #3B82F6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
}

.form-textarea {
  width: 100%;
  min-height: 80px;
  font-size: 14px;
  line-height: 1.6;
  color: #334155;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  
  &::placeholder {
    color: #94A3B8;
  }
}

.textarea-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.hint-text {
  font-size: 12px;
  color: #94A3B8;
}

.char-count {
  font-size: 12px;
  color: #94A3B8;
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
  width: 36px;
  height: 36px;
  background-color: rgba(59, 130, 246, 0.1);
  border-radius: 6px;
  cursor: pointer;
  
  &:active {
    background-color: rgba(59, 130, 246, 0.2);
  }
}

.editor-card {
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #E2E8F0;
  overflow: hidden;
  transition: all 0.2s ease;
  
  &.focused {
    border-color: #3B82F6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
}

.editor-toolbar {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #fff;
  border-bottom: 1px solid #E2E8F0;
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
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #64748B;
  
  &:hover {
    background: #f1f5f9;
    color: #3B82F6;
  }
  
  &:active {
    background: #E2E8F0;
  }
}

.indent-icon {
  font-size: 16px;
  font-weight: bold;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: #E2E8F0;
  margin: 0 4px;
}

.editor-content {
  min-height: 150px;
  padding: 14px;
  
  :deep(.ql-editor) {
    font-size: 14px;
    line-height: 1.6;
    color: #334155;
    padding: 0;
    
    &.ql-blank::before {
      color: #94A3B8;
      font-style: normal;
    }
    
    ol, ul {
      padding-left: 20px;
    }
    
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 8px 0;
      
      td {
        border: 1px solid #ddd;
        padding: 8px;
        min-width: 50px;
      }
    }
  }
}

.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #fff;
  border-top: 1px solid #E2E8F0;
}

.table-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.table-dialog-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.table-dialog-content {
  position: relative;
  width: 300px;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}

.table-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #E2E8F0;
}

.table-dialog-title {
  font-size: 16px;
  font-weight: 600;
  color: #1E293B;
}

.close-btn {
  cursor: pointer;
}

.table-dialog-body {
  padding: 20px 16px;
}

.table-input-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.table-label {
  width: 60px;
  font-size: 14px;
  color: #64748B;
}

.table-input {
  flex: 1;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  
  &:focus {
    border-color: #3B82F6;
  }
}

.table-dialog-footer {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid #E2E8F0;
}

.table-btn {
  flex: 1;
  height: 40px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  
  &.cancel {
    background: #f1f5f9;
    color: #64748B;
  }
  
  &.confirm {
    background: #3B82F6;
    color: #fff;
  }
}

.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  background: #fff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.btn-cancel {
  flex: 1;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border-radius: 12px;
  font-size: 15px;
  color: #64748B;
  cursor: pointer;
  
  &:active {
    background: #E2E8F0;
  }
}

.btn-submit {
  flex: 2;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  border-radius: 12px;
  font-size: 15px;
  color: #fff;
  font-weight: 500;
  cursor: pointer;
  
  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:active:not(.disabled) {
    transform: scale(0.98);
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 12px;
}

.empty-text {
  font-size: 14px;
  color: #94A3B8;
}
</style>

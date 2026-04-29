<template>
  <div class="container">
    <div class="custom-nav">
      <div class="nav-left" @click="router.back()">
        <t-icon name="chevron-left" size="20px" color="#333" />
      </div>
      <div class="nav-title">{{ isEdit ? '编辑卡片' : '创建新卡片' }}</div>
      <div class="nav-right"></div>
    </div>
    
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
              <span class="label-text">答案</span>
              <span class="label-required">*</span>
            </div>
            <div class="textarea-card answer-card" :class="{ focused: answerFocused }">
              <textarea
                class="form-textarea answer-textarea"
                placeholder="输入答案解析，支持分点作答..."
                v-model="answer"
                maxlength="500"
                @focus="answerFocused = true"
                @blur="answerFocused = false"
              ></textarea>
              <div class="textarea-footer">
                <span class="hint-text">详细解析，加深理解记忆</span>
                <span class="char-count">{{ answer.length }}/500</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="footer">
        <div class="btn-cancel" @click="onCancel">取消</div>
        <div class="btn-submit" :class="{ disabled: !canSubmit }" @click="onSubmit">
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next'
import { cardAPI, libraryAPI, chapterAPI } from '@/utils/api'
import Picker from '@/components/Picker.vue'

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
  return question.value.trim() && answer.value.trim() && selectedLibrary.value
})

onMounted(() => {
  const q = route.query.question as string
  const a = route.query.answer as string
  const editId = route.query.id as string
  const libraryId = route.query.libraryId as string
  const libraryName = route.query.libraryName as string
  
  if (editId) {
    isEdit.value = true
    cardId.value = parseInt(editId)
    loadCardData()
  } else {
    if (q) question.value = decodeURIComponent(q)
    if (a) answer.value = decodeURIComponent(a)
  }
  
  loadLibraries()
})

const loadCardData = async () => {
  try {
    const res = await cardAPI.getDetail(cardId.value)
    if (res.success && res.data) {
      question.value = res.data.question
      answer.value = res.data.answer
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
    if (res.success && res.data) {
      libraries.value = (res.data.list || res.data || []).map((lib: any) => ({
        id: lib.id,
        name: lib.name
      }))
      
      if (libraries.value.length === 0) {
        MessagePlugin.warning('请先创建知识库')
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
        }
      } else {
        selectedLibrary.value = libraries.value[0]
        selectedLibraryIndex.value = [libraries.value[0].id]
        loadChapters(libraries.value[0].id)
      }
    }
  } catch (error) {
    console.error('加载知识库失败:', error)
    MessagePlugin.error('加载失败')
    setTimeout(() => router.back(), 1500)
  } finally {
    loading.value = false
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
  if (question.value.trim() || answer.value.trim()) {
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

const onSubmit = async () => {
  if (!canSubmit.value) return

  try {
    const data = {
      library_id: selectedLibrary.value!.id,
      chapter_id: selectedChapter.value?.id || null,
      question: question.value.trim(),
      answer: answer.value.trim(),
      tags: [],
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
  padding-top: 60px;
  padding-bottom: 100px;
  box-sizing: border-box;
}

.custom-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 44px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  z-index: 100;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.nav-left {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:active {
    opacity: 0.8;
  }
}

.nav-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.nav-right {
  width: 40px;
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
  top: 44px;
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

.divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, #e8ecf0, transparent);
  margin: 16px 0;
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

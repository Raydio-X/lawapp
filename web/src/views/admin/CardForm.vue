<template>
  <div class="card-form-container">
    <div class="batch-import-entry" @click="showBatchImport = true" v-if="!isEdit && !isHot">
      <t-icon name="upload" size="18px" color="#3B82F6" />
      <span class="batch-import-text">批量导入卡片</span>
      <t-icon name="chevron-right" size="14px" color="#ccc" />
    </div>

    <div class="form-section">
      <div class="form-item" v-if="!isHot">
        <div class="form-label">
          <span class="label-text">所属知识库</span>
          <span class="label-required">*</span>
        </div>
        <div class="picker-wrapper" @click="showLibraryPicker = true">
          <div class="picker-content" :class="{ selected: selectedLibrary }">
            <span>{{ selectedLibrary ? selectedLibrary.name : '请选择知识库' }}</span>
          </div>
          <t-icon name="chevron-right" size="16px" color="#ccc" />
        </div>
      </div>

      <div class="form-item" v-if="selectedLibrary && !isHot">
        <div class="form-label">
          <span class="label-text">所属章节</span>
        </div>
        <div class="picker-wrapper" @click="showChapterPicker = true">
          <div class="picker-content" :class="{ selected: selectedChapter }">
            <span>{{ selectedChapter ? selectedChapter.name : '请选择章节（可选）' }}</span>
          </div>
          <t-icon name="chevron-right" size="16px" color="#ccc" />
        </div>
      </div>

      <div class="form-item">
        <div class="form-label">
          <span class="label-text">题目 / 问题</span>
          <span class="label-required">*</span>
        </div>
        <div class="textarea-wrapper">
          <textarea
            class="form-textarea"
            placeholder="请输入题目或问题，例如：正当防卫的构成要件有哪些？"
            v-model="question"
            maxlength="100"
          ></textarea>
          <div class="char-count">{{ question.length }}/100</div>
        </div>
      </div>

      <div class="form-item">
        <div class="form-label">
          <span class="label-text">答案 / 解析</span>
          <span class="label-required">*</span>
        </div>
        <div class="textarea-wrapper">
          <textarea
            class="form-textarea answer-textarea"
            placeholder="请输入答案或解析内容，支持换行"
            v-model="answer"
            maxlength="500"
          ></textarea>
          <div class="char-count">{{ answer.length }}/500</div>
        </div>
      </div>

      <div class="form-item">
        <div class="form-label">
          <span class="label-text">标签</span>
          <span class="label-optional">最多3个</span>
        </div>
        <div class="tags-input-container">
          <div class="tags-list-horizontal">
            <div class="tag-item-horizontal" v-for="(tag, index) in tagList" :key="index">
              <input 
                class="tag-input-horizontal" 
                v-model="tagList[index]" 
                :placeholder="'标签' + (index + 1)"
                maxlength="10"
              />
              <div class="tag-remove-horizontal" @click="onRemoveTag(index)">
                <t-icon name="close" size="12px" color="#999" />
              </div>
            </div>
            <div class="tag-add-btn-horizontal" v-if="tagList.length < 3" @click="onAddTag">
              <t-icon name="add" size="14px" color="#3B82F6" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="btn-group">
        <div class="btn-cancel" @click="onCancel">取消</div>
        <div class="btn-submit" :class="{ disabled: !canSubmit }" @click="onSubmit">
          {{ isEdit ? '保存修改' : '创建卡片' }}
        </div>
      </div>
    </div>

    <t-popup v-model:visible="showLibraryPicker" placement="bottom">
      <div class="picker-popup">
        <div class="picker-header">
          <span class="picker-title">选择知识库</span>
          <div class="picker-close" @click="showLibraryPicker = false">
            <t-icon name="close" size="20px" color="#999" />
          </div>
        </div>
        <div class="picker-list">
          <div 
            class="picker-item"
            :class="{ selected: selectedLibrary?.id === library.id }"
            v-for="library in libraries" 
            :key="library.id"
            @click="onSelectLibrary(library)"
          >
            <span>{{ library.name }}</span>
            <t-icon v-if="selectedLibrary?.id === library.id" name="check" size="18px" color="#3B82F6" />
          </div>
        </div>
      </div>
    </t-popup>

    <t-popup v-model:visible="showChapterPicker" placement="bottom">
      <div class="picker-popup">
        <div class="picker-header">
          <span class="picker-title">选择章节</span>
          <div class="picker-close" @click="showChapterPicker = false">
            <t-icon name="close" size="20px" color="#999" />
          </div>
        </div>
        <div class="picker-list">
          <div 
            class="picker-item"
            :class="{ selected: selectedChapter?.id === chapter.id }"
            v-for="chapter in chapters" 
            :key="chapter.id"
            @click="onSelectChapter(chapter)"
          >
            <span>{{ chapter.name }}</span>
            <t-icon v-if="selectedChapter?.id === chapter.id" name="check" size="18px" color="#3B82F6" />
          </div>
        </div>
      </div>
    </t-popup>

    <div class="batch-popup" v-if="showBatchImport" @click.self="showBatchImport = false">
      <div class="batch-container">
        <div class="batch-header">
          <span class="batch-title">批量导入</span>
          <div class="batch-close" @click="showBatchImport = false">
            <t-icon name="close" size="16px" color="#999" />
          </div>
        </div>

        <div class="batch-step" v-if="batchStep === 1">
          <div class="batch-step-header">
            <span class="batch-step-num">1</span>
            <span class="batch-step-title">选择目标知识库</span>
          </div>
          <div class="batch-library-list">
            <div 
              class="batch-library-item"
              :class="{ selected: batchLibraryId === library.id }" 
              v-for="library in libraries" 
              :key="library.id"
              @click="batchLibraryId = library.id"
            >
              <div class="batch-library-radio">
                <div class="batch-radio-dot" v-if="batchLibraryId === library.id"></div>
              </div>
              <div class="batch-library-info">
                <span class="batch-library-name">{{ library.name }}</span>
                <span class="batch-library-count">{{ library.card_count || 0 }}张卡片</span>
              </div>
            </div>
          </div>
          <div class="batch-empty" v-if="libraries.length === 0">
            <span>请先创建知识库</span>
          </div>
          <div class="batch-step-footer">
            <div class="batch-next-btn" :class="{ disabled: !batchLibraryId }" @click="batchStep = 2">下一步</div>
          </div>
        </div>

        <div class="batch-step" v-if="batchStep === 2">
          <div class="batch-step-header">
            <span class="batch-step-num">2</span>
            <span class="batch-step-title">上传Excel文件</span>
          </div>
          
          <div class="batch-upload-area" @click="onChooseFile">
            <div class="batch-upload-content" v-if="!batchFileName">
              <t-icon name="upload" size="32px" color="#00A870" />
              <span class="batch-upload-text">点击选择Excel文件</span>
              <span class="batch-upload-hint">支持 .xlsx / .xls 格式</span>
            </div>
            <div class="batch-upload-done" v-else>
              <t-icon name="file" size="24px" color="#00A870" />
              <span class="batch-file-name">{{ batchFileName }}</span>
              <span class="batch-file-change">点击更换文件</span>
            </div>
          </div>

          <div class="batch-template-section">
            <div class="batch-template-title">
              <t-icon name="info-circle" size="14px" color="#999" />
              <span>模板格式说明</span>
            </div>
            <div class="batch-template-info">
              <span class="batch-template-row"><span class="col-a">A列</span><span class="col-b">问题</span></span>
              <span class="batch-template-row"><span class="col-a">B列</span><span class="col-b">答案</span></span>
              <span class="batch-template-row"><span class="col-a">C列（可选）</span><span class="col-b">章节</span></span>
            </div>
            <div class="batch-download-template" @click="onDownloadTemplate">
              <t-icon name="download" size="14px" color="#3B82F6" />
              <span>下载模板</span>
            </div>
          </div>

          <div class="batch-step-actions">
            <div class="batch-prev-btn" @click="batchStep = 1">上一步</div>
            <div class="batch-next-btn" :class="{ disabled: !batchFileName }" @click="onBatchParse">解析文件</div>
          </div>
        </div>

        <div class="batch-step" v-if="batchStep === 3">
          <div class="batch-step-header">
            <span class="batch-step-num">3</span>
            <span class="batch-step-title">预览并确认</span>
          </div>

          <div class="batch-preview-summary">
            <span class="batch-preview-total">共解析到 <span class="highlight">{{ batchCards.length }}</span> 张卡片</span>
          </div>

          <div class="batch-preview-list">
            <div class="batch-preview-item" v-for="(card, index) in batchCards" :key="index">
              <div class="batch-preview-index">{{ index + 1 }}</div>
              <div class="batch-preview-content">
                <span class="batch-preview-q">Q: {{ card.question }}</span>
                <span class="batch-preview-a">A: {{ card.answer }}</span>
                <span class="batch-preview-chapter" v-if="card.chapter">{{ card.chapter }}</span>
              </div>
            </div>
          </div>

          <div class="batch-step-actions">
            <div class="batch-prev-btn" @click="batchStep = 2">上一步</div>
            <div class="batch-next-btn" :class="{ disabled: batchImporting }" @click="onBatchConfirmImport">
              {{ batchImporting ? '导入中...' : '确认导入' }}
            </div>
          </div>
        </div>

        <div class="batch-step" v-if="batchStep === 4">
          <div class="batch-result">
            <div class="batch-result-icon">
              <t-icon :name="batchImportSuccess ? 'check-circle' : 'error-circle'" size="48px" :color="batchImportSuccess ? '#00A870' : '#E34D59'" />
            </div>
            <span class="batch-result-title">{{ batchImportSuccess ? '导入成功' : '导入失败' }}</span>
            <span class="batch-result-desc" v-if="batchImportSuccess">成功导入 {{ batchImportCount }} 张卡片</span>
            <span class="batch-result-desc" v-else>{{ batchImportError || '请检查文件格式后重试' }}</span>
          </div>
          <div class="batch-step-footer">
            <div class="batch-next-btn" @click="showBatchImport = false">完成</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import api from '@/utils/api'

const router = useRouter()
const route = useRoute()

const isEdit = computed(() => !!route.query.id)
const isHot = computed(() => route.query.isHot === 'true')

const question = ref('')
const answer = ref('')
const tagList = ref<string[]>([])

const libraries = ref<any[]>([])
const chapters = ref<any[]>([])
const selectedLibrary = ref<any>(null)
const selectedChapter = ref<any>(null)

const showLibraryPicker = ref(false)
const showChapterPicker = ref(false)

const showBatchImport = ref(false)
const batchStep = ref(1)
const batchLibraryId = ref('')
const batchFileName = ref('')
const batchCards = ref<any[]>([])
const batchImporting = ref(false)
const batchImportSuccess = ref(false)
const batchImportCount = ref(0)
const batchImportError = ref('')

const canSubmit = computed(() => {
  if (!question.value.trim() || !answer.value.trim()) return false
  if (!isHot.value && !selectedLibrary.value) return false
  return true
})

onMounted(() => {
  loadLibraries()
  if (isEdit.value) {
    loadCardDetail()
  }
})

const loadLibraries = async () => {
  try {
    const res = await api.get('/libraries', { pageSize: 100 })
    if (res.success && res.data) {
      libraries.value = res.data.list || res.data
    }
  } catch (error) {
    console.error('加载知识库失败', error)
  }
}

const loadCardDetail = async () => {
  try {
    const res = await api.get(`/cards/${route.query.id}`)
    if (res.success && res.data) {
      const card = res.data
      question.value = card.question
      answer.value = card.answer
      tagList.value = card.tags || []
      if (card.library_id) {
        selectedLibrary.value = { id: card.library_id, name: card.library_name }
      }
      if (card.chapter_id) {
        selectedChapter.value = { id: card.chapter_id, name: card.chapter_name }
      }
    }
  } catch (error) {
    console.error('加载卡片详情失败', error)
  }
}

const onSelectLibrary = async (library: any) => {
  selectedLibrary.value = library
  showLibraryPicker.value = false
  selectedChapter.value = null
  
  try {
    const res = await api.get(`/libraries/${library.id}/chapters`)
    if (res.success && res.data) {
      chapters.value = res.data
    }
  } catch (error) {
    console.error('加载章节失败', error)
  }
}

const onSelectChapter = (chapter: any) => {
  selectedChapter.value = chapter
  showChapterPicker.value = false
}

const onAddTag = () => {
  if (tagList.value.length < 3) {
    tagList.value.push('')
  }
}

const onRemoveTag = (index: number) => {
  tagList.value.splice(index, 1)
}

const onCancel = () => {
  router.back()
}

const onSubmit = async () => {
  if (!canSubmit.value) return

  try {
    const data: any = {
      question: question.value,
      answer: answer.value,
      tags: tagList.value.filter(t => t.trim()),
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
      res = await api.put(`/cards/${route.query.id}`, data)
    } else {
      res = await api.post('/cards', data)
    }

    if (res.success) {
      MessagePlugin.success(isEdit.value ? '修改成功' : '创建成功')
      router.back()
    } else {
      MessagePlugin.error(res.message || '操作失败')
    }
  } catch (error) {
    MessagePlugin.error('操作失败，请重试')
  }
}

const onChooseFile = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.xlsx,.xls'
  input.onchange = (e: any) => {
    const file = e.target.files[0]
    if (file) {
      batchFileName.value = file.name
      parseExcelFile(file)
    }
  }
  input.click()
}

const parseExcelFile = async (file: File) => {
  
  MessagePlugin.info('文件解析功能需要集成xlsx库')
}

const onBatchParse = () => {
  if (!batchFileName.value) return
  batchStep.value = 3
}

const onDownloadTemplate = () => {
  const template = '问题,答案,章节\n示例问题1,示例答案1,第一章\n示例问题2,示例答案2,'
  const blob = new Blob(['\ufeff' + template], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '卡片导入模板.csv'
  a.click()
  URL.revokeObjectURL(url)
}

const onBatchConfirmImport = async () => {
  if (batchImporting.value) return
  
  batchImporting.value = true
  try {
    const res = await api.post('/cards/batch', {
      library_id: batchLibraryId.value,
      cards: batchCards.value
    })
    if (res.data.code === 0) {
      batchImportSuccess.value = true
      batchImportCount.value = res.data.data.count || batchCards.value.length
      batchStep.value = 4
    } else {
      batchImportSuccess.value = false
      batchImportError.value = res.data.message
      batchStep.value = 4
    }
  } catch (error) {
    batchImportSuccess.value = false
    batchImportError.value = '导入失败，请重试'
    batchStep.value = 4
  } finally {
    batchImporting.value = false
  }
}
</script>

<style lang="scss" scoped>
.card-form-container {
  min-height: 100vh;
  background-color: #f5f6fa;
  padding-bottom: 80px;
}

.batch-import-entry {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background-color: #fff;
  margin-bottom: 12px;
  cursor: pointer;

  .batch-import-text {
    flex: 1;
    margin-left: 8px;
    font-size: 14px;
    color: #3B82F6;
  }
}

.form-section {
  background-color: #fff;
  padding: 16px;
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
  margin-bottom: 8px;
}

.label-text {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.label-required {
  color: #f5222d;
  margin-left: 4px;
}

.label-optional {
  font-size: 12px;
  color: #999;
  margin-left: 8px;
}

.picker-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 12px;
  background-color: #f5f7fa;
  border-radius: 6px;
  cursor: pointer;
}

.picker-content {
  font-size: 14px;
  color: #bbb;

  &.selected {
    color: #333;
  }
}

.textarea-wrapper {
  position: relative;
}

.form-textarea {
  width: 100%;
  min-height: 80px;
  padding: 12px;
  font-size: 14px;
  color: #333;
  background-color: #f5f7fa;
  border-radius: 6px;
  border: none;
  outline: none;
  resize: none;
  box-sizing: border-box;

  &.answer-textarea {
    min-height: 120px;
  }

  &::placeholder {
    color: #bbb;
  }
}

.char-count {
  position: absolute;
  right: 12px;
  bottom: 8px;
  font-size: 12px;
  color: #bbb;
}

.tags-input-container {
  margin-top: 8px;
}

.tags-list-horizontal {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item-horizontal {
  display: flex;
  align-items: center;
  background-color: #f5f7fa;
  border-radius: 6px;
  padding: 0 8px;
  height: 36px;
}

.tag-input-horizontal {
  width: 80px;
  height: 36px;
  font-size: 14px;
  color: #333;
  background: transparent;
  border: none;
  outline: none;
}

.tag-remove-horizontal {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.tag-add-btn-horizontal {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background-color: #e8f4ff;
  border-radius: 6px;
  cursor: pointer;
}

.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  padding: 12px 16px;
  border-top: 1px solid #eee;
}

.btn-group {
  display: flex;
  gap: 12px;
}

.btn-cancel {
  flex: 1;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 22px;
  font-size: 15px;
  color: #666;
  background-color: #f5f7fa;
  cursor: pointer;
}

.btn-submit {
  flex: 1;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 22px;
  font-size: 15px;
  color: #fff;
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
  cursor: pointer;

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.picker-popup {
  background-color: #fff;
  border-radius: 16px 16px 0 0;
  max-height: 60vh;
  display: flex;
  flex-direction: column;
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.picker-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.picker-close {
  cursor: pointer;
}

.picker-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.picker-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  font-size: 14px;
  color: #333;
  cursor: pointer;

  &.selected {
    background-color: #e8f3ff;
    color: #3B82F6;
  }
}

.batch-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 1000;
}

.batch-container {
  width: 100%;
  background-color: #fff;
  border-radius: 16px 16px 0 0;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.batch-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.batch-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.batch-close {
  cursor: pointer;
}

.batch-step {
  padding: 16px;
}

.batch-step-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.batch-step-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #3B82F6;
  color: #fff;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.batch-step-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.batch-library-list {
  max-height: 300px;
  overflow-y: auto;
}

.batch-library-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;

  &.selected {
    background-color: #e8f3ff;
    border: 1px solid #3B82F6;
  }
}

.batch-library-radio {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;

  .batch-library-item.selected & {
    border-color: #3B82F6;
  }
}

.batch-radio-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #3B82F6;
}

.batch-library-info {
  flex: 1;
}

.batch-library-name {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.batch-library-count {
  font-size: 12px;
  color: #999;
}

.batch-empty {
  text-align: center;
  padding: 40px;
  color: #999;
}

.batch-step-footer {
  padding-top: 16px;
}

.batch-next-btn {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #3B82F6;
  color: #fff;
  border-radius: 22px;
  font-size: 15px;
  cursor: pointer;

  &.disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
}

.batch-upload-area {
  padding: 32px;
  background-color: #f8f9fa;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  margin-bottom: 16px;
}

.batch-upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.batch-upload-text {
  font-size: 14px;
  color: #333;
  margin-top: 12px;
}

.batch-upload-hint {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

.batch-upload-done {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.batch-file-name {
  font-size: 14px;
  color: #333;
  margin-top: 8px;
}

.batch-file-change {
  font-size: 12px;
  color: #3B82F6;
  margin-top: 8px;
}

.batch-template-section {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.batch-template-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
}

.batch-template-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.batch-template-row {
  display: flex;
  font-size: 13px;

  .col-a {
    width: 80px;
    color: #999;
  }

  .col-b {
    color: #333;
  }
}

.batch-download-template {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  background-color: #fff;
  border-radius: 6px;
  font-size: 13px;
  color: #3B82F6;
  cursor: pointer;
}

.batch-step-actions {
  display: flex;
  gap: 12px;
  padding-top: 16px;
}

.batch-prev-btn {
  flex: 1;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  color: #666;
  border-radius: 22px;
  font-size: 15px;
  cursor: pointer;
}

.batch-preview-summary {
  padding: 12px;
  background-color: #e8f4ff;
  border-radius: 8px;
  margin-bottom: 16px;
  text-align: center;
}

.batch-preview-total {
  font-size: 14px;
  color: #333;

  .highlight {
    color: #3B82F6;
    font-weight: 600;
  }
}

.batch-preview-list {
  max-height: 300px;
  overflow-y: auto;
}

.batch-preview-item {
  display: flex;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 8px;
}

.batch-preview-index {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #3B82F6;
  color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.batch-preview-content {
  flex: 1;
}

.batch-preview-q {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.batch-preview-a {
  display: block;
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.batch-preview-chapter {
  display: block;
  font-size: 12px;
  color: #999;
}

.batch-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0;
}

.batch-result-icon {
  margin-bottom: 16px;
}

.batch-result-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.batch-result-desc {
  font-size: 14px;
  color: #999;
}
</style>

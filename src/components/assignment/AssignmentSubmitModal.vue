<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>과제 제출</h3>
        <button @click="$emit('close')" class="close-btn">&times;</button>
      </div>

      <div class="assignment-info">
        <h4>{{ assignment.title }}</h4>
        <p>{{ assignment.description }}</p>
        <div class="deadline-info">
          <span :class="{ 'text-danger': isLate }">
            <i class="far fa-calendar"></i>
            마감일: {{ formatDate(assignment.dueDate) }}
          </span>
          <span v-if="isLate" class="late-warning">
            <i class="fas fa-exclamation-triangle"></i>
            늦은 제출입니다
          </span>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="submit-form">
        <div class="form-group">
          <label>제출 파일 *</label>
          <div 
            class="file-dropzone"
            @dragover.prevent="dragOver = true"
            @dragleave.prevent="dragOver = false"
            @drop.prevent="handleDrop"
            :class="{ 'drag-over': dragOver }"
          >
            <input
              ref="fileInput"
              type="file"
              multiple
              @change="handleFileChange"
              accept=".pdf,.doc,.docx,.hwp,.txt,.zip,.png,.jpg,.jpeg"
            />
            
            <div v-if="selectedFiles.length === 0" class="dropzone-content">
              <i class="fas fa-cloud-upload-alt"></i>
              <p>파일을 드래그하거나 클릭하여 선택하세요</p>
              <span class="file-types">PDF, DOC, DOCX, HWP, TXT, ZIP, 이미지</span>
            </div>
            
            <div v-else class="selected-files">
              <div v-for="(file, index) in selectedFiles" :key="index" class="file-item">
                <div class="file-icon">
                  <i :class="getFileIcon(file.name)"></i>
                </div>
                <div class="file-details">
                  <span class="file-name">{{ file.name }}</span>
                  <span class="file-size">{{ formatFileSize(file.size) }}</span>
                </div>
                <button type="button" @click="removeFile(index)" class="remove-btn">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="comment">코멘트 (선택)</label>
          <textarea
            id="comment"
            v-model="comment"
            rows="3"
            placeholder="선생님께 전달할 메시지를 입력하세요"
          ></textarea>
        </div>

        <div class="form-actions">
          <button type="button" @click="$emit('close')" class="btn-cancel">
            취소
          </button>
          <button 
            type="submit" 
            class="btn-submit"
            :disabled="loading || selectedFiles.length === 0"
          >
            <span v-if="loading">
              <i class="fas fa-spinner fa-spin"></i> 제출 중...
            </span>
            <span v-else>
              <i class="fas fa-paper-plane"></i> 과제 제출
            </span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { format, isPast } from 'date-fns'
import { ko } from 'date-fns/locale'
import submissionApi from '@/api/submission'

export default {
  name: 'AssignmentSubmitModal',
  props: {
    assignment: {
      type: Object,
      required: true
    }
  },
  emits: ['close', 'submitted'],
  setup(props, { emit }) {
    const selectedFiles = ref([])
    const comment = ref('')
    const loading = ref(false)
    const dragOver = ref(false)
    const fileInput = ref(null)
    const studentId = ref(1) // TODO: 실제 로그인한 학생 ID로 변경

    const isLate = computed(() => {
      return isPast(new Date(props.assignment.dueDate))
    })

    const handleFileChange = (event) => {
      const files = Array.from(event.target.files)
      addFiles(files)
    }

    const handleDrop = (event) => {
      dragOver.value = false
      const files = Array.from(event.dataTransfer.files)
      addFiles(files)
    }

    const addFiles = (files) => {
      const validFiles = files.filter(file => {
        // 파일 크기 체크 (50MB)
        if (file.size > 50 * 1024 * 1024) {
          alert(`${file.name} 파일이 너무 큽니다. (최대 50MB)`)
          return false
        }
        return true
      })
      
      selectedFiles.value = [...selectedFiles.value, ...validFiles]
    }

    const removeFile = (index) => {
      selectedFiles.value.splice(index, 1)
    }

    const formatDate = (dateString) => {
      return format(new Date(dateString), 'yyyy년 MM월 dd일 HH:mm', { locale: ko })
    }

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    }

    const getFileIcon = (fileName) => {
      const extension = fileName.split('.').pop().toLowerCase()
      const iconMap = {
        pdf: 'far fa-file-pdf',
        doc: 'far fa-file-word',
        docx: 'far fa-file-word',
        hwp: 'far fa-file-alt',
        txt: 'far fa-file-alt',
        zip: 'far fa-file-archive',
        png: 'far fa-file-image',
        jpg: 'far fa-file-image',
        jpeg: 'far fa-file-image'
      }
      return iconMap[extension] || 'far fa-file'
    }

    const handleSubmit = async () => {
      if (selectedFiles.value.length === 0) {
        alert('제출할 파일을 선택해주세요.')
        return
      }

      loading.value = true

      try {
        const formData = new FormData()
        formData.append('assignmentId', props.assignment.id)
        formData.append('studentId', studentId.value)
        formData.append('comment', comment.value)
        
        selectedFiles.value.forEach(file => {
          formData.append('files', file)
        })

        const response = await submissionApi.submitAssignment(formData)
        
        alert('과제가 제출되었습니다.')
        emit('submitted', response.data)
        emit('close')
      } catch (error) {
        console.error('과제 제출 실패:', error)
        alert('과제 제출에 실패했습니다.')
      } finally {
        loading.value = false
      }
    }

    return {
      selectedFiles,
      comment,
      loading,
      dragOver,
      fileInput,
      isLate,
      handleFileChange,
      handleDrop,
      removeFile,
      formatDate,
      formatFileSize,
      getFileIcon,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
}

.close-btn:hover {
  color: #333;
}

.assignment-info {
  padding: 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.assignment-info h4 {
  margin: 0 0 10px 0;
  font-size: 18px;
  font-weight: 600;
}

.assignment-info p {
  color: #666;
  margin: 0 0 15px 0;
  line-height: 1.5;
}

.deadline-info {
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 14px;
}

.text-danger {
  color: #f44336;
}

.late-warning {
  color: #ff9800;
  font-weight: 500;
}

.submit-form {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.file-dropzone {
  position: relative;
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 30px;
  background: #fafafa;
  transition: all 0.3s ease;
  cursor: pointer;
}

.file-dropzone:hover,
.file-dropzone.drag-over {
  border-color: #1976d2;
  background: #e3f2fd;
}

.file-dropzone input[type="file"] {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.dropzone-content {
  text-align: center;
  color: #666;
}

.dropzone-content i {
  font-size: 48px;
  color: #1976d2;
  margin-bottom: 15px;
}

.dropzone-content p {
  margin: 10px 0;
  font-size: 16px;
}

.file-types {
  font-size: 12px;
  color: #999;
}

.selected-files {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}

.file-icon {
  font-size: 24px;
  color: #666;
}

.file-details {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.file-size {
  font-size: 12px;
  color: #999;
}

.remove-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 4px;
  font-size: 16px;
}

.remove-btn:hover {
  color: #f44336;
}

textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #e0e0e0;
  margin: 0 -20px -20px;
}

.btn-cancel,
.btn-submit {
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-cancel {
  background: white;
  border: 1px solid #ddd;
  color: #666;
}

.btn-cancel:hover {
  background: #f5f5f5;
}

.btn-submit {
  background: #1976d2;
  border: none;
  color: white;
}

.btn-submit:hover:not(:disabled) {
  background: #1565c0;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-submit i {
  margin-right: 5px;
}
</style>
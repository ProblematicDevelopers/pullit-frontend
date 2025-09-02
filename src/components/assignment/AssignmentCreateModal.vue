<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>새 과제 만들기</h3>
        <button @click="$emit('close')" class="close-btn">&times;</button>
      </div>

      <form @submit.prevent="handleSubmit" class="assignment-form">
        <div class="form-group">
          <label for="title">과제 제목 *</label>
          <input
            id="title"
            v-model="formData.title"
            type="text"
            required
            placeholder="과제 제목을 입력하세요"
          />
        </div>

        <div class="form-group">
          <label for="description">과제 설명</label>
          <textarea
            id="description"
            v-model="formData.description"
            rows="4"
            placeholder="과제에 대한 상세 설명을 입력하세요"
          ></textarea>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="dueDate">마감일 *</label>
            <input
              id="dueDate"
              v-model="formData.dueDate"
              type="datetime-local"
              required
              :min="minDateTime"
            />
          </div>

          <div class="form-group">
            <label for="maxScore">최대 점수</label>
            <input
              id="maxScore"
              v-model.number="formData.maxScore"
              type="number"
              min="0"
              placeholder="100"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="classes">대상 반 선택 *</label>
          <div class="class-selection">
            <div 
              v-for="cls in availableClasses" 
              :key="cls.id"
              class="class-checkbox"
            >
              <input
                :id="`class-${cls.id}`"
                v-model="formData.classIds"
                type="checkbox"
                :value="cls.id"
                @change="updateClassNames(cls)"
              />
              <label :for="`class-${cls.id}`">{{ cls.name }}</label>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label for="files">첨부 파일</label>
          <div class="file-upload-area">
            <input
              id="files"
              ref="fileInput"
              type="file"
              multiple
              @change="handleFileChange"
              accept=".pdf,.doc,.docx,.hwp,.txt,.zip,.png,.jpg,.jpeg"
            />
            <label for="files" class="file-upload-label">
              <i class="fas fa-cloud-upload-alt"></i>
              <span>파일을 선택하거나 드래그하세요</span>
              <span class="file-types">PDF, DOC, DOCX, HWP, TXT, ZIP, 이미지</span>
            </label>
          </div>
          
          <div v-if="selectedFiles.length > 0" class="selected-files">
            <div v-for="(file, index) in selectedFiles" :key="index" class="file-item">
              <i class="far fa-file"></i>
              <span>{{ file.name }} ({{ formatFileSize(file.size) }})</span>
              <button type="button" @click="removeFile(index)" class="remove-file">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input
              v-model="formData.allowLateSubmission"
              type="checkbox"
            />
            <span>늦은 제출 허용</span>
          </label>
        </div>

        <div class="form-actions">
          <button type="button" @click="$emit('close')" class="btn-cancel">
            취소
          </button>
          <button type="submit" class="btn-primary" :disabled="loading">
            <span v-if="loading">
              <i class="fas fa-spinner fa-spin"></i> 생성 중...
            </span>
            <span v-else>과제 생성</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import assignmentApi from '@/api/assignment'
import classApi from '@/api/class'

export default {
  name: 'AssignmentCreateModal',
  emits: ['close', 'created'],
  setup(props, { emit }) {
    const formData = ref({
      title: '',
      description: '',
      dueDate: '',
      maxScore: 100,
      classIds: [],
      classNames: {},
      allowLateSubmission: false,
      teacherId: 1 // TODO: 실제 로그인한 선생님 ID로 변경
    })

    const selectedFiles = ref([])
    const availableClasses = ref([])
    const loading = ref(false)
    const fileInput = ref(null)

    const minDateTime = computed(() => {
      const now = new Date()
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
      return now.toISOString().slice(0, 16)
    })

    const fetchClasses = async () => {
      try {
        // TODO: 실제 API 호출로 변경
        availableClasses.value = [
          { id: 1, name: '1학년 1반' },
          { id: 2, name: '1학년 2반' },
          { id: 3, name: '2학년 1반' },
          { id: 4, name: '2학년 2반' },
          { id: 5, name: '3학년 1반' }
        ]
      } catch (error) {
        console.error('반 목록 조회 실패:', error)
      }
    }

    const updateClassNames = (cls) => {
      if (formData.value.classIds.includes(cls.id)) {
        formData.value.classNames[cls.id] = cls.name
      } else {
        delete formData.value.classNames[cls.id]
      }
    }

    const handleFileChange = (event) => {
      const files = Array.from(event.target.files)
      selectedFiles.value = files
    }

    const removeFile = (index) => {
      selectedFiles.value.splice(index, 1)
      if (selectedFiles.value.length === 0 && fileInput.value) {
        fileInput.value.value = ''
      }
    }

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    }

    const handleSubmit = async () => {
      if (formData.value.classIds.length === 0) {
        alert('대상 반을 선택해주세요.')
        return
      }

      loading.value = true

      try {
        const formDataToSend = new FormData()
        
        // JSON 데이터를 Blob으로 변환
        const assignmentData = {
          ...formData.value,
          dueDate: new Date(formData.value.dueDate).toISOString()
        }
        
        formDataToSend.append('assignment', new Blob([JSON.stringify(assignmentData)], {
          type: 'application/json'
        }))

        // 파일 추가
        selectedFiles.value.forEach(file => {
          formDataToSend.append('files', file)
        })

        const response = await assignmentApi.createAssignment(formDataToSend)
        
        alert('과제가 생성되었습니다.')
        emit('created', response.data)
        emit('close')
      } catch (error) {
        console.error('과제 생성 실패:', error)
        alert('과제 생성에 실패했습니다.')
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      fetchClasses()
    })

    return {
      formData,
      selectedFiles,
      availableClasses,
      loading,
      fileInput,
      minDateTime,
      updateClassNames,
      handleFileChange,
      removeFile,
      formatFileSize,
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
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.assignment-form {
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

.form-group input[type="text"],
.form-group input[type="number"],
.form-group input[type="datetime-local"],
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group textarea {
  resize: vertical;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.class-selection {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  max-height: 150px;
  overflow-y: auto;
}

.class-checkbox {
  display: flex;
  align-items: center;
}

.class-checkbox input[type="checkbox"] {
  margin-right: 8px;
}

.file-upload-area {
  position: relative;
  border: 2px dashed #ddd;
  border-radius: 4px;
  padding: 30px;
  text-align: center;
  transition: all 0.3s ease;
}

.file-upload-area:hover {
  border-color: #1976d2;
  background: #f8f9fa;
}

.file-upload-area input[type="file"] {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.file-upload-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: #666;
  cursor: pointer;
}

.file-upload-label i {
  font-size: 48px;
  color: #1976d2;
}

.file-types {
  font-size: 12px;
  color: #999;
}

.selected-files {
  margin-top: 15px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: white;
  border-radius: 4px;
  margin-bottom: 8px;
}

.file-item:last-child {
  margin-bottom: 0;
}

.file-item i {
  color: #666;
}

.file-item span {
  flex: 1;
  font-size: 14px;
}

.remove-file {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 4px;
}

.remove-file:hover {
  color: #f44336;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  margin-right: 8px;
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
.btn-primary {
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

.btn-primary {
  background: #1976d2;
  border: none;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1565c0;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
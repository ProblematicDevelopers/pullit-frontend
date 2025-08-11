<template>
  <div class="api-test">
    <h2>API 테스트</h2>

    <div class="test-buttons">
      <button @click="testHealth" :disabled="loading">
        최종테스트
      </button>

      <button @click="testCors" :disabled="loading">
        CORS 테스트지롱롱롱
      </button>

      <button @click="testEcho" :disabled="loading">
        Echo 테스트지롱asdfasdf
      </button>
      <router-link to="/statistics">통계 테스트</router-link>
    </div>

    <div v-if="loading" class="loading">
      요청 중...
    </div>

    <div v-if="response" class="response">
      <h3>응답 결과:</h3>
      <pre>{{ JSON.stringify(response, null, 2) }}</pre>
    </div>

    <div v-if="error" class="error">
      <h3>에러 발생:</h3>
      <pre>{{ error }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const loading = ref(false)
const response = ref(null)
const error = ref(null)

const clearState = () => {
  response.value = null
  error.value = null
}

const testHealth = async () => {
  clearState()
  loading.value = true

  try {
    const res = await axios.get(`${API_BASE_URL}/test/health`)
    response.value = res.data
    console.log('Health check success:', res.data)
  } catch (err) {
    error.value = err.message
    console.error('Health check failed:', err)
  } finally {
    loading.value = false
  }
}

const testCors = async () => {
  clearState()
  loading.value = true

  try {
    const res = await axios.get(`${API_BASE_URL}/test/cors-test`)
    response.value = res.data
    console.log('CORS test success:', res.data)
  } catch (err) {
    error.value = err.message
    console.error('CORS test failed:', err)
  } finally {
    loading.value = false
  }
}

const testEcho = async () => {
  clearState()
  loading.value = true

  try {
    const testData = {
      message: 'Hello from Vue.js',
      timestamp: new Date().toISOString(),
      test: true
    }

    const res = await axios.post(`${API_BASE_URL}/test/echo`, testData)
    response.value = res.data
    console.log('Echo test success:', res.data)
  } catch (err) {
    error.value = err.message
    console.error('Echo test failed:', err)
  } finally {
    loading.value = false
  }
}

const statisticsTest = async () => {

}
</script>

<style scoped>
.api-test {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

h2 {
  color: #333;
  margin-bottom: 1.5rem;
}

.test-buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  background-color: #42b883;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover:not(:disabled) {
  background-color: #33a06f;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  color: #666;
  margin: 1rem 0;
}

.response, .error {
  margin-top: 2rem;
  padding: 1rem;
  border-radius: 4px;
}

.response {
  background-color: #f0f9ff;
  border: 1px solid #e0f2fe;
}

.error {
  background-color: #fef2f2;
  border: 1px solid #fee2e2;
  color: #dc2626;
}

pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

h3 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}
</style>

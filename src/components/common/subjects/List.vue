<template>
  <div>

  </div>
</template>

<script>

import axios from 'axios'
import { ref } from 'vue'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const loading = ref(false)
const response = ref(null)
const error = ref(null)
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
export default {

}

</script>

<style scoped>

</style>

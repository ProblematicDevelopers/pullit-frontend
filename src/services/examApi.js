import axios from 'axios';
import router from "@/router/index.js";
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

const examApi = axios.create({
  baseURL: `${API_BASE_URL}/api/exams`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
})

examApi.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
},
  error => {
  return Promise.reject(error);
  })
examApi.interceptors.response.use(response=>response,
  error => {
  if(error.response.status === 401){
    router.push('/login');
  }
  return Promise.reject(error);
  })

// 시험지 개수 조회 API 추가
examApi.getExamCounts = (params) => {
  return examApi.get('/count', { params })
}

export default examApi;

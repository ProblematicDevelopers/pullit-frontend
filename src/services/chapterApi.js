import api from './api';

/**
 * Chapter API Service
 * 단원 관련 API 호출 서비스
 */
const chapterApi = {
  // 전체 챕터 목록 조회
  getAllChapters: () => api.get('/chapter'),
  
  // 특정 교과서의 챕터 목록 조회
  getChaptersBySubject: (subjectId) => api.get(`/chapter/${subjectId}`),
  
  // 특정 교과서의 챕터 트리 구조 조회
  getChapterTree: (subjectId) => api.get(`/chapter/${subjectId}/tree`),
  
  // 챕터별 문항 수 조회
  getChapterItemCounts: (subjectId) => api.get(`/chapter/${subjectId}/item-counts`),
  
  // 챕터 상세 정보 조회
  getChapterDetail: (chapterId) => api.get(`/chapter/detail/${chapterId}`),
  
  // 챕터 검색
  searchChapters: (keyword) => api.get('/chapter/search', { params: { keyword } })
}

export default chapterApi;
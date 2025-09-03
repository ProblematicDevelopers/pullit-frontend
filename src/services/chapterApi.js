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
  
  // 특정 교과서의 챕터 트리 구조 조회 (문항 수 포함 시도)
  getChapterTreeWithItemCount: async (subjectId) => {
    try {
      // 트리 구조를 가져옴
      const treeResponse = await api.get(`/chapter/${subjectId}/tree`);
      
      // 트리 구조 반환 (현재는 item-counts API가 없으므로 트리 구조만 반환)
      // 추후 백엔드에 item-counts API가 추가되면 아래 코드 활성화
      /*
      try {
        const countsResponse = await api.get(`/chapter/${subjectId}/item-counts`);
        if (countsResponse.success && treeResponse.success) {
          // 트리 데이터와 문항 수를 결합하는 로직
        }
      } catch (countError) {
        console.log('item-counts API not available, using tree only');
      }
      */
      
      if (treeResponse.success && treeResponse.data) {
        // 트리 구조에 임시 문항 수 추가 (0으로 초기화)
        const enrichTree = (nodes) => {
          return nodes.map(node => {
            const enrichedNode = {
              ...node,
              itemCount: node.itemCount || 0,  // 백엔드에서 제공하면 사용, 없으면 0
              totalItemCount: node.totalItemCount || 0
            };
            
            // 자식 노드가 있으면 재귀적으로 처리
            if (node.children && node.children.length > 0) {
              enrichedNode.children = enrichTree(node.children);
            }
            
            return enrichedNode;
          });
        };
        
        return {
          success: true,
          data: enrichTree(treeResponse.data)
        };
      }
      
      return treeResponse;
    } catch (error) {
      console.error('Error in getChapterTreeWithItemCount:', error);
      // 에러 발생 시 기본 트리 구조 API 호출
      return api.get(`/chapter/${subjectId}/tree`);
    }
  },
  
  // 챕터별 문항 수 조회
  getChapterItemCounts: (subjectId) => api.get(`/chapter/${subjectId}/item-counts`),
  
  // 챕터 상세 정보 조회
  getChapterDetail: (chapterId) => api.get(`/chapter/detail/${chapterId}`),
  
  // 챕터 검색
  searchChapters: (keyword) => api.get('/chapter/search', { params: { keyword } })
}

export default chapterApi;
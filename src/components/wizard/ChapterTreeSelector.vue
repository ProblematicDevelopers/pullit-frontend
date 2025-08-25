<!--
  ChapterTreeSelector: 트리 구조로 단원을 선택하는 컴포넌트
  
  대단원과 중단원을 트리 구조로 표시하며, 
  대단원 체크 시 하위 중단원 모두 선택/해제 기능 제공
-->

<template>
  <div class="chapter-tree-selector">
    <div class="tree-header">
      <button 
        class="btn-select-all" 
        @click="toggleAllChapters"
      >
        {{ isAllSelected ? '전체 해제' : '전체 선택' }}
      </button>
      <span class="selected-count">
        {{ selectedCount }}개 선택됨
      </span>
    </div>
    
    <div class="tree-content">
      <div 
        v-for="chapter in chaptersTree" 
        :key="chapter.id || chapter.chapterId"
        class="tree-node"
      >
        <!-- 대단원 -->
        <div class="node-item parent">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              :checked="isChapterSelected(chapter)"
              @change="toggleChapter(chapter)"
            />
            <span class="checkbox-custom"></span>
            <span class="chapter-name">{{ chapter.name || chapter.chapterName }}</span>
            <span class="item-count">({{ chapter.totalItemCount || 0 }}문항)</span>
          </label>
          
          <button 
            v-if="chapter.children && chapter.children.length > 0"
            class="btn-expand"
            @click="toggleExpand(chapter.id || chapter.chapterId)"
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none"
              :class="{ rotated: expandedChapters.includes(chapter.id || chapter.chapterId) }"
            >
              <path d="M9 5L16 12L9 19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        
        <!-- 중단원 (확장된 경우만) -->
        <div 
          v-if="chapter.children && expandedChapters.includes(chapter.id || chapter.chapterId)"
          class="children"
        >
          <div 
            v-for="subChapter in chapter.children" 
            :key="subChapter.id || subChapter.chapterId"
            class="node-item child"
          >
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                :checked="selectedChapters.includes(subChapter.id || subChapter.chapterId)"
                @change="toggleSubChapter(subChapter)"
              />
              <span class="checkbox-custom"></span>
              <span class="chapter-name">{{ subChapter.name || subChapter.chapterName }}</span>
              <span class="item-count">({{ subChapter.itemCount || 0 }}문항)</span>
            </label>
          </div>
        </div>
      </div>
    </div>
    
    <div class="tree-footer">
      <p class="help-text">
        대단원을 선택하면 하위 중단원이 모두 선택됩니다
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// Props & Emits
const props = defineProps({
  chapters: {
    type: Array,
    default: () => []
  },
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

// State
const expandedChapters = ref([])
const selectedChapters = ref([...props.modelValue])

// Watch for external changes
watch(() => props.modelValue, (newVal) => {
  selectedChapters.value = [...newVal]
})

// Computed
const chaptersTree = computed(() => {
  console.log('ChapterTreeSelector - 전체 chapters:', props.chapters)
  
  // Step2ItemSelection처럼 직접 트리 구조로 들어온다고 가정
  // API가 이미 트리 구조로 반환하는 경우
  if (props.chapters.length > 0 && props.chapters[0].children !== undefined) {
    console.log('ChapterTreeSelector - 이미 트리 구조로 들어옴')
    return props.chapters.filter(ch => (ch.depth || ch.level || 1) === 1)
  }
  
  // 플랫한 배열인 경우 트리 구조로 변환
  const tree = []
  const chapterMap = new Map()
  
  // 모든 챕터를 맵에 저장
  props.chapters.forEach(chapter => {
    const id = chapter.id || chapter.chapterId
    const depth = chapter.depth || chapter.level || 1
    
    chapterMap.set(id, {
      ...chapter,
      id: id,
      name: chapter.name || chapter.chapterName,
      depth: depth,
      children: []
    })
  })
  
  // 트리 구조 구성
  props.chapters.forEach(chapter => {
    const id = chapter.id || chapter.chapterId
    const depth = chapter.depth || chapter.level || 1
    const parentId = chapter.parentId || chapter.parentChapterId
    
    if (depth === 2 && parentId) {
      // 중단원을 부모 대단원에 추가
      const parent = chapterMap.get(parentId)
      if (parent) {
        parent.children.push(chapterMap.get(id))
      }
    }
  })
  
  // 대단원만 트리에 추가
  props.chapters.forEach(chapter => {
    const depth = chapter.depth || chapter.level || 1
    if (depth === 1) {
      const id = chapter.id || chapter.chapterId
      const chapterNode = chapterMap.get(id)
      
      // 대단원의 총 문항 수 계산
      chapterNode.totalItemCount = (chapterNode.itemCount || 0) + 
        chapterNode.children.reduce((sum, child) => sum + (child.itemCount || 0), 0)
      
      tree.push(chapterNode)
    }
  })
  
  console.log('ChapterTreeSelector - 트리 구조:', tree)
  return tree
})

const selectedCount = computed(() => {
  return selectedChapters.value.length
})

const isAllSelected = computed(() => {
  const allChapterIds = []
  chaptersTree.value.forEach(chapter => {
    const chapterId = chapter.id || chapter.chapterId
    allChapterIds.push(chapterId)
    if (chapter.children) {
      chapter.children.forEach(child => {
        const childId = child.id || child.chapterId
        allChapterIds.push(childId)
      })
    }
  })
  
  return allChapterIds.length > 0 && 
         allChapterIds.every(id => selectedChapters.value.includes(id))
})

// Methods
const isChapterSelected = (chapter) => {
  const chapterId = chapter.id || chapter.chapterId
  // 대단원이 선택되었는지 확인 (본인 또는 모든 자식이 선택된 경우)
  if (selectedChapters.value.includes(chapterId)) {
    return true
  }
  
  if (chapter.children && chapter.children.length > 0) {
    return chapter.children.every(child => {
      const childId = child.id || child.chapterId
      return selectedChapters.value.includes(childId)
    })
  }
  
  return false
}

const toggleChapter = (chapter) => {
  const chapterId = chapter.id || chapter.chapterId
  const isSelected = isChapterSelected(chapter)
  
  if (isSelected) {
    // 대단원과 모든 중단원 해제
    selectedChapters.value = selectedChapters.value.filter(id => {
      if (id === chapterId) return false
      if (chapter.children) {
        return !chapter.children.some(child => {
          const childId = child.id || child.chapterId
          return childId === id
        })
      }
      return true
    })
  } else {
    // 대단원과 모든 중단원 선택
    const idsToAdd = [chapterId]
    if (chapter.children) {
      chapter.children.forEach(child => {
        const childId = child.id || child.chapterId
        idsToAdd.push(childId)
      })
    }
    
    idsToAdd.forEach(id => {
      if (!selectedChapters.value.includes(id)) {
        selectedChapters.value.push(id)
      }
    })
  }
  
  emit('update:modelValue', selectedChapters.value)
}

const toggleSubChapter = (subChapter) => {
  const subChapterId = subChapter.id || subChapter.chapterId
  const index = selectedChapters.value.indexOf(subChapterId)
  
  if (index > -1) {
    selectedChapters.value.splice(index, 1)
  } else {
    selectedChapters.value.push(subChapterId)
  }
  
  emit('update:modelValue', selectedChapters.value)
}

const toggleAllChapters = () => {
  if (isAllSelected.value) {
    selectedChapters.value = []
  } else {
    const allIds = []
    chaptersTree.value.forEach(chapter => {
      const chapterId = chapter.id || chapter.chapterId
      allIds.push(chapterId)
      if (chapter.children) {
        chapter.children.forEach(child => {
          const childId = child.id || child.chapterId
          allIds.push(childId)
        })
      }
    })
    selectedChapters.value = allIds
  }
  
  emit('update:modelValue', selectedChapters.value)
}

const toggleExpand = (chapterId) => {
  const index = expandedChapters.value.indexOf(chapterId)
  if (index > -1) {
    expandedChapters.value.splice(index, 1)
  } else {
    expandedChapters.value.push(chapterId)
  }
}

// 초기 확장 상태 설정 (선택된 항목이 있는 대단원은 자동 확장)
const initExpandedState = () => {
  chaptersTree.value.forEach(chapter => {
    const chapterId = chapter.id || chapter.chapterId
    if (chapter.children && chapter.children.length > 0) {
      const hasSelectedChild = chapter.children.some(child => {
        const childId = child.id || child.chapterId
        return selectedChapters.value.includes(childId)
      })
      if (hasSelectedChild || selectedChapters.value.includes(chapterId)) {
        expandedChapters.value.push(chapterId)
      }
    }
  })
}

// Initialize
initExpandedState()
</script>

<style scoped>
.chapter-tree-selector {
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  background: white;
  overflow: hidden;
}

/* 헤더 */
.tree-header {
  padding: 12px 16px;
  background: #F9FAFB;
  border-bottom: 1px solid #E5E7EB;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-select-all {
  padding: 6px 12px;
  background: white;
  border: 1px solid #D1D5DB;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-select-all:hover {
  background: #F3F4F6;
  border-color: #9CA3AF;
}

.selected-count {
  font-size: 13px;
  color: #6B7280;
  font-weight: 500;
}

/* 트리 컨텐츠 */
.tree-content {
  max-height: 400px;
  overflow-y: auto;
}

.tree-node {
  border-bottom: 1px solid #F3F4F6;
}

.tree-node:last-child {
  border-bottom: none;
}

.node-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  transition: background 0.2s;
}

.node-item:hover {
  background: #F9FAFB;
}

.node-item.parent {
  font-weight: 500;
}

.node-item.child {
  padding-left: 40px;
  background: #FAFBFC;
}

.checkbox-label {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.checkbox-label input {
  display: none;
}

.checkbox-custom {
  width: 18px;
  height: 18px;
  border: 2px solid #D1D5DB;
  border-radius: 4px;
  position: relative;
  transition: all 0.2s;
  flex-shrink: 0;
}

.checkbox-label input:checked + .checkbox-custom {
  background: #3B82F6;
  border-color: #3B82F6;
}

.checkbox-label input:checked + .checkbox-custom::after {
  content: '';
  position: absolute;
  width: 5px;
  height: 9px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
  left: 5px;
  top: 2px;
}

.chapter-name {
  flex: 1;
  font-size: 14px;
  color: #111827;
}

.item-count {
  font-size: 12px;
  color: #9CA3AF;
  font-weight: 400;
}

.btn-expand {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #6B7280;
  transition: all 0.2s;
}

.btn-expand:hover {
  background: #E5E7EB;
  border-radius: 4px;
}

.btn-expand svg {
  transition: transform 0.2s;
}

.btn-expand svg.rotated {
  transform: rotate(90deg);
}

.children {
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 500px;
  }
}

/* 푸터 */
.tree-footer {
  padding: 12px 16px;
  background: #F9FAFB;
  border-top: 1px solid #E5E7EB;
}

.help-text {
  font-size: 12px;
  color: #6B7280;
  margin: 0;
}

/* 스크롤바 스타일 */
.tree-content::-webkit-scrollbar {
  width: 6px;
}

.tree-content::-webkit-scrollbar-track {
  background: #F3F4F6;
}

.tree-content::-webkit-scrollbar-thumb {
  background: #D1D5DB;
  border-radius: 3px;
}

.tree-content::-webkit-scrollbar-thumb:hover {
  background: #9CA3AF;
}
</style>
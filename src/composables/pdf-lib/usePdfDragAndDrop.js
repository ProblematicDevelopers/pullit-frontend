import { ref, watch, onUnmounted, unref, nextTick } from 'vue'

export function usePdfDragAndDrop(pdfPages, currentPageIndex, selectedPages, callbacks = {}) {
  // 드래그 앤 드롭 관련 상태
  const dragIndex = ref(null)
  const dropIndex = ref(null)
  const isDragging = ref(false)
  const dragElement = ref(null)

  // 드래그 상태 보호를 위한 추가 상태
  const isProcessingDrop = ref(false)
  const lastDropTime = ref(0)
  const minDropInterval = 300 // 최소 드롭 간격 (밀리초)
  const dragStartTime = ref(0)
  const maxDragDuration = 10000 // 최대 드래그 지속 시간 (밀리초)
  let dragTimeout = null

  // 드래그 상태 보호를 위한 추가 변수
  const dragStartIndex = ref(null) // 드래그 시작 시 인덱스 백업
  const isDragValid = ref(false) // 드래그가 유효한지 확인
  const isResetting = ref(false) // 상태 초기화 중인지 확인

  // 콜백 함수들 (기본값 설정)
  const {
    onPageMoved = () => {}
  } = callbacks

  // 강제로 상태 업데이트하는 함수
  const forceUpdateDragState = (index) => {
    dragIndex.value = index
    dragStartIndex.value = index
    isDragging.value = true
    isDragValid.value = true
    dragStartTime.value = Date.now()

    // Vue 반응성 강제 업데이트
    nextTick(() => {
      if (dragIndex.value !== index) {
        console.warn('Vue 반응성 문제 감지, 강제 업데이트')
        dragIndex.value = index
        dragStartIndex.value = index
      }
    })
  }

  // 드래그 시작 처리
  const handleDragStart = (event, index) => {
    console.log('🚀 [1] 드래그 시작 호출됨:', {
      index,
      timestamp: Date.now(),
      currentState: {
        dragIndex: dragIndex.value,
        dragStartIndex: dragStartIndex.value,
        isDragging: isDragging.value,
        isDragValid: isDragValid.value,
        isProcessingDrop: isProcessingDrop.value
      }
    })

    // 이미 드래그 중이거나 드롭 처리 중이면 무시
    if (isDragging.value || isProcessingDrop.value) {
      console.log('❌ [1] 드래그 시작 무시: 이미 드래그 중이거나 처리 중')
      event.preventDefault()
      return
    }

    // 마지막 드롭으로부터 최소 시간이 지나지 않았으면 무시
    const now = Date.now()
    if (now - lastDropTime.value < minDropInterval) {
      console.log('❌ [1] 드래그 시작 무시: 너무 빠른 연속 드래그')
      event.preventDefault()
      return
    }

    // 인덱스 유효성 검사
    if (index === null || index === undefined || index < 0) {
      console.error('❌ [1] 유효하지 않은 드래그 인덱스:', index)
      event.preventDefault()
      return
    }

    // 페이지 배열과 인덱스 일치성 검사
    const pages = unref(pdfPages)
    if (!pages || !Array.isArray(pages) || index >= pages.length) {
      console.error('❌ [1] 페이지 배열과 인덱스 불일치:', {
        index,
        pagesLength: pages?.length,
        pages: pages
      })
      event.preventDefault()
      return
    }

    // 해당 인덱스의 페이지가 실제로 존재하는지 확인
    const targetPage = pages[index]
    if (!targetPage) {
      console.error('❌ [1] 대상 페이지가 존재하지 않음:', {
        index,
        pagesLength: pages.length,
        availableIndexes: pages.map((_, i) => i)
      })
      event.preventDefault()
      return
    }

    // 이전 드래그 상태가 남아있다면 강제 초기화
    if (dragIndex.value !== null || dragStartIndex.value !== null || isDragging.value || isDragValid.value) {
      console.warn('⚠️ [1] 이전 드래그 상태 감지, 강제 초기화')
      resetDragState()

      // 초기화 완료 후 잠시 대기
      setTimeout(() => {
        console.log('🔄 [1] 초기화 완료, 드래그 시작 재시도')
        forceUpdateDragState(index)
      }, 100)
      return
    }

    // 강제 상태 업데이트
    forceUpdateDragState(index)

    // 드래그 데이터 설정
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/html', index.toString())
    event.dataTransfer.setData('application/json', JSON.stringify({ index, timestamp: now }))

    // 드래그 중인 요소에 스타일 적용
    if (event.target) {
      event.target.style.opacity = '0.6'
      event.target.style.transform = 'scale(0.95) rotate(2deg)'
      event.target.style.zIndex = '1000'
    }

    // 드래그 타임아웃 설정
    dragTimeout = setTimeout(() => {
      console.log('⏰ [1] 드래그 타임아웃, 상태 초기화')
      resetDragState()
    }, maxDragDuration)

    console.log('✅ [1] 드래그 시작 완료:', {
      dragIndex: dragIndex.value,
      dragStartIndex: dragStartIndex.value,
      isDragging: isDragging.value
    })
  }

  // 드래그 종료 처리
  const handleDragEnd = (event) => {
    console.log('🔄 [2] 드래그 종료 호출됨:', {
      timestamp: Date.now(),
      currentState: {
        dragIndex: dragIndex.value,
        dragStartIndex: dragStartIndex.value,
        isDragging: isDragging.value,
        isDragValid: isDragValid.value,
        isProcessingDrop: isProcessingDrop.value
      }
    })

    // 타임아웃 정리
    if (dragTimeout) {
      clearTimeout(dragTimeout)
      dragTimeout = null
    }

    // 스타일 초기화 (강화)
    if (dragElement.value) {
      console.log('🎨 [2] 드래그 종료 시 요소 스타일 초기화')
      dragElement.value.style.opacity = '1'
      dragElement.value.style.transform = 'none'
      dragElement.value.style.zIndex = 'auto'
      dragElement.value = null
    }

    // 추가 안전장치: 모든 썸네일 요소의 스타일 강제 초기화
    try {
      const allThumbnails = document.querySelectorAll('.thumbnail-item')
      allThumbnails.forEach(thumbnail => {
        if (thumbnail.style.opacity === '0.6' ||
            thumbnail.style.transform.includes('scale(0.95)') ||
            thumbnail.style.transform.includes('rotate(2deg)') ||
            thumbnail.style.zIndex === '1000') {
          console.log('🎨 [2] 드래그 종료 시 썸네일 스타일 강제 초기화')
          thumbnail.style.opacity = '1'
          thumbnail.style.transform = 'none'
          thumbnail.style.zIndex = 'auto'
        }
      })
    } catch (error) {
      console.log('🎨 [2] 드래그 종료 시 스타일 초기화 중 오류:', error)
    }

    // 드롭이 성공적으로 처리되지 않았다면 드래그 상태 초기화
    if (!isProcessingDrop.value) {
      console.log('🔄 [2] 드롭 처리되지 않음, 드래그 상태 초기화')
      resetDragState()
    } else {
      console.log('🔄 [2] 드롭 처리 중, 추가 상태 정리 건너뜀')
      // 드롭 처리 중이면 handleDrop에서 이미 상태를 정리하므로 여기서는 아무것도 하지 않음
    }
  }

  // 드래그 오버 처리
  const handleDragOver = (event, index) => {
    event.preventDefault()

    // 드래그 중이 아니면 무시
    if (!isDragging.value || !isDragValid.value) {
      return
    }

    // dragIndex가 null이면 백업에서 복원 시도
    if (dragIndex.value === null && dragStartIndex.value !== null) {
      console.log('dragIndex 복원 시도:', dragStartIndex.value)
      dragIndex.value = dragStartIndex.value
    }

    // 여전히 dragIndex가 null이면 무시
    if (dragIndex.value === null) {
      console.warn('dragIndex가 null, 드래그 오버 무시')
      return
    }

    // 드롭 처리 중이면 무시
    if (isProcessingDrop.value) {
      return
    }

    // 같은 요소 위에 있으면 무시
    if (dragIndex.value === index) {
      return
    }

    // dropIndex 업데이트
    dropIndex.value = index
  }

  // 드래그 리브 처리
  const handleDragLeave = (event) => {
    // 현재 요소에서 완전히 벗어났을 때만 dropIndex 초기화
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX
    const y = event.clientY

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      dropIndex.value = null
    }
  }

  // 드롭 처리
  const handleDrop = (event, index) => {
    event.preventDefault()
    console.log('📥 [3] 드롭 처리 시작:', {
      dragIndex: dragIndex.value,
      dragStartIndex: dragStartIndex.value,
      dropIndex: index,
      timestamp: Date.now(),
      currentState: {
        isDragging: isDragging.value,
        isDragValid: isDragValid.value,
        isProcessingDrop: isProcessingDrop.value
      }
    })

    // dragIndex가 null이면 백업에서 복원 시도
    if (dragIndex.value === null && dragStartIndex.value !== null) {
      console.log('🔄 [3] 드롭 처리 중 dragIndex 복원:', dragStartIndex.value)
      dragIndex.value = dragStartIndex.value
    }

    // 유효성 검사
    if (dragIndex.value === null || dragIndex.value === index || !isDragging.value || !isDragValid.value) {
      console.log('❌ [3] 드롭 처리 무효:', {
        dragIndex: dragIndex.value,
        dropIndex: index,
        isDragging: isDragging.value,
        isDragValid: isDragValid.value
      })
      resetDragState()
      return
    }

    // 이미 드롭 처리 중이면 무시
    if (isProcessingDrop.value) {
      console.log('❌ [3] 드롭 처리 무시: 이미 처리 중')
      resetDragState()
      return
    }

    // 드롭 처리 시작
    isProcessingDrop.value = true
    lastDropTime.value = Date.now()
    console.log('🔄 [3] 드롭 처리 상태 설정 완료')

    const pages = unref(pdfPages)
    if (!pages || !Array.isArray(pages)) {
      console.error('❌ [3] PDF 페이지 데이터가 유효하지 않음')
      resetDragState()
      return
    }

    try {
      // 페이지 순서 변경
      const reorderedPages = reorderPages(pages, dragIndex.value, index)

      // 배열 길이 검증
      if (reorderedPages.length !== pages.length) {
        throw new Error(`배열 길이 불일치: 원본 ${pages.length}, 새 배열 ${reorderedPages.length}`)
      }

      console.log('✅ [3] 페이지 이동 완료:', {
        fromIndex: dragIndex.value,
        toIndex: index,
        originalLength: pages.length,
        newLength: reorderedPages.length
      })

      // 부모 컴포넌트에 변경 알림
      onPageMoved({
        fromIndex: dragIndex.value,
        toIndex: index,
        newPages: reorderedPages
      })

      // 인덱스 조정
      updateIndexes(dragIndex.value, index)

    } catch (error) {
      console.error('❌ [3] 페이지 이동 중 오류:', error)
    } finally {
      // 드롭 처리 완료 후 즉시 상태 정리
      console.log('🔄 [3] 드롭 처리 완료, 상태 정리 시작')

      // 드래그 상태 완전 초기화
      resetDragState()

      // 처리 상태 해제 (더 빠르게)
      setTimeout(() => {
        isProcessingDrop.value = false
        console.log('✅ [3] 드롭 처리 완료, 모든 상태 해제')

        // 추가 안전장치: 드래그 상태가 완전히 초기화되었는지 확인
        if (dragIndex.value !== null || isDragging.value || isDragValid.value) {
          console.warn('⚠️ [3] 드래그 상태가 완전히 초기화되지 않음, 강제 초기화')
          resetDragState()
        }
      }, 50) // 100ms에서 50ms로 단축
    }
  }

  // 페이지 재정렬 함수
  const reorderPages = (pages, fromIndex, toIndex) => {
    const newPages = [...pages]
    const draggedPage = newPages[fromIndex]

    // 새로운 배열 생성
    const reorderedPages = []

    // 페이지들을 올바른 순서로 재배열
    for (let i = 0; i < newPages.length; i++) {
      if (i === fromIndex) {
        // 드래그된 페이지는 건너뛰기
        continue
      }

      if (i === toIndex) {
        // 삽입 위치에 드래그된 페이지 추가 (인덱스 업데이트)
        const updatedDraggedPage = {
          ...draggedPage,
          index: toIndex,
          pageNumber: toIndex + 1
        }
        reorderedPages.push(updatedDraggedPage)
      }

      // 현재 페이지 추가 (인덱스 업데이트)
      const updatedPage = {
        ...newPages[i],
        index: reorderedPages.length,
        pageNumber: reorderedPages.length + 1
      }
      reorderedPages.push(updatedPage)
    }

    // 삽입 위치가 배열 끝인 경우 드래그된 페이지 추가
    if (toIndex === newPages.length) {
      const updatedDraggedPage = {
        ...draggedPage,
        index: toIndex,
        pageNumber: toIndex + 1
      }
      reorderedPages.push(updatedDraggedPage)
    }

    // 모든 페이지의 인덱스를 최종적으로 정리
    reorderedPages.forEach((page, finalIndex) => {
      page.index = finalIndex
      page.pageNumber = finalIndex + 1
    })

    console.log('페이지 재정렬 완료:', {
      fromIndex,
      toIndex,
      originalPages: pages.map(p => ({ index: p.index, pageNumber: p.pageNumber })),
      reorderedPages: reorderedPages.map(p => ({ index: p.index, pageNumber: p.pageNumber }))
    })

    return reorderedPages
  }

  // 인덱스 업데이트 함수
  const updateIndexes = (fromIndex, toIndex) => {
    console.log('🔄 [6] 인덱스 업데이트 시작:', { fromIndex, toIndex })

    // 현재 페이지 인덱스 조정
    if (currentPageIndex.value === fromIndex) {
      currentPageIndex.value = toIndex
      console.log('🔄 [6] 현재 페이지 인덱스 업데이트:', toIndex)
    } else if (currentPageIndex.value > fromIndex && currentPageIndex.value <= toIndex) {
      currentPageIndex.value--
      console.log('🔄 [6] 현재 페이지 인덱스 감소:', currentPageIndex.value)
    } else if (currentPageIndex.value < fromIndex && currentPageIndex.value >= toIndex) {
      currentPageIndex.value++
      console.log('🔄 [6] 현재 페이지 인덱스 증가:', currentPageIndex.value)
    }

    // 선택된 페이지들의 인덱스도 조정
    if (selectedPages && selectedPages.value) {
      const oldSelectedPages = [...selectedPages.value]
      selectedPages.value = selectedPages.value.map(selectedIndex => {
        if (selectedIndex === fromIndex) {
          return toIndex
        } else if (selectedIndex > fromIndex && selectedIndex <= toIndex) {
          return selectedIndex - 1
        } else if (selectedIndex < fromIndex && selectedIndex >= toIndex) {
          return selectedIndex + 1
        }
        return selectedIndex
      })
      console.log('🔄 [6] 선택된 페이지 인덱스 업데이트:', {
        before: oldSelectedPages,
        after: selectedPages.value
      })
    }

    console.log('🔄 [6] 인덱스 업데이트 완료')
  }

  // 드래그 상태 강제 초기화
  const resetDragState = () => {
    // 이미 초기화 중이면 무시
    if (isResetting.value) {
      console.log('⚠️ [4] 이미 초기화 중, 무시')
      return
    }

    console.log('🔄 [4] 드래그 상태 초기화 시작:', {
      beforeReset: {
        dragIndex: dragIndex.value,
        dragStartIndex: dragStartIndex.value,
        isDragging: isDragging.value,
        isDragValid: isDragValid.value,
        dropIndex: dropIndex.value,
        isProcessingDrop: isProcessingDrop.value
      }
    })

    isResetting.value = true

    // 타임아웃 정리
    if (dragTimeout) {
      clearTimeout(dragTimeout)
      dragTimeout = null
      console.log('⏰ [4] 타임아웃 정리 완료')
    }

    // 스타일 초기화 (모든 드래그 관련 요소)
    if (dragElement.value) {
      console.log('🎨 [4] 드래그 요소 스타일 초기화')
      dragElement.value.style.opacity = '1'
      dragElement.value.style.transform = 'none'
      dragElement.value.style.zIndex = 'auto'
      dragElement.value = null
    }

    // 추가 안전장치: 페이지 내 모든 썸네일 요소의 스타일 초기화
    try {
      const allThumbnails = document.querySelectorAll('.thumbnail-item')
      let styleResetCount = 0

      allThumbnails.forEach(thumbnail => {
        if (thumbnail.style.opacity === '0.6' ||
            thumbnail.style.transform.includes('scale(0.95)') ||
            thumbnail.style.transform.includes('rotate(2deg)') ||
            thumbnail.style.zIndex === '1000') {
          console.log('🎨 [4] 썸네일 스타일 강제 초기화')
          thumbnail.style.opacity = '1'
          thumbnail.style.transform = 'none'
          thumbnail.style.zIndex = 'auto'
          styleResetCount++
        }

        // CSS 클래스도 제거
        const classRemoved = []
        if (thumbnail.classList.contains('dragging')) {
          thumbnail.classList.remove('dragging')
          classRemoved.push('dragging')
        }
        if (thumbnail.classList.contains('drag-over')) {
          thumbnail.classList.remove('drag-over')
          classRemoved.push('drag-over')
        }
        if (thumbnail.classList.contains('drag-placeholder')) {
          thumbnail.classList.remove('drag-placeholder')
          classRemoved.push('drag-placeholder')
        }

        if (classRemoved.length > 0) {
          console.log('🎨 [4] CSS 클래스 제거:', classRemoved)
        }
      })

      console.log(`🎨 [4] 총 ${styleResetCount}개 썸네일 스타일 초기화 완료`)
    } catch (error) {
      console.log('🎨 [4] 스타일 초기화 중 오류:', error)
    }

    // 상태 초기화
    const oldDragIndex = dragIndex.value
    const oldDragStartIndex = dragStartIndex.value
    const oldIsDragging = isDragging.value

    dragIndex.value = null
    dropIndex.value = null
    isDragging.value = false
    isDragValid.value = false
    dragStartIndex.value = null
    dragStartTime.value = 0

    console.log('🔄 [4] 상태 변수 초기화 완료:', {
      changed: {
        dragIndex: oldDragIndex !== dragIndex.value,
        dragStartIndex: oldDragStartIndex !== dragStartIndex.value,
        isDragging: oldIsDragging !== isDragging.value
      }
    })

    // 초기화 완료
    setTimeout(() => {
      isResetting.value = false
      console.log('✅ [4] 드래그 상태 초기화 완료:', {
        afterReset: {
          dragIndex: dragIndex.value,
          dragStartIndex: dragStartIndex.value,
          isDragging: isDragging.value,
          isDragValid: isDragValid.value,
          dropIndex: dropIndex.value,
          isProcessingDrop: isProcessingDrop.value
        }
      })
    }, 50)
  }

  // 컴포넌트 언마운트 시 드래그 상태 초기화
  onUnmounted(() => {
    console.log('컴포넌트 언마운트, 드래그 상태 초기화')
    resetDragState()
    isProcessingDrop.value = false
  })

  // PDF 페이지가 변경될 때 드래그 상태 초기화
  watch(() => unref(pdfPages), (newPages, oldPages) => {
    if (newPages && oldPages) {
      // 페이지 길이가 변경되었거나, 페이지 순서가 변경되었는지 확인
      const lengthChanged = newPages.length !== oldPages.length
      const orderChanged = newPages.some((page, index) =>
        oldPages[index] && page.index !== oldPages[index].index
      )

      if (lengthChanged || orderChanged) {
        console.log('📄 [5] PDF 페이지 변경 감지:', {
          lengthChanged,
          orderChanged,
          oldLength: oldPages.length,
          newLength: newPages.length,
          oldIndexes: oldPages.map(p => p.index),
          newIndexes: newPages.map(p => p.index)
        })

        // 페이지 인덱스 재정렬 (삭제 후 인덱스 꼬임 방지)
        if (lengthChanged && newPages.length < oldPages.length) {
          console.log('📄 [5] 페이지 삭제 감지, 인덱스 재정렬 시작')
          newPages.forEach((page, newIndex) => {
            page.index = newIndex
            page.pageNumber = newIndex + 1
          })
          console.log('📄 [5] 인덱스 재정렬 완료:', newPages.map(p => ({ index: p.index, pageNumber: p.pageNumber })))
        }

        // 드래그 상태 강제 초기화 (삭제 후 새로운 드래그를 위해)
        console.log('📄 [5] 페이지 변경으로 인한 드래그 상태 강제 초기화')
        resetDragState()

        // 타임아웃도 정리
        if (dragTimeout) {
          clearTimeout(dragTimeout)
          dragTimeout = null
        }
      }
    }
  }, { deep: true })

  // 디버깅용 상태 출력
  const getDragState = () => {
    const state = {
      dragIndex: dragIndex.value,
      dragStartIndex: dragStartIndex.value,
      dropIndex: dropIndex.value,
      isDragging: isDragging.value,
      isDragValid: isDragValid.value,
      isProcessingDrop: isProcessingDrop.value,
      hasDragElement: !!dragElement.value,
      lastDropTime: lastDropTime.value,
      timeSinceLastDrop: Date.now() - lastDropTime.value,
      dragStartTime: dragStartTime.value,
      dragDuration: dragStartTime.value ? Date.now() - dragStartTime.value : 0,
      hasDragTimeout: !!dragTimeout,
      isResetting: isResetting.value
    }

    // 드래그 상태 요약
    if (isDragging.value) {
      state.status = '드래그 중'
    } else if (isProcessingDrop.value) {
      state.status = '드롭 처리 중'
    } else if (dragIndex.value !== null || dragStartIndex.value !== null) {
      state.status = '드래그 상태 불일치'
    } else {
      state.status = '드래그 완료'
    }

    return state
  }

  return {
    dragIndex,
    dropIndex,
    isDragging,
    isProcessingDrop,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    resetDragState,
    getDragState
  }
}

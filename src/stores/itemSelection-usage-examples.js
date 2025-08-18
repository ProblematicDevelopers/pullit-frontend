/**
 * Pinia Store Usage Examples - itemSelection Store
 * 
 * This file demonstrates how to use the updated itemSelection store
 * with real API integration and Elasticsearch features.
 */

import { useItemSelectionStore } from './itemSelection.js'

// Basic usage example
export function useItemSelectionExamples() {
  const store = useItemSelectionStore()

  // 1. Initialize and load subjects/textbooks
  const initializeStore = async () => {
    try {
      // Load subjects with textbooks
      await store.loadSubjects({ includeTextbooks: true })
      console.log('Available subjects:', store.subjects)
      console.log('Textbooks by subject:', store.textbooks)
    } catch (error) {
      console.error('Failed to initialize store:', error)
    }
  }

  // 2. Search items with filters
  const searchWithFilters = async () => {
    // Set filters
    store.setFilters({
      subjects: ['math', 'science'],
      grades: ['grade7', 'grade8'],
      difficulties: ['medium', 'high'],
      keyword: '방정식'
    })

    // Search items
    await store.searchItems({
      page: 1,
      size: 20
    })

    console.log('Search results:', store.items)
    console.log('Total items:', store.totalItems)
  }

  // 3. Get item details with caching
  const getItemWithDetails = async (itemId) => {
    try {
      const itemDetail = await store.getItemDetail(itemId)
      console.log('Item detail:', itemDetail)
      
      // Second call will use cache
      const cachedDetail = await store.getItemDetail(itemId)
      console.log('Cached detail:', cachedDetail)
    } catch (error) {
      console.error('Failed to get item details:', error)
    }
  }

  // 4. Search similar items using Elasticsearch
  const findSimilarItems = async (itemId) => {
    try {
      const similarItems = await store.searchSimilarItems(itemId, {
        limit: 10,
        minScore: 0.5,
        subjects: ['math'],
        grades: ['grade7']
      })
      
      console.log('Similar items:', similarItems)
      
      // Access cached similar items
      const cachedSimilar = store.getSimilarItems(itemId)
      console.log('Cached similar items:', cachedSimilar)
    } catch (error) {
      console.error('Failed to find similar items:', error)
    }
  }

  // 5. Search history management
  const manageSearchHistory = () => {
    // Search history is automatically managed when searching
    console.log('Recent searches:', store.recentSearchKeywords)
    
    // Remove specific search from history
    store.removeFromSearchHistory('old keyword')
    
    // Clear all search history
    store.clearSearchHistory()
  }

  // 6. Item selection and management
  const manageItemSelection = () => {
    // Select items
    store.items.forEach(item => {
      if (item.difficulty === 'high') {
        store.selectItem(item)
      }
    })

    // Toggle selection
    const firstItem = store.items[0]
    store.toggleItemSelection(firstItem)

    // Select all current page items
    store.selectAll()

    // Get selection statistics
    console.log('Selected by difficulty:', store.selectedByDifficulty)
    console.log('Selected by subject:', store.selectedBySubject)
    console.log('Total points:', store.totalPoints)

    // Reorder selected items
    store.reorderSelectedItems(0, 2)

    // Shuffle selected items
    store.shuffleSelectedItems()
  }

  // 7. Load statistics and analytics
  const loadStatistics = async () => {
    try {
      // Load chapter counts for current filters
      await store.loadChapterCounts()
      console.log('Chapter counts:', store.chapterCounts)

      // Load general item statistics
      await store.loadItemStats({
        dateRange: 'month',
        subjects: ['math', 'science']
      })
      console.log('Item statistics:', store.itemStats)
    } catch (error) {
      console.error('Failed to load statistics:', error)
    }
  }

  // 8. Bulk operations
  const performBulkOperations = async () => {
    const selectedIds = store.selectedItemIds

    try {
      // Export selected items
      const exportResult = await store.bulkItemOperation('export', selectedIds, {
        format: 'pdf',
        includeAnswers: true
      })
      console.log('Export result:', exportResult)

      // Update metadata for multiple items
      const updateResult = await store.bulkItemOperation('update', selectedIds, {
        metadata: { difficulty: 'high', category: 'algebra' }
      })
      console.log('Update result:', updateResult)
    } catch (error) {
      console.error('Bulk operation failed:', error)
    }
  }

  // 9. Advanced search with similar items for selected
  const advancedSimilarItemSearch = async () => {
    try {
      // Find similar items for all selected items
      const allSimilarItems = await store.loadSimilarItemsForSelected({
        limit: 5,
        minScore: 0.3
      })
      
      console.log('Similar items for all selected:', allSimilarItems)
    } catch (error) {
      console.error('Failed to load similar items for selected:', error)
    }
  }

  // 10. Reactive state monitoring
  const monitorStoreState = () => {
    // Watch loading states
    console.log('Any loading:', store.isAnyLoading)
    console.log('Search loading:', store.isLoading)
    console.log('Similar items loading:', store.isSimilarItemsLoading)

    // Watch error states
    console.log('Any error:', store.hasAnyError)
    console.log('Main error:', store.error)
    console.log('Similar items error:', store.similarItemsError)

    // Watch filter state
    console.log('Has active filters:', store.hasActiveFilters)
  }

  return {
    initializeStore,
    searchWithFilters,
    getItemWithDetails,
    findSimilarItems,
    manageSearchHistory,
    manageItemSelection,
    loadStatistics,
    performBulkOperations,
    advancedSimilarItemSearch,
    monitorStoreState
  }
}

// Vue composition API usage example
export function useItemSelectionComposition() {
  const store = useItemSelectionStore()
  
  // Computed properties for reactive UI
  const isLoading = computed(() => store.isAnyLoading)
  const hasError = computed(() => store.hasAnyError)
  const selectedCount = computed(() => store.selectedItems.length)
  const totalPages = computed(() => store.totalPages)
  
  // Methods
  const search = async (filters) => {
    store.setFilters(filters)
    await store.searchItems()
  }

  const selectItem = (item) => {
    store.selectItem(item)
  }

  const loadPage = async (page) => {
    store.setCurrentPage(page)
    await store.refreshSearch()
  }

  return {
    // State
    items: computed(() => store.items),
    selectedItems: computed(() => store.selectedItems),
    subjects: computed(() => store.subjects),
    
    // Computed
    isLoading,
    hasError,
    selectedCount,
    totalPages,
    
    // Methods
    search,
    selectItem,
    loadPage,
    
    // Store reference for direct access
    store
  }
}

// Component usage patterns
export const ComponentUsagePatterns = {
  // In a Vue component template
  template: `
    <div>
      <!-- Loading indicator -->
      <div v-if="store.isAnyLoading" class="loading-spinner">
        로딩 중...
      </div>

      <!-- Error display -->
      <div v-if="store.hasAnyError" class="error-message">
        {{ store.error || store.similarItemsError || store.subjectsError }}
      </div>

      <!-- Search results -->
      <div v-for="item in store.items" :key="item.itemId" class="item-card">
        <input 
          type="checkbox" 
          :checked="store.isItemSelected(item.itemId)"
          @change="store.toggleItemSelection(item)"
        />
        <h3>{{ item.title }}</h3>
        <p>Difficulty: {{ item.difficulty }}</p>
        
        <!-- Similar items button -->
        <button @click="loadSimilarItems(item.itemId)">
          유사 문항 찾기
        </button>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <button 
          v-for="page in store.totalPages" 
          :key="page"
          :class="{ active: page === store.currentPage }"
          @click="store.searchItems({ page })"
        >
          {{ page }}
        </button>
      </div>

      <!-- Selection summary -->
      <div class="selection-summary">
        <h4>선택된 문항: {{ store.selectedItems.length }}개</h4>
        <p>총 배점: {{ store.totalPoints }}점</p>
        <p>난이도별: 
          상({{ store.selectedByDifficulty.H || store.selectedByDifficulty.high }})
          중({{ store.selectedByDifficulty.M || store.selectedByDifficulty.medium }})
          하({{ store.selectedByDifficulty.L || store.selectedByDifficulty.low }})
        </p>
      </div>
    </div>
  `,

  // Component methods example
  methods: {
    async loadSimilarItems(itemId) {
      try {
        const similarItems = await this.store.searchSimilarItems(itemId, {
          limit: 5,
          minScore: 0.5
        })
        // Handle similar items display
        console.log('Similar items loaded:', similarItems)
      } catch (error) {
        console.error('Failed to load similar items:', error)
      }
    },

    async initializeComponent() {
      try {
        // Load initial data
        await this.store.loadSubjects()
        await this.store.searchItems({
          subjects: ['math'],
          grades: ['grade7'],
          page: 1
        })
      } catch (error) {
        console.error('Component initialization failed:', error)
      }
    },

    handleFilterChange(newFilters) {
      this.store.setFilters(newFilters)
      this.store.searchItems({ page: 1 }) // Reset to first page
    }
  }
}
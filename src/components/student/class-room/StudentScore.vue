<template>
    <div>
        <!-- 시험별 평점 -->

        <!-- 로딩 -->
        <div v-if="linesLoading" class="loading-container">
            <div class="loading-spinner"></div>
            <p>시험 데이터를 불러오는 중...</p>
        </div>
        <!-- 에러 상태 -->
        <div v-else-if="linesError" class="error-container">
            <div class="error-message">
                <p>{{ error }}</p>
                <button @click="getLines" class="retry-btn">다시 시도</button>
            </div>
        </div>

        <!-- 평점 차트 -->
        <div v-if="!linesLoading && !linesError">
            <MultiDatasetChartComponent
                v-if="lines.length > 0"
                :chartData="linesChartData"    
                :datasetLabels="linesDataLabels"
                title="시험별 평점"
                :normalize="linesNormalize"
                :maxValues="linesMaxValues"
                :chartType="linesChartType"
            />
            <div v-else>
                <p> 조회된 데이터가 없습니다. </p>
            </div>
        </div>

        
        <!-- 시험별 세부 통계표-->

        <!-- 로딩 -->
        <div v-if="linesLoading" class="loading-container">
            <div class="loading-spinner"></div>
            <p>시험 데이터를 불러오는 중...</p>
        </div>
        <!-- 에러 상태 -->
        <div v-else-if="linesError" class="error-container">
            <div class="error-message">
                <p>{{ error }}</p>
                <button @click="getDetail" class="retry-btn">다시 시도</button>
            </div>
        </div>
        
        <!-- 통계표 -->
        <div v-else>
            <table class="errata table table-bordered">
                <thead>
                    <tr>
                        <th>시험명</th>
                        <th>내 점수</th>
                        <th>평균 점수</th>
                        <th>석차</th>
                        <th>백분위</th>
                        <th>백분율</th>
                        <th>사분위</th>
                        <th>최고점</th>
                        <th>최저점</th>
                        <th>중앙값</th>
                        <th>표준편차</th>
                    </tr>
                </thead>
                <tbody>
                    <template v-if="detail.length > 0">
                        <tr v-for="exam in detail" :key="exam">
                            <td>{{ getExamName(exam.examId, exam.examName) }}</td>
                            <td>{{ exam.score }}점</td>
                            <td>{{ exam.mean }}점</td>
                            <td>{{ exam.rankPosition}}/{{ exam.totalStudents }}</td>
                            <td>{{ exam.percentile }}%</td>
                            <td>상위 {{ exam.topPercentage }}%</td>
                            <td>{{ exam.quartileDescription }}</td>
                            <td>{{ exam.max }}점</td>
                            <td>{{ exam.min }}점</td>
                            <td>{{ exam.median }}점</td>
                            <td>{{ exam.stdDeviation }}점</td>
                        </tr>
                    </template>
                    <template v-else>
                        <tr>
                            <td colspan="4">
                                조회된 데이터가 없습니다.
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>
        </div>
        <!-- box plot -->
         <BoxPlot :examData="boxData" :useNormalized="true"/>
    </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import classApi from '@/services/classApi';
import MultiDatasetChartComponent from '../report/MultiDatasetChartComponent.vue';
import BoxPlot from './BoxPlot.vue';

const classId = ref(-1);
const examFlag = ref(true);

const getExamName = (examId, examName) => {
    if(examFlag.value) return `시험${examId}`;
    return examName.replace('[CBT]중등 > 수학 > ', '') 
                   .replace(/\s+\d{4}-\d{2}-\d{2}$/, '') 
                   .replace(/\(.*?\)/, '') 
                   .trim();
}

// 시험별 평점 조회

const lines = ref([]);
const linesLoading = ref(false)
const linesError = ref(null)

const linesChartData = ref({})
const linesDataLabels = ref([])
const linesNormalize = ref(true)
const linesMaxValues = ref({})
const linesChartType = ref('bar')


async function getLines(classId) {
    linesLoading.value = true;
    linesError.value = null;

    try{
        const response = await classApi.getStatsLines(classId.value);
        const data = await response.data;
        lines.value = data.data;
        
       if (lines.value && lines.value.length > 0) {
            const chartDataObj = {};
            const maxValuesObj = {};
            
            lines.value.forEach(exam => {
                const displayName = getExamName(exam.examId, exam.examName);
                chartDataObj[displayName] = [
                    exam.avgPoints,
                    exam.userPoints
                ];
                
                maxValuesObj[displayName] = exam.totalPoints;
            });
            
            // 차트 컴포넌트에 전달할 데이터 설정
            linesChartData.value = chartDataObj;
            linesDataLabels.value = ['평균 점수', '내 점수'];
            linesMaxValues.value = maxValuesObj;
        }
    } catch(err) {
        console.log('시험별 평점 조회에 실패했습니다.:', err);
        linesError.value = '시험별 평점 조회에 실패했습니다.'
    } finally {
        linesLoading.value = false;
    }
}

// 시험별 세부 통계 조회
const detail = ref([]);
const detailLoading = ref(false)
const detailError = ref(null)

const boxData = ref([{}])

async function getDetail(classId) {
    detailLoading.value = true;
    detailError.value = null;

    try{
        const response = await classApi.getStatsDetail(classId.value);
        const data = await response.data;
        detail.value = data.data;

        console.log(detail);
        boxData.value = detail.value.map(exam => ({
            examName: getExamName(exam.examId, exam.examName),
            min: exam.min,
            q1: exam.q1,
            median: exam.median,
            q3: exam.q3,
            max: exam.max,
            mean: exam.mean,
            userScore: exam.score
            })
        );


    } catch(err) {
        console.log('시험별 평점 조회에 실패했습니다.:', err);
        detailError.value = '시험별 평점 조회에 실패했습니다.'
    } finally {
        detailLoading.value = false;
    }
}

// 화면 렌더링
const loadClassData = async () => {
    try {
        // API 호출로 실제 데이터 가져오기
        const response = await classApi.getMyClass();
        const data = response.data.data;
        classId.value = data.classId;
    } catch (error) {
        console.error('반 정보 로드 실패:', error);
    } 
}

onMounted(async () => {
    await loadClassData();    
    getLines(classId);
    getDetail(classId);    
})
</script>

<style scoped>
/* 테이블 스타일 */
.errata {
  margin-top: 20px;
  margin-bottom: 40px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  background: white;
}

.errata th {
  background: #f8f9ff;
  color: #3b6cff;
  font-weight: 600;
  padding: 16px 20px;
  border: none;
  border-bottom: 2px solid #e2e8f0;
  text-align: center;
  font-size: 13px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.errata td {
  padding: 16px 20px;
  border: none;
  border-bottom: 1px solid #f1f5f9;
  text-align: center;
  font-size: 14px;
  color: #475569;
  transition: background-color 0.2s ease;
}

.errata tr:hover {
  background: #f8fafc;
}

.errata tr:last-child td {
  border-bottom: none;
}

/* 로딩 상태 스타일 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 20px;
  margin: 20px 0;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid #e2e8f0;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

/* 에러 상태 스타일 */
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 80px 20px;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border-radius: 20px;
  margin: 20px 0;
  border: 2px solid #fecaca;
}

.error-message {
  text-align: center;
  color: #dc2626;
}

.error-message p {
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: 600;
}

.retry-btn {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.3px;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(239, 68, 68, 0.4);
}
</style>
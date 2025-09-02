<template>
    <div class="student-score-dashboard bg-light min-vh-100">
        <!-- Page Header -->
        <div class="page-header bg-white border-bottom py-4 mb-4">
            <div class="container">
                <h1 class="h2 fw-bold text-dark mb-1">성적 확인</h1>
                <p class="text-muted mb-0">
                    내 시험 성적과 통계를 확인해보세요
                </p>
            </div>
        </div>

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

        <!-- 메인 콘텐츠 -->
        <div v-if="!linesLoading && !linesError" class="container">
            <!-- 차트 그리드 섹션 -->
            <section class="charts-grid-section mb-5">
                <div class="row g-4">
                    <!-- 시험별 평점 차트 -->
                    <div class="col-lg-6">
                        <div class="card border-0 shadow-sm h-80">
                            <div class="card-header bg-white border-bottom py-3">
                                <h2 class="h4 fw-bold text-dark mb-0">📊 시험별 평점</h2>
                            </div>
                            <div class="card-body p-3">
                                <div v-if="lines.length > 0" class="chart-container-small">
                                    <MultiDatasetChartComponent
                                        :chartData="linesChartData"
                                        :datasetLabels="linesDataLabels"
                                        title="시험별 평점"
                                        :normalize="linesNormalize"
                                        :maxValues="linesMaxValues"
                                        :chartType="linesChartType"
                                    />
                                </div>
                                <div v-else class="text-center py-3">
                                    <div class="text-muted">
                                        <span class="fs-1">📋</span>
                                        <p class="mt-2">조회된 데이터가 없습니다.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 박스플롯 -->
                    <div class="col-lg-6">
                        <div class="card border-0 shadow-sm h-80">
                            <div class="card-header bg-white border-bottom py-3">
                                <h2 class="h4 fw-bold text-dark mb-0">📊 성적 분포</h2>
                            </div>
                            <div class="card-body p-3">
                                <div class="chart-container-small">
                                    <BoxPlot :examData="boxData" :useNormalized="true"/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- 시험별 세부 통계표 섹션 -->
            <section class="stats-section mb-5">
                <div class="card border-0 shadow-sm">
                    <div class="card-header bg-white border-bottom py-3">
                        <h2 class="h4 fw-bold text-dark mb-0">📈 시험별 세부 통계</h2>
                    </div>
                    <div class="card-body p-0">
                        <div class="table-responsive">
                            <table class="table table-hover mb-0">
                                <thead class="table-light">
                                    <tr>
                                        <th class="text-center">시험명</th>
                                        <th class="text-center">내 점수</th>
                                        <th class="text-center">평균 점수</th>
                                        <th class="text-center">석차</th>
                                        <th class="text-center">백분위</th>
                                        <th class="text-center">백분율</th>
                                        <th class="text-center">사분위</th>
                                        <th class="text-center">최고점</th>
                                        <th class="text-center">최저점</th>
                                        <th class="text-center">중앙값</th>
                                        <th class="text-center">표준편차</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <template v-if="detail.length > 0">
                                        <tr v-for="exam in detail" :key="exam" class="align-middle">
                                            <td class="fw-semibold">{{ getExamName(exam.examId, exam.examName) }}</td>
                                            <td class="text-center fw-bold text-primary">{{ exam.score }}점</td>
                                            <td class="text-center">{{ exam.mean }}점</td>
                                            <td class="text-center">{{ exam.rankPosition}}/{{ exam.totalStudents }}</td>
                                            <td class="text-center">{{ exam.percentile }}%</td>
                                            <td class="text-center">상위 {{ exam.topPercentage }}%</td>
                                            <td class="text-center">{{ exam.quartileDescription }}</td>
                                            <td class="text-center text-success">{{ exam.max }}점</td>
                                            <td class="text-center text-danger">{{ exam.min }}점</td>
                                            <td class="text-center">{{ exam.median }}점</td>
                                            <td class="text-center">{{ exam.stdDeviation }}점</td>
                                        </tr>
                                    </template>
                                    <template v-else>
                                        <tr>
                                            <td colspan="11" class="text-center py-5">
                                                <div class="text-muted">
                                                    <span class="fs-1">📋</span>
                                                    <p class="mt-3">조회된 데이터가 없습니다.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    </template>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>
        </div>
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
/* 페이지 헤더 스타일 */
.page-header {
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 카드 스타일 */
.card {
    transition: all 0.3s ease;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    overflow: hidden;
}

.card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
    border-color: #3b82f6;
}

.card-header {
    background: #3b6cff !important;
    border-bottom: 2px solid #3b6cff !important;
    padding: 1.25rem 1.5rem;
    color: #ffffff !important;
}

.card .card-header {
    background: #3b6cff !important;
}

.card-header h2,
.card-header .h4 {
    color: #ffffff !important;
    font-weight: 700;
    font-size: 1.125rem;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.card-body {
    background: #ffffff;
    padding: 1.5rem;
}

/* 테이블 스타일 */
.table {
    margin-bottom: 0;
}

.table th {
    background: #f8f9ff;
    color: #3b6cff;
    font-weight: 600;
    padding: 16px 12px;
    border: none;
    border-bottom: 2px solid #e2e8f0;
    text-align: center;
    font-size: 13px;
    letter-spacing: 0.3px;
    text-transform: uppercase;
}

.table td {
    padding: 16px 12px;
    border: none;
    border-bottom: 1px solid #f1f5f9;
    text-align: center;
    font-size: 14px;
    color: #475569;
    transition: background-color 0.2s ease;
    vertical-align: middle;
}

.table tbody tr:hover {
    background: #f8fafc;
}

.table tbody tr:last-child td {
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
    margin: 20px;
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

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* 에러 상태 스타일 */
.error-container {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 80px 20px;
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    border-radius: 20px;
    margin: 20px;
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

/* 섹션 간격 */
.charts-grid-section,
.stats-section {
    margin-bottom: 3rem;
    margin-top: 2rem;
}

/* 그리드 간격 */
.row.g-4 {
    --bs-gutter-x: 2rem;
    --bs-gutter-y: 2rem;
}

/* 카드 마진 */
.card {
    margin: 1rem 0;
}

/* 차트 컨테이너 높이 조정 */
.chart-container-small {
    height: 400px;
    overflow: hidden;
    background: #ffffff !important;
    border-radius: 12px;
    padding: 1rem;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
}

/* 차트 내부 배경색 통일 */
.chart-container-small canvas {
    background: #ffffff !important;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
    .table-responsive {
        font-size: 12px;
    }

    .table th,
    .table td {
        padding: 8px 6px;
    }

    .card-body {
        padding: 1rem;
    }
}
</style>

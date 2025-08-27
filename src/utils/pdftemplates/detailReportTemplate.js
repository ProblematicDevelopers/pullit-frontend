/**
 * 상세리포트 PDF 템플릿
 * PDFMe를 사용한 상세리포트 PDF 생성 템플릿
 */

/**
 * 상세리포트 PDF 템플릿 생성
 * @param {Object} reportData - 리포트 데이터
 * @returns {Object} PDFMe 템플릿 객체
 */
export const createDetailReportTemplate = () => {
  return {
    basePdf: {
      width: 595.28,
      height: 841.89,
      padding: 40,
    },
    schemas: [
      // 헤더 섹션
      {
        title: {
          type: 'text',
          position: { x: 40, y: 40 },
          width: 515,
          height: 30,
          fontSize: 24,
          fontWeight: 'bold',
          textAlign: 'center',
          value: '상세 리포트',
        },
      },
      {
        examInfo: {
          type: 'text',
          position: { x: 40, y: 80 },
          width: 515,
          height: 20,
          fontSize: 14,
          textAlign: 'center',
          value: '{{examTitle}} - {{studentName}}',
        },
      },
      {
        date: {
          type: 'text',
          position: { x: 40, y: 110 },
          width: 515,
          height: 15,
          fontSize: 12,
          textAlign: 'center',
          value: '생성일: {{currentDate}}',
        },
      },

      // 기본 정보 섹션
      {
        basicInfoTitle: {
          type: 'text',
          position: { x: 40, y: 150 },
          width: 515,
          height: 20,
          fontSize: 16,
          fontWeight: 'bold',
          value: '📊 기본 정보',
        },
      },
      {
        scoreInfo: {
          type: 'text',
          position: { x: 40, y: 180 },
          width: 515,
          height: 15,
          fontSize: 12,
          value: '총점: {{totalScore}}점 / {{totalPoints}}점 (정답률: {{accuracy}}%)',
        },
      },
      {
        durationInfo: {
          type: 'text',
          position: { x: 40, y: 200 },
          width: 515,
          height: 15,
          fontSize: 12,
          value: '소요시간: {{totalDuration}}분',
        },
      },

      // 정오표 섹션
      {
        errataTitle: {
          type: 'text',
          position: { x: 40, y: 240 },
          width: 515,
          height: 20,
          fontSize: 16,
          fontWeight: 'bold',
          value: '📝 정오표',
        },
      },
      {
        errataData: {
          type: 'text',
          position: { x: 40, y: 270 },
          width: 515,
          height: 200,
          fontSize: 10,
          value: '{{errataDataText}}',
        },
      },

      // 난이도별 통계 섹션
      {
        difficultyTitle: {
          type: 'text',
          position: { x: 40, y: 490 },
          width: 515,
          height: 20,
          fontSize: 16,
          fontWeight: 'bold',
          value: '📈 난이도별 통계',
        },
      },
      {
        difficultyData: {
          type: 'text',
          position: { x: 40, y: 520 },
          width: 515,
          height: 120,
          fontSize: 10,
          value: '{{difficultyDataText}}',
        },
      },

      // 평가영역별 통계 섹션
      {
        evaluationTitle: {
          type: 'text',
          position: { x: 40, y: 660 },
          width: 515,
          height: 20,
          fontSize: 16,
          fontWeight: 'bold',
          value: '📊 평가영역별 통계',
        },
      },
      {
        evaluationData: {
          type: 'text',
          position: { x: 40, y: 690 },
          width: 515,
          height: 120,
          fontSize: 10,
          value: '{{evaluationDataText}}',
        },
      },
    ],
  }
}

/**
 * 상세리포트 입력 데이터 생성
 * @param {Object} reportData - 리포트 데이터
 * @returns {Array} PDFMe 입력 데이터 배열
 */
export const generateDetailReportInputData = (reportData) => {
  const now = new Date()
  const currentDate = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`

  // 정오표 데이터를 텍스트로 변환
  const errataDataText =
    reportData.errataData
      ?.map(
        (item) =>
          `${item.itemOrder || '-'}. ${item.domainName || '-'} | 배점: ${item.points || '-'}점 | 정답: ${item.answer || '-'} | 제출답: ${item.userAnswer || '-'} | 획득점수: ${item.userPoints || '-'}점 | ${item.isCorrect ? '정답' : '오답'} | 평균정답률: ${Math.round((item.accuracy || 0) * 10000) / 100}%`,
      )
      .join('\n') || '정오표 데이터가 없습니다.'

  // 난이도별 통계 데이터를 텍스트로 변환
  const difficultyDataText =
    reportData.difficultyData
      ?.map(
        (item) =>
          `${getDifficultyName(item.difficultyCode)} | 총문항수: ${item.itemCount || '-'}개 | 정답문항수: ${item.userCount || '-'}개 | 정답문항수평균: ${Math.round((item.avgCount || 0) * 10) / 10}개 | 총배점: ${item.totalPoints || '-'}점 | 획득점수: ${Math.round((item.userPoints || 0) * 100) / 100}점 | 획득점수평균: ${Math.round((item.avgPoints || 0) * 100) / 100}점 | 소요시간: ${Math.round((item.userDuration || 0) * 100) / 100}초 | 소요시간평균: ${Math.round((item.avgDuration || 0) * 100) / 100}초`,
      )
      .join('\n') || '난이도별 통계 데이터가 없습니다.'

  // 평가영역별 통계 데이터를 텍스트로 변환
  const evaluationDataText =
    reportData.evaluationData
      ?.map(
        (item) =>
          `${item.domainName || '-'} | 총문항수: ${item.totalCount || '-'}개 | 정답문항수: ${item.userCount || '-'}개 | 정답문항수평균: ${Math.round((item.avgCount || 0) * 10) / 10}개 | 총배점: ${item.totalPoints || '-'}점 | 획득점수: ${Math.round((item.userPoints || 0) * 100) / 100}점 | 획득점수평균: ${Math.round((item.avgPoints || 0) * 100) / 100}점 | 소요시간: ${Math.round((item.userDuration || 0) * 100) / 100}초 | 소요시간평균: ${Math.round((item.avgDuration || 0) * 100) / 100}초`,
      )
      .join('\n') || '평가영역별 통계 데이터가 없습니다.'

  // 총점 및 정답률 계산
  const totalScore =
    reportData.errataData?.reduce((sum, item) => sum + (item.userPoints || 0), 0) || 0
  const totalPoints = reportData.errataData?.reduce((sum, item) => sum + (item.points || 0), 0) || 0
  const accuracy = totalPoints > 0 ? Math.round((totalScore / totalPoints) * 10000) / 100 : 0

  // 총 소요시간 계산 (초를 분으로 변환)
  const totalDurationSeconds =
    reportData.errataData?.reduce((sum, item) => sum + (item.duration || 0), 0) || 0
  const totalDuration = Math.round((totalDurationSeconds / 60) * 10) / 10

  return [
    {
      examTitle: reportData.examTitle || '시험',
      studentName: reportData.studentName || '학생',
      currentDate: currentDate,
      totalScore: totalScore,
      totalPoints: totalPoints,
      accuracy: accuracy,
      totalDuration: totalDuration,
      errataDataText: errataDataText,
      difficultyDataText: difficultyDataText,
      evaluationDataText: evaluationDataText,
    },
  ]
}

/**
 * 난이도 코드를 한글 이름으로 변환
 * @param {string} code - 난이도 코드
 * @returns {string} 난이도 한글 이름
 */
const getDifficultyName = (code) => {
  const difficultyMap = {
    1: '최하',
    2: '하',
    3: '중',
    4: '상',
    5: '최상',
  }
  return difficultyMap[code] || '미상'
}

export default {
  createDetailReportTemplate,
  generateDetailReportInputData,
}

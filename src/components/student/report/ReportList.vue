<template>
  <div>
    <div v-for="(item, index) in items" :key="index" class="list-item">
      <div class="left">
        <div class="num">{{ index + 1 }}</div>
        <div class="info">
          <span class="tag">{{ item.subject }}</span>
          <span class="title">{{ item.title }}</span>
          <span class="sub">{{ item.grade }}  사용 {{ item.usage }}회</span>
        </div>
      </div>
      <div class="right"><a href="#">자세히 보기</a></div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ReportList",
  components:"BasicReport",
  data() {
    return {
      items: [
        { subject: "수학", title: "2024 수학 1단원", grade: "중1", usage: 567 },
        { subject: "영어", title: "영어 문법 기초", grade: "중1", usage: 432 },
        { subject: "국어", title: "국어 문학 작품 분석", grade: "중2", usage: 389 },
        { subject: "과학", title: "2024 과학 2단원", grade: "중3", usage: 234 },
        { subject: "사회", title: "역사 연표 CBT", grade: "중2", usage: 198 }
      ]
    };
  }
};
</script>

<style scoped>
.list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 14px;
  margin-bottom: 10px;
}
.left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.num {
  font-size: 18px;
  font-weight: bold;
  color: #555;
  width: 24px;
  text-align: center;
}
.info {
  display: flex;
  flex-direction: column;
}
.tag {
  display: inline-block;
  font-size: 12px;
  background: #f0f4ff;
  color: #3b6cff;
  padding: 2px 6px;
  border-radius: 4px;
  margin-bottom: 4px;
}
.title {
  font-size: 15px;
  font-weight: bold;
  margin-bottom: 2px;
}
.sub {
  font-size: 12px;
  color: #777;
}
.right a {
  color: #3b6cff;
  text-decoration: none;
  font-weight: bold;
  font-size: 14px;
}
.right a:hover {
  text-decoration: underline;
}
</style>

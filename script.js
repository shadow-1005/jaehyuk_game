// 버튼 요소 가져오기
const startBtn = document.getElementById("startBtn");
const creditBtn = document.getElementById("creditBtn");
const creditModal = document.getElementById("creditModal");
const closeModalBtn = document.getElementById("closeModalBtn");

// 게임시작 버튼 클릭 시
startBtn.addEventListener("click", () => {
  // 여기는 나중에 실제 게임 화면으로 넘어가도록 수정 가능
  alert("게임을 시작합니다!");
  
  // 예시:
  // window.location.href = "game.html";
});

// 제작진 버튼 클릭 시 팝업 열기
creditBtn.addEventListener("click", () => {
  creditModal.classList.remove("hidden");
});

// 닫기 버튼 클릭 시 팝업 닫기
closeModalBtn.addEventListener("click", () => {
  creditModal.classList.add("hidden");
});

// 팝업 바깥 부분 클릭 시 닫기
creditModal.addEventListener("click", (event) => {
  if (event.target === creditModal) {
    creditModal.classList.add("hidden");
  }
});
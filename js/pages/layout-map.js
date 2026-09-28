$(document).ready(function () {
  // 페이지 로드 완료
});

// enabled 상태 확인
function checkLayoutMapEnabled() {
  if (!window.previewHandler) return;

  if (window.previewHandler.currentData) {
    const layoutEnabled = window.previewHandler.currentData?.homepage?.customFields?.pages?.layoutMap?.sections?.[0]?.enabled;
    if (layoutEnabled === false) {
      window.location.href = '404.html';
      return;
    }
  }
}
window._checkPageEnabled = checkLayoutMapEnabled;

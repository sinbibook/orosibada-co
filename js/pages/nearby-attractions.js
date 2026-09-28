$(document).ready(function () {
  // 페이지 로드 완료
});

// enabled 상태 확인
function checkNearbyAttractionsEnabled() {
  if (!window.previewHandler) return;

  if (window.previewHandler.currentData) {
    const nearbyEnabled = window.previewHandler.currentData?.homepage?.customFields?.pages?.nearbyAttractions?.sections?.[0]?.enabled;
    if (nearbyEnabled === false) {
      window.location.href = '404.html';
      return;
    }
  }
}
window._checkPageEnabled = checkNearbyAttractionsEnabled;

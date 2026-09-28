// Image Helpers - 이미지 없을 때 placeholder 처리
var ImageHelpers = {
  // Empty image SVG placeholder (Base64)
  EMPTY_IMAGE_SVG: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSItMC4zZW0iIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==',

  // 이미지 요소에 placeholder 적용
  applyPlaceholder: function(imgElement) {
    if (!imgElement) return;
    imgElement.src = ImageHelpers.EMPTY_IMAGE_SVG;
    imgElement.alt = 'No Image';
    imgElement.classList.add('empty-image-placeholder');
  },

  // 배경 이미지에 placeholder 적용
  applyBackgroundPlaceholder: function(element) {
    if (!element) return;
    element.style.backgroundImage = 'url(' + ImageHelpers.EMPTY_IMAGE_SVG + ')';
    element.style.backgroundColor = '#f0f0f0';
    element.classList.add('empty-image-placeholder');
  }
};

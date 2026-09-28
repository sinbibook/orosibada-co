// Directions Page Mapper - 오시는길 페이지 동적 매핑
var DirectionsMapper = {
  map: function(data) {
    if (!data || !data.property) return;

    // Con0: Hero 이미지 매핑
    this.mapHeroImage(data);

    // Con14: 주소 및 안내 정보 매핑
    this.mapAddressAndNotice(data);

    // Con14: 카카오 맵 초기화
    this.initKakaoMap(data);
  },

  // CON0: Hero 이미지 매핑
  mapHeroImage: function(data) {
    var sections = data.homepage &&
                   data.homepage.customFields &&
                   data.homepage.customFields.pages &&
                   data.homepage.customFields.pages.directions &&
                   data.homepage.customFields.pages.directions.sections;

    if (!sections || !sections[0] || !sections[0].hero) return;

    var hero = sections[0].hero;
    var imgEl = document.querySelector('.con0 .img');

    if (imgEl && hero.images && hero.images.length > 0) {
      var selectedImg = hero.images.find(function(img) { return img.isSelected; }) || hero.images[0];
      if (selectedImg && selectedImg.url) {
        imgEl.style.backgroundImage = 'url(' + selectedImg.url + ')';
        imgEl.style.backgroundRepeat = 'no-repeat';
        imgEl.style.backgroundPosition = 'center';
        imgEl.style.backgroundSize = 'cover';
      } else {
        ImageHelpers.applyBackgroundPlaceholder(imgEl);
      }
    } else {
      ImageHelpers.applyBackgroundPlaceholder(imgEl);
    }
  },

  // CON14: 주소 및 안내 정보 매핑
  mapAddressAndNotice: function(data) {
    // 주소 매핑 (property.address 우선, 없으면 property.businessInfo.businessAddress)
    var addressEl = document.querySelector('[data-directions-address]');
    if (addressEl) {
      var address = null;

      if (data.property && data.property.address) {
        address = data.property.address;
      } else if (data.property.businessInfo && data.property.businessInfo.businessAddress) {
        address = data.property.businessInfo.businessAddress;
      }

      if (address) {
        addressEl.textContent = address;
      }
    }

    // 안내 제목, 설명 매핑 (directions.notice)
    var sections = data.homepage &&
                   data.homepage.customFields &&
                   data.homepage.customFields.pages &&
                   data.homepage.customFields.pages.directions &&
                   data.homepage.customFields.pages.directions.sections;

    var noticeSection = document.querySelector('[data-directions-notice-section]');

    if (sections && sections[0] && sections[0].notice) {
      var notice = sections[0].notice;

      // notice.description이 없으면 섹션 숨기기
      if (!notice.description) {
        if (noticeSection) {
          noticeSection.style.display = 'none';
        }
        return;
      }

      // 안내 섹션 표시
      if (noticeSection) {
        noticeSection.style.display = 'block';
      }

      // 안내 제목
      var noticeTitleEl = document.querySelector('[data-directions-notice-title]');
      if (noticeTitleEl && notice.title) {
        noticeTitleEl.textContent = notice.title;
      }

      // 안내 정보
      var noticeEl = document.querySelector('[data-directions-notice-description]');
      if (noticeEl && notice.description) {
        noticeEl.innerHTML = notice.description.replace(/\n/g, '<br>');
      }
    } else if (noticeSection) {
      // notice 섹션이 없으면 섹션 숨기기
      noticeSection.style.display = 'none';
    }
  },

  // CON14: 카카오 맵 초기화 (SDK 로드 확인 + 재시도 로직)
  initKakaoMap: function(data) {
    var container = document.getElementById('kakao-map');
    if (!container) return;

    var latitude = data.property.latitude || 0;
    var longitude = data.property.longitude || 0;
    if (!latitude || !longitude) return;

    // 지도 생성 함수
    var createMap = function() {
      try {
        var options = {
          center: new kakao.maps.LatLng(latitude, longitude),
          level: 4,
          scrollwheel: false,
          draggable: false
        };

        var map = new kakao.maps.Map(container, options);

        // 마커 추가
        var markerPosition = new kakao.maps.LatLng(latitude, longitude);
        var marker = new kakao.maps.Marker({
          position: markerPosition
        });
        marker.setMap(map);

        // 정보 윈도우 표시 (주소)
        if (data.property.address) {
          var infowindow = new kakao.maps.InfoWindow({
            content: '<div style="padding:5px;font-size:12px;">' + data.property.address + '</div>'
          });
          infowindow.open(map, marker);
        }
      } catch (error) {
        console.error('Failed to create Kakao Map:', error);
      }
    };

    // SDK 로드 확인 및 재시도
    var checkSdkAndLoad = function(retryCount) {
      retryCount = retryCount || 0;
      var MAX_RETRIES = 20; // 20 * 100ms = 2초

      if (window.kakao && window.kakao.maps && window.kakao.maps.load) {
        window.kakao.maps.load(createMap);
      } else if (retryCount < MAX_RETRIES) {
        setTimeout(function() {
          checkSdkAndLoad(retryCount + 1);
        }, 100);
      } else {
        console.error('Failed to load Kakao Map SDK after multiple retries.');
      }
    };

    checkSdkAndLoad();
  }

};
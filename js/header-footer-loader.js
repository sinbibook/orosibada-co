// Header Footer Loader - 헤더/푸터 동적 로드 + 메뉴 토글
var HeaderFooterLoader = {
  init: function() {
    this.loadHeader();
    this.loadFooter();
    this.loadAndMapData();

    // 화면 크기 변경 시 snb 스크롤 인디케이터 재계산
    var self = this;
    window.addEventListener('resize', function() {
      self.checkSnbScroll();
    });
  },

  // snb_wrap 가로 스크롤 가능 여부에 따라 < scroll > 인디케이터 토글
  checkSnbScroll: function() {
    var snbWrap = document.querySelector('#snb_wrap');
    if (!snbWrap) return;

    var ul = snbWrap.querySelector('ul');
    if (!ul) return;

    // 실제 콘텐츠 너비가 보이는 영역보다 크면 스크롤 가능
    if (ul.scrollWidth > ul.clientWidth + 1) {
      snbWrap.classList.add('has-scroll');
    } else {
      snbWrap.classList.remove('has-scroll');
    }
  },

  loadHeader: function() {
    var self = this;
    fetch('common/header.html')
      .then(function(response) { return response.text(); })
      .then(function(html) {
        var wrapper = document.querySelector('.wrapper');
        if (wrapper) {
          wrapper.insertAdjacentHTML('afterbegin', html);
          // 헤더가 DOM에 추가된 후 이벤트 바인딩
          self.setupMenuToggle();
        }
      })
      .catch(function(error) { console.error('Header load error:', error); });
  },

  loadFooter: function() {
    fetch('common/footer.html')
      .then(function(response) { return response.text(); })
      .then(function(html) {
        var wrapper = document.querySelector('.wrapper');
        if (wrapper) {
          wrapper.insertAdjacentHTML('beforeend', html);
        }
      })
      .catch(function(error) { console.error('Footer load error:', error); });
  },

  loadAndMapData: function() {
    // 프리뷰(iframe)에선 preview-handler 가 admin(백오피스) 데이터로 매핑한다.
    // 여기서 standard-template-data.json 으로 다시 매핑하면 admin 입력값(예: 이미지설명)을
    // 덮어써서 fallback 으로 되돌아가므로, 프리뷰에선 standard 데이터 로드/매핑을 생략한다.
    if (window.parent !== window) return;

    var self = this;
    fetch('standard-template-data.json')
      .then(function(response) { return response.json(); })
      .then(function(data) {
        // Header/Footer 매핑
        if (typeof HeaderFooterMapper !== 'undefined') {
          HeaderFooterMapper.mapHeader(data);
          HeaderFooterMapper.mapFooter(data);
          HeaderFooterMapper.mapConsult(data);
        }

        // enabled 필드 체크 (nearby-attractions, layout-map)
        self.checkPageEnabled(data);

        // 페이지별 Mapper 호출
        self.mapPageContent(data);

        // Mapper 실행 후 Swiper 재초기화 (con3, con4)
        setTimeout(function() {
          self.reinitializeSwiper();
        }, 100);
      })
      .catch(function(error) { console.error('Data load error:', error); });
  },

  checkPageEnabled: function(data) {
    if (window.parent !== window &&
        window.previewHandler &&
        typeof window.previewHandler.isCurrentPageDisabled === 'function') {
      if (window.previewHandler.isCurrentPageDisabled(data)) {
        window.previewHandler.showPreviewNotFound();
      } else if (typeof window.previewHandler.hidePreviewNotFound === 'function') {
        window.previewHandler.hidePreviewNotFound();
      }
      return;
    }

    var pathname = window.location.pathname;
    var filename = pathname.split('/').pop().replace('.html', '');

    // nearby-attractions 페이지 체크
    if (filename === 'nearby-attractions') {
      var nearbyEnabled = (data.homepage &&
                           data.homepage.customFields &&
                           data.homepage.customFields.pages &&
                           data.homepage.customFields.pages.nearbyAttractions &&
                           data.homepage.customFields.pages.nearbyAttractions.sections &&
                           data.homepage.customFields.pages.nearbyAttractions.sections[0] &&
                           data.homepage.customFields.pages.nearbyAttractions.sections[0].enabled) !== false;
      if (!nearbyEnabled) {
        window.location.href = '404.html';
        return;
      }
    }

    // layout-map 페이지 체크
    if (filename === 'layout-map') {
      var layoutEnabled = (data.homepage &&
                           data.homepage.customFields &&
                           data.homepage.customFields.pages &&
                           data.homepage.customFields.pages.layoutMap &&
                           data.homepage.customFields.pages.layoutMap.sections &&
                           data.homepage.customFields.pages.layoutMap.sections[0] &&
                           data.homepage.customFields.pages.layoutMap.sections[0].enabled) !== false;
      if (!layoutEnabled) {
        window.location.href = '404.html';
        return;
      }
    }
  },

  mapPageContent: function(data) {
    // SEO: 페이지 종류와 무관하게 전역 seo 메타태그를 먼저 주입 (공통 base-mapper)
    if (typeof BaseMapper !== 'undefined') BaseMapper.updateMetaTags(data);

    // 현재 페이지 이름 추출
    var pathname = window.location.pathname;
    var filename = pathname.split('/').pop().replace('.html', '');
    if (!filename || filename === '') {
      filename = 'index';
    }

    // 페이지별 Mapper 실행
    if (filename === 'index' && typeof IndexMapper !== 'undefined') {
      IndexMapper.map(data);
    } else if (filename === 'main' && typeof MainMapper !== 'undefined') {
      MainMapper.map(data);
    } else if (filename === 'directions' && typeof DirectionsMapper !== 'undefined') {
      DirectionsMapper.map(data);
    } else if (filename === 'room' && typeof RoomMapper !== 'undefined') {
      RoomMapper.map(data);
    } else if (filename === 'facility' && typeof FacilityMapper !== 'undefined') {
      FacilityMapper.map(data);
    } else if (filename === 'layout-map' && typeof LayoutMapMapper !== 'undefined') {
      LayoutMapMapper.map(data);
    } else if (filename === 'reservation' && typeof ReservationMapper !== 'undefined') {
      ReservationMapper.map(data);
    } else if (filename === 'nearby-attractions' && typeof NearbyAttractionsMapper !== 'undefined') {
      NearbyAttractionsMapper.map(data);
    }
  },

  reinitializeSwiper: function() {
    // con0 Swiper 재초기화 (동적 슬라이드 생성 후)
    var con0Container = document.querySelector('.con0');
    if (con0Container) {
      var con0SwiperEl = con0Container.querySelector('.swiper-container');
      if (con0SwiperEl && con0SwiperEl.swiper) {
        con0SwiperEl.swiper.destroy(true, true);
      }

      new Swiper(con0Container.querySelector(".swiper-container"), {
        slidesPerView: 1,
        loop: con0Container.querySelectorAll('.swiper-slide').length > 1, // 슬라이드 부족 시 loop 비활성 (Swiper 경고 방지)
        effect: "fade",
        autoplay: {
          delay: 2500,
          disableOnInteraction: false,
        },
        navigation: {
          nextEl: con0Container.querySelector(".swiper-button-next"),
          prevEl: con0Container.querySelector(".swiper-button-prev"),
        },
      });
    }

    // con3, con4 Swiper 재초기화
    var con3Container = document.querySelector('.con3');
    var con4Container = document.querySelector('.con4');

    // con3 Swiper 파괴 후 재초기화
    if (con3Container) {
      var con3SwiperEl = con3Container.querySelector('.swiper-container');
      if (con3SwiperEl && con3SwiperEl.swiper) {
        con3SwiperEl.swiper.destroy(true, true);
      }

      new Swiper(con3Container.querySelector(".swiper-container"), {
        slidesPerView: 1,
        loop: con3Container.querySelectorAll('.swiper-slide').length > 1, // 슬라이드 부족 시 loop 비활성 (Swiper 경고 방지)
        effect: "fade",
        autoplay: {
          delay: 4000,
          disableOnInteraction: false,
        },
        navigation: {
          nextEl: con3Container.querySelector(".swiper-button-next"),
          prevEl: con3Container.querySelector(".swiper-button-prev"),
        },
      });
    }

    // con4 Swiper 파괴 후 재초기화
    if (con4Container) {
      var con4SwiperEl = con4Container.querySelector('.swiper-container');
      if (con4SwiperEl && con4SwiperEl.swiper) {
        con4SwiperEl.swiper.destroy(true, true);
      }

      var slideCount = con4Container.querySelectorAll('.swiper-slide').length;

      new Swiper(con4Container.querySelector(".swiper-container"), {
        slidesPerView: "auto",
        // 2장 이하는 모두 보이므로 정적(off). 3장은 index-mapper에서 6장으로 복제되어
        // slideCount>2가 되고, 4장 이상도 마찬가지로 loop/autoplay 활성화.
        loop: slideCount > 2,
        autoplay: slideCount > 2 ? {
          delay: 5000,
          disableOnInteraction: false,
        } : false,
        navigation: {
          nextEl: con4Container.querySelector(".swiper-button-next"),
          prevEl: con4Container.querySelector(".swiper-button-prev"),
        },
      });
    }

    // snb 네비게이션 렌더 후 스크롤 인디케이터 갱신
    this.checkSnbScroll();
  },

  setupMenuToggle: function() {
    var header = document.querySelector('.header');
    var menu = document.querySelector('.menu');
    var btnMenu = document.querySelector('.btnMenu');
    var menuClose = document.querySelector('.menuClose');

    if (!menu || !btnMenu) return;

    // 메뉴 버튼 클릭 - 메뉴 열기
    btnMenu.addEventListener('click', function(e) {
      e.preventDefault();
      menu.classList.add('active');
    });

    // 메뉴 닫기 버튼
    if (menuClose) {
      menuClose.addEventListener('click', function(e) {
        e.preventDefault();
        menu.classList.remove('active');
      });
    }

    // 대메뉴(depth_1) 클릭 - 소메뉴(depth_2) 토글
    var menuInner = document.querySelector('.menuInner');
    if (menuInner) {
      menuInner.addEventListener('click', function(e) {
        var link = e.target.closest('.depth_1 > a');
        if (link) {
          e.preventDefault();
          var depth1 = link.closest('.depth_1');
          var depth2 = depth1.querySelector('.depth_2');

          if (depth2) {
            // 소메뉴가 있으면 토글
            var depth1Items = menuInner.querySelectorAll('.depth_1');
            depth1Items.forEach(function(item) {
              if (item !== depth1) {
                item.classList.remove('active');
              }
            });
            depth1.classList.toggle('active');
          }
        }
      });
    }

    // 소메뉴 링크 클릭 - 메뉴 닫기
    var depth2Links = document.querySelectorAll('.menuInner .depth_2 a');
    depth2Links.forEach(function(link) {
      link.addEventListener('click', function() {
        if (!link.hasAttribute('target') || link.getAttribute('target') !== '_blank') {
          menu.classList.remove('active');
        }
      });
    });
  }
};

// DOM 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', function() {
  HeaderFooterLoader.init();
});

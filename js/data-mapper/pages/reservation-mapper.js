// Reservation Page Mapper - 예약안내 페이지 동적 매핑
// BaseMapper 미로드 상황(로드 순서/부분 실패)에서 ReferenceError 로 매핑 전체가
// 죽지 않도록 방어. 못 구하면 '#!' → 링크 비활성(404 로 나가는 것보다 안전)
function getBookingUrlSafe(data) {
  return (typeof BaseMapper !== 'undefined' && typeof BaseMapper.getBookingUrl === 'function')
    ? BaseMapper.getBookingUrl(data)
    : '#!';
}

var ReservationMapper = {
  map: function(data) {
    if (!data) return;

    // MAPPER: customFields.pages.reservation.sections[0].hero.images[0] (히어로 이미지)
    this.mapHero(data);

    // MAPPER: customFields.pages.reservation.sections[0].about (이용안내)
    this.mapUsageGuide(data);

    // MAPPER: customFields.pages.reservation.sections[1].about (환불정책)
    this.mapRefundPolicy(data);

    // MAPPER: 예약하기 버튼 링크
    this.mapBookingButton(data);
  },

  // 히어로 이미지 매핑 (customFields.pages.reservation.sections[0].hero.images[0])
  mapHero: function(data) {
    var customFields = data && data.homepage && data.homepage.customFields;
    var reservationData = customFields && customFields.pages && customFields.pages.reservation;
    var sections = reservationData && reservationData.sections;
    var hero = sections && sections[0] && sections[0].hero;
    var images = hero && hero.images;

    // 타이틀 매핑: hero.title 우선, 없으면 '예약안내' fallback
    var tx0_1El = document.querySelector('.con12 .tx0_1');
    if (tx0_1El) {
      if (hero && hero.title && hero.title.trim()) {
        tx0_1El.textContent = hero.title;
      } else {
        tx0_1El.textContent = '예약안내';
      }
    }

    var con0 = document.querySelector('.con0');
    if (!con0) return;

    // 이미지 없음: placeholder 적용
    if (!images || images.length === 0) {
      con0.style.backgroundImage = 'url(' + ImageHelpers.EMPTY_IMAGE_SVG + ')';
      con0.style.backgroundColor = '#f0f0f0';
      con0.style.backgroundRepeat = 'no-repeat';
      con0.style.backgroundPosition = 'center';
      con0.style.backgroundSize = 'cover';
      return;
    }

    // 첫 번째 이미지 사용
    var heroImg = images[0];
    if (heroImg && heroImg.url) {
      con0.style.backgroundImage = 'url(' + heroImg.url + ')';
    } else {
      // URL 없음: placeholder 적용
      con0.style.backgroundImage = 'url(' + ImageHelpers.EMPTY_IMAGE_SVG + ')';
      con0.style.backgroundColor = '#f0f0f0';
    }

    con0.style.backgroundRepeat = 'no-repeat';
    con0.style.backgroundPosition = 'center';
    con0.style.backgroundSize = 'cover';
  },

  // 이용안내 매핑 (customFields.pages.reservation.sections[0].about 우선 > property.usageGuide)
  mapUsageGuide: function(data) {
    var con13 = document.querySelector('.con13');
    if (!con13) return;

    var customFields = data && data.homepage && data.homepage.customFields;
    var reservationData = customFields && customFields.pages && customFields.pages.reservation;
    var sections = reservationData && reservationData.sections;
    var about = sections && sections[0] && sections[0].about;

    // 제목 매핑: customFields.pages.reservation.sections[0].about.title 우선
    var titleEl = con13.querySelector('.tx1');
    if (titleEl) {
      if (about && about.title && about.title.trim()) {
        titleEl.textContent = about.title;
      } else {
        titleEl.textContent = 'USER GUIDE';
      }
    }

    // 내용 매핑: property.usageGuide
    var contentEl = con13.querySelector('.tx2');
    if (contentEl) {
      var usageContent = (data && data.property && data.property.usageGuide) || '';

      if (usageContent) {
        contentEl.innerHTML = usageContent
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>');
      }
    }
  },

  // 환불정책 매핑 (customFields > property.refundPolicies)
  mapRefundPolicy: function(data) {
    var refundEl = document.querySelectorAll('.con13 .tx1 + .tx2');
    if (!refundEl || refundEl.length < 2) return;

    var refundContainer = refundEl[1];

    var customFields = data && data.homepage && data.homepage.customFields;
    var reservationData = customFields && customFields.pages && customFields.pages.reservation;
    var sections = reservationData && reservationData.sections;
    var refundAbout = sections && sections[1] && sections[1].about;

    var refundContent = '';

    // Priority 1: customFields.pages.reservation.sections[1].about.description
    if (refundAbout && refundAbout.description && refundAbout.description.trim()) {
      refundContent = refundAbout.description;
    }
    // Priority 2: property.refundPolicies
    else if (data && data.property && data.property.refundPolicies) {
      var policies = data.property.refundPolicies;
      policies.forEach(function(p) {
        var days = p.refundProcessingDays;
        var daysLabel = days === 0 ? '당일' : days + '일전';
        var refundText = p.refundRate === 100 ? '전액 환불' : p.refundRate + '% 환불';
        refundContent += '* 이용일 ' + daysLabel + ' 취소시 ' + refundText + '<br>';
      });
    }

    if (refundContent) {
      refundContainer.innerHTML = refundContent;
    }
  },

  // 예약하기 버튼 링크 설정
  mapBookingButton: function(data) {
    var btnEl = document.querySelector('[data-booking-link]');
    if (!btnEl) return;

    var bookingUrl = getBookingUrlSafe(data);
    if (bookingUrl !== '#!') {
      btnEl.href = bookingUrl;
      btnEl.target = '_blank';
    }
  }

};
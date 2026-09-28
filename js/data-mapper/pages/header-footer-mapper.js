// Header Footer Mapper - JSON 데이터로 헤더/푸터 동적 매핑
// BaseMapper 미로드 상황(로드 순서/부분 실패)에서 ReferenceError 로 매핑 전체가
// 죽지 않도록 방어. 못 구하면 '#!' → 링크 비활성(404 로 나가는 것보다 안전)
function getBookingUrlSafe(data) {
  return (typeof BaseMapper !== 'undefined' && typeof BaseMapper.getBookingUrl === 'function')
    ? BaseMapper.getBookingUrl(data)
    : '#!';
}

function getPhoneListSafe(value) {
  if (typeof BaseMapper !== 'undefined' && typeof BaseMapper.toPhoneList === 'function') {
    return BaseMapper.toPhoneList(value);
  }
  var list = [];
  if (Array.isArray(value)) {
    list = value.filter(function (v) { return typeof v === 'string' && v.trim(); });
  } else if (typeof value === 'string' && value.trim()) {
    list = [value];
  }
  return list.length > 0 ? list : ['1833-9306'];
}

var CONSULT_BASE_URL = 'https://www.bookingplay.co.kr/api/cti_eicn/kakao_happy_talk?tid=';

// 파트너 타입 — 원천은 백오피스 DB `public.contract_info.partner_type` 이고
// BFF 가 코드 문자열을 그대로 내려준다. **분기는 템플릿이 한다**(PC/모바일은 템플릿만 안다).
//
//   distributor_a  총판A     PC 상담하기 / 모바일 상담하기 + 예약하기
//   distributor_b  총판B     PC 없음     / 모바일 예약하기
//   sales_agency   판매대행  PC 없음     / 모바일 예약하기
//
// ⚠️ 예약하기는 **파트너 타입과 무관**하다 — 세 타입 모두 모바일에서만 뜬다(`for_m`).
var CONSULT_PARTNER_TYPES = ['distributor_a'];

function consultText(v) {
  return v === undefined || v === null ? '' : String(v).trim();
}

var HeaderFooterMapper = {
  // 숙소 한글명: customFields.property.name 우선, 없으면 property.name (C/D/E 동일 컨벤션)
  getPropertyName: function(data) {
    var cf = data && data.homepage && data.homepage.customFields;
    if (cf && cf.property && cf.property.name) return cf.property.name;
    return (data && data.property && data.property.name) || '';
  },

  // 숙소 영문명: customFields.property.nameEn 우선, 없으면 property.nameEn
  getPropertyNameEn: function(data) {
    var cf = data && data.homepage && data.homepage.customFields;
    if (cf && cf.property && cf.property.nameEn) return cf.property.nameEn;
    return (data && data.property && data.property.nameEn) || '';
  },

  // 객실 유형 + 구조 조합 (예: "독채형/분리형/ 침대룸2 거실 주방 화장실2")
  // roomStructures 전체를 '/'로 결합 + totalRoomCount(2개 이상이면 개수 표기, 순서: 침대룸·온돌룸·거실·주방·화장실)
  ROOM_STRUCTURE_LABELS: {
    bedroom: '침대룸', ondol: '온돌룸', livingRoom: '거실', kitchen: '주방', bathroom: '화장실'
  },
  buildRoomTypeDetail: function(room) {
    if (!room) return '';
    var typePart = (room.roomStructures || []).join('/');
    var counts = room.totalRoomCount || {};
    var labels = [];
    var map = this.ROOM_STRUCTURE_LABELS;
    ['bedroom', 'ondol', 'livingRoom', 'kitchen', 'bathroom'].forEach(function(key) {
      var c = counts[key];
      if (c >= 1) labels.push(map[key] + (c > 1 ? c : ''));
    });
    if (typePart && labels.length) return typePart + '/ ' + labels.join(' ');
    return typePart || labels.join(' ');
  },

  // 파비콘 매핑: homepage.images[0].logo[isSelected].url 재사용 (C/D/E 동일)
  mapFavicon: function(data) {
    var logoImg = data && data.homepage && data.homepage.images && data.homepage.images[0] && data.homepage.images[0].logo;
    if (!logoImg || !logoImg.length) return;
    var selectedLogo = logoImg.find(function(l) { return l.isSelected; }) || logoImg[0];
    if (!selectedLogo || !selectedLogo.url) return;

    var link = document.querySelector('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = selectedLogo.url;
  },

  mapHeader: function(data) {
    if (!data) return;
    this.mapFavicon(data);
    if (!data.property) return;

    // enabled 값 안전하게 접근
    var nearbyAttractionsEnabled = (data.homepage &&
                                    data.homepage.customFields &&
                                    data.homepage.customFields.pages &&
                                    data.homepage.customFields.pages.nearbyAttractions &&
                                    data.homepage.customFields.pages.nearbyAttractions.sections &&
                                    data.homepage.customFields.pages.nearbyAttractions.sections[0] &&
                                    data.homepage.customFields.pages.nearbyAttractions.sections[0].enabled) !== false;

    var layoutMapEnabled = (data.homepage &&
                            data.homepage.customFields &&
                            data.homepage.customFields.pages &&
                            data.homepage.customFields.pages.layoutMap &&
                            data.homepage.customFields.pages.layoutMap.sections &&
                            data.homepage.customFields.pages.layoutMap.sections[0] &&
                            data.homepage.customFields.pages.layoutMap.sections[0].enabled) !== false;

    // 1. 로고 이미지 매핑
    var logoElement = document.querySelector('[data-logo]');
    if (logoElement) {
      var logoImg = data.homepage && data.homepage.images && data.homepage.images[0] && data.homepage.images[0].logo;
      if (logoImg && logoImg.length > 0) {
        var selectedLogo = logoImg.find(function(l) { return l.isSelected; }) || logoImg[0];
        if (selectedLogo && selectedLogo.url) {
          logoElement.src = selectedLogo.url;
        } else {
          ImageHelpers.applyPlaceholder(logoElement);
        }
      } else {
        ImageHelpers.applyPlaceholder(logoElement);
      }
    }

    // 2. 메뉴 구조 생성
    var menuContainer = document.querySelector('[data-menu-container]');
    if (!menuContainer) return;

    // 기존 메뉴 초기화 (중복 방지)
    menuContainer.innerHTML = '';

    // 메뉴 구조: ABOUT, ROOMS, SPECIAL, RESERVE, TOUR
    var menuStructure = [
      {
        title: 'ABOUT',
        items: [
          { name: '외관보기', href: 'main.html' },
          { name: '오시는길', href: 'directions.html' }
        ]
      },
      {
        title: 'ROOMS',
        isSubmenu: true,
        dataKey: 'rooms',
        customItems: [
          {
            name: '미리보기',
            href: 'layout-map.html',
            enabledKey: 'layoutMapEnabled'
          }
        ]
      },
      {
        title: 'SPECIAL',
        isSubmenu: true,
        dataKey: 'facilities'
      },
      {
        title: 'RESERVE',
        items: [
          { name: '예약하기', href: getBookingUrlSafe(data), isLink: true },
          { name: '예약안내', href: 'reservation.html' }
        ]
      },
      {
        title: 'TOUR',
        items: [
          { name: '주변관광지', href: 'nearby-attractions.html', enabledKey: 'nearbyAttractionsEnabled' }
        ]
      }
    ];

    // 3. 메뉴 HTML 생성
    menuStructure.forEach(function(menu) {
      var depth1 = document.createElement('div');
      depth1.className = 'depth_1';

      var link = document.createElement('a');
      link.href = 'javascript:void(0)';
      link.textContent = menu.title;

      if (menu.title === 'RESERVE' && getBookingUrlSafe(data) !== '#!') {
        link.className = 'yellow';
      }

      depth1.appendChild(link);

      // 소메뉴 생성
      if (menu.isSubmenu) {
        var depth2 = document.createElement('div');
        depth2.className = 'depth_2';

        if (menu.dataKey === 'rooms') {
          // 객실명은 customFields.roomtypes 기준, status는 rooms[](id 매칭)에서 참조
          var cf = (data && data.homepage && data.homepage.customFields) || (data && data.customFields) || {};
          var roomtypes = cf.roomtypes || [];
          var rooms = (data && data.rooms) || [];
          // Layout Map - enabled 확인해서 추가
          if (layoutMapEnabled) {
            var layoutLink = document.createElement('a');
            layoutLink.href = 'layout-map.html';
            layoutLink.textContent = '미리보기';
            depth2.appendChild(layoutLink);
          }

          // 활성화된 객실 추가 (roomtypes 순회, inactive만 제외)
          var activeRoomtypes = roomtypes.filter(function(rt) {
            var matched = rooms.find(function(r) { return r.id === rt.id; });
            return !(matched && matched.status === 'inactive');
          });
          var roomItems = BaseMapper.getRoomMenuItems(activeRoomtypes, function(rt) {
            var matched = rooms.find(function(r) { return r.id === rt.id; });
            return (rt.name && rt.name.trim()) || (matched && matched.name) || '객실명';
          });
          roomItems.forEach(function(item) {
            var roomName = BaseMapper.getRoomMenuLabel(item);
            var roomLink = document.createElement('a');
            roomLink.href = BaseMapper.getRoomMenuLink(item);
            roomLink.textContent = roomName;
            depth2.appendChild(roomLink);
          });
        } else if (menu.dataKey === 'facilities' && data.property.facilities) {
          // 시설 동적 생성
          data.property.facilities.forEach(function(facility) {
            var facilityLink = document.createElement('a');
            facilityLink.href = 'facility.html?facility_id=' + facility.id;
            facilityLink.textContent = facility.name;
            depth2.appendChild(facilityLink);
          });
        }

        depth1.appendChild(depth2);
      } else if (menu.items) {
        // 정적 아이템
        var depth2 = document.createElement('div');
        depth2.className = 'depth_2';

        menu.items.forEach(function(item) {
          // enabled 필드 확인
          var isEnabled = true;
          if (item.enabledKey === 'nearbyAttractionsEnabled') {
            isEnabled = nearbyAttractionsEnabled;
          }

          if (isEnabled) {
            var itemLink = document.createElement('a');
            itemLink.href = item.href;
            itemLink.textContent = item.name;
            var bookingUrl = getBookingUrlSafe(data);
            if (item.isLink && bookingUrl !== '#!') {
              itemLink.href = bookingUrl;
              itemLink.target = '_blank';
            }
            depth2.appendChild(itemLink);
          }
        });

        if (depth2.children.length > 0) {
          depth1.appendChild(depth2);
        } else {
          return;
        }
      }

      menuContainer.appendChild(depth1);
    });

    // 4. 예약 버튼 링크 설정
    var bookingUrl = getBookingUrlSafe(data);
    if (bookingUrl !== '#!') {
      var bookingLinks = document.querySelectorAll('[data-booking-link]');
      bookingLinks.forEach(function(link) {
        link.href = bookingUrl;
        link.target = '_blank';
      });
    }

    // 5. YBS 버튼 표시 및 링크 설정
    var ybsButtons = document.querySelectorAll('[data-ybs-button]');
    var ybsId = data.property.ybsId;
    var ybsUrl = 'https://rev.yapen.co.kr/external?ypIdx=';

    ybsButtons.forEach(function(button) {
      var link = button.querySelector('a');

      if (!ybsId) {
        button.style.display = 'none';
        if (link) {
          link.href = '#!';
          link.removeAttribute('target');
        }
        return;
      }

      button.style.display = 'flex';
      button.setAttribute('data-ybs-id', ybsId);
      if (link) {
        link.href = ybsUrl + ybsId;
        link.target = '_blank';
      }
    });
  },


  // MAPPER: property.tripPropertyId + partnerType → [data-consult-button] (우측 하단 상담하기)
  //
  // 총판A 만 노출하고, `tripPropertyId` 가 비면 타입과 무관하게 숨긴다.
  // ⚠️ L 은 원래 플로팅 버튼이 없던 템플릿이라 상담하기·예약하기 둘 다 새로 넣었다.
  mapConsult: function(data) {
    var property = (data && data.property) || {};
    var raw = consultText(property.tripPropertyId);
    // URL 쿼리에 그대로 붙는 값이라 토큰 형태만 통과시킨다
    var tripPropertyId = /^[A-Za-z0-9_-]+$/.test(raw) ? raw : '';
    var partnerType = consultText(property.partnerType);
    var visible = Boolean(tripPropertyId) && CONSULT_PARTNER_TYPES.indexOf(partnerType) !== -1;

    // 상담하기가 빠지면 예약하기 아래가 비어 버린다. CSS 가 위치를 되돌릴 수 있도록 찍는다.
    document.documentElement.setAttribute('data-consult', visible ? 'on' : 'off');

    document.querySelectorAll('[data-consult-button]').forEach(function(el) {
      var host = el.closest('[data-consult-wrap]') || el;
      if (!visible) {
        host.style.display = 'none';
        return;
      }
      host.style.display = '';
      var target = el.tagName === 'A' ? el : el.querySelector('a');
      if (target) {
        target.href = CONSULT_BASE_URL + tripPropertyId;
        target.setAttribute('target', '_blank');
      }
    });
  },

  // MAPPER: property.tripProviderName → [data-copyright]
  // 공급사명이 있으면 data-copyright 의 템플릿 문자열에서 {provider} 를 치환한다.
  // 값이 없으면(백오피스 미입력 → "") HTML 의 기존 트립일레븐 문구를 그대로 둔다.
  mapCopyright: function(data) {
    var provider = String(((data && data.property) || {}).tripProviderName || '').trim();
    if (!provider) return;
    document.querySelectorAll('[data-copyright]').forEach(function (el) {
      var tpl = el.getAttribute('data-copyright') || '';
      el.textContent = tpl.replace(/\{provider\}/g, provider);
    });
  },

  mapFooter: function(data) {
    if (!data || !data.property) return;

    this.mapCopyright(data);

    var businessInfo = data.property.businessInfo || {};
    var phones = getPhoneListSafe(data.property.contactPhone);

    // 1. 전화번호 (property.contactPhone — 배열이면 전부 한 줄씩 노출)
    var phoneEl = document.querySelector('[data-phone]');
    if (phoneEl) {
      phoneEl.textContent = '';
      phones.forEach(function (phone) {
        var item = document.createElement('span');
        item.className = 'phoneItem';
        item.textContent = phone;
        phoneEl.appendChild(item);
      });
    }

    // 2. 주소
    var addressEl = document.querySelector('[data-address]');
    if (addressEl && businessInfo.businessAddress) {
      addressEl.textContent = businessInfo.businessAddress;
    }

    // 3. 사업자번호
    var businessNumberEl = document.querySelector('[data-business-number]');
    if (businessNumberEl && businessInfo.businessNumber) {
      businessNumberEl.textContent = businessInfo.businessNumber;
    }

    // 4. 대표자명
    var representativeEl = document.querySelector('[data-representative]');
    if (representativeEl && businessInfo.representativeName) {
      representativeEl.textContent = businessInfo.representativeName;
    }

    // 5. YBS 링크 (있으면 표시)
    if (data.property.ybsId) {
      var ybsLink = document.querySelector('[data-ybs-link]');
      if (ybsLink) {
        ybsLink.href = data.property.ybsId;
        ybsLink.style.display = 'inline-block';
      }
    }

    // 6. Footer 로고 매핑
    var footerLogoElement = document.querySelector('[data-footer-logo]');
    if (footerLogoElement) {
      var logoImg = data.homepage && data.homepage.images && data.homepage.images[0] && data.homepage.images[0].logo;
      if (logoImg && logoImg.length > 0) {
        var selectedLogo = logoImg.find(function(l) { return l.isSelected; }) || logoImg[0];
        if (selectedLogo && selectedLogo.url) {
          footerLogoElement.src = selectedLogo.url;
        } else {
          ImageHelpers.applyPlaceholder(footerLogoElement);
        }
      } else {
        ImageHelpers.applyPlaceholder(footerLogoElement);
      }
    }

  }
};

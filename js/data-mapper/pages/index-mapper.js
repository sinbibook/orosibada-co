// Index Page Mapper - 인덱스 페이지 동적 컨텐츠 매핑
var IndexMapper = {
  map: function(data) {
    if (!data || !data.property) {
      this.reveal(); // 매핑할 데이터가 없어도 화면은 노출
      return;
    }
    if (this.maybeRedirectToLanding(data)) return; // 랜딩으로 이동 — 노출하지 않는다

    // Con0: 히어로 슬라이더 + 숙소 한글명 매핑
    this.mapHeroSlides(data);
    this.mapHeroTitle(data);

    // Con1: 숙소 영문명 + 이미지 매핑
    this.mapCon1Section(data);

    // Con2: Signature (주요 순간들) 매핑
    this.mapSignatureSection(data);

    // Con3: Gallery 제목/태그 + 객실 슬라이드 매핑
    this.mapGalleryInfo(data);
    this.mapRoomsSlider(data);

    // Con4: Essence 제목/태그 + 시설 슬라이드 매핑
    this.mapEssenceInfo(data);
    this.mapFacilitiesSlider(data);

    // Con5: Closing 섹션 매핑
    this.mapClosingSection(data);

    this.reveal(); // 매핑 완료 → 화면 노출(페이드인)
  },

  // index.html head 렌더 게이트 해제. 조기 랜딩 가드가 __tplReveal 을 감싸 두므로
  // 호출 시점의 window.__tplReveal 을 그대로 부른다 (미리 잡아 두면 가드를 건너뛴다).
  reveal: function() {
    if (window.__tplReveal) window.__tplReveal();
  },

  // 랜딩으로 이동을 시작했으면 true. location.replace 는 즉시 페이지를 떠나지 않으므로,
  // 그 사이 다른 매핑이 끝나며 부르는 __tplReveal 이 index 를 잠깐 드러내지 않게 막는 데 쓴다.
  leavingToLanding: false,

  goToLanding: function() {
    this.leavingToLanding = true;
    window.location.replace('landing.html');
  },

  // 루트 가드: 랜딩 진입 대상이면 index.html 진입을 landing.html 로 되돌린다 (판단은 shouldEnterLanding).
  maybeRedirectToLanding: function(data) {
    var pages = data.homepage && data.homepage.customFields && data.homepage.customFields.pages;
    if (!this.shouldEnterLanding(pages && pages.landing)) return false;

    this.goToLanding();
    return true;
  },

  // 랜딩 진입 판단 — index.html 진입을 landing.html 로 돌려야 하면 true.
  // 쿼리 파라미터 없이 "어디서 왔는지(referrer)" 로 가른다.
  //   - 어드민 프리뷰 iframe → false (실제 방문자 진입 경로가 아니다)
  //   - pages.landing.sections[0].enabled !== true → false (명시적으로 켠 경우만. 어드민 저장 시
  //     undefined 는 JSON 에서 키째 빠지므로, 누락을 '켜짐' 으로 보면 랜딩을 안 쓰는 숙소가 튕긴다)
  //   - 같은 사이트 안에서 넘어옴 → false (헤더/푸터 로고, 랜딩의 자기 자신 카드)
  //   - 랜딩 카드에 등록된 연결 숙소 도메인에서 넘어옴 → false (그 숙소 랜딩의 카드를 눌러 온 경우)
  //   - 그 외(주소 직접 입력·즐겨찾기·검색/외부 링크) → true
  shouldEnterLanding: function(landingPage) {
    if (window.top !== window.self) return false;

    var section = landingPage && landingPage.sections && landingPage.sections[0];
    if (!section || section.enabled !== true) return false;

    return !this.isFromSameSite() && !this.isFromLinkedProperty(section);
  },

  getReferrerUrl: function() {
    try {
      return document.referrer ? new URL(document.referrer) : null;
    } catch (e) {
      return null;
    }
  },

  isFromSameSite: function() {
    var ref = this.getReferrerUrl();
    return !!ref && ref.origin === window.location.origin;
  },

  // 크로스 도메인 referrer 는 브라우저 기본 정책상 origin 만 오므로 호스트로만 비교한다 (www. 유무는 무시).
  isFromLinkedProperty: function(section) {
    var ref = this.getReferrerUrl();
    if (!ref) return false;

    var self = this;
    var refHost = this.normalizeHost(ref.host);
    return ((section && section.about) || []).some(function(card) {
      var domain = card && typeof card.domain === 'string' ? card.domain.trim() : '';
      if (!domain) return false;
      try {
        var url = new URL(/^https?:\/\//i.test(domain) ? domain : 'https://' + domain);
        return self.normalizeHost(url.host) === refHost;
      } catch (e) {
        return false;
      }
    });
  },

  normalizeHost: function(host) {
    return String(host || '').toLowerCase().replace(/^www\./, '');
  },

  // CON0: 히어로 슬라이드 매핑
  mapHeroSlides: function(data) {
    var sections = data.homepage &&
                   data.homepage.customFields &&
                   data.homepage.customFields.pages &&
                   data.homepage.customFields.pages.index &&
                   data.homepage.customFields.pages.index.sections;

    if (!sections || !sections[0]) return;

    var hero = sections[0].hero;
    if (!hero || !hero.images) return;

    var wrapper = document.querySelector('.con0 .swiper-wrapper');
    if (!wrapper) return;

    // 기존 슬라이드 제거 (샘플 제거)
    wrapper.innerHTML = '';

    // isSelected가 true인 이미지만 슬라이드로 생성
    var hasSelectedImages = false;
    hero.images.forEach(function(img) {
      if (img.isSelected) {
        hasSelectedImages = true;
        var slide = document.createElement('div');
        slide.className = 'swiper-slide';

        var imgDiv = document.createElement('div');
        imgDiv.className = 'img';

        // URL이 있으면 배경이미지, 없으면 placeholder
        if (img.url) {
          imgDiv.style.backgroundImage = 'url(' + img.url + ')';
          imgDiv.style.backgroundRepeat = 'no-repeat';
          imgDiv.style.backgroundPosition = 'center';
        } else {
          ImageHelpers.applyBackgroundPlaceholder(imgDiv);
        }

        slide.appendChild(imgDiv);
        wrapper.appendChild(slide);
      }
    });

    // 선택된 이미지가 없으면 placeholder 슬라이드 생성
    if (!hasSelectedImages) {
      var slide = document.createElement('div');
      slide.className = 'swiper-slide';

      var imgDiv = document.createElement('div');
      imgDiv.className = 'img';
      ImageHelpers.applyBackgroundPlaceholder(imgDiv);

      slide.appendChild(imgDiv);
      wrapper.appendChild(slide);
    }
  },

  // CON0: 숙소 한글명 매핑
  mapHeroTitle: function(data) {
    var el = document.querySelector('.con0 .tx1');
    var name = HeaderFooterMapper.getPropertyName(data);
    if (el && name) {
      el.textContent = name;
    }
  },

  // CON1: 핵심메시지 (signature 블록: 타이틀 + 이미지)
  mapCon1Section: function(data) {
    var sections = data.homepage &&
                   data.homepage.customFields &&
                   data.homepage.customFields.pages &&
                   data.homepage.customFields.pages.index &&
                   data.homepage.customFields.pages.index.sections;

    var signature = sections && sections[0] && sections[0].signature;

    // 타이틀 매핑 (signature.title → span.travelFont)
    var titleEl = document.querySelector('.con1 span.travelFont');
    if (titleEl && signature && signature.title) {
      titleEl.textContent = signature.title;
    }

    // 이미지 매핑 (signature.images[isSelected].url)
    var imgEl = document.querySelector('[data-index-con1-image]');
    if (!imgEl) return;

    var images = (signature && signature.images) || [];
    if (images.length > 0) {
      var selectedImg = images.find(function(img) { return img.isSelected; });
      var imageUrl = (selectedImg && selectedImg.url) || (images[0] && images[0].url);

      if (imageUrl) {
        imgEl.src = imageUrl;
      } else {
        ImageHelpers.applyPlaceholder(imgEl);
      }
    } else {
      ImageHelpers.applyPlaceholder(imgEl);
    }
  },

  // CON2: 히어로 타이틀 + 이미지 설명 매핑
  mapSignatureSection: function(data) {
    var sections = data.homepage &&
                   data.homepage.customFields &&
                   data.homepage.customFields.pages &&
                   data.homepage.customFields.pages.index &&
                   data.homepage.customFields.pages.index.sections;

    if (!sections || !sections[0] || !sections[0].hero) return;

    var hero = sections[0].hero;

    // 타이틀 매핑 (customFields.pages.index.sections[0].hero.title)
    var titleEl = document.querySelector('.con2 .title');
    if (titleEl && hero.title) {
      titleEl.textContent = hero.title;
    }

    // 태그 매핑 (hero.images[isSelected].description → #tag)
    var subTitle = document.querySelector('.con2 .subTitle');
    if (subTitle) {
      subTitle.innerHTML = '';

      // description 1개라도 입력되었는지 확인
      var hasDescription = hero.images && hero.images.some(function(img) { return img && img.isSelected && img.description; });

      if (hasDescription) {
        // 입력된 태그만 표시 (최대 3개까지)
        var count = 0;
        hero.images.forEach(function(img) {
          if (count < 3 && img && img.isSelected && img.description) {
            var tag = document.createElement('div');
            tag.className = 'tag';
            tag.textContent = '#' + img.description;
            subTitle.appendChild(tag);
            count++;
          }
        });
      } else {
        // Fallback: #이미지설명 3개 표시
        for (var i = 0; i < 3; i++) {
          var tag = document.createElement('div');
          tag.className = 'tag';
          tag.textContent = '#이미지설명';
          subTitle.appendChild(tag);
        }
      }
    }

    // 이미지 롤링 매핑 (hero.images[1]부터 - con1에서 [0] 사용)
    var imgRolling = document.querySelector('.con2 .imgRolling');
    if (imgRolling) {
      imgRolling.innerHTML = '';
      var hasAnyImage = false;

      if (hero.images && hero.images.length > 1) {
        for (var i = 1; i < hero.images.length; i++) {
          var img = hero.images[i];
          if (img && img.isSelected) {
            var imgDiv = document.createElement('div');
            imgDiv.className = 'img';
            if (img.url) {
              hasAnyImage = true;
              imgDiv.style.backgroundImage = 'url(' + img.url + ')';
              imgDiv.style.backgroundRepeat = 'no-repeat';
              imgDiv.style.backgroundPosition = 'center';
            } else {
              ImageHelpers.applyBackgroundPlaceholder(imgDiv);
            }
            imgRolling.appendChild(imgDiv);
          }
        }
      }

      // 이미지가 없으면 placeholder 4개 추가
      if (!hasAnyImage) {
        for (var i = 0; i < 4; i++) {
          var placeholderDiv = document.createElement('div');
          placeholderDiv.className = 'img';
          ImageHelpers.applyBackgroundPlaceholder(placeholderDiv);
          imgRolling.appendChild(placeholderDiv);
        }
      }

      // 이미지를 채운 "뒤" 롤링 초기화 (main-mapper와 동일 방식 - 끊김 없는 마퀴)
      this.initializeRolling(imgRolling);
    }
  },

  // ImgRolling 초기화 (이미지 1벌 복제 → 2배, totalWidth/2에서 리셋)
  // common.js의 페이지 로드 시점 초기화는 컨테이너가 비어 있어 복제가 안 되므로
  // 데이터 매핑이 끝난 이 시점에서 직접 초기화한다.
  initializeRolling: function(container) {
    if (!container) return;

    // 원본 이미지 한 벌 복제
    var images = container.querySelectorAll('.img:not([data-roll-clone])');
    images.forEach(function(img) {
      var clone = img.cloneNode(true);
      clone.setAttribute('data-roll-clone', 'true');
      container.appendChild(clone);
    });

    // 복제 후 폭 갱신 (재렌더 대응)
    container._rollHalf = container.scrollWidth / 2;

    // 롤링 루프는 1회만 시작 (재렌더 시 중복 루프 방지)
    if (container._rolling) return;
    container._rolling = true;

    var position = 0;
    var speed = 0.4;
    function roll() {
      position -= speed;
      if (container._rollHalf > 0 && Math.abs(position) >= container._rollHalf) {
        position = 0;
      }
      container.style.transform = 'translateX(' + position + 'px)';
      requestAnimationFrame(roll);
    }
    roll();
  },

  // CON3: Essence 제목/태그 매핑
  mapGalleryInfo: function(data) {
    var sections = data.homepage &&
                   data.homepage.customFields &&
                   data.homepage.customFields.pages &&
                   data.homepage.customFields.pages.index &&
                   data.homepage.customFields.pages.index.sections;

    if (!sections || !sections[0]) return;

    var essence = sections[0].essence;
    if (!essence) return;

    // 타이틀 매핑 (essence.title → .con3 .title)
    var titleEl = document.querySelector('.con3 .title');
    if (titleEl && essence.title) {
      titleEl.textContent = essence.title;
    }

    // 태그 매핑 (#숙소한글명 + #객실)
    var subTitle = document.querySelector('.con3 .subTitle');
    if (subTitle) {
      subTitle.innerHTML = '';

      // 숙소한글명 태그
      var nameKr = HeaderFooterMapper.getPropertyName(data);
      if (nameKr) {
        var tag1 = document.createElement('div');
        tag1.className = 'tag';
        tag1.textContent = '#' + nameKr;
        subTitle.appendChild(tag1);
      }

      // 객실 태그 (하드코딩)
      var tag2 = document.createElement('div');
      tag2.className = 'tag';
      tag2.textContent = '#객실';
      subTitle.appendChild(tag2);
    }
  },

  // CON3: 객실 슬라이드 매핑 (객실명/이미지=roomtypes, 설명/status=rooms id 매칭)
  mapRoomsSlider: function(data) {
    var cf = (data && data.homepage && data.homepage.customFields) || (data && data.customFields) || {};
    var roomtypes = cf.roomtypes || [];
    var rooms = (data && data.rooms) || [];
    var self = this;
    var wrapper = document.querySelector('.con3 .swiper-wrapper');
    if (!wrapper) return;

    wrapper.innerHTML = '';
    if (!roomtypes.length) return;

    var activeRoomtypes = roomtypes.filter(function(rt) {
      var matched = rooms.find(function(r) { return r.id === rt.id; });
      if (matched && matched.status === 'inactive') return false;
      // 원본이 내려둔 객실은 카드도 내지 않는다 — 그룹도 없고 사진도 없으면 보여줄 게 없다.
      // 크롤러가 이름·사진을 못 읽은 경우는 groupName 이 남아 있어 여기서 걸리지 않는다.
      return !!((rt.groupName || '').trim()) || !!(rt.images || []).length;
    });
    // Room Preview 카드는 groupName 과 무관하게 **항상 전체 객실**을 깐다.
    // 그룹으로 접히는 곳은 헤더 ROOMS 메뉴와 객실 상세 탭뿐이고,
    // 카드는 저마다 자기 객실 상세로 연결한다.
    activeRoomtypes.forEach(function(rt) {
      var matched = rooms.find(function(r) { return r.id === rt.id; });
      var roomName = (rt.name && rt.name.trim()) || (matched && matched.name) || '객실명';

      var slide = document.createElement('div');
      slide.className = 'swiper-slide';

      var link = document.createElement('a');
      link.href = BaseMapper.getRoomMenuLink(rt);

      var imgDiv = document.createElement('div');
      imgDiv.className = 'img';

      var thumbs = (rt.images || []).filter(function(im) { return im.category === 'roomtype_thumbnail' && im.isSelected; });
      thumbs.sort(function(a, b) { return (a.sortOrder || 0) - (b.sortOrder || 0); });
      if (thumbs[0] && thumbs[0].url) {
        imgDiv.style.backgroundImage = 'url(' + thumbs[0].url + ')';
        imgDiv.style.backgroundRepeat = 'no-repeat';
        imgDiv.style.backgroundPosition = 'center';
        imgDiv.style.backgroundSize = 'cover';
      } else {
        ImageHelpers.applyBackgroundPlaceholder(imgDiv);
      }

      var textDiv = document.createElement('div');
      textDiv.className = 'tx';

      var titleDiv = document.createElement('div');
      titleDiv.className = 'tx1';
      titleDiv.textContent = roomName;

      var descDiv = document.createElement('div');
      descDiv.className = 'tx2';
      descDiv.textContent = HeaderFooterMapper.buildRoomTypeDetail(matched);

      textDiv.appendChild(titleDiv);
      textDiv.appendChild(descDiv);
      link.appendChild(imgDiv);
      link.appendChild(textDiv);
      slide.appendChild(link);
      wrapper.appendChild(slide);
    });
  },

  mapEssenceInfo: function(data) {
    var sections = data.homepage &&
                   data.homepage.customFields &&
                   data.homepage.customFields.pages &&
                   data.homepage.customFields.pages.index &&
                   data.homepage.customFields.pages.index.sections;

    if (!sections || !sections[0]) return;

    var gallery = sections[0].gallery;
    if (!gallery) return;

    // 타이틀 매핑 (gallery.title → .con4 .title)
    var titleEl = document.querySelector('.con4 .title');
    if (titleEl && gallery.title) {
      titleEl.textContent = gallery.title;
    }

    // 태그 매핑 (#숙소한글명 + #부대시설)
    var subTitle = document.querySelector('.con4 .subTitle');
    if (subTitle) {
      subTitle.innerHTML = '';

      // 숙소한글명 태그
      var nameKr = HeaderFooterMapper.getPropertyName(data);
      if (nameKr) {
        var tag1 = document.createElement('div');
        tag1.className = 'tag';
        tag1.textContent = '#' + nameKr;
        subTitle.appendChild(tag1);
      }

      // 부대시설 태그 (하드코딩)
      var tag2 = document.createElement('div');
      tag2.className = 'tag';
      tag2.textContent = '#부대시설';
      subTitle.appendChild(tag2);
    }
  },

  // CON4: 시설 슬라이드 매핑
  mapFacilitiesSlider: function(data) {
    var facilities = data.property.facilities || [];
    var wrapper = document.querySelector('.con4 .swiper-wrapper');
    if (!wrapper) return;

    // 기존 슬라이드 제거 (샘플 제거)
    wrapper.innerHTML = '';

    facilities.forEach(function(facility, index) {
      var slide = document.createElement('div');
      slide.className = 'swiper-slide';

      var link = document.createElement('a');
      link.href = 'facility.html?facility_id=' + facility.id;

      var imgDiv = document.createElement('div');
      imgDiv.className = 'img';

      // facility.images[]에서 isSelected === true인 첫 이미지 찾기
      var imageUrl = null;
      if (facility.images && facility.images.length > 0) {
        var selectedImg = facility.images.find(function(img) { return img.isSelected; });
        if (selectedImg && selectedImg.url) {
          imageUrl = selectedImg.url;
        } else if (facility.images[0] && facility.images[0].url) {
          // 선택된 이미지가 없으면 첫 번째 이미지 사용
          imageUrl = facility.images[0].url;
        }
      }

      if (imageUrl) {
        imgDiv.style.backgroundImage = 'url(' + imageUrl + ')';
        imgDiv.style.backgroundRepeat = 'no-repeat';
        imgDiv.style.backgroundPosition = 'center';
      } else {
        ImageHelpers.applyBackgroundPlaceholder(imgDiv);
      }

      var textDiv = document.createElement('div');
      textDiv.className = 'tx';

      // 좌측: SPECIAL #N (순서)
      var tx1 = document.createElement('div');
      tx1.className = 'tx1';
      tx1.textContent = 'SPECIAL #' + (index + 1);

      // 우측: 부대시설명
      var tx2 = document.createElement('div');
      tx2.className = 'tx2';
      tx2.textContent = facility.name || '';

      textDiv.appendChild(tx1);
      textDiv.appendChild(tx2);
      link.appendChild(imgDiv);
      link.appendChild(textDiv);
      slide.appendChild(link);
      wrapper.appendChild(slide);
    });

    // 한 화면에 약 2.5장 노출:
    // - 2개 이하 → 모두 보임(잘림 없음) → 복제/loop 불필요 (정적)
    // - 3개 → 3번째가 잘림 → 원본 복제로 개수를 채워 4개 이상처럼 연속 루프
    // - 4개 이상 → 그대로 loop
    var MIN_SLIDES = 6;
    if (facilities.length === 3 && wrapper.children.length < MIN_SLIDES) {
      var originals = Array.prototype.slice.call(wrapper.children);
      var i = 0;
      while (wrapper.children.length < MIN_SLIDES) {
        wrapper.appendChild(originals[i % originals.length].cloneNode(true));
        i++;
      }
    }
  },

  // CON5: Closing 섹션 매핑
  mapClosingSection: function(data) {
    var sections = data.homepage &&
                   data.homepage.customFields &&
                   data.homepage.customFields.pages &&
                   data.homepage.customFields.pages.index &&
                   data.homepage.customFields.pages.index.sections;

    if (!sections || !sections[0]) return;

    var closing = sections[0].closing;
    if (!closing) return;

    // 이미지 매핑 (closing.images[]에서 isSelected인 이미지)
    var imgEl = document.querySelector('.con5 .img');
    if (imgEl) {
      var imageUrl = null;
      if (closing.images && closing.images.length > 0) {
        var selectedImg = closing.images.find(function(img) { return img.isSelected; });
        if (selectedImg && selectedImg.url) {
          imageUrl = selectedImg.url;
        } else if (closing.images[0] && closing.images[0].url) {
          imageUrl = closing.images[0].url;
        }
      }
      if (imageUrl) {
        imgEl.style.backgroundImage = 'url(' + imageUrl + ')';
        imgEl.style.backgroundRepeat = 'no-repeat';
        imgEl.style.backgroundPosition = '50% center';
        imgEl.style.backgroundSize = 'cover';
        imgEl.style.backgroundColor = '';
      } else {
        imgEl.style.backgroundImage = 'url(' + ImageHelpers.EMPTY_IMAGE_SVG + ')';
        imgEl.style.backgroundRepeat = 'no-repeat';
        imgEl.style.backgroundPosition = '50% center';
        imgEl.style.backgroundSize = 'cover';
        imgEl.style.backgroundColor = '#f0f0f0';
      }
    }

    // 텍스트: 하드코딩 유지 (travelFont는 영문 전용)
    // 타이틀 커스텀 시 한국어 사용으로 인한 폰트 적용 문제 방지
    var txEl = document.querySelector('.con5 .tx.travelFont');
    if (txEl) {
      txEl.innerHTML = 'Experience<br />Fullness and rest';
    }
  }

};

// 조기 랜딩 가드 — 매핑을 기다리지 않고 이 스크립트가 로드되자마자 랜딩 여부부터 판단한다.
//   index 매핑(header-footer-loader → IndexMapper.map)이 끝나며 렌더 게이트를 풀기 전에 판단이
//   끝나지 않으면, 매핑된 index(히어로 Prev/Next 등)가 잠깐 보였다가 랜딩으로 넘어갈 수 있다.
//   판단이 끝날 때까지 __tplReveal 을 붙잡아 둔다.
//   - 랜딩 진입 대상(shouldEnterLanding) → 화면을 풀지 않고 곧장 landing.html. 이동 판단 뒤에 매핑이
//     끝나며 노출을 요청해도 무시한다 (판단 = 노출 허용으로 보면 페이지를 떠나기 직전 index 가 비친다)
//   - 그 외 → 붙잡아 둔 노출을 그대로 진행 (JSON 한 번 더 읽는 시간만큼 늦게 뜰 수 있다)
//   - 네트워크 실패/지연 대비 3초 뒤에는 무조건 판단을 끝낸다 (head 의 렌더 게이트 타임아웃과 같은 값)
//   iframe(어드민 프리뷰)·내부 이동은 JSON 을 읽기 전에 바로 건너뛴다 (어차피 랜딩으로 안 보낸다).
//   (t-template-A index-mapper.js 의 earlyLandingGate 와 같은 동작)
(function earlyLandingGate() {
  if (window.top !== window.self) return;
  if (IndexMapper.isFromSameSite()) return;

  var reveal = window.__tplReveal;
  var decided = false;
  var pending = false;

  function finish() {
    if (decided) return;
    decided = true;
    if (pending && reveal) reveal();
  }

  window.__tplReveal = function() {
    if (IndexMapper.leavingToLanding) return; // 랜딩으로 떠나는 중 — 노출하지 않는다
    if (decided) {
      if (reveal) reveal();
    } else {
      pending = true;
    }
  };

  setTimeout(function() {
    pending = true;
    finish();
  }, 3000);

  fetch('standard-template-data.json?t=' + Date.now())
    .then(function(res) { return res.json(); })
    .then(function(data) {
      var customFields = (data && data.homepage && data.homepage.customFields) || (data && data.customFields) || {};
      var landing = customFields.pages && customFields.pages.landing;
      if (!decided && IndexMapper.shouldEnterLanding(landing)) {
        decided = true;
        IndexMapper.goToLanding(); // 노출하지 않고 이동한다 (이후 들어오는 노출 요청은 무시)
        return;
      }
      finish();
    })
    .catch(finish);
})();

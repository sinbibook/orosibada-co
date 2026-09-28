// Room Page Mapper - 객실 상세 페이지 동적 매핑
// 이미지/객실명 = customFields.roomtypes[current], 인원/평형/집기/유형/설명 = rooms[] (id 매칭)
// (template-D data-mapping.md room.html 규칙 기준)
var ROOM_COUNT_LABELS = {
  bedroom: '침대룸',
  bathroom: '화장실',
  livingRoom: '거실',
  ondol: '온돌룸',
  kitchen: '주방'
};

var RoomMapper = {
  map: function(data) {
    if (!data) return;

    var rt = this.getCurrentRoomType(data);
    var room = this.getMatchedRoom(data, rt);

    // MAPPER: roomtypes[current] interior[isSelected] + name
    this.mapHeroSlides(rt, room);

    // MAPPER: roomtypes[current](name, images) + rooms[current](bedTypes, roomStructures, usageGuide)
    this.mapRoomDetail(data, rt, room);

    // MAPPER: rooms[current].amenities (집기품목)
    this.mapAmenities(room);

    // MAPPER: roomtypes[current] interior 이미지 (con7 이미지 3개)
    this.mapCon7Images(rt);

    // MAPPER: customFields.pages.room[current].sections[0].gallery.title (con7 tx2)
    this.mapCon7Text(data, rt);

    // MAPPER: roomtypes[current] 평면도 이미지 (없으면 구간째 미노출)
    this.mapFloorplan(rt);

    // MAPPER: 다른 객실 미리보기 (roomtypes[] thumbnail + name)
    this.mapRoomPreview(data);

    // MAPPER: roomtypes[] (snb_wrap)
    this.mapRoomNavigation(data, rt);
  },

  // ── 공통 헬퍼 ───────────────────────────────────────────
  getCustomFields: function(data) {
    return (data && data.homepage && data.homepage.customFields) ||
      (data && data.customFields) || {};
  },

  getRoomtypes: function(data) {
    return this.getCustomFields(data).roomtypes || [];
  },

  // 현재 객실타입: URL ?room_id= (preview는 ?id= 호환), 없으면 첫 번째
  getCurrentRoomType: function(data) {
    var roomtypes = this.getRoomtypes(data);
    var params = new URLSearchParams(window.location.search);
    var roomId = params.get('room_id') || params.get('id');
    if (roomId) {
      return roomtypes.find(function(rt) { return rt.id === roomId; }) || roomtypes[0];
    }
    return roomtypes[0];
  },

  // roomtypes[current].id === rooms[j].id 매칭
  getMatchedRoom: function(data, roomtype) {
    if (!roomtype) return null;
    var rooms = (data && data.rooms) || [];
    return rooms.find(function(r) { return r.id === roomtype.id; }) || null;
  },

  // 객실명 해석: roomtype.name 우선 → rooms[].name → '객실명' (빈 JSON 임시 노출용)
  resolveRoomName: function(rt, room) {
    return (rt && rt.name && rt.name.trim()) || (room && room.name) || '객실명';
  },

  // isSelected=true인 이미지를 sortOrder 순으로 반환
  getSelectedImages: function(images) {
    if (!images || !images.length) return [];
    return images
      .filter(function(img) { return img.isSelected; })
      .sort(function(a, b) { return (a.sortOrder || 0) - (b.sortOrder || 0); });
  },

  // roomtypes[i].images 중 특정 category(isSelected, sortOrder순)
  getCategoryImages: function(rt, category) {
    var imgs = (rt && rt.images) || [];
    return this.getSelectedImages(imgs.filter(function(im) { return im.category === category; }));
  },

  // 객실 평면도 소스.
  // 크롤러가 원본 객실 상세의 평면도 영역에서 이미지를 찾았을 때만 이 필드/카테고리를 채운다.
  // ⚠️ 제목·설명 자리가 없다. 도면 이미지 한 장이 전부다.
  getFloorplanImages: function(rt) {
    if (!rt) return [];

    var direct = rt.floorplanImages || rt.floorplans || (rt.floorplan && rt.floorplan.images) || [];
    if (direct && !Array.isArray(direct)) direct = [direct];

    if (direct.length) {
      var selectedDirect = this.getSelectedImages(direct);
      return selectedDirect.length ? selectedDirect : direct;
    }

    var imgs = (rt && rt.images) || [];
    var filtered = imgs.filter(function(im) {
      return /^(roomtype_)?floorplan$|^room_floorplan$|^floor_plan$/i.test(im.category || '');
    });
    var selected = this.getSelectedImages(filtered);
    return selected.length ? selected : filtered.slice();
  },

  // roomStructures[0] + "/ " + totalRoomCount 값≥1 항목 한글 나열
  buildRoomStructure: function(room) {
    if (!room) return '';
    var structures = room.roomStructures || [];
    var base = structures.length ? structures[0] : '';
    var counts = room.totalRoomCount || {};
    var labels = [];
    Object.keys(ROOM_COUNT_LABELS).forEach(function(key) {
      if (counts[key] >= 1) labels.push(ROOM_COUNT_LABELS[key]);
    });
    if (base && labels.length) return base + '/ ' + labels.join(' ');
    return base || labels.join(' ');
  },

  // 객실 유형+구조 조합: HeaderFooterMapper.buildRoomTypeDetail 공용 사용 (con6 tx3 / con3 슬라이드)
  buildRoomTypeDetail: function(room) {
    return HeaderFooterMapper.buildRoomTypeDetail(room);
  },

  // Con0: 히어로 슬라이드 (roomtype interior 이미지) + 객실명 (tx1)
  mapHeroSlides: function(rt, room) {
    var name = this.resolveRoomName(rt, room);

    // 객실명 매핑 (con0 .tx1)
    var tx1El = document.querySelector('.con0 .tx1');
    if (tx1El) {
      tx1El.textContent = name;
    }

    var wrapper = document.querySelector('.con0 .swiper-wrapper');
    if (!wrapper) return;

    var slides = this.getCategoryImages(rt, 'roomtype_interior');

    wrapper.innerHTML = '';

    if (slides.length === 0) {
      var placeholderDiv = document.createElement('div');
      placeholderDiv.className = 'swiper-slide';
      var imgDiv = document.createElement('div');
      imgDiv.className = 'img';
      ImageHelpers.applyBackgroundPlaceholder(imgDiv);
      placeholderDiv.appendChild(imgDiv);
      wrapper.appendChild(placeholderDiv);
    } else {
      slides.forEach(function(slide) {
        var div = document.createElement('div');
        div.className = 'swiper-slide';
        var imgDiv = document.createElement('div');
        imgDiv.className = 'img';

        if (slide.url) {
          imgDiv.style.backgroundImage = 'url(' + slide.url + ')';
          imgDiv.style.backgroundRepeat = 'no-repeat';
          imgDiv.style.backgroundPosition = 'center';
          imgDiv.style.backgroundSize = 'cover';
        } else {
          ImageHelpers.applyBackgroundPlaceholder(imgDiv);
        }

        div.appendChild(imgDiv);
        wrapper.appendChild(div);
      });
    }
  },

  // Con6: 객실 상세 정보 (메인 이미지 + 정보)
  mapRoomDetail: function(data, rt, room) {
    var name = this.resolveRoomName(rt, room);

    // 메인 이미지 (con6 .left .img img) - roomtype thumbnail
    var mainImg = document.querySelector('.con6 .left .img img');
    var thumbs = this.getCategoryImages(rt, 'roomtype_thumbnail');
    if (mainImg && thumbs[0] && thumbs[0].url) {
      mainImg.src = thumbs[0].url;
      mainImg.alt = name;
    } else if (mainImg) {
      ImageHelpers.applyPlaceholder(mainImg);
    }

    // 오른쪽 정보 (con6 .right)
    // tx1: "ROOMS" / "NOTICE" 정적 텍스트(HTML) — 매핑하지 않음

    // tx2: 객실명 (roomtype name)
    var rightTx2 = document.querySelector('.con6 .right .tx2');
    if (rightTx2) {
      rightTx2.textContent = name;
    }

    // tx3: 객실 유형 + 구조 조합 (예: "독채형/분리형/ 침대룸2 거실 주방 화장실2")
    var rightTx3 = document.querySelector('.con6 .right .tx3');
    if (rightTx3) {
      rightTx3.textContent = this.buildRoomTypeDetail(room);
    }

    // tx4: NOTICE — 하드코딩 (매핑 삭제)
    // "※ 자세한 내용은 예약안내 페이지 참고 부탁드립니다." (room.html에 직접 작성)

    // 오른쪽 이미지 (con6 .right .img img) - roomtype interior[2] (3번째 이미지)
    var interior = this.getCategoryImages(rt, 'roomtype_interior');
    var rightInterior = interior[2];
    var rightImg = document.querySelector('.con6 .right .img img');
    if (rightImg && rightInterior && rightInterior.url) {
      rightImg.src = rightInterior.url;
      rightImg.alt = rightInterior.description || name;
    } else if (rightImg) {
      ImageHelpers.applyPlaceholder(rightImg);
    }

    // Con8: 테이블 데이터 매핑 (객실명, 기준, 최대, 유형, 평형)
    this.mapTable(rt, room);
  },

  // 집기품목 매핑 (rooms[current].amenities)
  mapAmenities: function(room) {
    var amenitiesText = (room && room.amenities && room.amenities.length) ? room.amenities.join(', ') : '';

    document.querySelectorAll('[data-room-amenities]').forEach(function(container) {
      container.textContent = amenitiesText;
    });
  },

  // Con8: 테이블 매핑 (순서: 객실명, 기준, 최대, 유형, 평형)
  mapTable: function(rt, room) {
    var name = this.resolveRoomName(rt, room);

    var tableTd = document.querySelectorAll('.con8 .price_table.for_pc table.table_default tbody tr td');
    if (tableTd.length >= 5) {
      tableTd[0].textContent = name;
      tableTd[1].textContent = (room && room.baseOccupancy != null) ? room.baseOccupancy : '';
      tableTd[2].textContent = (room && room.maxOccupancy != null) ? room.maxOccupancy : '';
      tableTd[3].textContent = this.buildRoomStructure(room);
      // 평형: rooms[j].size(㎡)를 평으로 환산 (1평=3.305785㎡, 소수 1자리) — sizePyeong 미전송 대비
      var sqm = (room && room.size != null) ? Number(room.size) : null;
      var pyeong = (sqm != null && !isNaN(sqm)) ? Math.round(sqm / 3.305785 * 10) / 10 : null;
      tableTd[4].textContent = (pyeong != null) ? pyeong + '평' : '';
    }
  },

  // Con7: 텍스트 매핑 (tx1=hero.title, tx2=gallery.title / 값 없으면 하드코딩 fallback)
  mapCon7Text: function(data, rt) {
    if (!rt) return;

    var cf = this.getCustomFields(data);
    var roomCf = (cf.pages?.room || []).find(function(r) { return r.id === rt.id; });
    var sec = roomCf?.sections?.[0];

    // tx1: hero.title (값 없으면 fallback "I support your beautiful trip")
    var tx1El = document.querySelector('.con7 .center .tx1');
    if (tx1El) {
      var heroTitle = (sec?.hero?.title || '');
      tx1El.textContent = heroTitle.trim() ? heroTitle : 'I support your beautiful trip';
    }

    // tx2: gallery.title (값 없으면 하드코딩 fallback)
    var tx2El = document.querySelector('.con7 .center .tx2');
    if (tx2El) {
      var galleryTitle = (sec?.gallery?.title || '');
      if (galleryTitle.trim()) {
        tx2El.innerHTML = galleryTitle.replace(/\n/g, '<br />');
      } else {
        tx2El.innerHTML = '특별한 장소가 주는 특별한 하루<br />이곳에서 최상의 휴식을 경험하세요.';
      }
    }
  },

  // Con7: 이미지 3개 매핑 (roomtype exterior[0,1,2])
  mapCon7Images: function(rt) {
    var interior = this.getCategoryImages(rt, 'roomtype_exterior');

    var images = [
      document.querySelector('.con7 .w1440 > .img:nth-of-type(1)'),
      document.querySelector('.con7 .w1440 .center .img'),
      document.querySelector('.con7 .w1440 > .img:nth-of-type(3)')
    ];

    images.forEach(function(imgEl, index) {
      if (imgEl && interior[index] && interior[index].url) {
        imgEl.style.backgroundImage = 'url(' + interior[index].url + ')';
        imgEl.style.backgroundRepeat = 'no-repeat';
        imgEl.style.backgroundPosition = 'center';
        imgEl.style.backgroundSize = 'cover';
      } else if (imgEl) {
        ImageHelpers.applyBackgroundPlaceholder(imgEl);
      }
    });
  },

  // Con3: 객실 미리보기 (roomtypes[] thumbnail + name, 현재 객실 포함 전체 노출)
  mapRoomPreview: function(data) {
    var roomtypes = this.getRoomtypes(data);
    var rooms = (data && data.rooms) || [];
    var self = this;
    var wrapper = document.querySelector('[data-room-list-slides]');
    if (!wrapper) return;

    wrapper.innerHTML = '';
    if (!roomtypes.length) return;

    var activeRoomtypes = roomtypes.filter(function(rt) {
      var matched = rooms.find(function(r) { return r.id === rt.id; });
      return !(matched && matched.status === 'inactive');
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

      var thumbs = self.getCategoryImages(rt, 'roomtype_thumbnail');
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
      descDiv.textContent = self.buildRoomStructure ? self.buildRoomStructure(matched) : '';

      textDiv.appendChild(titleDiv);
      textDiv.appendChild(descDiv);
      link.appendChild(imgDiv);
      link.appendChild(textDiv);
      slide.appendChild(link);
      wrapper.appendChild(slide);
    });
  },

  mapRoomNavigation: function(data, currentRt) {
    var roomtypes = this.getRoomtypes(data);
    var rooms = (data && data.rooms) || [];

    var ul = document.querySelector('[data-room-nav-list]');
    if (!ul) return;

    // 첫 li(미리보기)는 남기고 이전 생성분만 지운다.
    // innerHTML='' 로 통째로 비우면 객실 상세에서 미리보기로 돌아갈 길이 없어진다.
    ul.querySelectorAll('[data-generated="room"]').forEach(function(li) { li.remove(); });
    var firstLi = ul.querySelector('li');
    if (firstLi) firstLi.className = currentRt ? '' : 'active';

    var activeRoomtypes = roomtypes.filter(function(rt) {
      var matched = rooms.find(function(r) { return r.id === rt.id; });
      return !(matched && matched.status === 'inactive');
    });
    var self = this;
    var roomItems = BaseMapper.getRoomMenuItems(activeRoomtypes, function(rt) {
      var matched = rooms.find(function(r) { return r.id === rt.id; });
      return self.resolveRoomName(rt, matched);
    });

    // 그룹 안이면 그 그룹의 객실만 펼친다.
    // 헤더/미리보기 메뉴는 그룹명 하나로 접히고 클릭 시 그룹의 첫 객실로 들어가는데,
    // 이 탭까지 접혀 있으면 2번째 객실부터는 UI 로 도달할 방법이 없다.
    // 멤버가 1실인 그룹은 펼치지 않는다(항목이 하나뿐이라 의미가 없다).
    var currentId = currentRt && currentRt.id;
    var activeGroup = null;
    roomItems.forEach(function(it) {
      var members = (it && it.roomtypes) || [];
      if (members.length > 1 && BaseMapper.isRoomMenuItemActive(it, currentId)) activeGroup = it;
    });
    if (activeGroup) {
      roomItems = activeGroup.roomtypes.map(function(rt) {
        var matched = rooms.find(function(r) { return r.id === rt.id; });
        return { label: self.resolveRoomName(rt, matched), roomtype: rt, roomtypes: [rt] };
      });
    }

    roomItems.forEach(function(item) {
      var roomName = BaseMapper.getRoomMenuLabel(item);
      var li = document.createElement('li');
      li.setAttribute('data-generated', 'room');
      var link = document.createElement('a');
      link.href = BaseMapper.getRoomMenuLink(item);
      link.textContent = roomName;
      if (BaseMapper.isRoomMenuItemActive(item, currentId)) {
        li.className = 'active';
      }
      li.appendChild(link);
      ul.appendChild(li);
    });
  },

  /* MAPPER: roomtypes[current] 평면도 이미지 → [data-room-floorplan-image]
     ⚠️ 제목·설명 자리가 없다. 도면 이미지 한 장이 전부다.
     ⚠️ 이미지가 없으면 [data-room-floorplan-section] 을 통째로 숨긴다 —
        원본에 없던 빈 구간을 남기지 않는다.
        (layout-map 의 배치도는 반대로 없어도 placeholder 를 세운다 — 규칙이 정반대다.)
     ⚠️ URL 이 있는데 로드가 죽어도 구간째 숨긴다 — 깨진 아이콘만 남는 것보다 낫다. */
  mapFloorplan: function(rt) {
    var sections = document.querySelectorAll('[data-room-floorplan-section]');
    if (!sections.length) return;

    var images = this.getFloorplanImages(rt);
    var url = (images.length && images[0].url) || '';

    sections.forEach(function(el) {
      el.style.display = url ? '' : 'none';
    });
    if (!url) return;

    document.querySelectorAll('[data-room-floorplan-image]').forEach(function(img) {
      img.alt = '객실 평면도';
      img.onerror = function() {
        sections.forEach(function(el) {
          el.style.display = 'none';
        });
      };
      img.src = url;
    });
  }
};

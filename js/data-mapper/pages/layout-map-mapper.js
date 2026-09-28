// Layout Map Page Mapper - 레이아웃 맵 페이지 동적 매핑
var LayoutMapMapper = {
  map: function(data) {
    if (!data) return;

    // MAPPER: homepage.customFields.pages.layoutMap.sections[0].hero.images[isSelected]
    this.mapHeroImage(data);

    // Room Navigation 매핑
    this.mapRoomNavigation(data);

    // MAPPER: homepage.customFields.pages.layoutMap.sections[0].hero.title
    this.mapConTitle(data);

    // MAPPER: homepage.customFields.pages.layoutMap.sections[0].about.images[].description (3개까지)
    this.mapConSubtitle(data);

    // Con3: Room Preview Swiper (그대로 유지)
    this.mapRoomPreview(data);

    // MAPPER: homepage.customFields.pages.layoutMap.sections[0].about.images[0].url
    this.mapConImage(data);
  },

  // Con0: Hero 이미지 매핑 (homepage.customFields.pages.layoutMap.sections[0].hero.images[isSelected])
  mapHeroImage: function(data) {
    var slide = document.querySelector('.con0 .swiper-slide');
    if (!slide) return;

    var imgDiv = slide.querySelector('.img');
    if (!imgDiv) return;

    var layoutMap = data.homepage && data.homepage.customFields &&
                    data.homepage.customFields.pages &&
                    data.homepage.customFields.pages.layoutMap &&
                    data.homepage.customFields.pages.layoutMap.sections &&
                    data.homepage.customFields.pages.layoutMap.sections[0];

    if (layoutMap && layoutMap.hero && layoutMap.hero.images) {
      var selectedImg = layoutMap.hero.images.find(function(img) { return img.isSelected; }) || layoutMap.hero.images[0];

      if (selectedImg && selectedImg.url) {
        imgDiv.style.backgroundImage = 'url(' + selectedImg.url + ')';
        imgDiv.style.backgroundRepeat = 'no-repeat';
        imgDiv.style.backgroundPosition = 'center';
        imgDiv.style.backgroundSize = 'cover';
      } else {
        ImageHelpers.applyBackgroundPlaceholder(imgDiv);
      }
    } else {
      ImageHelpers.applyBackgroundPlaceholder(imgDiv);
    }
  },

  // Room Navigation (snb_wrap ul) - 객실명=roomtypes, status=rooms id 매칭
  mapRoomNavigation: function(data) {
    var cf = (data && data.homepage && data.homepage.customFields) || (data && data.customFields) || {};
    var roomtypes = cf.roomtypes || [];
    var rooms = (data && data.rooms) || [];
    var ul = document.querySelector('[data-room-nav-list]');
    if (!ul) return;

    var lis = ul.querySelectorAll('li');
    for (var i = lis.length - 1; i > 0; i--) {
      lis[i].remove();
    }

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
      var li = document.createElement('li');
      var link = document.createElement('a');
      link.href = BaseMapper.getRoomMenuLink(item);
      link.textContent = roomName;
      li.appendChild(link);
      ul.appendChild(li);
    });
  },

  mapConTitle: function(data) {
    var titleEl = document.querySelector('.con3 .conTitle .title');
    if (!titleEl) return;

    var layoutMap = data.homepage && data.homepage.customFields &&
                    data.homepage.customFields.pages &&
                    data.homepage.customFields.pages.layoutMap &&
                    data.homepage.customFields.pages.layoutMap.sections &&
                    data.homepage.customFields.pages.layoutMap.sections[0];

    titleEl.textContent = (layoutMap && layoutMap.hero && layoutMap.hero.title) ? layoutMap.hero.title : '';
  },

  // Con3: SubTitle (Tags) 매핑 (index와 동일: #숙소한글명 + #객실)
  mapConSubtitle: function(data) {
    var subTitleEl = document.querySelector('.con3 .conTitle .subTitle');
    if (!subTitleEl) return;

    subTitleEl.innerHTML = '';

    // 숙소한글명 태그
    var nameKr = HeaderFooterMapper.getPropertyName(data);
    if (nameKr) {
      var tag1 = document.createElement('div');
      tag1.className = 'tag';
      tag1.textContent = '#' + nameKr;
      subTitleEl.appendChild(tag1);
    }

    // 객실 태그 (하드코딩)
    var tag2 = document.createElement('div');
    tag2.className = 'tag';
    tag2.textContent = '#객실';
    subTitleEl.appendChild(tag2);
  },

  // Con3: Room Preview Swiper (객실명/이미지=roomtypes, 설명/status=rooms id 매칭)
  mapRoomPreview: function(data) {
    var cf = (data && data.homepage && data.homepage.customFields) || (data && data.customFields) || {};
    var roomtypes = cf.roomtypes || [];
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

  mapConImage: function(data) {
    var imgEl = document.querySelector('.con5 .img img');
    if (!imgEl) return;

    var layoutMap = data.homepage && data.homepage.customFields &&
                    data.homepage.customFields.pages &&
                    data.homepage.customFields.pages.layoutMap &&
                    data.homepage.customFields.pages.layoutMap.sections &&
                    data.homepage.customFields.pages.layoutMap.sections[0];

    if (layoutMap && layoutMap.about && layoutMap.about.images && layoutMap.about.images[0] && layoutMap.about.images[0].url) {
      imgEl.src = layoutMap.about.images[0].url;
    } else {
      ImageHelpers.applyPlaceholder(imgEl);
    }
  }

};
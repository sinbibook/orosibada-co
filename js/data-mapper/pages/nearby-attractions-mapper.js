// Nearby Attractions Page Mapper - 주변 여행지 페이지 동적 매핑
var NearbyAttractionsMapper = {
  map: function(data) {
    if (!data) return;

    var customFields = data && data.homepage && data.homepage.customFields;
    var pages = customFields && customFields.pages;
    var nearbyAttractions = pages && pages.nearbyAttractions;

    // enabled=false이면 매핑 스킵
    if (!nearbyAttractions || !nearbyAttractions.sections || !nearbyAttractions.sections[0] || nearbyAttractions.sections[0].enabled === false) {
      return;
    }

    // MAPPER: Hero 이미지
    this.mapHero(data);

    // MAPPER: Hero 제목/설명
    this.mapHeroTitle(data);

    // MAPPER: 항목 카드들
    this.mapAttractionCards(data);
  },

  // Hero 이미지 슬라이드 매핑
  mapHero: function(data) {
    var customFields = data && data.homepage && data.homepage.customFields;
    var pages = customFields && customFields.pages;
    var nearbyAttractions = pages && pages.nearbyAttractions;
    var sections = nearbyAttractions && nearbyAttractions.sections;
    var hero = sections && sections[0] && sections[0].hero;

    var wrapper = document.querySelector('[data-nearby-attractions-hero-slides]');
    if (!wrapper || !hero) return;

    wrapper.innerHTML = '';

    var images = (hero.images || []).filter(function(img) { return img && img.isSelected; });

    if (!images.length) {
      var placeholderDiv = document.createElement('div');
      placeholderDiv.className = 'swiper-slide';
      var imgDiv = document.createElement('div');
      imgDiv.className = 'img';
      ImageHelpers.applyBackgroundPlaceholder(imgDiv);
      placeholderDiv.appendChild(imgDiv);
      wrapper.appendChild(placeholderDiv);
      return;
    }

    images.forEach(function(img) {
      var div = document.createElement('div');
      div.className = 'swiper-slide';
      var imgDiv = document.createElement('div');
      imgDiv.className = 'img';

      if (img && img.url) {
        imgDiv.style.backgroundImage = 'url(' + img.url + ')';
        imgDiv.style.backgroundRepeat = 'no-repeat';
        imgDiv.style.backgroundPosition = 'center';
        imgDiv.style.backgroundSize = 'cover';
      } else {
        ImageHelpers.applyBackgroundPlaceholder(imgDiv);
      }

      div.appendChild(imgDiv);
      wrapper.appendChild(div);
    });
  },

  // Hero 제목/설명 매핑
  mapHeroTitle: function(data) {
    var customFields = data && data.homepage && data.homepage.customFields;
    var pages = customFields && customFields.pages;
    var nearbyAttractions = pages && pages.nearbyAttractions;
    var sections = nearbyAttractions && nearbyAttractions.sections;
    var hero = sections && sections[0] && sections[0].hero;

    if (!hero) return;

    // 제목: hero.title (없으면 "주변 여행지")
    var titleEl = document.querySelector('[data-nearby-attractions-hero-title]');
    if (titleEl) {
      if (hero.title && hero.title.trim()) {
        titleEl.textContent = hero.title;
      } else {
        titleEl.textContent = '주변 여행지';
      }
    }

    // 설명: hero.description (없으면 "펜션 주변의 아름다운 여행지들")
    var descEl = document.querySelector('[data-nearby-attractions-hero-description]');
    if (descEl) {
      if (hero.description && hero.description.trim()) {
        descEl.textContent = hero.description;
      } else {
        descEl.textContent = '펜션 주변의 아름다운 여행지들';
      }
    }
  },

  // 항목 카드 매핑
  mapAttractionCards: function(data) {
    var customFields = data && data.homepage && data.homepage.customFields;
    var pages = customFields && customFields.pages;
    var nearbyAttractions = pages && pages.nearbyAttractions;
    var sections = nearbyAttractions && nearbyAttractions.sections;
    var about = sections && sections[0] && sections[0].about;

    var itemWrap = document.querySelector('[data-nearby-attractions-items]');
    if (!itemWrap || !about || !about.length) return;

    itemWrap.innerHTML = '';

    about.forEach(function(item, index) {
      var div = document.createElement('div');
      div.className = 'item';
      div.setAttribute('data-aos', 'fade-up');

      // 이미지
      var images = item.images || [];
      var selectedImage = images.find(function(img) { return img && img.isSelected; }) || images[0];

      var img = document.createElement('img');
      if (selectedImage && selectedImage.url) {
        img.src = selectedImage.url;
        img.alt = item.title || '';
      } else {
        ImageHelpers.applyPlaceholder(img);
      }
      div.appendChild(img);

      // tx1: 제목
      var tx1 = document.createElement('div');
      tx1.className = 'tx1';
      tx1.textContent = item.title || '';
      div.appendChild(tx1);

      // tx2: 거리 정보 (이미지 description) - fallback 포함
      var distanceInfo = selectedImage && selectedImage.description ? selectedImage.description : '소개 이미지 설명';
      var tx2 = document.createElement('div');
      tx2.className = 'tx2';
      tx2.textContent = distanceInfo;
      div.appendChild(tx2);

      // tx3: 설명
      var tx3 = document.createElement('div');
      tx3.className = 'tx3';
      tx3.textContent = item.description || '';
      div.appendChild(tx3);

      itemWrap.appendChild(div);
    });
  }

};
// Landing Page Mapper - 랜딩 게이트 (여러 숙소 카드)
// t-template-A 의 landing-mapper.js 와 같은 동작을 L 의 객체 리터럴 매퍼 형태로 옮겼다.
// 호출: header-footer-loader.js mapPageContent() (standalone) / preview-handler renderTemplate() (프리뷰)
//   standalone 에서는 header-footer-loader 가 DOMContentLoaded 에서 바로 JSON 을 읽어 매핑하므로
//   preview-handler 의 2초 대기와 무관하게 카드가 바로 그려진다 (iframe 일 때만 로더가 건너뛴다).
// enabled 판정(!== true → 404)은 다른 L 페이지처럼 HeaderFooterLoader.checkPageEnabled 가 한다.
var LandingMapper = {
  map: function(data) {
    var section = this.getSection(data);
    if (section) this.mapCards(data, section);
    if (window.__tplReveal) window.__tplReveal(); // 매핑 완료 → 화면 노출(페이드인)
  },

  // pages.landing.sections[0]
  getSection: function(data) {
    var page = data && data.homepage && data.homepage.customFields &&
      data.homepage.customFields.pages && data.homepage.customFields.pages.landing;
    return (page && page.sections && page.sections[0]) || null;
  },

  cleanText: function(value) {
    if (value === undefined || value === null) return '';
    return String(value).trim();
  },

  getSelectedImages: function(images) {
    if (!images || !images.length) return [];
    return images
      .filter(function(img) { return img && img.isSelected && img.url; })
      .sort(function(a, b) { return (a.sortOrder || 0) - (b.sortOrder || 0); });
  },

  setBackground: function(el, url) {
    if (!el) return;
    if (url) {
      el.style.backgroundImage = 'url(' + url + ')';
      el.style.backgroundRepeat = 'no-repeat';
      el.style.backgroundPosition = 'center';
      el.style.backgroundSize = 'cover';
      el.classList.remove('empty-image-placeholder');
    } else if (window.ImageHelpers && ImageHelpers.applyBackgroundPlaceholder) {
      ImageHelpers.applyBackgroundPlaceholder(el);
    }
  },

  // 카드 클릭 시 이동할 주소 — 전부 새 탭 (랜딩 자체는 원래 탭에 남겨둔다)
  //   - 자기 자신(카드의 propertyId === property.id) → ./index.html
  //   - 연결 숙소 → {domain}/
  //   - domain 이 없는 연결 숙소 → 비활성 링크(#)
  //   도착한 index 가 랜딩으로 되돌리지 않는 건 IndexMapper.shouldEnterLanding 이 referrer 로
  //   판단한다 (같은 사이트 / 랜딩 카드에 등록된 연결 숙소 도메인에서 왔으면 건너뜀). 쿼리 파라미터는 붙이지 않는다.
  getCardLink: function(data, card) {
    if (!card) return { href: '#', external: false };

    var currentPropertyId = data && data.property && data.property.id;
    if (currentPropertyId && card.propertyId === currentPropertyId) {
      return { href: './index.html', external: true };
    }

    var domain = this.cleanText(card.domain);
    if (!domain) return { href: '#', external: false };

    var origin = /^https?:\/\//i.test(domain) ? domain.replace(/\/+$/, '') : 'https://' + domain;
    return { href: origin + '/', external: true };
  },

  // about[] (1~3장) → [data-landing-cards]
  //   배경 = about[i].images 첫 장 / 로고 = hero.images 중 blockId === about[i].blockId
  //   로고가 없으면 propertyName, title 은 입력했을 때만
  mapCards: function(data, section) {
    var self = this;
    // 노출 순서는 about[i].order 다. 어드민 "노출 순서" 는 배열을 재정렬하지 않고 order 값만 맞바꾼다.
    // order 가 없거나 같으면 원래 배열 순서를 유지한다 (안정 정렬).
    var cards = (Array.isArray(section.about) ? section.about : [])
      .map(function(card, index) { return { card: card, index: index }; })
      .sort(function(a, b) {
        var oa = Number(a.card && a.card.order);
        var ob = Number(b.card && b.card.order);
        oa = isFinite(oa) ? oa : Infinity;
        ob = isFinite(ob) ? ob : Infinity;
        return oa - ob || a.index - b.index;
      })
      .map(function(entry) { return entry.card; });
    var heroImages = (section.hero && section.hero.images) || [];

    document.querySelectorAll('[data-landing-cards]').forEach(function(ul) {
      ul.innerHTML = '';
      ul.setAttribute('data-count', String(Math.min(cards.length, 3) || 1));

      cards.forEach(function(card) {
        var li = document.createElement('li');
        li.className = 'landing_card';

        var link = self.getCardLink(data, card);
        var a = document.createElement('a');
        a.href = link.href;
        if (link.external) a.setAttribute('target', '_blank');

        var bg = document.createElement('div');
        bg.className = 'landing_card_bg';
        var bgImages = self.getSelectedImages((card && card.images) || []);
        self.setBackground(bg, bgImages.length ? bgImages[0].url : '');
        a.appendChild(bg);

        var overlay = document.createElement('div');
        overlay.className = 'landing_card_overlay';
        a.appendChild(overlay);

        var content = document.createElement('div');
        content.className = 'landing_card_content';

        var logos = self.getSelectedImages(heroImages.filter(function(image) {
          return image.blockId === (card && card.blockId);
        }));
        var propertyName = self.cleanText(card && card.propertyName);
        var titleText = self.cleanText(card && card.title);

        if (logos.length) {
          var img = document.createElement('img');
          img.className = 'landing_card_logo_img';
          img.src = logos[0].url;
          img.alt = propertyName || titleText;
          content.appendChild(img);
        } else if (propertyName) {
          var nameEl = document.createElement('p');
          nameEl.className = 'landing_card_name';
          nameEl.textContent = propertyName;
          content.appendChild(nameEl);
        }

        if (titleText) {
          var p = document.createElement('p');
          p.className = 'landing_card_title';
          p.textContent = titleText;
          content.appendChild(p);
        }

        a.appendChild(content);
        li.appendChild(a);
        ul.appendChild(li);
      });
    });
  }
};

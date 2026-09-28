// Base Mapper - 페이지 공통 매핑 유틸 (SEO 메타태그 등)
// 기존엔 각 페이지 매퍼에 updateMetaTags가 중복 정의돼 있었으나 이곳으로 통일.
(function (global) {
  var BaseMapper = {
    // realtimeBookingId 는 "실시간예약링크" 같은 플레이스홀더/설명 문구가 그대로
    // 들어올 수 있다. 그걸 href 로 쓰면 상대경로로 해석돼 404 페이지가 열리므로,
    // 실제 URL 로 보일 때만 링크로 취급하고 그 외에는 '#!'(비활성) 로 처리한다.
    getBookingUrl: function (data) {
      var raw = data && data.property && data.property.realtimeBookingId;
      if (typeof raw !== 'string') return '#!';

      var v = raw.trim();
      if (!v || v === '#!') return '#!';

      if (/^https?:\/\//i.test(v)) return v;      // http(s)://...
      if (/^\/\//.test(v)) return 'https:' + v;   // //도메인/...

      // 프로토콜 없이 도메인만 들어온 경우(booking.example.com/abc)는 https 를 붙여준다
      if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?([\/?#]|$)/i.test(v)) return 'https://' + v;

      return '#!';
    },

    toPhoneList: function (value) {
      var fallbackPhone = '1833-9306';
      var list = [];
      if (Array.isArray(value)) {
        list = value.filter(function (v) { return typeof v === 'string' && v.trim(); });
      } else if (typeof value === 'string' && value.trim()) {
        list = [value];
      }
      return list.length > 0 ? list : [fallbackPhone];
    },

    getRoomGroupName: function (roomtype) {
      return String((roomtype && roomtype.groupName) || '').trim();
    },

    hasRoomGroups: function (roomtypes) {
      var self = this;
      return (roomtypes || []).some(function (rt) {
        return !!self.getRoomGroupName(rt);
      });
    },

    getRoomMenuItems: function (roomtypes, resolveName) {
      var self = this;
      var list = roomtypes || [];
      if (!this.hasRoomGroups(list)) {
        return list.map(function (rt) {
          return { label: resolveName ? resolveName(rt) : (rt && rt.name) || '', roomtype: rt, roomtypes: [rt] };
        });
      }
      var seen = {};
      var items = [];
      list.forEach(function (rt) {
        var groupName = self.getRoomGroupName(rt);
        // 그룹 숙소에서는 미그룹 객실을 메뉴에 내지 않는다.
        // 원본 헤더가 그룹만 노출하고, 미그룹 객실은 목록 / Room Preview 로만 도달한다.
        // (Room Preview 는 roomtypes[] 전체를 그리므로 영향 없다)
        if (!groupName) return;

        var label = groupName || (resolveName ? resolveName(rt) : (rt && rt.name) || '');
        if (!String(label).trim()) return;
        var key = groupName ? 'group:' + groupName : 'room:' + rt.id;
        if (!seen[key]) {
          seen[key] = { label: label, groupName: groupName, roomtype: rt, roomtypes: [rt] };
          items.push(seen[key]);
        } else {
          seen[key].roomtypes.push(rt);
        }
      });
      return items;
    },

    getRoomMenuLabel: function (item) {
      return (item && item.label) || '';
    },

    getRoomMenuRoomtype: function (item) {
      return (item && item.roomtype) || item;
    },

    getRoomMenuLink: function (item) {
      var roomtype = this.getRoomMenuRoomtype(item);
      return 'room.html?room_id=' + encodeURIComponent(roomtype && roomtype.id);
    },

    isRoomMenuItemActive: function (item, currentId) {
      if (!item || !currentId) return false;
      return (item.roomtypes || []).some(function (rt) {
        return String(rt && rt.id) === String(currentId);
      });
    },

    // SEO 메타태그 공통 처리: homepage.seo → title + description/keywords + 네이버/구글 사이트 인증
    updateMetaTags: function (data) {
      var seo = (data && data.homepage && data.homepage.seo) || {};

      // name 기반 meta 태그를 upsert (값 없으면 태그 생성 안 함 → 빈 태그 방지)
      function upsertMetaByName(name, content) {
        if (!content) return;
        var meta = document.head.querySelector('meta[name="' + name + '"]');
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('name', name);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      }

      if (seo.title) {
        var titleEl = document.querySelector('title');
        if (titleEl) titleEl.textContent = seo.title;
      }

      upsertMetaByName('description', seo.description);
      upsertMetaByName('keywords', seo.keywords);
      upsertMetaByName('naver-site-verification', seo.naverSiteVerification);
      upsertMetaByName('google-site-verification', seo.googleSiteVerification);
    }
  };

  global.BaseMapper = BaseMapper;
})(window);

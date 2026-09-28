$(document).ready(function () {
  // Initialize AOS
  // ⚠️ 404.html 은 aos.js 를 싣지 않는다(오류 페이지라 등장 애니메이션이 필요 없다).
  //    존재 검사 없이 호출하면 ReferenceError 로 **이 아래 전체가 중단**된다 —
  //    햄버거 메뉴·Swiper 초기화까지 같이 죽는다.
  //    layout-map / nearby-attractions 가 비노출이면 404 로 리다이렉트되므로
  //    그 두 페이지에서도 같은 에러가 났다.
  if (window.AOS) {
    AOS.init({
      once: true,
      duration: 2000,
    });
  }

  // const locomotiveScroll = new LocomotiveScroll();

  // con0/con3/con4 Swiper는 동적 슬라이드 생성 후 header-footer-loader.js의
  // reinitializeSwiper()에서 초기화한다. (document.ready 시점엔 슬라이드가 비어 있어
  // 빈 컨테이너로 이중 초기화 → autoplay 깜박임 발생하던 버그)

  $(".header .btnMenu").on("click", function () {
    $(".header .menu").toggleClass("active");
  });
  $(".header .menuClose").on("click", function () {
    $(".header .menu").toggleClass("active");
  });

  // con2(.imgRolling) 롤링은 각 페이지 mapper에서 이미지 매핑 직후 초기화한다.
  // (페이지 로드 시점엔 컨테이너가 비어 있어 복제가 안 됨 → index에서 여백 발생하던 버그)
  // index: IndexMapper.initializeRolling, main: MainMapper.initializeRolling

  $(".header .menu .depth_1 > a").on("click", function (e) {
    e.preventDefault();

    $(this).parent().toggleClass("active");
  });

  function animateSentences($el) {
    $el.find(".__sentence").each(function (i) {
      var $sentence = $(this);
      gsap.set($sentence.find("span"), {
        y: "150%",
        skewY: 30,
      });
      gsap.to($sentence.find("span"), {
        y: "0%",
        skewY: 0,
        delay: i * 0.1,
        duration: 3,
        ease: "power2.out",
        stagger: {
          amount: 0.5,
          from: "start",
        },
      });
    });
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var $el = $(entry.target);
          animateSentences($el);
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
    }
  );

  $(".__anim-sentence").each(function () {
    observer.observe(this);
  });
});

/* The eyes over the rule on story.html. They blink at uneven
   gaps, sometimes twice, and drift slowly along the rule,
   looking the way they move. With reduced motion turned on,
   they stay still and only blink. */
(() => {
  const peek = document.querySelector(".peek");
  if (!peek) return;
  const eyes = peek.querySelector(".peek__eyes");
  const lids = [...eyes.children];
  const pupils = eyes.querySelectorAll("i");
  const between = (a, b) => a + Math.random() * (b - a);
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const blink = () => {
    lids.forEach(e => e.classList.add("is-shut"));
    setTimeout(() => lids.forEach(e => e.classList.remove("is-shut")), 110);
  };
  const keepBlinking = () => {
    blink();
    if (Math.random() < 0.25) setTimeout(blink, 260);
    setTimeout(keepBlinking, between(1500, 6000));
  };
  setTimeout(keepBlinking, between(800, 2500));

  if (calm) return;
  let x = 0;
  const wander = () => {
    const to = Math.round(between(0, peek.clientWidth - eyes.offsetWidth));
    pupils.forEach(p => (p.style.left = (to > x ? 13 : 2) + "px"));
    eyes.style.transform = `translateX(${to}px)`;
    x = to;
    setTimeout(() => {
      pupils.forEach(p => (p.style.left = ""));
      setTimeout(wander, between(1500, 4000));
    }, 5000);
  };
  setTimeout(wander, 1500);
})();

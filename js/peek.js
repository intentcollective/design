/* The eyes over the rule on story.html. They blink at uneven
   gaps, sometimes twice, and drift slowly along the rule,
   looking the way they move. With reduced motion turned on,
   they stay still and only blink.

   They are also star 7 of the hunt (see stars.js). The first
   time a pointer comes close they dart away. Catch them once
   and they ask their question. */
(() => {
  const peek = document.querySelector(".peek");
  if (!peek) return;
  const eyes = peek.querySelector(".peek__eyes");
  const lids = [...eyes.querySelectorAll(".peek__eye")];
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

  // Move the eyes to x, looking the way they go.
  let x = 0;
  const moveTo = (to, seconds) => {
    eyes.style.transitionDuration = seconds + "s";
    pupils.forEach(p => (p.style.left = (to > x ? 13 : 2) + "px"));
    eyes.style.transform = `translateX(${to}px)`;
    x = to;
  };
  const room = () => peek.clientWidth - eyes.offsetWidth;

  // Startled once, they dart to the far side of the rule.
  let startled = false;
  eyes.addEventListener("pointerenter", e => {
    if (startled || calm || e.pointerType === "touch") return;
    startled = true;
    blink();
    moveTo(x > room() / 2 ? 0 : room(), 0.5);
  });

  // Caught.
  eyes.addEventListener("click", () => {
    blink();
    setTimeout(blink, 220);
    document.dispatchEvent(new Event("peek:caught"));
  });

  if (calm) return;
  const wander = () => {
    moveTo(Math.round(between(0, room())), 5);
    setTimeout(() => {
      pupils.forEach(p => (p.style.left = ""));
      setTimeout(wander, between(1500, 4000));
    }, 5000);
  };
  setTimeout(wander, 200);
})();

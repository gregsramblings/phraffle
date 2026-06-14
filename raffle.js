/**
 * Phraffle — create an instant raffle using mobile phone numbers as tickets.
 * Greg Wilson · https://gregsramblings.com
 * Slot mechanic originally based on code by Saurabh Odhyan (CC BY-SA 3.0).
 *
 * 2026 rewrite: zero dependencies. The reel animation that used to run on
 * jQuery + spritely is now plain requestAnimationFrame driving the sprite's
 * background-position. The four number reels share one tall sprite
 * (images/reel_normal_numbers.png, 86×750 = ten 75px digits) and swap to a
 * motion-blur sprite while spinning fast.
 */
(() => {
  'use strict';

  const DIGIT_H = 75;                  // px per digit in the sprite sheet
  const DIGITS = 10;                   // digits 0–9
  const SPRITE_H = DIGIT_H * DIGITS;   // 750px tall sprite

  const reduceMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const now = () => performance.now();
  const rand = (n) => Math.floor(Math.random() * n);

  class Reel {
    constructor(el, opts = {}) {
      this.el = el;
      this.maxSpeed = opts.maxSpeed || 1900; // px/sec at full spin
      this.accel = opts.accel || 5200;       // px/sec² ramp-up
      this.blurOn = opts.blurOn || 700;      // speed above which blur shows

      this.state = 'idle';                   // idle | spinning | stopping
      this.speed = 0;                        // px/sec
      this.offset = rand(DIGITS) * DIGIT_H;  // start on a random whole digit
      this.raf = null;
      this.last = 0;

      this.markStopped();
      this.render();
    }

    render() {
      // Keep the number tidy; repeat-y handles the infinite-strip illusion.
      this.el.style.backgroundPositionY = (this.offset % SPRITE_H) + 'px';
    }

    setMotion(on) {
      this.el.classList.toggle('motion', on && !reduceMotion);
    }

    markSpinning() {
      this.el.classList.remove('slotstopped');
      this.el.setAttribute('aria-label', 'Number reel spinning — tap to stop');
    }

    markStopped() {
      this.el.classList.add('slotstopped');
      this.el.setAttribute('aria-label', 'Number reel stopped — tap to spin');
    }

    toggle() {
      if (this.state === 'idle') this.spin();
      else if (this.state === 'spinning') this.stop();
      // Ignore taps while it is already easing to a stop.
    }

    spin() {
      if (this.state !== 'idle') return;
      this.state = 'spinning';
      this.markSpinning();
      this.last = now();
      this.run();
    }

    stop() {
      if (this.state !== 'spinning') return;
      this.state = 'stopping';
      // Land on a whole digit a little ahead so the stop feels natural.
      const lead = Math.max(this.speed * 0.4, DIGIT_H * 3);
      this.from = this.offset;
      this.target = Math.ceil((this.offset + lead) / DIGIT_H) * DIGIT_H;
      this.stopStart = now();
      this.stopDur = reduceMotion
        ? 250
        : Math.min(1100, Math.max(550, this.speed * 0.5));
    }

    run() {
      const tick = (t) => {
        const dt = Math.min(0.05, (t - this.last) / 1000); // clamp tab-switch gaps
        this.last = t;

        if (this.state === 'spinning') {
          if (this.speed < this.maxSpeed) {
            this.speed = Math.min(this.maxSpeed, this.speed + this.accel * dt);
          }
          this.offset += this.speed * dt;
          this.setMotion(this.speed > this.blurOn);
          this.render();
          this.raf = requestAnimationFrame(tick);
          return;
        }

        if (this.state === 'stopping') {
          const p = Math.min(1, (t - this.stopStart) / this.stopDur);
          this.offset = this.from + (this.target - this.from) * easeOut(p);
          this.setMotion(p < 0.45);
          this.render();
          if (p < 1) {
            this.raf = requestAnimationFrame(tick);
            return;
          }
          this.offset = this.target % SPRITE_H;
          this.speed = 0;
          this.state = 'idle';
          this.setMotion(false);
          this.markStopped();
          this.render();
          this.raf = null;
        }
      };
      this.raf = requestAnimationFrame(tick);
    }
  }

  function init() {
    const reels = [
      ['slot1', { maxSpeed: 1750, accel: 4800 }],
      ['slot2', { maxSpeed: 1900, accel: 5200 }],
      ['slot3', { maxSpeed: 2050, accel: 5600 }],
      ['slot4', { maxSpeed: 2200, accel: 6000 }],
    ]
      .map(([id, opts]) => {
        const el = document.getElementById(id);
        return el ? new Reel(el, opts) : null;
      })
      .filter(Boolean);

    for (const reel of reels) {
      reel.el.addEventListener('click', () => reel.toggle());
      reel.el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          reel.toggle();
        }
      });
    }

    // Spin everything on load — unless the visitor asked for reduced motion,
    // in which case the reels wait for a tap.
    if (!reduceMotion) for (const reel of reels) reel.spin();

    setupResponsiveScale();
  }

  // The slot machine is a fixed-size sprite layout; scale it to fit narrow
  // screens without distorting the artwork.
  function setupResponsiveScale() {
    const machine = document.querySelector('.machine');
    const wrap = document.querySelector('.machine-wrap');
    if (!machine || !wrap) return;

    // The machine is a fixed-size sprite layout, so its intrinsic size never
    // changes — measure it once. (Re-measuring the element we're scaling would
    // feed its own transformed size back in and collapse the layout.)
    const naturalW = machine.offsetWidth;
    const naturalH = machine.offsetHeight;

    const fit = () => {
      const avail = wrap.clientWidth;
      // max(0, …) guards against a negative scale (which would mirror the
      // machine) if the container is ever narrower than the 8px gutter.
      const scale = Math.min(1, Math.max(0, avail - 8) / naturalW);
      // Centre the scaled machine ourselves (origin is top-left) so it stays
      // centred even when the un-scaled box is wider than the viewport.
      const tx = (avail - naturalW * scale) / 2;
      machine.style.transform = 'translateX(' + tx + 'px) scale(' + scale + ')';
      wrap.style.height = naturalH * scale + 'px';
    };

    fit();
    window.addEventListener('resize', fit);
    // Also catch viewport/layout changes that don't fire a window resize
    // (orientation, dynamic toolbars). Safe from feedback loops because fit()
    // reads cached natural dimensions, not the element it scales.
    if (window.ResizeObserver) new ResizeObserver(fit).observe(document.documentElement);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

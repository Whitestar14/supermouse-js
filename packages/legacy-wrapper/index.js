import './scss/supermouse.scss';

class Supermouse {
  constructor(options = {}) {
    this.options = this.getDefaultOptions({
      ...options,
    });
    this.theme = this.options.theme;
    this.mouseX = -100;
    this.mouseY = -100;
    this.ringX = -100;
    this.ringY = -100;
    this.isHover = false;
    this.mouseDown = false;
    this.isRunning = true;

    const { pointer, ring, ptContainer } = this.elementInit();
    this.pointer = pointer;
    this.ring = ring;
    this.ptContainer = ptContainer;

    this.applyTheme();
    this.init();
  }

  applyTheme() {
    this.ptContainer.className = `supermouse-cursor supermouse-theme-${this.theme}`;
    this.pointer.className = 'supermouse-cursor__dot';
    this.ring.className = 'supermouse-cursor__ring';
  }

  setTheme(theme) {
    const validThemes = ['default', 'neon', 'monochrome', 'sunset', 'ocean'];
    // @ts-ignore
    if (validThemes.includes(theme) && theme !== this.theme) {
      this.theme = theme;
      this.applyTheme();
    } else if (!validThemes.includes(theme)) {
      console.warn(
        `Theme "${theme}" specified not found. Reverting to default theme option.`
      );
      this.theme = 'default';
      this.applyTheme();
    }
    return this;
  }

  getDefaultOptions(options) {
    const defaultPointerSize = 5;
    const defaultRingSize = 15;

    // Use pointerSize and ringSize if provided, otherwise fallback to dimensions or defaults
    const pointerDimensions = options.pointerSize
      ? [options.pointerSize, options.pointerSize]
      : Array.isArray(options.dimensions?.pointer)
        ? options.dimensions.pointer
        : [defaultPointerSize, defaultPointerSize];

    const ringDimensions = options.ringSize
      ? [options.ringSize, options.ringSize]
      : Array.isArray(options.dimensions?.ring)
        ? options.dimensions.ring
        : [defaultRingSize, defaultRingSize];

    return {
      theme: options.theme || 'default',
      ringSize: options.ringSize || ringDimensions,
      pointerSize: options.pointerSize || pointerDimensions,
      ringClickSize: options.ringClickSize || [
        ringDimensions[0] - 5,
        ringDimensions[1] - 5,
      ],
      pointerClickSize: options.pointerClickSize || [
        pointerDimensions[0],
        pointerDimensions[1],
      ],
      useAnimation:
        options.useAnimation !== undefined ? options.useAnimation : true,
      animationDuration: options.animationDuration || 200,
      ringAnimationDuration: options.ringAnimationDuration || 600,
      ringAnimationDelay: options.ringAnimationDelay || 200,
      ringSmoothness: options.ringSmoothness || 0.2,
      ringThickness: options.ringThickness || 2,
      dimensions: {
        pointer: pointerDimensions,
        ring: ringDimensions,
      },
    };
  }

  init() {
    this.ptContainer.appendChild(this.pointer);
    this.ptContainer.appendChild(this.ring);
    document.body.insertBefore(this.ptContainer, document.body.children[0]);

    this.bindEvents();
    this.handleHoverEffects();
    this.render();
  }

  elementInit() {
    const ptContainer = document.createElement('div');
    const pointer = document.createElement('div');
    const ring = document.createElement('div');
    return { pointer, ring, ptContainer };
  }

  bindEvents() {
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
  }

  handleMouseMove = (e) => {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
  };

  handleMouseDown = () => {
    this.mouseDown = true;
  };

  handleMouseUp = () => {
    this.mouseDown = false;
  };

  trace(a, b, n) {
    return (1 - n) * a + n * b;
  }

  setDimensions(pointerDimensions, ringDimensions) {
    // Check if the arguments are arrays or single values
    if (Array.isArray(pointerDimensions)) {
      this.options.dimensions.pointer = pointerDimensions;
    } else {
      this.options.dimensions.pointer = [pointerDimensions, pointerDimensions];
    }

    if (Array.isArray(ringDimensions)) {
      this.options.dimensions.ring = ringDimensions;
    } else {
      this.options.dimensions.ring = [ringDimensions, ringDimensions];
    }

    // Update the pointer and ring click size based on new dimensions
    this.options.pointerClickSize = [
      this.options.dimensions.pointer[0],
      this.options.dimensions.pointer[1],
    ];

    this.options.ringClickSize = [
      this.options.dimensions.ring[0] - 5,
      this.options.dimensions.ring[1] - 5,
    ];

    // Update the styles of the pointer and ring elements immediately
    this.pointer.style.width = `${this.options.dimensions.pointer[0]}px`;
    this.pointer.style.height = `${this.options.dimensions.pointer[1]}px`;

    this.ring.style.width = `${this.options.dimensions.ring[0]}px`;
    this.ring.style.height = `${this.options.dimensions.ring[1]}px`;

    // Reposition the pointer and ring to ensure they're centered correctly
    this.pointer.style.transform = `translate(${this.mouseX - this.options.dimensions.pointer[0] / 2}px, ${this.mouseY - this.options.dimensions.pointer[1] / 2}px)`;
    this.ring.style.transform = `translate(${this.ringX - this.options.dimensions.ring[0] / 2}px, ${this.ringY - this.options.dimensions.ring[1] / 2}px)`;
  }

  render = () => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    if (currentTime - this.lastRenderTime < 16) {
      if (!this.isDefined(window) && window.requestAnimationFrame) {
        window.requestAnimationFrame(this.render);
      }
      return;
    }
    this.lastRenderTime = currentTime;

    const [pointerWidth, pointerHeight] = this.mouseDown
      ? this.options.pointerClickSize
      : this.options.dimensions.pointer;

    const [ringWidth, ringHeight] = this.mouseDown
      ? this.options.ringClickSize
      : this.options.dimensions.ring;

    if (this.options.useAnimation) {
      // When useAnimation is true, we rely on CSS animations.

      this.ringX = this.trace(
        this.ringX,
        this.mouseX,
        this.options.ringSmoothness
      );
      this.ringY = this.trace(
        this.ringY,
        this.mouseY,
        this.options.ringSmoothness
      );

      const pointerX = this.mouseX - pointerWidth / 2;
      const pointerY = this.mouseY - pointerHeight / 2;

      const ringX = this.ringX - ringWidth / 2;
      const ringY = this.ringY - ringHeight / 2;

      if (typeof this.pointer.animate === 'function') {
        this.pointer.animate(
          {
            transform: `translate(${pointerX}px, ${pointerY}px)`,
            width: `${pointerWidth}px`,
            height: `${pointerHeight}px`,
          },
          { duration: this.options.animationDuration, fill: 'forwards' }
        );

        this.ring.animate(
          {
            transform: `translate(${ringX}px, ${ringY}px)`,
            width: `${ringWidth}px`,
            height: `${ringHeight}px`,
            borderWidth: `${this.options.ringThickness}px`,
          },
          {
            duration: this.options.ringAnimationDuration,
            fill: 'forwards',
            delay: this.options.ringAnimationDelay,
          }
        );
      } else {
        // Fallback for environments without animate support
        // When useAnimation is false, we manually update the position using trace.
        this.ringX = this.trace(
          this.ringX,
          this.mouseX,
          this.options.ringSmoothness
        );
        this.ringY = this.trace(
          this.ringY,
          this.mouseY,
          this.options.ringSmoothness
        );
        const pointerX = this.mouseX - pointerWidth / 2;
        const pointerY = this.mouseY - pointerHeight / 2;

        const ringX = this.ringX - ringWidth / 2;
        const ringY = this.ringY - ringHeight / 2;

        this.pointer.style.transform = `translate(${pointerX}px, ${pointerY}px)`;
        this.pointer.style.width = `${pointerWidth}px`;
        this.pointer.style.height = `${pointerHeight}px`;

        this.ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
        this.ring.style.width = `${ringWidth}px`;
        this.ring.style.height = `${ringHeight}px`;
        this.ring.style.borderWidth = `${this.options.ringThickness}px`;
      }
    } else {
      // When useAnimation is false, we manually update the position using trace.
      this.ringX = this.trace(
        this.ringX,
        this.mouseX,
        this.options.ringSmoothness
      );
      this.ringY = this.trace(
        this.ringY,
        this.mouseY,
        this.options.ringSmoothness
      );

      const pointerX = this.mouseX - pointerWidth / 2;
      const pointerY = this.mouseY - pointerHeight / 2;

      const ringX = this.ringX - ringWidth / 2;
      const ringY = this.ringY - ringHeight / 2;

      this.pointer.style.transform = `translate(${pointerX}px, ${pointerY}px)`;
      this.pointer.style.width = `${pointerWidth}px`;
      this.pointer.style.height = `${pointerHeight}px`;

      this.ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
      this.ring.style.width = `${ringWidth}px`;
      this.ring.style.height = `${ringHeight}px`;
      this.ring.style.borderWidth = `${this.options.ringThickness}px`;
    }

    requestAnimationFrame(this.render);
  };

  handleHoverEffects() {
    const hoverElements = document.querySelectorAll('a, button, [data-hover]');

    hoverElements.forEach((element) => {
      element.addEventListener('mouseenter', () => {
        this.isHover = true;
      });

      element.addEventListener('mouseleave', () => {
        this.isHover = false;
      });
    });
  }

  destroy() {
    this.isRunning = false;
    this.ptContainer.remove();
  }

  startAnimation() {
    this.isRunning = true;
    this.render();
  }

  stopAnimation() {
    this.isRunning = false;
  }

  // Preserving legacy feataures

  setPointerSize(size, clickSize = size) {
    this.options.pointerSize = [size, size];
    this.options.dimensions.pointer = [size, size];
    if (this.isDefined(clickSize)) {
      return;
    } else {
      this.options.pointerClickSize = [clickSize, clickSize];
    }
  }

  isDefined(elem) {
    return typeof elem === undefined;
  }

  setRingSize(size, clickSize = size) {
    this.options.ringSize = [size, size];
    this.options.dimensions.ring = [size, size];
    this.options.ringClickSize =
      this.options.ringClickSize !== 'undefined'
        ? this.options.ringClickSize
        : [clickSize, clickSize];
  }

  setRingSmoothness(smoothness) {
    this.options.ringSmoothness = smoothness;
  }

  setAnimationDuration(duration) {
    this.options.animationDuration = duration;
    return this;
  }

  setRingAnimationDuration(duration) {
    this.options.ringAnimationDuration = duration;
    return this;
  }

  setRingAnimationDelay(delay) {
    this.options.ringAnimationDelay = delay;
    return this;
  }
}

export default Supermouse;

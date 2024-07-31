/**
 * 根据 https://github.com/hakimel/zoom.js 改造，原代码在 document.body 上设置
 * translate: transform 达到局部放大的功能
 *
 * 经改造过后，可以自行设定在哪个元素上做 transform
 *
 * 在 slide 组件中，不需要处理页面滚动，所以去掉了 scroll 相关处理如果有需要在有滚动条的组件
 * 中使用，请根据源码进行相应的改动
 *
 * refer https://github.com/hakimel/zoom.js/blob/master/js/zoom.js
 */
export class Zoom {
  private TRANSITION_DURATION = 800

  // The current zoom level (scale)
  private level:number = 1

  // Timeout for callback function
  private callbackTimeout:number = -1

  // The container which set transform on, default as document.body
  private zoomContainer:HTMLElement = document.body

  // Check for transform support so that we can fallback otherwise
  private supportsTransforms:boolean = false

  constructor(container?: HTMLElement) {
    if (container) {
      this.zoomContainer = container
    }

    this.supportsTransforms =
      'WebkitTransform' in this.zoomContainer.style ||
      'MozTransform' in this.zoomContainer.style ||
      'msTransform' in this.zoomContainer.style ||
      'OTransform' in this.zoomContainer.style ||
      'transform' in this.zoomContainer.style

    if (this.supportsTransforms) {
      // The easing that will be applied when we zoom in/out
      this.zoomContainer.style.transition =
        'transform ' + this.TRANSITION_DURATION + 'ms ease'
      this.zoomContainer.style['OTransition'] =
        '-o-transform ' + this.TRANSITION_DURATION + 'ms ease'
      this.zoomContainer.style['msTransition'] =
        '-ms-transform ' + this.TRANSITION_DURATION + 'ms ease'
      this.zoomContainer.style['MozTransition'] =
        '-moz-transform ' + this.TRANSITION_DURATION + 'ms ease'
      this.zoomContainer.style['WebkitTransition'] =
        '-webkit-transform ' + this.TRANSITION_DURATION + 'ms ease'
    }

    // Zoom out if the user hits escape
    this.zoomContainer.addEventListener('keyup', this.onKeyup)
  }

  /**
   * Applies the CSS required to zoom in, prefers the use of CSS3
   * transforms but falls back on zoom for IE.
   *
   * @param {Object} rect
   * @param {Number} scale
   */
  magnify(rect: {
    x: number,
    y: number,
    width?: number,
    height?: number
  }, scale: number): void {
    // Ensure a width/height is set
    rect.width = rect.width || 1
    rect.height = rect.height || 1

    // Center the rect within the zoomed viewport
    rect.x -= (window.innerWidth - rect.width * scale) / 2
    rect.y -= (window.innerHeight - rect.height * scale) / 2

    if (this.supportsTransforms) {
      // Reset
      if (scale === 1) {
        this.zoomContainer.style.transform = ''
        this.zoomContainer.style['OTransform'] = ''
        this.zoomContainer.style['msTransform'] = ''
        this.zoomContainer.style['MozTransform'] = ''
        this.zoomContainer.style['WebkitTransform'] = ''
      }
      // Scale
      else {
        var origin = '0px 0px',
          transform =
            'translate(' +
            -rect.x +
            'px,' +
            -rect.y +
            'px) scale(' +
            scale +
            ')'

        this.zoomContainer.style.transformOrigin = origin
        this.zoomContainer.style['OTransformOrigin'] = origin
        this.zoomContainer.style['msTransformOrigin'] = origin
        this.zoomContainer.style['MozTransformOrigin'] = origin
        this.zoomContainer.style['WebkitTransformOrigin'] = origin

        this.zoomContainer.style.transform = transform
        this.zoomContainer.style['OTransform'] = transform
        this.zoomContainer.style['msTransform'] = transform
        this.zoomContainer.style['MozTransform'] = transform
        this.zoomContainer.style['WebkitTransform'] = transform
      }
    } else {
      // Reset
      if (scale === 1) {
        this.zoomContainer.style.position = ''
        this.zoomContainer.style.left = ''
        this.zoomContainer.style.top = ''
        this.zoomContainer.style.width = ''
        this.zoomContainer.style.height = ''
        this.zoomContainer.style.zoom = ''
      }
      // Scale
      else {
        this.zoomContainer.style.position = 'relative'
        this.zoomContainer.style.left = -rect.x / scale + 'px'
        this.zoomContainer.style.top = -rect.y / scale + 'px'
        this.zoomContainer.style.width = scale * 100 + '%'
        this.zoomContainer.style.height = scale * 100 + '%'
        this.zoomContainer.style.zoom = `${scale}`
      }
    }

    this.level = scale
  }

  onKeyup(event: KeyboardEvent): void {
    if (this.level !== 1 && event.keyCode === 27) {
      this.out()
    }
  }

  /**
   * Clear side effect
   */
  clearSideEffect(): void {
    this.zoomContainer.removeEventListener('keydown', this.onKeyup)
  }
  /**
   * Zooms in on either a rectangle or HTML element.
   *
   * @param {Object} options
   *
   *   (required)
   *   - element: HTML element to zoom in on
   *   OR
   *   - x/y: coordinates in non-transformed space to zoom in on
   *   - width/height: the portion of the screen to zoom in on
   *   - scale: can be used instead of width/height to explicitly set scale
   *
   *   (optional)
   *   - callback: call back when zooming in ends
   *   - padding: spacing around the zoomed in element
   */
  to(options: {
    element: HTMLElement,
    x?: number,
    y?: number,
    width?: number,
    height?: number,
    scale?: number,
    callback?: () => void,
    padding?: number
  }): void {
    // Due to an implementation limitation we can't zoom in
    // to another element without zooming out first
    if (this.level !== 1) {
      this.out()
    } else {
      options.x = options.x || 0
      options.y = options.y || 0

      // If an element is set, that takes precedence
      if (!!options.element) {
        // Space around the zoomed in element to leave on screen
        var padding =
          typeof options.padding === 'number' ? options.padding : 20
        var bounds = options.element.getBoundingClientRect()

        options.x = bounds.left - padding
        options.y = bounds.top - padding
        options.width = bounds.width + padding * 2
        options.height = bounds.height + padding * 2
      }

      // If width/height values are set, calculate scale from those values
      if (options.width !== undefined && options.height !== undefined) {
        options.scale = Math.max(
          Math.min(
            window.innerWidth / options.width,
            window.innerHeight / options.height,
          ),
          1,
        )
      }

      if (options.scale && options.scale > 1) {
        options.x *= options.scale
        options.y *= options.scale

        options.x = Math.max(options.x, 0)
        options.y = Math.max(options.y, 0)

        this.magnify({
          x: options.x,
          y: options.y,
          width: options.width,
          height: options.height
        }, options.scale)

        if (typeof options.callback === 'function') {
          this.callbackTimeout = window.setTimeout(options.callback, this.TRANSITION_DURATION)
        }
      }
    }
  }

  /**
   * Resets the document zoom state to its default.
   *
   * @param {Object} options
   *   - callback: call back when zooming out ends
   */
  out(options?: {
    callback: () => void
  }): void {
    clearTimeout(this.callbackTimeout)

    this.magnify({ x: 0, y: 0 }, 1)

    if (options && typeof options.callback === 'function') {
      setTimeout(options.callback, this.TRANSITION_DURATION)
    }

    this.level = 1
  }

  // Alias
  reset(): void {
    this.out()
  }

  zoomLevel(): number {
    return this.level
  }
}

import $ from 'jquery';

export function initViewport({ canvas }) {
  const pixelRatio = window.devicePixelRatio;
  const viewport = [
    $(window).width(),
    $(window).height()
  ];

  canvas.width = viewport[0] * pixelRatio;
  canvas.height = viewport[1] * pixelRatio;

  canvas.style.width = `${viewport[0]}px`;
  canvas.style.height = `${viewport[1]}px`;
  return viewport;
}

export const BLENDING_MODES = ['normal', 'darken', 'lighten', 'multiply', 'screen', 'difference', 'multiply', 'normal'];
export const GRADIENT_KINDS = ['linear', 'radial'];

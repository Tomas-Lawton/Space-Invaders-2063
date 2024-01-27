import * as THREE from 'three';

export const  generateRadialGradient = () => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(
    window.innerWidth / 2,
    window.innerHeight / 2,
    0,
    window.innerWidth / 2,
    window.innerHeight / 2,
    window.innerWidth
  );

  gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
  gradient.addColorStop(1, 'rgba(20, 20, 20, 1)');

  context.fillStyle = gradient;
  context.fillRect(0, 0, window.innerWidth, window.innerHeight);

  return canvas;
}
// World-space camera: walking inside the central area leaves the map still.
// Every layer subtracts the same integer offset, keeping pixel-art tiles aligned.
export function movementProgress(time, start, duration) {
 if (!(duration > 0)) return 1;
 return Math.max(0, Math.min(1, (time - start) / duration));
}

export function updateMapCamera(previous, {x, y, width, height, scene, bounds}) {
 const reset = !previous || previous.scene !== scene || previous.width !== width || previous.height !== height
  || Math.abs(x - previous.targetX) > width || Math.abs(y - previous.targetY) > height;
 const follow = (offset, target, size) => {
  const margin = Math.min(96, size * .2);
  return Math.max(target - size / 2 - margin, Math.min(offset, target - size / 2 + margin));
 };
 let offsetX = reset ? x - width / 2 : follow(previous.offsetX, x, width);
 let offsetY = reset ? y - height / 2 : follow(previous.offsetY, y, height);
 if (bounds) {
  const constrain = (offset, view, map) => map <= view ? (map - view) / 2 : Math.max(0, Math.min(map - view, offset));
  offsetX = constrain(offsetX, width, bounds.width);
  offsetY = constrain(offsetY, height, bounds.height);
 }
 return {scene, width, height, targetX:x, targetY:y, offsetX, offsetY,
  left:Math.round(offsetX), top:Math.round(offsetY)};
}

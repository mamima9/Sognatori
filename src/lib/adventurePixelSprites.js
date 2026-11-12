/** Riduce l'artwork a una griglia sprite e conserva la trasparenza. */
export function createAdventurePixelSprite(image, targetHeight = 32) {
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const width = Math.max(1, Math.round(sourceWidth * targetHeight / Math.max(1, sourceHeight)));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.imageSmoothingEnabled = true;
  ctx.clearRect(0, 0, width, targetHeight);
  ctx.drawImage(image, 0, 0, width, targetHeight);
  return canvas;
}

export const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

/**
 * @param {string} imageSrc - Image File url
 * @param {object} pixelCrop - pixelCrop Object provided by react-easy-crop
 * @param {number} targetWidth - target size width
 * @param {number} targetHeight - target size height
 */
export async function getCroppedImg(imageSrc, pixelCrop, targetWidth, targetHeight) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  // Set the canvas size to the target size
  canvas.width = targetWidth || pixelCrop.width;
  canvas.height = targetHeight || pixelCrop.height;

  // Draw the cropped image onto the canvas
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, "image/jpeg");
  });
}

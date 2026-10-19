// Shrinks a photo in the browser before upload: longest side at most
// `maxSide` pixels, re-encoded as JPEG. A typical 4-8 MB phone photo comes
// out around 200-500 KB, which keeps uploads quick on mobile data and the
// storage bucket small. Resolves to a data: URL (what PhotoUpload stores).
export function resizeImage(file, { maxSide = 1600, quality = 0.8 } = {}) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      // JPEG has no transparency; paint white behind transparent PNGs.
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not read "${file.name}" as an image.`));
    };
    img.src = url;
  });
}

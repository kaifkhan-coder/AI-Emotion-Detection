
export async function compressImage(base64Str: string, maxWidth: number = 512): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      // Optimized 0.6 quality for maximum speed while retaining facial details
      const compressed = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
      resolve(compressed);
    };
    img.src = `data:image/jpeg;base64,${base64Str}`;
  });
}

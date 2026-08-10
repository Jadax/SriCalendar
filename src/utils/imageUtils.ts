const MAX_AVATAR_EDGE = 512;

/** Converts a selected profile photo into a compact JPEG data URL for private profile storage. */
export function compressAvatar(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) return Promise.reject(new Error('Please choose an image file.'));
  return new Promise((resolve, reject) => {
    const sourceUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = (): void => {
      const scale = Math.min(1, MAX_AVATAR_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) { URL.revokeObjectURL(sourceUrl); reject(new Error('Your browser could not prepare this photo.')); return; }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(sourceUrl);
      resolve(canvas.toDataURL('image/jpeg', .84));
    };
    image.onerror = (): void => { URL.revokeObjectURL(sourceUrl); reject(new Error('Please choose a JPG, PNG, or WebP photo.')); };
    image.src = sourceUrl;
  });
}

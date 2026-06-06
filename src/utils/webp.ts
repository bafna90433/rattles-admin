/**
 * Helper to convert and resize an uploaded image File (PNG, JPG, etc.) to WebP base64 & dataUrl.
 * It uses HTML Canvas to scale the image to a maximum of 800px (width/height) and export
 * it to a compressed WebP format client-side, speeding up server uploads significantly.
 */
export const convertToWebP = (file: File, quality = 0.8): Promise<{ base64: string; dataUrl: string }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          
          // Max limits for width and height (perfect for reference sample display)
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.naturalWidth;
          let height = img.naturalHeight;
          
          // Calculate scale ratios while maintaining aspect ratio
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            // Fallback if canvas context is unavailable
            const origBase64 = (event.target?.result as string).split(",")[1];
            resolve({ base64: origBase64, dataUrl: event.target?.result as string });
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL("image/webp", quality);
          const base64 = dataUrl.split(",")[1];
          resolve({ base64, dataUrl });
        } catch (error) {
          // Fallback to original read if canvas conversion fails
          const origBase64 = (event.target?.result as string).split(",")[1];
          resolve({ base64: origBase64, dataUrl: event.target?.result as string });
        }
      };
      img.onerror = () => {
        // Fallback if Image loading fails
        const origBase64 = (event.target?.result as string).split(",")[1];
        resolve({ base64: origBase64, dataUrl: event.target?.result as string });
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      resolve({ base64: "", dataUrl: "" });
    };
    reader.readAsDataURL(file);
  });
};

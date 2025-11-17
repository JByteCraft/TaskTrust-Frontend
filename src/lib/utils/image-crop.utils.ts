// Simple image cropping utility using canvas
export const cropImage = (
  imageUrl: string,
  cropArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  },
  aspectRatio?: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Calculate crop dimensions
        let { x, y, width, height } = cropArea;
        
        // Ensure crop area is within image bounds
        x = Math.max(0, Math.min(x, img.width));
        y = Math.max(0, Math.min(y, img.height));
        width = Math.min(width, img.width - x);
        height = Math.min(height, img.height - y);

        // Apply aspect ratio if provided
        if (aspectRatio) {
          if (width / height > aspectRatio) {
            width = height * aspectRatio;
          } else {
            height = width / aspectRatio;
          }
        }

        // Set canvas size to crop dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw cropped image
        ctx.drawImage(
          img,
          x, y, width, height, // Source rectangle
          0, 0, width, height  // Destination rectangle
        );

        // Convert to blob and create object URL
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              resolve(url);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          'image/jpeg',
          0.95
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageUrl;
  });
};


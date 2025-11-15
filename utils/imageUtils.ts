
export const addTextToImage = (imageBlob: Blob, text: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const imageUrl = URL.createObjectURL(imageBlob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(imageUrl);
      const canvas = document.createElement('canvas');
      // Using standard 16:9 YouTube thumbnail dimensions
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }

      // Draw image to fill canvas
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // --- Text Styling ---
      const fontSize = Math.floor(canvas.height / 12);
      ctx.font = `bold ${fontSize}px 'Arial Black', Gadget, sans-serif`;
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = fontSize / 8;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const x = canvas.width / 2;
      const maxWidth = canvas.width * 0.9;

      // --- Text Wrapping ---
      const words = text.split(' ');
      let line = '';
      const lines = [];
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          lines.push(line);
          line = words[n] + ' ';
        } else {
          line = testLine;
        }
      }
      lines.push(line);

      // --- Draw Text ---
      const lineHeight = fontSize * 1.1;
      const totalTextHeight = lineHeight * lines.length;
      // Position text block towards the bottom middle
      let startY = canvas.height - totalTextHeight - (canvas.height * 0.1);

      lines.forEach((line, index) => {
        const currentY = startY + (index * lineHeight);
        // Draw stroke and then fill for better visibility
        ctx.strokeText(line.trim(), x, currentY);
        ctx.fillText(line.trim(), x, currentY);
      });

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas to Blob conversion failed'));
        }
      }, 'image/jpeg', 0.9);
    };
    img.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error('Failed to load image'));
    };
    img.src = imageUrl;
  });
};

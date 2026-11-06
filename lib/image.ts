export const LOGO_OPTIONS = {
  maxSize: 256,
  outputType: 'image/png',
  outputExtension: 'png',
} as const;

export async function compressImage(
  file: File,
  options: typeof LOGO_OPTIONS = LOGO_OPTIONS,
): Promise<File> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();

    const scale = Math.min(1, options.maxSize / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Your browser could not process this logo. Try another image.');
    }

    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) resolve(result);
        else reject(new Error('Your browser could not process this logo. Try another image.'));
      }, options.outputType);
    });

    const name = file.name.replace(/\.[^.]+$/, '') || 'organization-logo';
    return new File([blob], `${name}.${options.outputExtension}`, {
      type: options.outputType,
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

import { Jimp } from 'jimp';
import { BrowserQRCodeReader, BinaryBitmap, HybridBinarizer, RGBLuminanceSource } from '@zxing/library';

export async function leerQR(buffer: Buffer): Promise<string | null> {
  try {
    const imagen = await Jimp.fromBuffer(buffer);
    const { width, height } = imagen.bitmap;

    const luminances = new Uint8ClampedArray(width * height);
    imagen.scan(0, 0, width, height, (x, y, idx) => {
      const r = imagen.bitmap.data[idx];
      const g = imagen.bitmap.data[idx + 1];
      const b = imagen.bitmap.data[idx + 2];
      luminances[y * width + x] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    });

    const source = new RGBLuminanceSource(luminances, width, height);
    const bitmap = new BinaryBitmap(new HybridBinarizer(source));
    const reader = new BrowserQRCodeReader();
    const result = reader.decodeBitmap(bitmap);
    return result.getText();
  } catch {
    return null;
  }
}
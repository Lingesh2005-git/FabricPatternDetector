import { Skia, ColorType, AlphaType } from '@shopify/react-native-skia';

const SIZE = 224;

// Decodes a picker-provided base64 image, draws it at model resolution, and normalizes RGB to [0, 1].
export function imageUriToFloat32Buffer(_uri, base64) {
  if (!base64) throw new Error('The selected image could not be read. Please choose another image.');
  const encoded = Skia.Data.fromBase64(base64);
  const source = Skia.Image.MakeImageFromEncoded(encoded);
  if (!source) throw new Error('Unsupported or corrupted image. Please use a JPEG or PNG.');
  const surface = Skia.Surface.MakeOffscreen(SIZE, SIZE);
  const canvas = surface.getCanvas();
  canvas.clear(Skia.Color('#000000'));
  const scale = Math.max(SIZE / source.width(), SIZE / source.height());
  const width = source.width() * scale;
  const height = source.height() * scale;
  canvas.drawImageRect(source, Skia.XYWHRect(0, 0, source.width(), source.height()), Skia.XYWHRect((SIZE - width) / 2, (SIZE - height) / 2, width, height), Skia.Paint());
  const image = surface.makeImageSnapshot();
  const pixels = image.readPixels(0, 0, { width: SIZE, height: SIZE, colorType: ColorType.RGBA_8888, alphaType: AlphaType.Unpremul });
  if (!pixels) throw new Error('Unable to prepare image pixels for inference.');
  const input = new Float32Array(SIZE * SIZE * 3);
  for (let sourceIndex = 0, targetIndex = 0; targetIndex < input.length; sourceIndex += 4) {
    input[targetIndex++] = pixels[sourceIndex];
    input[targetIndex++] = pixels[sourceIndex + 1];
    input[targetIndex++] = pixels[sourceIndex + 2];
  }
  return input.buffer;
}

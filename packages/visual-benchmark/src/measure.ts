/**
 * Normalized layout and style measurement plus screenshot comparison.
 *
 * Screenshots from different sources never share a pixel grid: a headless
 * browser capture and a device capture differ in size and density even when
 * they show the same screen. Comparison therefore happens in a normalized
 * space where each image is box-downscaled so its longest side fits
 * `longestSide` pixels, and difference is measured per normalized pixel with
 * an optional per-channel tolerance.
 *
 * Verdicts follow the scenario contract: difference inside a declared mask is
 * reported, never silently forgiven; any difference outside a mask fails the
 * comparison. A normalized size mismatch is itself an undeclared difference.
 *
 * PNG support is dependency-free (node:zlib only) and limited to what capture
 * pipelines emit: 8-bit truecolour, truecolour with alpha, and greyscale.
 * Interlaced images are refused rather than misread.
 */
import { inflateSync, deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

export interface DecodedImage {
  width: number
  height: number
  /** Row-major RGBA bytes, length width * height * 4. */
  data: Buffer
}

export interface NormalizedImage extends DecodedImage {
  sourceWidth: number
  sourceHeight: number
  scale: number
}

export interface CaptureMask {
  /** Region origin and size in the capture's own pixels. */
  x: number
  y: number
  width: number
  height: number
}

export type ComparisonVerdict = 'identical' | 'masked-differences' | 'undeclared-differences'

export interface ComparisonResult {
  a: string
  b: string
  normalizedWidth: number
  normalizedHeight: number
  /** Normalized size mismatch; when present the verdict is undeclared. */
  sizeMismatch?: { a: { width: number; height: number }; b: { width: number; height: number } }
  totalPixels: number
  differingPixels: number
  /** Differing pixels inside a declared mask; reported, never a silent pass. */
  maskedDifferingPixels: number
  unmaskedDifferingPixels: number
  unmaskedRatio: number
  /** Bounding box of unmasked differences in normalized pixels, if any. */
  boundingBox: { x: number; y: number; width: number; height: number } | null
  verdict: ComparisonVerdict
}

export interface CompareOptions {
  /** Longest side of the normalized grid in pixels. Defaults to 256. */
  longestSide?: number
  /** Per-channel tolerance in 0-255. Defaults to 0 (exact). */
  threshold?: number
}

export class PngDecodeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PngDecodeError'
  }
}

/** Bounds-checked byte read; out-of-range access is a corrupt image, not undefined math. */
function byte(buffer: Buffer, index: number): number {
  const value = buffer[index]
  if (value === undefined) {
    throw new PngDecodeError(`pixel data ends at byte ${index}`)
  }
  return value
}

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

/**
 * Decode a PNG buffer into row-major RGBA. Throws PngDecodeError on anything
 * outside the supported subset rather than returning shifted pixels.
 */
export function decodePng(buffer: Buffer): DecodedImage {
  if (buffer.length < 8 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new PngDecodeError('not a PNG image: bad signature')
  }
  let width = 0
  let height = 0
  let bitDepth = 0
  let colourType = -1
  let interlace = 1
  const idat: Buffer[] = []
  let offset = 8
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset)
    const type = buffer.toString('latin1', offset + 4, offset + 8)
    const data = buffer.subarray(offset + 8, offset + 8 + length)
    if (data.length < length) {
      throw new PngDecodeError(`truncated ${type} chunk`)
    }
    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      bitDepth = byte(data, 8)
      colourType = byte(data, 9)
      interlace = byte(data, 12)
    } else if (type === 'IDAT') {
      idat.push(Buffer.from(data))
    } else if (type === 'IEND') {
      break
    }
    offset += 12 + length
  }
  if (width === 0 || height === 0) {
    throw new PngDecodeError('missing or empty IHDR chunk')
  }
  if (bitDepth !== 8) {
    throw new PngDecodeError(`unsupported bit depth ${bitDepth}, only 8-bit captures are supported`)
  }
  if (interlace !== 0) {
    throw new PngDecodeError('interlaced PNG captures are not supported')
  }
  const channels = colourType === 2 ? 3 : colourType === 6 ? 4 : colourType === 0 ? 1 : -1
  if (channels === -1) {
    throw new PngDecodeError(`unsupported colour type ${colourType}`)
  }
  const stride = width * channels
  const raw = inflateSync(Buffer.concat(idat))
  if (raw.length !== height * (stride + 1)) {
    throw new PngDecodeError(
      `pixel data length ${raw.length} does not match ${width}x${height} (${channels} channels)`,
    )
  }
  const data = Buffer.alloc(width * height * 4)
  const prev = Buffer.alloc(stride)
  const line = Buffer.alloc(stride)
  let inOffset = 0
  for (let y = 0; y < height; y += 1) {
    const filter = byte(raw, inOffset)
    inOffset += 1
    for (let i = 0; i < stride; i += 1) {
      const a = i >= channels ? byte(line, i - channels) : 0
      const b = byte(prev, i)
      const c = i >= channels ? byte(prev, i - channels) : 0
      const rawByte = byte(raw, inOffset + i)
      if (filter === 0) {
        line[i] = rawByte
      } else if (filter === 1) {
        line[i] = (rawByte + a) & 0xff
      } else if (filter === 2) {
        line[i] = (rawByte + b) & 0xff
      } else if (filter === 3) {
        line[i] = (rawByte + ((a + b) >> 1)) & 0xff
      } else if (filter === 4) {
        const p = a + b - c
        const pa = Math.abs(p - a)
        const pb = Math.abs(p - b)
        const pc = Math.abs(p - c)
        const predictor = pa <= pb && pa <= pc ? a : pb <= pc ? b : c
        line[i] = (rawByte + predictor) & 0xff
      } else {
        throw new PngDecodeError(`unknown filter type ${filter} on row ${y}`)
      }
    }
    inOffset += stride
    for (let x = 0; x < width; x += 1) {
      const out = (y * width + x) * 4
      if (channels === 1) {
        const grey = byte(line, x)
        data[out] = grey
        data[out + 1] = grey
        data[out + 2] = grey
        data[out + 3] = 255
      } else {
        data[out] = byte(line, x * channels)
        data[out + 1] = byte(line, x * channels + 1)
        data[out + 2] = byte(line, x * channels + 2)
        data[out + 3] = channels === 4 ? byte(line, x * channels + 3) : 255
      }
    }
    prev.set(line)
  }
  return { width, height, data }
}

/**
 * Box-downscale the image so its longest side fits longestSide pixels.
 * Averages source texels so a one-pixel shift cannot flip the verdict; when
 * the image already fits, the pixels pass through untouched.
 */
export function normalizeImage(image: DecodedImage, longestSide = 256): NormalizedImage {
  if (!Number.isInteger(longestSide) || longestSide <= 0) {
    throw new RangeError('longestSide must be a positive integer')
  }
  const longest = Math.max(image.width, image.height)
  if (longest <= longestSide) {
    return {
      ...image,
      data: Buffer.from(image.data),
      sourceWidth: image.width,
      sourceHeight: image.height,
      scale: 1,
    }
  }
  const scale = longestSide / longest
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))
  const data = Buffer.alloc(width * height * 4)
  for (let y = 0; y < height; y += 1) {
    const y0 = Math.floor(y / scale)
    const y1 = Math.max(y0 + 1, Math.min(image.height, Math.ceil((y + 1) / scale)))
    for (let x = 0; x < width; x += 1) {
      const x0 = Math.floor(x / scale)
      const x1 = Math.max(x0 + 1, Math.min(image.width, Math.ceil((x + 1) / scale)))
      let s0 = 0
      let s1 = 0
      let s2 = 0
      let s3 = 0
      for (let sy = y0; sy < y1; sy += 1) {
        for (let sx = x0; sx < x1; sx += 1) {
          const at = (sy * image.width + sx) * 4
          s0 += byte(image.data, at)
          s1 += byte(image.data, at + 1)
          s2 += byte(image.data, at + 2)
          s3 += byte(image.data, at + 3)
        }
      }
      const count = (x1 - x0) * (y1 - y0)
      const out = (y * width + x) * 4
      data[out] = Math.round(s0 / count)
      data[out + 1] = Math.round(s1 / count)
      data[out + 2] = Math.round(s2 / count)
      data[out + 3] = Math.round(s3 / count)
    }
  }
  return { width, height, data, sourceWidth: image.width, sourceHeight: image.height, scale }
}

/**
 * Compare two captures in normalized space. Each mask is scaled into the
 * normalized grid of the image it is applied to; a normalized pixel counts
 * as masked when either side masks it, so a mask declared in capture pixels
 * keeps its meaning when the two captures differ in size.
 */
export function compareImages(
  aLabel: string,
  a: DecodedImage,
  bLabel: string,
  b: DecodedImage,
  masks: CaptureMask[] = [],
  options: CompareOptions = {},
): ComparisonResult {
  const longestSide = options.longestSide ?? 256
  const threshold = options.threshold ?? 0
  const normalizedA = normalizeImage(a, longestSide)
  const normalizedB = normalizeImage(b, longestSide)
  if (normalizedA.width !== normalizedB.width || normalizedA.height !== normalizedB.height) {
    return {
      a: aLabel,
      b: bLabel,
      normalizedWidth: normalizedA.width,
      normalizedHeight: normalizedB.height,
      sizeMismatch: {
        a: { width: normalizedA.width, height: normalizedA.height },
        b: { width: normalizedB.width, height: normalizedB.height },
      },
      totalPixels: 0,
      differingPixels: 0,
      maskedDifferingPixels: 0,
      unmaskedDifferingPixels: 0,
      unmaskedRatio: 1,
      boundingBox: null,
      verdict: 'undeclared-differences',
    }
  }
  const { width, height } = normalizedA
  const { unmasked, masked } = diffPixels(normalizedA, normalizedB, masks, threshold)
  let differingPixels = 0
  let maskedDifferingPixels = 0
  let unmaskedDifferingPixels = 0
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x
      if (masked[index]) {
        maskedDifferingPixels += 1
        differingPixels += 1
        continue
      }
      if (unmasked[index]) {
        unmaskedDifferingPixels += 1
        differingPixels += 1
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
    }
  }
  const totalPixels = width * height
  const verdict: ComparisonVerdict =
    unmaskedDifferingPixels > 0
      ? 'undeclared-differences'
      : differingPixels > 0
        ? 'masked-differences'
        : 'identical'
  return {
    a: aLabel,
    b: bLabel,
    normalizedWidth: width,
    normalizedHeight: height,
    totalPixels,
    differingPixels,
    maskedDifferingPixels,
    unmaskedDifferingPixels,
    unmaskedRatio: totalPixels === 0 ? 0 : unmaskedDifferingPixels / totalPixels,
    boundingBox:
      unmaskedDifferingPixels === 0
        ? null
        : { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 },
    verdict,
  }
}

/**
 * Per-pixel difference sets in normalized space. `unmasked[i]` marks a
 * difference outside every mask, `masked[i]` a difference inside at least
 * one mask. Shared by compareImages and the review renderer so both
 * classify pixels identically.
 */
export function diffPixels(
  a: NormalizedImage,
  b: NormalizedImage,
  masks: CaptureMask[],
  threshold: number,
): { unmasked: boolean[]; masked: boolean[] } {
  const unmasked: boolean[] = new Array(a.width * a.height).fill(false)
  const masked: boolean[] = new Array(a.width * a.height).fill(false)
  const isMasked = (x: number, y: number): boolean =>
    masks.some((mask) => {
      const inA =
        x >= Math.floor(mask.x * a.scale) &&
        x < Math.ceil((mask.x + mask.width) * a.scale) &&
        y >= Math.floor(mask.y * a.scale) &&
        y < Math.ceil((mask.y + mask.height) * a.scale)
      const inB =
        x >= Math.floor(mask.x * b.scale) &&
        x < Math.ceil((mask.x + mask.width) * b.scale) &&
        y >= Math.floor(mask.y * b.scale) &&
        y < Math.ceil((mask.y + mask.height) * b.scale)
      return inA || inB
    })
  for (let y = 0; y < a.height; y += 1) {
    for (let x = 0; x < a.width; x += 1) {
      const at = (y * a.width + x) * 4
      const differs =
        Math.abs(byte(a.data, at) - byte(b.data, at)) > threshold ||
        Math.abs(byte(a.data, at + 1) - byte(b.data, at + 1)) > threshold ||
        Math.abs(byte(a.data, at + 2) - byte(b.data, at + 2)) > threshold ||
        Math.abs(byte(a.data, at + 3) - byte(b.data, at + 3)) > threshold
      if (!differs) {
        continue
      }
      const index = y * a.width + x
      if (isMasked(x, y)) {
        masked[index] = true
      } else {
        unmasked[index] = true
      }
    }
  }
  return { unmasked, masked }
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c
  }
  return table
})()

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff
  for (const byteValue of buffer) {
    crc = (CRC_TABLE[(crc ^ byteValue) & 0xff] ?? 0) ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type: string, data: Buffer): Buffer {
  const header = Buffer.alloc(8)
  header.writeUInt32BE(data.length, 0)
  header.write(type, 4, 'latin1')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'latin1'), data])), 0)
  return Buffer.concat([header, data, crc])
}

/**
 * Encode row-major RGBA as an 8-bit truecolour-with-alpha PNG with no
 * filtering. The review renderer and the comparison scripts use it to
 * persist diff overlays; tests use it to build synthetic captures.
 */
export function encodePng(image: DecodedImage): Buffer {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(image.width, 0)
  header.writeUInt32BE(image.height, 4)
  header[8] = 8
  header[9] = 6
  const stride = image.width * 4
  const raw = Buffer.alloc(image.height * (stride + 1))
  for (let y = 0; y < image.height; y += 1) {
    raw[y * (stride + 1)] = 0
    image.data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }
  return Buffer.concat([
    PNG_SIGNATURE,
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

export interface ReviewPaths {
  html: string
  diff: string
}

/**
 * Write the screenshot review artifact for a comparison: a diff overlay PNG
 * plus an HTML page showing both captures side by side with the verdict and
 * counts. Unmasked differences render red, masked differences yellow, on top
 * of the `b` capture. The HTML references the capture files and the overlay
 * by relative file name, so the whole set stays viewable wherever the
 * artifact directory moves.
 */
export function writeComparisonReview(
  result: ComparisonResult,
  a: DecodedImage,
  b: DecodedImage,
  masks: CaptureMask[],
  options: CompareOptions,
  outHtmlPath: string,
  aFileName: string,
  bFileName: string,
): ReviewPaths {
  const longestSide = options.longestSide ?? 256
  const threshold = options.threshold ?? 0
  const normalizedA = normalizeImage(a, longestSide)
  const normalizedB = normalizeImage(b, longestSide)
  const diffFileName = 'diff.png'
  const diffPath = join(dirname(outHtmlPath), diffFileName)
  if (normalizedA.width === normalizedB.width && normalizedA.height === normalizedB.height) {
    const { unmasked, masked } = diffPixels(normalizedA, normalizedB, masks, threshold)
    const overlay = Buffer.from(normalizedB.data)
    for (let i = 0; i < unmasked.length; i += 1) {
      if (!unmasked[i] && !masked[i]) {
        continue
      }
      const at = i * 4
      overlay[at] = unmasked[i] ? 255 : 255
      overlay[at + 1] = unmasked[i] ? 0 : 200
      overlay[at + 2] = 0
      overlay[at + 3] = 255
    }
    writeFileSync(
      diffPath,
      encodePng({ width: normalizedB.width, height: normalizedB.height, data: overlay }),
    )
  }
  const rows = [
    ['verdict', result.verdict],
    ['normalized grid', `${result.normalizedWidth}x${result.normalizedHeight}`],
    ['differing pixels', String(result.differingPixels)],
    ['masked differing pixels', String(result.maskedDifferingPixels)],
    ['unmasked differing pixels', String(result.unmaskedDifferingPixels)],
    ['unmasked ratio', result.unmaskedRatio.toFixed(6)],
    ['bounding box', result.boundingBox ? JSON.stringify(result.boundingBox) : 'none'],
    ['size mismatch', result.sizeMismatch ? JSON.stringify(result.sizeMismatch) : 'none'],
  ]
    .map(([key, value]) => `      <tr><th>${key}</th><td>${value}</td></tr>`)
    .join('\n')
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>comparison review: ${result.a} vs ${result.b}</title>
  </head>
  <body>
    <h1>comparison review: ${result.a} vs ${result.b}</h1>
    <table>
${rows}
    </table>
    <h2>a: ${result.a}</h2>
    <img src="${aFileName}" alt="capture a" />
    <h2>b: ${result.b}</h2>
    <img src="${bFileName}" alt="capture b" />
    <h2>diff overlay (red unmasked, yellow masked)</h2>
    <img src="${diffFileName}" alt="diff overlay" />
  </body>
</html>
`
  writeFileSync(outHtmlPath, html)
  return { html: outHtmlPath, diff: diffPath }
}

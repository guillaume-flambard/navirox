import { describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  PngDecodeError,
  compareImages,
  decodePng,
  encodePng,
  normalizeImage,
  writeComparisonReview,
  type CaptureMask,
  type DecodedImage,
} from './measure.js'

function solid(
  width: number,
  height: number,
  rgba: [number, number, number, number],
): DecodedImage {
  const data = Buffer.alloc(width * height * 4)
  for (let i = 0; i < width * height; i += 1) {
    data[i * 4] = rgba[0]
    data[i * 4 + 1] = rgba[1]
    data[i * 4 + 2] = rgba[2]
    data[i * 4 + 3] = rgba[3]
  }
  return { width, height, data }
}

function paint(
  image: DecodedImage,
  x: number,
  y: number,
  width: number,
  height: number,
  rgba: [number, number, number, number],
): DecodedImage {
  const data = Buffer.from(image.data)
  for (let sy = y; sy < y + height; sy += 1) {
    for (let sx = x; sx < x + width; sx += 1) {
      const at = (sy * image.width + sx) * 4
      data[at] = rgba[0]
      data[at + 1] = rgba[1]
      data[at + 2] = rgba[2]
      data[at + 3] = rgba[3]
    }
  }
  return { width: image.width, height: image.height, data }
}

const WHITE: [number, number, number, number] = [255, 255, 255, 255]
const BLACK: [number, number, number, number] = [0, 0, 0, 255]

describe('decodePng', () => {
  it('round-trips an encoded image byte for byte', () => {
    const source = paint(solid(32, 24, WHITE), 4, 4, 6, 6, BLACK)
    const decoded = decodePng(encodePng(source))
    expect(decoded.width).toBe(32)
    expect(decoded.height).toBe(24)
    expect(decoded.data.equals(source.data)).toBe(true)
  })

  it('rejects a buffer that is not a PNG', () => {
    expect(() => decodePng(Buffer.from('not a png at all'))).toThrow(PngDecodeError)
  })

  it('rejects a truncated image instead of reading shifted pixels', () => {
    const encoded = encodePng(solid(8, 8, WHITE))
    expect(() => decodePng(encoded.subarray(0, 20))).toThrow(PngDecodeError)
  })
})

describe('normalizeImage', () => {
  it('passes an image that already fits through untouched', () => {
    const image = solid(64, 48, WHITE)
    const normalized = normalizeImage(image, 256)
    expect(normalized.scale).toBe(1)
    expect(normalized.width).toBe(64)
    expect(normalized.height).toBe(48)
    expect(normalized.data.equals(image.data)).toBe(true)
  })

  it('downscales so the longest side fits the target', () => {
    const normalized = normalizeImage(solid(400, 200, WHITE), 100)
    expect(normalized.width).toBe(100)
    expect(normalized.height).toBe(50)
    expect(normalized.scale).toBeCloseTo(0.25)
    expect(normalized.sourceWidth).toBe(400)
    expect(normalized.sourceHeight).toBe(200)
  })

  it('refuses a non-positive longest side', () => {
    expect(() => normalizeImage(solid(4, 4, WHITE), 0)).toThrow(RangeError)
  })
})

describe('compareImages', () => {
  it('reports identical for the same capture', () => {
    const image = paint(solid(64, 64, WHITE), 10, 10, 8, 8, BLACK)
    const result = compareImages('a', image, 'b', { ...image, data: Buffer.from(image.data) })
    expect(result.verdict).toBe('identical')
    expect(result.differingPixels).toBe(0)
    expect(result.unmaskedRatio).toBe(0)
    expect(result.boundingBox).toBeNull()
  })

  it('fails on a difference outside every declared mask', () => {
    const a = solid(64, 64, WHITE)
    const b = paint(a, 10, 10, 8, 8, BLACK)
    const result = compareImages('a', a, 'b', b)
    expect(result.verdict).toBe('undeclared-differences')
    expect(result.unmaskedDifferingPixels).toBe(64)
    expect(result.maskedDifferingPixels).toBe(0)
    expect(result.boundingBox).toEqual({ x: 10, y: 10, width: 8, height: 8 })
  })

  it('reports a difference inside a declared mask without failing', () => {
    const a = solid(64, 64, WHITE)
    const b = paint(a, 10, 10, 8, 8, BLACK)
    const masks: CaptureMask[] = [{ x: 10, y: 10, width: 8, height: 8 }]
    const result = compareImages('a', a, 'b', b, masks)
    expect(result.verdict).toBe('masked-differences')
    expect(result.unmaskedDifferingPixels).toBe(0)
    expect(result.maskedDifferingPixels).toBe(64)
    expect(result.boundingBox).toBeNull()
  })

  it('does not fail on a mask that covers nothing that differs', () => {
    const a = solid(64, 64, WHITE)
    const b = paint(a, 10, 10, 8, 8, BLACK)
    const masks: CaptureMask[] = [{ x: 40, y: 40, width: 8, height: 8 }]
    const result = compareImages('a', a, 'b', b, masks)
    expect(result.verdict).toBe('undeclared-differences')
    expect(result.maskedDifferingPixels).toBe(0)
  })

  it('tolerates a per-channel difference under the threshold', () => {
    const a = solid(16, 16, [100, 100, 100, 255])
    const b = solid(16, 16, [104, 104, 104, 255])
    expect(compareImages('a', a, 'b', b).verdict).toBe('undeclared-differences')
    expect(compareImages('a', a, 'b', b, [], { threshold: 8 }).verdict).toBe('identical')
  })

  it('treats a normalized size mismatch as an undeclared difference', () => {
    const result = compareImages('a', solid(64, 64, WHITE), 'b', solid(64, 128, WHITE), [], {
      longestSide: 64,
    })
    expect(result.verdict).toBe('undeclared-differences')
    expect(result.sizeMismatch).toEqual({
      a: { width: 64, height: 64 },
      b: { width: 32, height: 64 },
    })
    expect(result.boundingBox).toBeNull()
  })

  it('keeps a capture-pixel mask meaningful across differently sized captures', () => {
    const a = solid(64, 64, WHITE)
    const b = paint(solid(128, 128, WHITE), 20, 20, 16, 16, BLACK)
    const masks: CaptureMask[] = [{ x: 20, y: 20, width: 16, height: 16 }]
    const result = compareImages('a', a, 'b', b, masks, { longestSide: 64 })
    expect(result.verdict).toBe('masked-differences')
    expect(result.unmaskedDifferingPixels).toBe(0)
  })
})

describe('writeComparisonReview', () => {
  it('writes an HTML review and a diff overlay', () => {
    const a = solid(64, 64, WHITE)
    const b = paint(a, 10, 10, 8, 8, BLACK)
    const masks: CaptureMask[] = [{ x: 10, y: 10, width: 8, height: 8 }]
    const result = compareImages('a', a, 'b', b, masks)
    const dir = mkdtempSync(join(tmpdir(), 'visual-benchmark-review-'))
    try {
      const review = writeComparisonReview(
        result,
        a,
        b,
        masks,
        {},
        join(dir, 'review.html'),
        'a.png',
        'b.png',
      )
      const html = readFileSync(review.html, 'utf8')
      expect(html).toContain('comparison review: a vs b')
      expect(html).toContain('masked-differences')
      expect(html).toContain('src="a.png"')
      const diff = decodePng(readFileSync(review.diff))
      expect(diff.width).toBe(64)
      expect(diff.height).toBe(64)
      const at = (10 * 64 + 10) * 4
      expect([diff.data[at], diff.data[at + 1], diff.data[at + 2]]).toEqual([255, 200, 0])
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

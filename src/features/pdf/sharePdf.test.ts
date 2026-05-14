import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sharePdf } from './sharePdf'

const blob = new Blob(['%PDF'], { type: 'application/pdf' })
const filename = 'test.pdf'

describe('sharePdf — share path', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      canShare: vi.fn().mockReturnValue(true),
      share: vi.fn().mockResolvedValue(undefined),
    })
  })

  it('calls navigator.share when canShare returns true', async () => {
    await sharePdf(blob, filename)
    expect(navigator.share).toHaveBeenCalledOnce()
    const arg = (navigator.share as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(arg.files).toHaveLength(1)
    expect(arg.files[0].name).toBe(filename)
    expect(arg.files[0].type).toBe('application/pdf')
  })

  it('silently swallows AbortError', async () => {
    const abort = new DOMException('user cancelled', 'AbortError')
    ;(navigator.share as ReturnType<typeof vi.fn>).mockRejectedValueOnce(abort)
    await expect(sharePdf(blob, filename)).resolves.toBeUndefined()
  })

  it('rethrows non-abort errors', async () => {
    const err = new DOMException('not allowed', 'NotAllowedError')
    ;(navigator.share as ReturnType<typeof vi.fn>).mockRejectedValueOnce(err)
    await expect(sharePdf(blob, filename)).rejects.toThrow('not allowed')
  })
})

describe('sharePdf — download fallback', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      canShare: vi.fn().mockReturnValue(false),
    })
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn().mockReturnValue('blob:fake'),
      revokeObjectURL: vi.fn(),
    })
  })

  it('creates and clicks a download link when canShare is false', async () => {
    const clicks: string[] = []
    const origCreate = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreate(tag)
      if (tag === 'a') el.click = () => { clicks.push(el.download) }
      return el
    })

    await sharePdf(blob, filename)

    expect(URL.createObjectURL).toHaveBeenCalledWith(blob)
    expect(clicks).toContain(filename)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake')

    vi.restoreAllMocks()
  })
})

import {
  extractLangPrefix,
  extractLangId,
  extractPageIdAndViewId,
  getShortId,
  toUuid
} from '@/lib/utils/pageId'

describe('pageId utils', () => {
  describe('extractLangPrefix', () => {
    it('extracts language prefix from simple prefix string', () => {
      expect(extractLangPrefix('en:7e64875f4a50455fbab244e938535e57')).toBe('en')
      expect(extractLangPrefix('zh-CN:7e64875f4a50455fbab244e938535e57')).toBe('zh-CN')
    })

    it('does not treat http or https protocol as language prefix', () => {
      expect(
        extractLangPrefix(
          'https://app.notion.com/p/wangwenzhi/7e64875f4a50455fbab244e938535e57?v=a886285dbf4e4a56aaf410bd473aedc9'
        )
      ).toBe('')
      expect(
        extractLangPrefix('http://notion.so/7e64875f4a50455fbab244e938535e57')
      ).toBe('')
    })

    it('extracts language prefix even when value is a full URL with prefix', () => {
      expect(
        extractLangPrefix(
          'en:https://app.notion.com/p/wangwenzhi/7e64875f4a50455fbab244e938535e57?v=a886285dbf4e4a56aaf410bd473aedc9'
        )
      ).toBe('en')
    })
  })

  describe('extractLangId', () => {
    it('strips language prefix when present', () => {
      expect(extractLangId('en:7e64875f4a50455fbab244e938535e57')).toBe(
        '7e64875f4a50455fbab244e938535e57'
      )
    })

    it('preserves full URL without stripping https://', () => {
      const url =
        'https://app.notion.com/p/wangwenzhi/7e64875f4a50455fbab244e938535e57?v=a886285dbf4e4a56aaf410bd473aedc9'
      expect(extractLangId(url)).toBe(url)
    })
  })

  describe('extractPageIdAndViewId', () => {
    it('parses raw 32 hex page id', () => {
      const { pageId, viewId } = extractPageIdAndViewId(
        '7e64875f4a50455fbab244e938535e57'
      )
      expect(pageId).toBe('7e64875f-4a50-455f-bab2-44e938535e57')
      expect(viewId).toBeNull()
    })

    it('parses page id with ?v= parameter', () => {
      const { pageId, viewId } = extractPageIdAndViewId(
        '7e64875f4a50455fbab244e938535e57?v=a886285dbf4e4a56aaf410bd473aedc9'
      )
      expect(pageId).toBe('7e64875f-4a50-455f-bab2-44e938535e57')
      expect(viewId).toBe('a886285d-bf4e-4a56-aaf4-10bd473aedc9')
    })

    it('parses full Notion app URL with ?v= parameter', () => {
      const { pageId, viewId } = extractPageIdAndViewId(
        'https://app.notion.com/p/wangwenzhi/7e64875f4a50455fbab244e938535e57?v=a886285dbf4e4a56aaf410bd473aedc9'
      )
      expect(pageId).toBe('7e64875f-4a50-455f-bab2-44e938535e57')
      expect(viewId).toBe('a886285d-bf4e-4a56-aaf4-10bd473aedc9')
    })

    it('parses full URL prefixed with language code', () => {
      const { pageId, viewId } = extractPageIdAndViewId(
        'zh-CN:https://app.notion.com/p/wangwenzhi/7e64875f4a50455fbab244e938535e57?v=a886285dbf4e4a56aaf410bd473aedc9'
      )
      expect(pageId).toBe('7e64875f-4a50-455f-bab2-44e938535e57')
      expect(viewId).toBe('a886285d-bf4e-4a56-aaf4-10bd473aedc9')
    })
  })

  describe('getShortId & toUuid', () => {
    it('formats 32 hex char into canonical UUID', () => {
      expect(toUuid('7e64875f4a50455fbab244e938535e57')).toBe(
        '7e64875f-4a50-455f-bab2-44e938535e57'
      )
    })

    it('returns short id from uuid', () => {
      expect(getShortId('7e64875f-4a50-455f-bab2-44e938535e57')).toBe(
        '455f-bab2-44e938535e57'
      )
    })
  })
})

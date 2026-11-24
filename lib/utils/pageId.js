/**
 * 截取page-id的语言前缀
 * notionPageId的格式可以是 en:xxxxx
 * @param {*} str
 * @returns en|zh|xx
 */
function extractLangPrefix(str) {
  if (!str || typeof str !== 'string') return ''
  const trimmed = str.trim()
  if (/^https?:\/\//i.test(trimmed)) return ''
  const match = trimmed.match(/^([a-z]{2}(?:-[a-zA-Z0-9]+)?):/i)
  return match?.[1] || ''
}

/**
 * 截取page-id的id
 * notionPageId的格式可以是 en:xxxxx   * @param {*} str
 * @returns xxxxx
 */
function extractLangId(str) {
  if (!str || typeof str !== 'string') return ''
  const trimmed = str.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  const prefix = extractLangPrefix(trimmed)
  if (prefix) {
    return trimmed.slice(prefix.length + 1).trim()
  }
  return trimmed
}

/**
 * 列表中用过来区分page只需要端的id足够
 */

function getShortId(uuid) {
  if (!uuid?.includes('-')) {
    return uuid
  }
  return uuid.substring(14)
}

function toUuid(id) {
  const compactId = String(id || '').replace(/-/g, '')
  if (!/^[0-9a-fA-F]{32}$/.test(compactId)) return id

  return [
    compactId.slice(0, 8),
    compactId.slice(8, 12),
    compactId.slice(12, 16),
    compactId.slice(16, 20),
    compactId.slice(20)
  ].join('-')
}

/**
 * 从可能包含完整URL或参数的pageId字符串中，提取纯净的pageId (UUID) 和可选的viewId (UUID)
 * 支持格式：
 * - 32位hex或标准UUID：7e64875f4a50455fbab244e938535e57
 * - 带viewId参数：7e64875f4a50455fbab244e938535e57?v=a886285dbf4e4a56aaf410bd473aedc9
 * - Notion完整链接：https://app.notion.com/p/wangwenzhi/7e64875f4a50455fbab244e938535e57?v=a886285dbf4e4a56aaf410bd473aedc9
 * - 带语言前缀：en:https://... 或 zh:7e64875f...
 */
function extractPageIdAndViewId(str) {
  if (!str || typeof str !== 'string') {
    return { pageId: '', viewId: null }
  }
  const raw = extractLangId(str)
  let viewId = null
  const vMatch = raw.match(/[?&]v=([a-f0-9]{32}|[a-f0-9-]{36})/i)
  if (vMatch?.[1]) {
    viewId = toUuid(vMatch[1])
  }

  const cleanStr = raw.split(/[?#]/)[0]
  let pageId = ''
  const uuidMatches = cleanStr.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g)
  if (uuidMatches && uuidMatches.length > 0) {
    pageId = uuidMatches[uuidMatches.length - 1]
  } else {
    const hex32Matches = cleanStr.match(/[0-9a-fA-F]{32}/g)
    if (hex32Matches && hex32Matches.length > 0) {
      pageId = toUuid(hex32Matches[hex32Matches.length - 1])
    } else {
      pageId = cleanStr.trim()
    }
  }

  return { pageId, viewId }
}

module.exports = {
  extractLangPrefix,
  extractLangId,
  getShortId,
  extractPageIdAndViewId,
  toUuid
}

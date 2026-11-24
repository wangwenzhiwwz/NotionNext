jest.mock('notion-utils', () => ({
  idToUuid: hex => {
    const raw = String(hex).replace(/-/g, '')
    return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}-${raw.slice(16, 20)}-${raw.slice(20)}`
  }
}))

import getAllPageIds from '@/lib/db/notion/getAllPageIds'
import BLOG from '@/blog.config'

describe('getAllPageIds', () => {
  const collectionId = 'col-1'
  const view1 = '11111111-1111-1111-1111-111111111111'
  const view2 = '22222222-2222-2222-2222-222222222222'
  const view3 = '33333333-3333-3333-3333-333333333333'
  const viewIds = [view1, view2, view3]

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_NOTION_INDEX
    delete process.env.NOTION_INDEX
    delete process.env.NEXT_PUBLIC_NOTION_VIEW_ID
    delete process.env.NOTION_VIEW_ID
    BLOG.NOTION_INDEX = 0
    BLOG.NOTION_VIEW_ID = ''
  })

  it('selects explicitViewId when provided', () => {
    const collectionQuery = {
      [collectionId]: {
        [view1]: { blockIds: ['p-1', 'p-2'] },
        [view3]: { blockIds: ['p-3', 'p-4', 'p-5'] }
      }
    }

    const ids = getAllPageIds(
      collectionQuery,
      collectionId,
      {},
      viewIds,
      {},
      view3
    )

    expect(ids).toEqual(['p-3', 'p-4', 'p-5'])
  })

  it('extracts grouped reducers directly on viewData (e.g. results:select:...)', () => {
    const collectionQuery = {
      [collectionId]: {
        [view3]: {
          'results:select:AI': { blockIds: ['post-ai-1', 'post-ai-2'] },
          'results:select:Cloud': { blockIds: ['post-cloud-1'] },
          'results:select:Uncategorized': { blockIds: ['post-uncat-1'] }
        }
      }
    }

    const ids = getAllPageIds(
      collectionQuery,
      collectionId,
      {},
      viewIds,
      {},
      view3
    )

    expect(ids).toEqual([
      'post-ai-1',
      'post-ai-2',
      'post-cloud-1',
      'post-uncat-1'
    ])
  })

  it('extracts grouped reducers nested inside viewData.reducerResults', () => {
    const collectionQuery = {
      [collectionId]: {
        [view3]: {
          reducerResults: {
            'results:select:AI': { blockIds: ['post-ai-1'] },
            'results:select:Tech': { blockIds: ['post-tech-1'] }
          }
        }
      }
    }

    const ids = getAllPageIds(
      collectionQuery,
      collectionId,
      {},
      viewIds,
      {},
      view3
    )

    expect(ids).toEqual(['post-ai-1', 'post-tech-1'])
  })

  it('supports negative index in NOTION_INDEX (e.g. -1 for last view)', () => {
    BLOG.NOTION_INDEX = -1
    process.env.NEXT_PUBLIC_NOTION_INDEX = '-1'

    const collectionQuery = {
      [collectionId]: {
        [view1]: { blockIds: ['p-1'] },
        [view3]: { blockIds: ['last-view-p-1', 'last-view-p-2'] }
      }
    }

    const ids = getAllPageIds(collectionQuery, collectionId, {}, viewIds, {})
    expect(ids).toEqual(['last-view-p-1', 'last-view-p-2'])
  })

  it('unions all views when no target view is available in viewIds', () => {
    const collectionQuery = {
      [collectionId]: {
        [view1]: { blockIds: ['p-1', 'p-2'] },
        [view2]: { blockIds: ['p-3'] },
        [view3]: { 'results:select:AI': { blockIds: ['p-4', 'p-5'] } }
      }
    }

    const ids = getAllPageIds(collectionQuery, collectionId, {}, [], {})
    expect(ids).toEqual(['p-1', 'p-2', 'p-3', 'p-4', 'p-5'])
  })

  it('respects explicitly configured NOTION_INDEX=0', () => {
    process.env.NEXT_PUBLIC_NOTION_INDEX = '0'
    BLOG.NOTION_INDEX = 0

    const collectionQuery = {
      [collectionId]: {
        [view1]: { blockIds: ['p-1', 'p-2'] },
        [view2]: { blockIds: ['p-3'] }
      }
    }

    const ids = getAllPageIds(collectionQuery, collectionId, {}, viewIds, {})
    expect(ids).toEqual(['p-1', 'p-2'])
  })

  it('selects view when NOTION_INDEX is a UUID string', () => {
    process.env.NEXT_PUBLIC_NOTION_INDEX = view2
    BLOG.NOTION_INDEX = view2

    const collectionQuery = {
      [collectionId]: {
        [view1]: { blockIds: ['p-1'] },
        [view2]: { blockIds: ['p-view2'] }
      }
    }

    const ids = getAllPageIds(collectionQuery, collectionId, {}, viewIds, {})
    expect(ids).toEqual(['p-view2'])
  })

  it('selects view when BLOG.NOTION_VIEW_ID is set', () => {
    BLOG.NOTION_VIEW_ID = view2

    const collectionQuery = {
      [collectionId]: {
        [view1]: { blockIds: ['p-1'] },
        [view2]: { blockIds: ['p-view2-via-setting'] }
      }
    }

    const ids = getAllPageIds(collectionQuery, collectionId, {}, viewIds, {})
    expect(ids).toEqual(['p-view2-via-setting'])
  })

  it('falls back to page_sort when view has no query results', () => {
    const collectionView = {
      [view1]: {
        value: {
          value: {
            page_sort: ['sort-1', 'sort-2']
          }
        }
      }
    }

    const ids = getAllPageIds({}, collectionId, collectionView, viewIds, {}, view1)
    expect(ids).toEqual(['sort-1', 'sort-2'])
  })
})

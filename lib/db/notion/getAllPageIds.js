import BLOG from '@/blog.config'
import { idToUuid } from 'notion-utils'

export default function getAllPageIds(
  collectionQuery,
  collectionId,
  collectionView,
  viewIds,
  block = {},
  explicitViewId = null
) {
  const pageSet = new Set()

  // 1. Resolve target view ID
  let targetViewId = null
  const candidateTarget = explicitViewId || BLOG.NOTION_VIEW_ID

  if (candidateTarget) {
    targetViewId = findViewId(candidateTarget, viewIds, collectionView)
  }

  if (!targetViewId) {
    if (
      typeof BLOG.NOTION_INDEX === 'string' &&
      /^[0-9a-fA-F-]{32,36}$/.test(BLOG.NOTION_INDEX)
    ) {
      targetViewId = findViewId(BLOG.NOTION_INDEX, viewIds, collectionView)
    } else if (Array.isArray(viewIds) && viewIds.length > 0) {
      const idx = parseInt(BLOG.NOTION_INDEX ?? 0, 10)
      if (!isNaN(idx)) {
        targetViewId = idx < 0 ? viewIds[viewIds.length + idx] : viewIds[idx]
      }
    }
  }

  if (!targetViewId && Array.isArray(viewIds) && viewIds.length > 0) {
    targetViewId = viewIds[0]
  }

  // Collect query results from the selected view (or all views if none specified).
  // These respect Notion's view-level filters when a view is targeted.
  const viewQuery = getRecordById(collectionQuery, collectionId)
  let hasQueryData = false
  if (viewQuery) {
    const selectedViewData = targetViewId
      ? getRecordById(viewQuery, targetViewId)
      : null
    const queryData = selectedViewData
      ? [selectedViewData]
      : targetViewId
        ? []
        : Object.values(viewQuery)

    hasQueryData = queryData.length > 0
    queryData.forEach(viewData => {
      const collectionGroupBlockIds =
        viewData?.collection_group_results?.blockIds ??
        viewData?.reducerResults?.collection_group_results?.blockIds
      ;[
        collectionGroupBlockIds,
        viewData?.results?.blockIds,
        viewData?.blockIds
      ].forEach(ids => {
        if (Array.isArray(ids) && ids.length > 0) {
          ids.forEach(id => pageSet.add(id))
        }
      })

      // When views are grouped (e.g. by status, category, date, or board columns),
      // Notion puts grouped page IDs under reducers with keys like "results:select:..."
      // These can be direct properties on viewData or inside viewData.reducerResults
      const reducerSources = [viewData, viewData?.reducerResults].filter(
        source => source && typeof source === 'object'
      )
      reducerSources.forEach(source => {
        Object.entries(source).forEach(([key, reducer]) => {
          if (
            key !== 'collection_group_results' &&
            Array.isArray(reducer?.blockIds)
          ) {
            reducer.blockIds.forEach(id => pageSet.add(id))
          }
        })
      })
    })
  }

  // Only use page_sort when no query data exists (fallback for legacy payloads).
  // page_sort returns all pages in the view regardless of filters, so merging it
  // with filtered query results would bypass the filter — see #4127.
  if (!hasQueryData) {
    const viewsToScan = targetViewId
      ? [getRecordById(collectionView, targetViewId)]
      : collectionView && typeof collectionView === 'object'
        ? Object.values(collectionView)
        : []

    viewsToScan.forEach(view => {
      const pageSort =
        view?.value?.value?.page_sort ||
        view?.value?.page_sort ||
        view?.page_sort
      if (Array.isArray(pageSort) && pageSort.length > 0) {
        pageSort.forEach(id => pageSet.add(id))
      }
    })
  }

  return [...pageSet]
}

function findViewId(id, viewIds, collectionView) {
  if (!id || typeof id !== 'string') return null
  const candidates = getIdCandidates(id)
  if (Array.isArray(viewIds)) {
    for (const vId of viewIds) {
      for (const cand of candidates) {
        if (String(cand).toLowerCase() === String(vId).toLowerCase()) {
          return vId
        }
      }
    }
  }
  if (collectionView && typeof collectionView === 'object') {
    for (const vId of Object.keys(collectionView)) {
      for (const cand of candidates) {
        if (String(cand).toLowerCase() === String(vId).toLowerCase()) {
          return vId
        }
      }
    }
  }
  return null
}

function getRecordById(record, id) {
  if (!record || !id) return null

  for (const candidate of getIdCandidates(id)) {
    const value = record[candidate]
    if (value) return value
  }

  return null
}

function getIdCandidates(id) {
  const candidates = new Set([id])

  if (typeof id === 'string') {
    candidates.add(id.replace(/-/g, ''))
    candidates.add(toUuid(id))
    try {
      candidates.add(idToUuid(id))
    } catch (_) {
      // Keep the original id candidates when notion-utils cannot normalize it.
    }
  }

  return [...candidates]
}

function toUuid(id) {
  const compactId = id.replace(/-/g, '')
  if (!/^[0-9a-fA-F]{32}$/.test(compactId)) return id

  return [
    compactId.slice(0, 8),
    compactId.slice(8, 12),
    compactId.slice(12, 16),
    compactId.slice(16, 20),
    compactId.slice(20)
  ].join('-')
}

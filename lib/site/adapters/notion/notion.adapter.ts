import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import type { FetchSiteParams, SiteData } from '../../site.types'

/**
 * Reuse the established Notion catalog pipeline.
 *
 * The previous adapter called normalizeNotionSite(), which was only a
 * placeholder and returned empty collections even when Notion had returned
 * a valid record map. Keeping a second, incomplete parser here caused this
 * service path to silently lose all pages, navigation, categories and tags.
 */
export async function fetchSiteFromNotion(
  params: FetchSiteParams
): Promise<SiteData> {
  const siteData = await fetchGlobalAllData({
    pageId: params.pageId,
    from: params.from,
    locale: params.locale,
    requireAvailableData: true
  })

  if (!siteData || !Array.isArray(siteData.allPages)) {
    throw new Error('Notion site catalog returned an invalid data structure')
  }

  return siteData
}

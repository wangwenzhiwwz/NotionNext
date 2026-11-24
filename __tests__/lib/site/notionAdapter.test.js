jest.mock('@/lib/db/SiteDataApi', () => ({
  fetchGlobalAllData: jest.fn()
}))

const { fetchGlobalAllData } = require('@/lib/db/SiteDataApi')
const { fetchSiteFromNotion } = require('@/lib/site/adapters/notion/notion.adapter')

describe('fetchSiteFromNotion', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('uses the established catalog pipeline and preserves all returned pages', async () => {
    const siteData = {
      allPages: [{ id: 'page-1', slug: 'hello', type: 'Post', status: 'Published' }],
      allNavPages: [{ id: 'page-2', slug: 'about', title: 'About' }],
      allLinkPages: [],
      latestPosts: [],
      categoryOptions: [{ name: 'News' }],
      tagOptions: [{ name: 'JavaScript' }],
      customNav: [],
      customMenu: [],
      postCount: 1,
      NOTION_CONFIG: {},
      siteInfo: { title: 'Test', description: '', pageCover: '', icon: '', link: '' },
      notice: null
    }
    fetchGlobalAllData.mockResolvedValue(siteData)

    await expect(
      fetchSiteFromNotion({ pageId: 'root-page', from: 'test', locale: 'zh-CN' })
    ).resolves.toBe(siteData)

    expect(fetchGlobalAllData).toHaveBeenCalledWith({
      pageId: 'root-page',
      from: 'test',
      locale: 'zh-CN',
      requireAvailableData: true
    })
  })

  it('does not turn an unavailable Notion catalog into a successful empty result', async () => {
    fetchGlobalAllData.mockRejectedValue(new Error('Notion temporarily unavailable'))

    await expect(
      fetchSiteFromNotion({ pageId: 'root-page', from: 'test' })
    ).rejects.toThrow('Notion temporarily unavailable')
  })
})

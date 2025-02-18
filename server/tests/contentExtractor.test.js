const ContentExtractor = require('../services/contentExtractor');

describe('ContentExtractor', () => {
  test('full mode should extract entire page', async () => {
    const page = {
      evaluate: jest.fn().mockResolvedValue({
        content: [{
          title: 'Test Page',
          content: 'Full page content',
          metadata: { fullPage: true }
        }],
        links: ['http://test.com']
      })
    };

    const extractor = new ContentExtractor({});
    const result = await extractor.extractContent(page, 'full', 'http://test.com');
    
    expect(result.content[0].metadata.fullPage).toBe(true);
  });

  // Add more tests for different modes
});

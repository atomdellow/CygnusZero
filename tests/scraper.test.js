const ScraperService = require('../server/services/scraper');
const Source = require('../server/models/Source');
const Content = require('../server/models/Content');

jest.mock('puppeteer', () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      goto: jest.fn(),
      evaluate: jest.fn().mockResolvedValue({
        title: 'Test Title',
        content: 'Test Content',
        date: '2023-06-20'
      }),
      close: jest.fn()
    }),
    close: jest.fn()
  })
}));

describe('ScraperService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('scrapes content from source', async () => {
    const mockSource = {
      _id: 'sourceId',
      url: 'https://test.com',
      selectors: {
        title: '.title',
        content: '.content',
        date: '.date'
      }
    };

    await ScraperService.scrape(mockSource);

    expect(Content.create).toHaveBeenCalledWith(expect.objectContaining({
      source: 'sourceId',
      title: 'Test Title',
      content: 'Test Content'
    }));
  });

  test('schedules job for source', () => {
    const mockSource = {
      _id: 'sourceId',
      schedule: '*/30 * * * *'
    };

    ScraperService.scheduleJob(mockSource);
    expect(ScraperService.jobs.has('sourceId')).toBeTruthy();
  });
});

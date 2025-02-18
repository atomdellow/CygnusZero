const request = require('supertest');
const app = require('../server');
const Content = require('../server/models/Content');
const { authenticate } = require('../server/middleware/auth');

jest.mock('../server/middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    req.user = { _id: 'testUserId' };
    next();
  })
}));

describe('Content Routes', () => {
  beforeEach(async () => {
    await Content.deleteMany({});
  });

  describe('GET /api/content', () => {
    it('returns paginated content', async () => {
      // Create test content
      const contents = Array.from({ length: 15 }, (_, i) => ({
        title: `Test ${i}`,
        content: `Content ${i}`,
        date: new Date(),
        source: 'sourceId',
        user: 'testUserId'
      }));
      
      await Content.insertMany(contents);

      const res = await request(app)
        .get('/api/content')
        .query({ page: 1, limit: 10 });

      expect(res.statusCode).toBe(200);
      expect(res.body.contents.length).toBe(10);
      expect(res.body.total).toBe(15);
      expect(res.body.pages).toBe(2);
    });

    it('filters content by search term', async () => {
      await Content.create({
        title: 'Specific title',
        content: 'Test content',
        date: new Date(),
        source: 'sourceId',
        user: 'testUserId'
      });

      const res = await request(app)
        .get('/api/content')
        .query({ search: 'specific' });

      expect(res.statusCode).toBe(200);
      expect(res.body.contents.length).toBe(1);
      expect(res.body.contents[0].title).toBe('Specific title');
    });
  });
});

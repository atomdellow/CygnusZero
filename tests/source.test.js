const request = require('supertest');
const app = require('../server');
const Source = require('../server/models/Source');
const { authenticate } = require('../server/middleware/auth');

jest.mock('../server/middleware/auth', () => ({
  authenticate: jest.fn((req, res, next) => {
    req.user = { _id: 'testUserId' };
    next();
  })
}));

describe('Source Routes', () => {
  beforeEach(async () => {
    await Source.deleteMany({});
  });

  describe('POST /api/source', () => {
    it('creates new source with valid data', async () => {
      const sourceData = {
        url: 'https://test.com',
        schedule: '*/30 * * * *',
        contentType: 'article',
        selectors: {
          title: '.title',
          content: '.content',
          date: '.date'
        }
      };

      const res = await request(app)
        .post('/api/source')
        .send(sourceData);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.url).toBe(sourceData.url);
    });
  });

  describe('GET /api/source', () => {
    it('returns user sources', async () => {
      await Source.create({
        url: 'https://test.com',
        schedule: '*/30 * * * *',
        contentType: 'article',
        selectors: {
          title: '.title',
          content: '.content',
          date: '.date'
        },
        user: 'testUserId'
      });

      const res = await request(app)
        .get('/api/source');

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(1);
    });
  });
});

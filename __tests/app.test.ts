/* eslint-disable no-undef */
import request from 'supertest';
import { app } from '../src/app';

jest.mock('../src/models/Invoice');

describe('App Test', () => {
  test('GET /random-url should return 404', (done) => {
    request(app).get('/reset').expect(404, done);
  });

  test('GET /invoices/all should return 401', (done) => {
    request(app).get('/api/invoices').expect(401, done);
  });
});

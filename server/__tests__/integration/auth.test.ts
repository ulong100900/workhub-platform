import request from 'supertest';
import { app } from '../src/index';

describe('Authentication', () => {
  it('should register a new user', async () => {
    const userData = {
      email: `test${Date.now()}@example.com`,
      password: 'Test123!',
      name: 'Test User'
    };

    const res = await request(app)
      .post('/api/auth/register')
      .send(userData);

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
  });

  it('should login with correct credentials', async () => {
    const credentials = {
      email: 'test@example.com',
      password: 'Test123!'
    };

    const res = await request(app)
      .post('/api/auth/login')
      .send(credentials);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should reject invalid credentials', async () => {
    const credentials = {
      email: 'wrong@example.com',
      password: 'wrongpassword'
    };

    const res = await request(app)
      .post('/api/auth/login')
      .send(credentials);

    expect(res.statusCode).toEqual(401);
  });
});
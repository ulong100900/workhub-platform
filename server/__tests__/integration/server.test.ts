// Копируй весь этот код в файл:

import request from 'supertest';
import { app } from '../src/index'; // или твой путь к app

describe('Server Health Checks', () => {
  it('should respond with 200 on health check', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });

  it('should respond with 404 for unknown routes', async () => {
    const res = await request(app).get('/unknown-route');
    expect(res.statusCode).toEqual(404);
  });
});
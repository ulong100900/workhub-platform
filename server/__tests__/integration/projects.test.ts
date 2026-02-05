import request from 'supertest';
import { app } from '../src/index';

describe('Projects API', () => {
  let authToken: string;

  beforeAll(async () => {
    // Логинимся чтобы получить токен
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Test123!'
      });
    
    authToken = loginRes.body.token;
  });

  it('should create a new project', async () => {
    const projectData = {
      title: 'Website Development',
      description: 'Need a website for my business',
      budget: 5000,
      deadline: '2024-12-31'
    };

    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send(projectData);

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toEqual(projectData.title);
  });

  it('should get list of projects', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });
});
import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/db';

describe('Project API Unit & Authorization Tests', () => {
  let user1Token = '';
  let user2Token = '';
  let user1ProjectId = '';

  beforeAll(async () => {
    // Register User 1
    const u1Res = await request(app).post('/api/auth/register').send({
      fullName: 'User One',
      email: `user1_${Date.now()}@example.com`,
      password: 'Password123!',
    });
    user1Token = u1Res.body.token;

    // Register User 2
    const u2Res = await request(app).post('/api/auth/register').send({
      fullName: 'User Two',
      email: `user2_${Date.now()}@example.com`,
      password: 'Password123!',
    });
    user2Token = u2Res.body.token;
  });

  afterAll(async () => {
    try {
      await prisma.project.deleteMany();
      await prisma.user.deleteMany();
      await prisma.$disconnect();
    } catch (e) {}
  });

  it('should create a project for User 1', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        name: 'Mobile App Redesign',
        description: 'Complete overhaul of mobile UI',
        status: 'In Progress',
        startDate: new Date().toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.name).toBe('Mobile App Redesign');
    expect(res.body.data.status).toBe('In Progress');
    user1ProjectId = res.body.data.id;
  });

  it('should list projects belonging only to User 1', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.pagination).toBeDefined();
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(1);
  });

  it('CRITICAL AUTHORIZATION: User 2 must NOT be able to view User 1 project by ID', async () => {
    const res = await request(app)
      .get(`/api/projects/${user1ProjectId}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  it('CRITICAL AUTHORIZATION: User 2 must NOT be able to update User 1 project', async () => {
    const res = await request(app)
      .put(`/api/projects/${user1ProjectId}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        name: 'Hacked Project Name',
      });

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  it('should update project successfully by the owner (User 1)', async () => {
    const res = await request(app)
      .put(`/api/projects/${user1ProjectId}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        status: 'Completed',
        description: 'Updated description',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Completed');
    expect(res.body.data.description).toBe('Updated description');
  });

  it('should filter projects by status and search by name', async () => {
    const res = await request(app)
      .get('/api/projects?status=Completed&search=Mobile')
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].id).toBe(user1ProjectId);
  });

  it('CRITICAL AUTHORIZATION: User 2 must NOT be able to delete User 1 project', async () => {
    const res = await request(app)
      .delete(`/api/projects/${user1ProjectId}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  it('should delete project successfully by the owner (User 1)', async () => {
    const res = await request(app)
      .delete(`/api/projects/${user1ProjectId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');

    // Confirm deletion
    const checkRes = await request(app)
      .get(`/api/projects/${user1ProjectId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(checkRes.status).toBe(404);
  });
});

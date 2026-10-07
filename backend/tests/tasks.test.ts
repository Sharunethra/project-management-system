import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/db';

describe('Task API Unit, Authorization & Completion Tests', () => {
  let user1Token = '';
  let user2Token = '';
  let user1ProjectId = '';
  let taskId = '';

  beforeAll(async () => {
    // Register User 1
    const u1Res = await request(app).post('/api/auth/register').send({
      fullName: 'Task User One',
      email: `task_u1_${Date.now()}@example.com`,
      password: 'Password123!',
    });
    user1Token = u1Res.body.token;

    // Register User 2
    const u2Res = await request(app).post('/api/auth/register').send({
      fullName: 'Task User Two',
      email: `task_u2_${Date.now()}@example.com`,
      password: 'Password123!',
    });
    user2Token = u2Res.body.token;

    // Create a project for User 1
    const pRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        name: 'Backend API Integration',
        status: 'In Progress',
      });
    user1ProjectId = pRes.body.data.id;
  });

  afterAll(async () => {
    try {
      await prisma.task.deleteMany();
      await prisma.project.deleteMany();
      await prisma.user.deleteMany();
      await prisma.$disconnect();
    } catch (e) {}
  });

  it('CRITICAL AUTHORIZATION: User 2 cannot create task in User 1 project', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        projectId: user1ProjectId,
        name: 'Malicious task injection',
        priority: 'High',
        status: 'Pending',
      });

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  it('should successfully create a task for User 1', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        projectId: user1ProjectId,
        name: 'Implement JWT Auth',
        description: 'Set up token authentication and security middleware',
        priority: 'High',
        status: 'In Progress',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.name).toBe('Implement JWT Auth');
    expect(res.body.data.priority).toBe('High');
    expect(res.body.data.status).toBe('In Progress');
    taskId = res.body.data.id;
  });

  it('CRITICAL ACTION: should mark task as completed', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        status: 'Completed',
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.status).toBe('Completed');
  });

  it('should update task priority to Low', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        priority: 'Low',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.priority).toBe('Low');
  });

  it('CRITICAL AUTHORIZATION: User 2 must NOT be able to view User 1 task', async () => {
    const res = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  it('CRITICAL AUTHORIZATION: User 2 must NOT be able to modify User 1 task', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        name: 'Hacked task title',
      });

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  it('CRITICAL AUTHORIZATION: User 2 must NOT be able to delete User 1 task', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res.status).toBe(404);
    expect(res.body.status).toBe('error');
  });

  it('should delete task successfully by the owner (User 1)', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
  });
});

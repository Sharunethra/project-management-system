import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/db';

describe('Dashboard Statistics Tests', () => {
  let userToken = '';

  beforeAll(async () => {
    // Register User
    const uRes = await request(app).post('/api/auth/register').send({
      fullName: 'Dashboard User',
      email: `dash_${Date.now()}@example.com`,
      password: 'Password123!',
    });
    userToken = uRes.body.token;

    // Create 1 In Progress project and 1 Completed project
    const p1 = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Project A', status: 'In Progress' });

    const p2 = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Project B', status: 'Completed' });

    // Create 1 Pending task and 1 Completed task
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        projectId: p1.body.data.id,
        name: 'Task 1',
        status: 'Pending',
        priority: 'High',
      });

    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        projectId: p2.body.data.id,
        name: 'Task 2',
        status: 'Completed',
        priority: 'Low',
      });
  });

  afterAll(async () => {
    try {
      await prisma.task.deleteMany();
      await prisma.project.deleteMany();
      await prisma.user.deleteMany();
      await prisma.$disconnect();
    } catch (e) {}
  });

  it('should return exact 5 required statistics for the authenticated user', async () => {
    const res = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toBeDefined();

    const stats = res.body.data;
    expect(stats.totalProjects).toBe(2);
    expect(stats.totalTasks).toBe(2);
    expect(stats.completedTasks).toBe(1);
    expect(stats.pendingTasks).toBe(1);
    expect(stats.projectsInProgress).toBe(1);
  });
});

import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/db';

describe('Cross-Platform Web <-> Mobile Shared Synchronization Tests', () => {
  const syncUser = {
    fullName: 'Sync Tester',
    email: `sync_user_${Date.now()}@example.com`,
    password: 'Password123!',
  };

  let webAuthToken = '';
  let mobileAuthToken = '';
  let sharedProjectId = '';
  let sharedTaskId = '';

  beforeAll(async () => {
    // 1. User registers via Web client
    const webRegRes = await request(app)
      .post('/api/auth/register')
      .send(syncUser);

    expect(webRegRes.status).toBe(201);
    webAuthToken = webRegRes.body.token;

    // 2. Mobile client logs in using the EXACT SAME account
    const mobileLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: syncUser.email,
        password: syncUser.password,
      });

    expect(mobileLoginRes.status).toBe(200);
    expect(mobileLoginRes.body.user.email).toBe(syncUser.email.toLowerCase());
    mobileAuthToken = mobileLoginRes.body.token;
  });

  afterAll(async () => {
    try {
      await prisma.task.deleteMany();
      await prisma.project.deleteMany();
      await prisma.user.deleteMany({ where: { email: syncUser.email.toLowerCase() } });
      await prisma.$disconnect();
    } catch (e) {}
  });

  // TEST A: Web creates Project & Task -> Mobile refreshes & sees them
  it('TEST A: Project & Task created on Web must appear on Mobile after refresh', async () => {
    // Web creates project
    const projRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${webAuthToken}`)
      .send({
        name: 'Shared Cross-Platform Project',
        description: 'Created on Web client',
        status: 'In Progress',
      });

    expect(projRes.status).toBe(201);
    sharedProjectId = projRes.body.data.id;

    // Web creates task
    const taskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${webAuthToken}`)
      .send({
        projectId: sharedProjectId,
        name: 'Task Created on Web',
        description: 'Should appear on Android',
        priority: 'High',
        status: 'Pending',
      });

    expect(taskRes.status).toBe(201);
    sharedTaskId = taskRes.body.data.id;

    // Mobile simulates pull-to-refresh
    const mobileProjects = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${mobileAuthToken}`);

    expect(mobileProjects.status).toBe(200);
    const foundProj = mobileProjects.body.data.find((p: any) => p.id === sharedProjectId);
    expect(foundProj).toBeDefined();
    expect(foundProj.name).toBe('Shared Cross-Platform Project');

    const mobileTasks = await request(app)
      .get(`/api/tasks?projectId=${sharedProjectId}`)
      .set('Authorization', `Bearer ${mobileAuthToken}`);

    expect(mobileTasks.status).toBe(200);
    const foundTask = mobileTasks.body.data.find((t: any) => t.id === sharedTaskId);
    expect(foundTask).toBeDefined();
    expect(foundTask.name).toBe('Task Created on Web');
    expect(foundTask.status).toBe('Pending');
  });

  // TEST B: Mobile updates task status to Completed -> Web refreshes & sees it Completed
  it('TEST B: Task status updated on Mobile to Completed must appear on Web', async () => {
    // Mobile updates task status
    const updateRes = await request(app)
      .put(`/api/tasks/${sharedTaskId}`)
      .set('Authorization', `Bearer ${mobileAuthToken}`)
      .send({
        status: 'Completed',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.status).toBe('Completed');

    // Web simulates reload/refresh
    const webTaskRes = await request(app)
      .get(`/api/tasks/${sharedTaskId}`)
      .set('Authorization', `Bearer ${webAuthToken}`);

    expect(webTaskRes.status).toBe(200);
    expect(webTaskRes.body.data.status).toBe('Completed');
  });

  // TEST C: Web deletes Task -> Mobile pull-to-refresh confirms deletion
  it('TEST C: Task deleted on Web must not exist on Mobile after refresh', async () => {
    // Web deletes task
    const delRes = await request(app)
      .delete(`/api/tasks/${sharedTaskId}`)
      .set('Authorization', `Bearer ${webAuthToken}`);

    expect(delRes.status).toBe(200);

    // Mobile pull to refresh
    const mobileCheck = await request(app)
      .get(`/api/tasks/${sharedTaskId}`)
      .set('Authorization', `Bearer ${mobileAuthToken}`);

    expect(mobileCheck.status).toBe(404);
  });

  // TEST D: Mobile creates Task -> Web refresh sees it appear
  let mobileCreatedTaskId = '';
  it('TEST D: Task created on Mobile must appear on Web after refresh', async () => {
    // Mobile creates task
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${mobileAuthToken}`)
      .send({
        projectId: sharedProjectId,
        name: 'Task Created on Mobile',
        priority: 'Medium',
        status: 'Pending',
      });

    expect(createRes.status).toBe(201);
    mobileCreatedTaskId = createRes.body.data.id;

    // Web refreshes
    const webTasks = await request(app)
      .get(`/api/tasks?projectId=${sharedProjectId}`)
      .set('Authorization', `Bearer ${webAuthToken}`);

    expect(webTasks.status).toBe(200);
    const found = webTasks.body.data.find((t: any) => t.id === mobileCreatedTaskId);
    expect(found).toBeDefined();
    expect(found.name).toBe('Task Created on Mobile');
  });

  // TEST E: Web edits Task -> Mobile pull-to-refresh sees update
  it('TEST E: Task edited on Web must appear updated on Mobile after refresh', async () => {
    // Web edits task
    const editRes = await request(app)
      .put(`/api/tasks/${mobileCreatedTaskId}`)
      .set('Authorization', `Bearer ${webAuthToken}`)
      .send({
        name: 'Task Created on Mobile (Edited on Web)',
        priority: 'High',
      });

    expect(editRes.status).toBe(200);

    // Mobile refreshes
    const mobileTaskRes = await request(app)
      .get(`/api/tasks/${mobileCreatedTaskId}`)
      .set('Authorization', `Bearer ${mobileAuthToken}`);

    expect(mobileTaskRes.status).toBe(200);
    expect(mobileTaskRes.body.data.name).toBe('Task Created on Mobile (Edited on Web)');
    expect(mobileTaskRes.body.data.priority).toBe('High');
  });

  // TEST F: Mobile edits Task -> Web refresh sees update
  it('TEST F: Task edited on Mobile must appear updated on Web after refresh', async () => {
    // Mobile edits task
    const editRes = await request(app)
      .put(`/api/tasks/${mobileCreatedTaskId}`)
      .set('Authorization', `Bearer ${mobileAuthToken}`)
      .send({
        status: 'In Progress',
        priority: 'Low',
      });

    expect(editRes.status).toBe(200);

    // Web refreshes
    const webTaskRes = await request(app)
      .get(`/api/tasks/${mobileCreatedTaskId}`)
      .set('Authorization', `Bearer ${webAuthToken}`);

    expect(webTaskRes.status).toBe(200);
    expect(webTaskRes.body.data.status).toBe('In Progress');
    expect(webTaskRes.body.data.priority).toBe('Low');
  });
});

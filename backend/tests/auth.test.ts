import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/db';

describe('Auth API Unit & Integration Tests', () => {
  const testUser = {
    fullName: 'Alex Test',
    email: `alex_${Date.now()}@example.com`,
    password: 'Password123!',
  };

  let authToken = '';

  beforeAll(async () => {
    // Setup
  });

  afterAll(async () => {
    // Clean up created user
    try {
      await prisma.user.deleteMany({
        where: { email: { contains: 'test' } },
      });
      await prisma.$disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
  });

  it('should successfully register a new user', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.user.passwordHash).toBeUndefined(); // Sensitive data not exposed
    expect(res.body.user.password).toBeUndefined();
  });

  it('should reject registration with duplicate email', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toMatch(/already exists/i);
  });

  it('should reject registration with invalid email format', async () => {
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Alex Invalid',
      email: 'not-an-email',
      password: 'Password123!',
    });

    expect(res.status).toBe(400);
    expect(res.body.status).toBe('error');
  });

  it('should successfully log in with valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email.toLowerCase());
    authToken = res.body.token;
  });

  it('should reject login with invalid password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: 'WrongPassword123!',
    });

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toMatch(/invalid email or password/i);
  });

  it('should reject access to protected endpoint without token', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('should get authenticated user profile with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.user.email).toBe(testUser.email.toLowerCase());
  });

  it('should successfully handle user logout', async () => {
    const res = await request(app).post('/api/auth/logout');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
  });
});

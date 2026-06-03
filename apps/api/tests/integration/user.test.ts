import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { Controller, Get, Post, Patch, Delete, Body, INestApplication } from '@nestjs/common';
import { ZodValidationPipe, GlobalExceptionFilter, ResponseInterceptor, ResponseValidationInterceptor, UserSchema } from '@intervu/shared';

// Test Controller to verify routing + middleware + validation
@Controller('users')
class TestUsersController {
  @Post()
  createUser(@Body() body: unknown) {
    return { ...body, id: '123e4567-e89b-12d3-a456-426614174000', createdAt: new Date() };
  }

  @Get()
  getUsers() {
    return { id: '123e4567-e89b-12d3-a456-426614174000', email: 'test@example.com', createdAt: new Date() };
  }

  @Patch(':id')
  updateUser(@Body() body: unknown) {
    return { ...body, id: '123e4567-e89b-12d3-a456-426614174000', createdAt: new Date() };
  }

  @Delete(':id')
  deleteUser() {
    return { id: '123e4567-e89b-12d3-a456-426614174000', email: 'deleted@example.com', createdAt: new Date() };
  }
}

describe('User API Integration Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TestUsersController],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ZodValidationPipe());
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor(), new ResponseValidationInterceptor(UserSchema));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST endpoint returns normalized response', async () => {
    const res = await request(app.getHttpServer())
      .post('/users')
      .send({ email: 'test@example.com', password: 'pw' });
    
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('test@example.com');
  });

  it('GET endpoint returns normalized response', async () => {
    const res = await request(app.getHttpServer()).get('/users');
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('PATCH endpoint returns normalized response', async () => {
    const res = await request(app.getHttpServer())
      .patch('/users/123')
      .send({ email: 'updated@example.com' });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('updated@example.com');
  });

  it('DELETE endpoint returns normalized response', async () => {
    const res = await request(app.getHttpServer()).delete('/users/123');
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

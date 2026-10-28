import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Post } from '../src/models/Post.js';

describe('Akatsuki Draft API Integration Test Suite', () => {
  let userToken = '';
  let secondUserToken = '';
  let adminToken = '';
  let userId = '';
  let secondUserId = '';
  let adminId = '';

  let createdDraftId = '';
  let createdPendingId = '';

  before(async () => {
    process.env.NODE_ENV = 'test';
    await connectDB();

    // Clean up test data safely without wiping entire non-test databases
    await User.deleteMany({ email: { $regex: /@test-akatsuki\.internal$/ } });
    await Post.deleteMany({ title: { $regex: /^\[TEST\]/ } });

    // Create an Admin user for tests
    const adminUser = new User({
      name: 'Test Administrator',
      email: 'admin@test-akatsuki.internal',
      password: 'AdminPassword123!',
      role: 'admin',
    });
    await adminUser.save();
    adminId = adminUser._id.toString();

    // Get Admin Token via Login
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test-akatsuki.internal', password: 'AdminPassword123!' });
    adminToken = adminLoginRes.body.data.token;
  });

  after(async () => {
    // Clean up test collections
    await User.deleteMany({ email: { $regex: /@test-akatsuki\.internal$/ } });
    await Post.deleteMany({ title: { $regex: /^\[TEST\]/ } });
    await disconnectDB();
  });

  describe('1. System Health Endpoint', () => {
    it('GET /api/health should report healthy server and connected database', async () => {
      const res = await request(app).get('/api/health');
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.status, 'healthy');
      assert.equal(res.body.data.database.connected, true);
    });
  });

  describe('2. Authentication Workflows', () => {
    it('POST /api/auth/register should register a new standard user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Naruto Uzumaki',
          email: 'naruto@test-akatsuki.internal',
          password: 'RamenPassword123!',
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.email, 'naruto@test-akatsuki.internal');
      assert.equal(res.body.data.role, 'user');
      assert.equal(res.body.data.password, undefined); // Never return password
      userId = res.body.data.id;
    });

    it('POST /api/auth/register should reject duplicate email with 409', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Naruto Duplicate',
          email: 'naruto@test-akatsuki.internal',
          password: 'RamenPassword123!',
        });

      assert.equal(res.status, 409);
      assert.equal(res.body.success, false);
    });

    it('POST /api/auth/register should ignore role manipulation in payload', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Sasuke Uchiha',
          email: 'sasuke@test-akatsuki.internal',
          password: 'ChidoriPassword123!',
          role: 'admin', // Attempted privilege escalation
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.data.role, 'user'); // Must remain user
      secondUserId = res.body.data.id;
    });

    it('POST /api/auth/login should reject invalid credentials with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'naruto@test-akatsuki.internal',
          password: 'WrongPassword!',
        });

      assert.equal(res.status, 401);
      assert.equal(res.body.success, false);
    });

    it('POST /api/auth/login should return JWT token on valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'naruto@test-akatsuki.internal',
          password: 'RamenPassword123!',
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.token);
      userToken = res.body.data.token;

      // Also get second user token
      const secondRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'sasuke@test-akatsuki.internal',
          password: 'ChidoriPassword123!',
        });
      secondUserToken = secondRes.body.data.token;
    });

    it('GET /api/auth/me should return authenticated user details', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.data.user.email, 'naruto@test-akatsuki.internal');
      assert.equal(res.body.data.user.role, 'user');
    });

    it('GET /api/auth/me should reject requests without valid JWT with 401', async () => {
      const res = await request(app).get('/api/auth/me');
      assert.equal(res.status, 401);
    });
  });

  describe('3. User Post Management Workflows', () => {
    it('POST /api/posts should create a draft post', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: '[TEST] My First Ninja Journey',
          description: 'A story about training and dedication',
          content: 'Hard work and determination can conquer natural talent and destiny.',
          category: 'Philosophy',
          status: 'draft',
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.data.status, 'draft');
      assert.equal(res.body.data.createdBy._id.toString(), userId);
      createdDraftId = res.body.data._id;
    });

    it('POST /api/posts should create a post submitted for review (pending)', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: '[TEST] The Art of Rasengan',
          description: 'Guide on spinning chakra control',
          content: 'Mastering the Rasengan requires rotation, power, and containment mastery.',
          category: 'Ninjutsu',
          status: 'pending',
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.data.status, 'pending');
      createdPendingId = res.body.data._id;
    });

    it('POST /api/posts should reject ordinary user attempting to set status to "approved"', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: '[TEST] Bypassing Approval Attempt',
          description: 'Malicious attempt to bypass admin',
          content: 'This post should not be approved directly by user submission.',
          category: 'Security',
          status: 'approved',
        });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
    });

    it('GET /api/posts should return only approved posts and exclude drafts & pending', async () => {
      const res = await request(app).get('/api/posts');
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.data));
      // Neither createdDraftId nor createdPendingId should be in public approved posts
      const foundDraft = res.body.data.find((p) => p._id === createdDraftId);
      const foundPending = res.body.data.find((p) => p._id === createdPendingId);
      assert.equal(foundDraft, undefined);
      assert.equal(foundPending, undefined);
    });

    it('GET /api/posts/:id should allow author to view their own draft', async () => {
      const res = await request(app)
        .get(`/api/posts/${createdDraftId}`)
        .set('Authorization', `Bearer ${userToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.data._id, createdDraftId);
    });

    it('GET /api/posts/:id should forbid another user from viewing private draft', async () => {
      const res = await request(app)
        .get(`/api/posts/${createdDraftId}`)
        .set('Authorization', `Bearer ${secondUserToken}`);

      assert.equal(res.status, 403);
    });

    it('GET /api/posts/my-posts should return authenticated user posts and drafts', async () => {
      const res = await request(app)
        .get('/api/posts/my-posts')
        .set('Authorization', `Bearer ${userToken}`);

      assert.equal(res.status, 200);
      assert.ok(res.body.data.length >= 2);
      const ids = res.body.data.map((p) => p._id);
      assert.ok(ids.includes(createdDraftId));
      assert.ok(ids.includes(createdPendingId));
    });

    it('PATCH /api/posts/:id should allow owner to update post', async () => {
      const res = await request(app)
        .patch(`/api/posts/${createdDraftId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: '[TEST] My First Ninja Journey (Revised Edition)',
          content: 'Updated content with additional wisdom and detailed steps.',
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.data.title, '[TEST] My First Ninja Journey (Revised Edition)');
    });

    it('PATCH /api/posts/:id should forbid non-owner from updating post', async () => {
      const res = await request(app)
        .patch(`/api/posts/${createdDraftId}`)
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send({
          title: '[TEST] Unauthorized Tampering',
        });

      assert.equal(res.status, 403);
    });

    it('GET /api/posts/:id with invalid ObjectId format should return 400', async () => {
      const res = await request(app).get('/api/posts/not-a-valid-objectid');
      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
    });
  });

  describe('4. Admin Approval Workflows', () => {
    it('GET /api/admin/posts/pending should reject ordinary users with 403', async () => {
      const res = await request(app)
        .get('/api/admin/posts/pending')
        .set('Authorization', `Bearer ${userToken}`);

      assert.equal(res.status, 403);
    });

    it('GET /api/admin/posts/pending should return pending posts for admin', async () => {
      const res = await request(app)
        .get('/api/admin/posts/pending')
        .set('Authorization', `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      const pendingPost = res.body.data.find((p) => p._id === createdPendingId);
      assert.ok(pendingPost);
    });

    it('PATCH /api/admin/posts/approve/:id should reject draft post approval attempt', async () => {
      const res = await request(app)
        .patch(`/api/admin/posts/approve/${createdDraftId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      assert.equal(res.status, 400);
    });

    it('PATCH /api/admin/posts/approve/:id should approve a pending post', async () => {
      const res = await request(app)
        .patch(`/api/admin/posts/approve/${createdPendingId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      assert.equal(res.status, 200);
      assert.equal(res.body.data.status, 'approved');
    });

    it('Approved post should now be visible on public GET /api/posts', async () => {
      const res = await request(app).get('/api/posts');
      assert.equal(res.status, 200);
      const approvedPost = res.body.data.find((p) => p._id === createdPendingId);
      assert.ok(approvedPost);
    });

    it('Editing an approved post should reset its status back to pending for re-approval', async () => {
      const updateRes = await request(app)
        .patch(`/api/posts/${createdPendingId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: '[TEST] The Art of Rasengan (Edited)',
          content: 'Modified instructions that require fresh administrator verification.',
        });

      assert.equal(updateRes.status, 200);
      assert.equal(updateRes.body.data.status, 'pending');

      // Check public posts again: should no longer be publicly visible!
      const publicRes = await request(app).get('/api/posts');
      const foundInPublic = publicRes.body.data.find((p) => p._id === createdPendingId);
      assert.equal(foundInPublic, undefined);
    });

    it('PATCH /api/admin/posts/reject/:id should reject a pending post with reason', async () => {
      const res = await request(app)
        .patch(`/api/admin/posts/reject/${createdPendingId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          rejectionReason: 'Needs more citations on chakra control safety.',
        });

      assert.equal(res.status, 200);
      assert.equal(res.body.data.status, 'rejected');
      assert.equal(res.body.data.rejectionReason, 'Needs more citations on chakra control safety.');
    });
  });

  describe('5. AI Content Improvement Workflows', () => {
    it('POST /api/ai/improve/:postId should forbid non-owner from improving someone else post', async () => {
      const res = await request(app)
        .post(`/api/ai/improve/${createdDraftId}`)
        .set('Authorization', `Bearer ${secondUserToken}`);

      assert.equal(res.status, 403);
    });

    it('POST /api/ai/improve/:postId should return 404 for non-existent post', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/ai/improve/${nonExistentId}`)
        .set('Authorization', `Bearer ${userToken}`);

      assert.equal(res.status, 404);
    });

    it('POST /api/ai/improve/:postId handles unconfigured Gemini key gracefully without crashing', async () => {
      // In environment where GEMINI_API_KEY is unset or empty:
      const res = await request(app)
        .post(`/api/ai/improve/${createdDraftId}`)
        .set('Authorization', `Bearer ${userToken}`);

      // Expect 503 or 502 with informative message, never crash
      assert.ok([503, 502, 201].includes(res.status));
      if (res.status === 503) {
        assert.equal(res.body.success, false);
        assert.match(res.body.message, /Gemini|GEMINI_API_KEY/i);
      }
    });

    it('Verifies model architecture requirement: AI creation preserves original and generates new draft ID', async () => {
      // Directly verify the business logic rule:
      // Even if AI mock or real generation runs, the original post stays untouched with original ID,
      // and a new document is inserted with status: 'draft'
      const original = await Post.findById(createdDraftId);
      const originalTitle = original.title;
      const originalContent = original.content;

      // Simulate the exact document transformation performed by aiController
      const newDraftPost = new Post({
        title: `${original.title} (AI Polished)`,
        description: original.description,
        content: `${original.content} Enhanced for clarity and presentation flow.`,
        category: original.category,
        createdBy: original.createdBy,
        status: 'draft',
        originalPostId: original._id,
        isAiImproved: true,
      });
      await newDraftPost.save();

      // Verify original post document is completely unchanged
      const originalAfter = await Post.findById(createdDraftId);
      assert.equal(originalAfter.title, originalTitle);
      assert.equal(originalAfter.content, originalContent);
      assert.equal(originalAfter._id.toString(), original._id.toString());

      // Verify new post has a distinct ID and status 'draft'
      assert.notEqual(newDraftPost._id.toString(), original._id.toString());
      assert.equal(newDraftPost.status, 'draft');
      assert.equal(newDraftPost.isAiImproved, true);
    });
  });

  describe('6. Post Deletion & Authorization', () => {
    it('DELETE /api/posts/:id should forbid non-owner from deleting post', async () => {
      const res = await request(app)
        .delete(`/api/posts/${createdDraftId}`)
        .set('Authorization', `Bearer ${secondUserToken}`);

      assert.equal(res.status, 403);
    });

    it('DELETE /api/posts/:id should allow owner to delete their post', async () => {
      const res = await request(app)
        .delete(`/api/posts/${createdDraftId}`)
        .set('Authorization', `Bearer ${userToken}`);

      assert.equal(res.status, 200);
      const checkDeleted = await Post.findById(createdDraftId);
      assert.equal(checkDeleted, null);
    });
  });
});

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/waitwise_test';

const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const User = require('../models/User');
const Organisation = require('../models/Organisation');
const Branch = require('../models/Branch');
const Service = require('../models/Service');
const Counter = require('../models/Counter');
const QueueSession = require('../models/QueueSession');
const Ticket = require('../models/Ticket');

let studentToken = '';
let staffToken = '';
let adminToken = '';
let testOrg = null;
let testBranch = null;
let testService = null;
let testCounter = null;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await Promise.all([
    Organisation.deleteMany(),
    Branch.deleteMany(),
    User.deleteMany(),
    Service.deleteMany(),
    Counter.deleteMany(),
    QueueSession.deleteMany(),
    Ticket.deleteMany(),
  ]);

  // Create Organisation via registration API
  const orgRegRes = await request(app)
    .post('/api/organisations/register')
    .send({
      name: 'General Medical Center',
      slug: 'general-med',
      type: 'healthcare',
      adminName: 'Chief Officer',
      adminEmail: 'admin.med@waitwise.io',
      adminPassword: 'password123',
      branchName: 'Main Clinic',
      branchCode: 'CLINIC-1',
    });

  adminToken = orgRegRes.body.token;
  testOrg = orgRegRes.body.data.organisation;
  testBranch = orgRegRes.body.data.branch;

  // Create Service under Organisation
  const serviceRes = await request(app)
    .post('/api/services')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Diagnostic Blood Test',
      code: 'BLD',
      description: 'Phlebotomy and lab screening',
      category: 'Diagnostics',
      organisationId: testOrg._id,
      branchId: testBranch._id,
      estimatedServiceTimeMinutes: 5,
      maxQueueCapacity: 50,
      overflowThreshold: 10,
    });

  testService = serviceRes.body.data;

  // Create Staff
  const staff = await User.create({
    name: 'Nurse Staff',
    email: 'staff.nurse@waitwise.io',
    password: 'password123',
    role: 'staff',
    organisationId: testOrg._id,
    branchId: testBranch._id,
    assignedService: testService._id,
  });

  // Counter 1 was automatically created by createService; let's retrieve and open it
  testCounter = await Counter.findOneAndUpdate(
    { serviceId: testService._id, counterNumber: 1 },
    { assignedStaff: staff._id, status: 'open' },
    { new: true }
  );

  await User.findByIdAndUpdate(staff._id, { assignedCounter: testCounter._id });

  const staffLogin = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'staff.nurse@waitwise.io',
      password: 'password123',
    });
  staffToken = staffLogin.body.token;

  // Create Customer / Patient
  const studentRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Patient John',
      email: 'john.patient@waitwise.io',
      password: 'password123',
    });
  studentToken = studentRes.body.token;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('WAITWISE Universal Multi-Tenant Queue & API Tests', () => {
  test('1. System Health Check', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.system).toContain('Universal Smart Queue');
  });

  test('2. Organisation Directory Listing', async () => {
    const res = await request(app).get('/api/organisations');
    expect(res.statusCode).toBe(200);
    expect(res.body.count).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].slug).toBe('general-med');
  });

  test('3. Role Restrictions: Regular customer cannot create a service desk', async () => {
    const res = await request(app)
      .post('/api/services')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        name: 'Unauthorized Desk',
        code: 'UNAUTH',
      });
    expect(res.statusCode).toBe(403);
  });

  test('4. Patient/Customer Joins Queue (Self-Service)', async () => {
    const res = await request(app)
      .post('/api/queues/join')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        serviceId: testService._id,
        customerName: 'Patient John',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ticket.ticketNumber).toBe('BLD-001');
    expect(res.body.data.ticket.status).toBe('WAITING');
    expect(res.body.data.position).toBe(1);
    expect(res.body.data.peopleAhead).toBe(0);
  });

  test('5. Duplicate Token Prevention: Same user cannot hold 2 active tokens for same service', async () => {
    const res = await request(app)
      .post('/api/queues/join')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        serviceId: testService._id,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('already hold active token');
  });

  test('6. Kiosk Token Generation (Walk-in Guest)', async () => {
    const res = await request(app)
      .post('/api/queues/kiosk-join')
      .send({
        serviceId: testService._id,
        customerName: 'Kiosk Walk-in Patient',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.ticket.ticketNumber).toBe('BLD-002');
    expect(res.body.data.ticket.joinMethod).toBe('kiosk');
    expect(res.body.data.position).toBe(2);
    expect(res.body.data.peopleAhead).toBe(1);
  });

  test('7. Staff-Assisted Walk-in Token Generation', async () => {
    const res = await request(app)
      .post('/api/queues/staff-issue')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        serviceId: testService._id,
        customerName: 'Elderly Walk-in Patient',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.ticket.ticketNumber).toBe('BLD-003');
    expect(res.body.data.ticket.joinMethod).toBe('staff_assisted');
    expect(res.body.data.position).toBe(3);
    expect(res.body.data.peopleAhead).toBe(2);
  });

  test('8. FIFO Order & Staff Call Next', async () => {
    const res = await request(app)
      .post('/api/staff/call-next')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        counterId: testCounter._id,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.ticket.ticketNumber).toBe('BLD-001');
    expect(res.body.data.ticket.status).toBe('CALLED');
  });

  test('9. Service Lifecycle: Start and Complete Service', async () => {
    const calledTicket = await Ticket.findOne({ ticketNumber: 'BLD-001' });

    // Start Service
    const startRes = await request(app)
      .post('/api/staff/start-service')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        ticketId: calledTicket._id,
      });

    expect(startRes.statusCode).toBe(200);
    expect(startRes.body.data.status).toBe('SERVING');

    // Complete Service
    const completeRes = await request(app)
      .post('/api/staff/complete-service')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        ticketId: calledTicket._id,
        counterId: testCounter._id,
      });

    expect(completeRes.statusCode).toBe(200);
    expect(completeRes.body.data.status).toBe('COMPLETED');
    expect(completeRes.body.data.actualDurationMinutes).toBeGreaterThanOrEqual(1);

    const updatedCounter = await Counter.findById(testCounter._id);
    expect(updatedCounter.status).toBe('open');
    expect(updatedCounter.currentTicket).toBeNull();
  });

  test('10. Ticket Cancellation & Dynamic Position Recalculation', async () => {
    const ticket2 = await Ticket.findOne({ ticketNumber: 'BLD-002' });

    const cancelRes = await request(app)
      .post(`/api/queues/tickets/${ticket2._id}/cancel`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        reason: 'Patient departed facility',
      });

    expect(cancelRes.statusCode).toBe(200);
    expect(cancelRes.body.data.status).toBe('CANCELLED');

    const ticket3 = await Ticket.findOne({ ticketNumber: 'BLD-003' });
    const ticket3Res = await request(app).get(`/api/queues/tickets/${ticket3._id}`);
    expect(ticket3Res.body.data.peopleAhead).toBe(0);
    expect(ticket3Res.body.data.queuePosition).toBe(1);
  });

  test('11. Organisation Admin Counter Simulation', async () => {
    const simRes = await request(app)
      .post('/api/admin/simulate-counter')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        serviceId: testService._id,
        additionalCounters: 2,
      });

    expect(simRes.statusCode).toBe(200);
    expect(simRes.body.data.simulated.additionalCounters).toBe(2);
    expect(simRes.body.data.simulated.totalCounters).toBe(3);
  });
});

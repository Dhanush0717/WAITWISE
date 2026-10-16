process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/waitwise_test';

const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const User = require('../models/User');
const Service = require('../models/Service');
const Counter = require('../models/Counter');
const QueueSession = require('../models/QueueSession');
const Ticket = require('../models/Ticket');

let studentToken = '';
let staffToken = '';
let adminToken = '';
let testService = null;
let testCounter = null;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await Promise.all([
    User.deleteMany(),
    Service.deleteMany(),
    Counter.deleteMany(),
    QueueSession.deleteMany(),
    Ticket.deleteMany(),
  ]);

  // Create Admin
  const adminRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Admin Tester',
      email: 'admin.test@waitwise.campus',
      password: 'password123',
    });
  // Manually elevate to admin in test DB
  await User.findByIdAndUpdate(adminRes.body.user.id, { role: 'admin' });

  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'admin.test@waitwise.campus',
      password: 'password123',
    });
  adminToken = adminLogin.body.token;

  // Create Service
  testService = await Service.create({
    name: 'Test Examination Section',
    code: 'TEX',
    description: 'Testing service queue mechanics',
    category: 'academic',
    status: 'active',
    estimatedServiceTimeMinutes: 5,
    maxQueueCapacity: 50,
    overflowThreshold: 10,
    isKioskEnabled: true,
    isSelfJoinEnabled: true,
  });

  // Create Staff
  const staff = await User.create({
    name: 'Staff Tester',
    email: 'staff.test@waitwise.campus',
    password: 'password123',
    role: 'staff',
    assignedService: testService._id,
  });

  // Create Counter 1
  testCounter = await Counter.create({
    serviceId: testService._id,
    counterNumber: 1,
    name: 'Counter 1',
    assignedStaff: staff._id,
    status: 'open',
  });

  await User.findByIdAndUpdate(staff._id, { assignedCounter: testCounter._id });

  const staffLogin = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'staff.test@waitwise.campus',
      password: 'password123',
    });
  staffToken = staffLogin.body.token;

  // Create Student
  const studentRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Student Tester',
      email: 'student.test@waitwise.campus',
      password: 'password123',
    });
  studentToken = studentRes.body.token;
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('WAITWISE End-to-End Queue & API Tests', () => {
  test('1. System Health Check', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('2. Role Restrictions: Normal student cannot create a campus service', async () => {
    const res = await request(app)
      .post('/api/services')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        name: 'Unauthorized Service',
        code: 'UNAUTH',
      });
    expect(res.statusCode).toBe(403);
  });

  test('3. Student Joins Queue (Self-Service)', async () => {
    const res = await request(app)
      .post('/api/queues/join')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        serviceId: testService._id,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ticket.ticketNumber).toBe('TEX-001');
    expect(res.body.data.ticket.status).toBe('WAITING');
    expect(res.body.data.position).toBe(1);
    expect(res.body.data.peopleAhead).toBe(0);
  });

  test('4. Duplicate Token Prevention: Same user cannot join again while ticket is active', async () => {
    const res = await request(app)
      .post('/api/queues/join')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        serviceId: testService._id,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain('already hold active token');
  });

  test('5. Kiosk Token Generation (Guest)', async () => {
    const res = await request(app)
      .post('/api/queues/kiosk-join')
      .send({
        serviceId: testService._id,
        customerName: 'Kiosk Walk-in',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.ticket.ticketNumber).toBe('TEX-002');
    expect(res.body.data.ticket.joinMethod).toBe('kiosk');
    expect(res.body.data.position).toBe(2);
    expect(res.body.data.peopleAhead).toBe(1);
  });

  test('6. Staff-Assisted Token Generation', async () => {
    const res = await request(app)
      .post('/api/queues/staff-issue')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        serviceId: testService._id,
        customerName: 'Senior Citizen Visitor',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.ticket.ticketNumber).toBe('TEX-003');
    expect(res.body.data.ticket.joinMethod).toBe('staff_assisted');
    expect(res.body.data.position).toBe(3);
    expect(res.body.data.peopleAhead).toBe(2);
  });

  test('7. FIFO Order & Staff Call Next', async () => {
    const res = await request(app)
      .post('/api/staff/call-next')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        counterId: testCounter._id,
      });

    expect(res.statusCode).toBe(200);
    // Should call the first ticket (TEX-001) preserving FIFO
    expect(res.body.data.ticket.ticketNumber).toBe('TEX-001');
    expect(res.body.data.ticket.status).toBe('CALLED');
  });

  test('8. Service Lifecycle: Start and Complete Service', async () => {
    const calledTicket = await Ticket.findOne({ ticketNumber: 'TEX-001' });

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

    // Counter should be freed back to 'open'
    const updatedCounter = await Counter.findById(testCounter._id);
    expect(updatedCounter.status).toBe('open');
    expect(updatedCounter.currentTicket).toBeNull();
  });

  test('9. Ticket Cancellation & Position Update', async () => {
    // Ticket TEX-002 is currently WAITING
    const ticket2 = await Ticket.findOne({ ticketNumber: 'TEX-002' });

    const cancelRes = await request(app)
      .post(`/api/queues/tickets/${ticket2._id}/cancel`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        reason: 'Visitor departed campus',
      });

    expect(cancelRes.statusCode).toBe(200);
    expect(cancelRes.body.data.status).toBe('CANCELLED');

    // Verify ticket 3 is now position 1
    const ticket3 = await Ticket.findOne({ ticketNumber: 'TEX-003' });
    const ticket3Res = await request(app).get(`/api/queues/tickets/${ticket3._id}`);
    expect(ticket3Res.body.data.peopleAhead).toBe(0);
    expect(ticket3Res.body.data.queuePosition).toBe(1);
  });

  test('10. Admin Counter Simulation', async () => {
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

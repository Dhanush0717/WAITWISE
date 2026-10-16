require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Service = require('../models/Service');
const Counter = require('../models/Counter');
const QueueSession = require('../models/QueueSession');
const Ticket = require('../models/Ticket');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/waitwise';
    console.log(`Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    console.log('Clearing existing database collections...');
    await Promise.all([
      User.deleteMany(),
      Service.deleteMany(),
      Counter.deleteMany(),
      QueueSession.deleteMany(),
      Ticket.deleteMany(),
      Notification.deleteMany(),
      AuditLog.deleteMany(),
    ]);

    console.log('Seeding campus services...');
    // Coordinates set around a realistic campus grid (approx 28.545, 77.192)
    const services = await Service.create([
      {
        name: 'College Administration Office',
        code: 'ADM',
        description: 'Certificates, migration documents, bus passes, and general university inquiries.',
        category: 'administration',
        location: {
          building: 'Administrative Block A',
          room: 'Ground Floor, Room 102',
          coordinates: { lat: 28.5452, lng: 77.1925 },
        },
        operatingHours: { open: '09:00', close: '17:00', days: [1, 2, 3, 4, 5] },
        status: 'active',
        estimatedServiceTimeMinutes: 6,
        maxQueueCapacity: 80,
        overflowThreshold: 12,
        isKioskEnabled: true,
        isSelfJoinEnabled: true,
      },
      {
        name: 'Student Examination Section',
        code: 'EXM',
        description: 'Admit cards, mark sheets, grade revisions, and transcript verification.',
        category: 'academic',
        location: {
          building: 'Examination Complex',
          room: 'First Floor, Hall B',
          coordinates: { lat: 28.5460, lng: 77.1932 },
        },
        operatingHours: { open: '09:30', close: '16:30', days: [1, 2, 3, 4, 5] },
        status: 'active',
        estimatedServiceTimeMinutes: 7,
        maxQueueCapacity: 100,
        overflowThreshold: 15,
        isKioskEnabled: true,
        isSelfJoinEnabled: true,
      },
      {
        name: 'Central Campus Canteen',
        code: 'CAN',
        description: 'Meal tokens, cafeteria pre-orders, and dining discount reimbursements.',
        category: 'dining',
        location: {
          building: 'Student Activity Center',
          room: 'Ground Floor Food Court',
          coordinates: { lat: 28.5445, lng: 77.1915 },
        },
        operatingHours: { open: '08:00', close: '20:00', days: [1, 2, 3, 4, 5, 6, 7] },
        status: 'active',
        estimatedServiceTimeMinutes: 3,
        maxQueueCapacity: 150,
        overflowThreshold: 20,
        isKioskEnabled: true,
        isSelfJoinEnabled: true,
      },
      {
        name: 'University Central Library',
        code: 'LIB',
        description: 'Book checkout, thesis deposits, clearance certificates, and digital repository access.',
        category: 'library',
        location: {
          building: 'Knowledge Center',
          room: 'Circulation Desk, Ground Floor',
          coordinates: { lat: 28.5468, lng: 77.1918 },
        },
        operatingHours: { open: '08:30', close: '21:00', days: [1, 2, 3, 4, 5, 6] },
        status: 'active',
        estimatedServiceTimeMinutes: 4,
        maxQueueCapacity: 60,
        overflowThreshold: 10,
        isKioskEnabled: true,
        isSelfJoinEnabled: true,
      },
      {
        name: 'Laboratory Service Desks',
        code: 'LAB',
        description: 'Hardware equipment issue, component kits, lab manual collection, and project slots.',
        category: 'facility',
        location: {
          building: 'Engineering Block 3',
          room: 'Room 214, Instrumentation Desk',
          coordinates: { lat: 28.5472, lng: 77.1940 },
        },
        operatingHours: { open: '10:00', close: '17:00', days: [1, 2, 3, 4, 5] },
        status: 'active',
        estimatedServiceTimeMinutes: 5,
        maxQueueCapacity: 50,
        overflowThreshold: 10,
        isKioskEnabled: true,
        isSelfJoinEnabled: true,
      },
      {
        name: 'Campus Health & Medical Room',
        code: 'MED',
        description: 'First aid, primary nurse consultation, prescription medicine, and medical leave triage.',
        category: 'health',
        location: {
          building: 'Health & Wellness Pavilion',
          room: 'Triage Room 1',
          coordinates: { lat: 28.5438, lng: 77.1930 },
        },
        operatingHours: { open: '08:00', close: '20:00', days: [1, 2, 3, 4, 5, 6, 7] },
        status: 'active',
        estimatedServiceTimeMinutes: 8,
        maxQueueCapacity: 40,
        overflowThreshold: 8,
        isKioskEnabled: true,
        isSelfJoinEnabled: true,
      },
      {
        name: 'Fee Payment & Accounts Desk',
        code: 'FEE',
        description: 'Tuition receipt validation, scholarship disbursal, hostel caution deposit refund.',
        category: 'finance',
        location: {
          building: 'Finance Block',
          room: 'Cashier Wing, Counters 1-4',
          coordinates: { lat: 28.5455, lng: 77.1945 },
        },
        operatingHours: { open: '09:30', close: '15:30', days: [1, 2, 3, 4, 5] },
        status: 'active',
        estimatedServiceTimeMinutes: 6,
        maxQueueCapacity: 75,
        overflowThreshold: 12,
        isKioskEnabled: true,
        isSelfJoinEnabled: true,
      },
      {
        name: 'Annual Fest & Event Registration',
        code: 'EVT',
        description: 'College tech-fest badge issuance, hackathon check-in, and guest delegate kits.',
        category: 'other',
        location: {
          building: 'Auditorium Complex',
          room: 'Foyer Registration Booth',
          coordinates: { lat: 28.5442, lng: 77.1950 },
        },
        operatingHours: { open: '09:00', close: '18:00', days: [1, 2, 3, 4, 5, 6] },
        status: 'active',
        estimatedServiceTimeMinutes: 3,
        maxQueueCapacity: 120,
        overflowThreshold: 18,
        isKioskEnabled: true,
        isSelfJoinEnabled: true,
      },
    ]);

    console.log('Seeding staff & demo users...');
    const adminUser = await User.create({
      name: 'Campus Queue Administrator',
      email: 'admin@waitwise.campus',
      password: 'admin123',
      role: 'admin',
      identifier: 'EMP-ADM-001',
      phone: '+91 98765 43210',
    });

    const staffAdm = await User.create({
      name: 'Sarah Jenkins',
      email: 'staff.admin@waitwise.campus',
      password: 'staff123',
      role: 'staff',
      identifier: 'EMP-STF-101',
      assignedService: services[0]._id, // ADM
    });

    const staffExm = await User.create({
      name: 'David Patel',
      email: 'staff.exam@waitwise.campus',
      password: 'staff123',
      role: 'staff',
      identifier: 'EMP-STF-102',
      assignedService: services[1]._id, // EXM
    });

    const staffCan = await User.create({
      name: 'Chef Rajesh Kumar',
      email: 'staff.canteen@waitwise.campus',
      password: 'staff123',
      role: 'staff',
      identifier: 'EMP-STF-103',
      assignedService: services[2]._id, // CAN
    });

    const staffLib = await User.create({
      name: 'Elena Rostova',
      email: 'staff.library@waitwise.campus',
      password: 'staff123',
      role: 'staff',
      identifier: 'EMP-STF-104',
      assignedService: services[3]._id, // LIB
    });

    const demoStudent = await User.create({
      name: 'Alex Johnson',
      email: 'student@waitwise.campus',
      password: 'student123',
      role: 'student',
      identifier: '2024-CS-042',
      phone: '+91 91234 56789',
    });

    const demoStudent2 = await User.create({
      name: 'Priya Sharma',
      email: 'priya@waitwise.campus',
      password: 'student123',
      role: 'student',
      identifier: '2024-ECE-108',
      phone: '+91 98760 12345',
    });

    console.log('Seeding service counters...');
    // Create counters for each service
    const counters = [];
    for (let svc of services) {
      let assignedStaff = null;
      if (svc.code === 'ADM') assignedStaff = staffAdm._id;
      if (svc.code === 'EXM') assignedStaff = staffExm._id;
      if (svc.code === 'CAN') assignedStaff = staffCan._id;
      if (svc.code === 'LIB') assignedStaff = staffLib._id;

      // Counter 1 (Open and active)
      const c1 = await Counter.create({
        serviceId: svc._id,
        counterNumber: 1,
        name: `${svc.code} Counter 1`,
        assignedStaff,
        status: assignedStaff ? 'open' : 'closed',
      });
      counters.push(c1);

      // Counter 2 (Available for overflow simulation)
      const c2 = await Counter.create({
        serviceId: svc._id,
        counterNumber: 2,
        name: `${svc.code} Counter 2 (Overflow Support)`,
        assignedStaff: null,
        status: 'closed',
      });
      counters.push(c2);

      // Link staff assignedCounter
      if (assignedStaff) {
        await User.findByIdAndUpdate(assignedStaff, { assignedCounter: c1._id });
      }
    }

    console.log('Seeding daily queue sessions and sample tickets...');
    const today = new Date().toISOString().split('T')[0];

    // Seed session and tickets for Administration (ADM)
    const admService = services[0];
    const admSession = await QueueSession.create({
      serviceId: admService._id,
      sessionDate: today,
      tokenSequence: 6,
      totalTokensIssued: 6,
      status: 'active',
    });

    // Seed completed tickets today to feed prediction algorithm
    const completedTickets = [
      {
        ticketNumber: 'ADM-001',
        sequenceNumber: 1,
        serviceId: admService._id,
        queueSessionId: admSession._id,
        customerName: 'Marcus Aurelius',
        joinMethod: 'web_portal',
        status: 'COMPLETED',
        joinedAt: new Date(Date.now() - 65 * 60 * 1000),
        calledAt: new Date(Date.now() - 55 * 60 * 1000),
        serviceStartedAt: new Date(Date.now() - 54 * 60 * 1000),
        completedAt: new Date(Date.now() - 48 * 60 * 1000),
        actualDurationMinutes: 6,
      },
      {
        ticketNumber: 'ADM-002',
        sequenceNumber: 2,
        serviceId: admService._id,
        queueSessionId: admSession._id,
        customerName: 'Samantha Ray',
        joinMethod: 'qr_mobile',
        status: 'COMPLETED',
        joinedAt: new Date(Date.now() - 50 * 60 * 1000),
        calledAt: new Date(Date.now() - 47 * 60 * 1000),
        serviceStartedAt: new Date(Date.now() - 46 * 60 * 1000),
        completedAt: new Date(Date.now() - 41 * 60 * 1000),
        actualDurationMinutes: 5,
      },
      {
        ticketNumber: 'ADM-003',
        sequenceNumber: 3,
        serviceId: admService._id,
        queueSessionId: admSession._id,
        customerName: 'Walk-in Visitor #3',
        joinMethod: 'kiosk',
        status: 'COMPLETED',
        joinedAt: new Date(Date.now() - 42 * 60 * 1000),
        calledAt: new Date(Date.now() - 40 * 60 * 1000),
        serviceStartedAt: new Date(Date.now() - 39 * 60 * 1000),
        completedAt: new Date(Date.now() - 33 * 60 * 1000),
        actualDurationMinutes: 6,
      },
    ];
    await Ticket.create(completedTickets);

    // Active serving ticket for ADM Counter 1
    const admCounter1 = counters.find(
      (c) => c.name === 'ADM Counter 1'
    );

    const servingTicket = await Ticket.create({
      ticketNumber: 'ADM-004',
      sequenceNumber: 4,
      serviceId: admService._id,
      queueSessionId: admSession._id,
      userId: demoStudent2._id,
      customerName: 'Priya Sharma',
      customerIdentifier: '2024-ECE-108',
      joinMethod: 'web_portal',
      status: 'SERVING',
      assignedCounter: admCounter1._id,
      servedBy: staffAdm._id,
      joinedAt: new Date(Date.now() - 25 * 60 * 1000),
      calledAt: new Date(Date.now() - 4 * 60 * 1000),
      serviceStartedAt: new Date(Date.now() - 3 * 60 * 1000),
    });

    await Counter.findByIdAndUpdate(admCounter1._id, {
      currentTicket: servingTicket._id,
      status: 'busy',
      todayServedCount: 3,
    });

    // Active waiting tickets in ADM queue (including demo student!)
    await Ticket.create([
      {
        ticketNumber: 'ADM-005',
        sequenceNumber: 5,
        serviceId: admService._id,
        queueSessionId: admSession._id,
        customerName: 'Kiosk Visitor #5',
        joinMethod: 'kiosk',
        status: 'WAITING',
        joinedAt: new Date(Date.now() - 15 * 60 * 1000),
      },
      {
        ticketNumber: 'ADM-006',
        sequenceNumber: 6,
        serviceId: admService._id,
        queueSessionId: admSession._id,
        userId: demoStudent._id,
        customerName: 'Alex Johnson',
        customerIdentifier: '2024-CS-042',
        joinMethod: 'qr_mobile',
        status: 'WAITING',
        joinedAt: new Date(Date.now() - 10 * 60 * 1000),
      },
    ]);

    // Also seed a notification for Alex Johnson
    await Notification.create({
      recipient: demoStudent._id,
      title: 'Queue Position Update',
      message: 'You are now #2 in line for College Administration Office. Estimated wait: ~6-10 minutes.',
      type: 'turn_approaching',
    });

    console.log('=======================================================');
    console.log('✅ WAITWISE Database successfully seeded with demo data!');
    console.log('=======================================================');
    console.log('Demo Accounts:');
    console.log('👑 Admin:   admin@waitwise.campus / admin123');
    console.log('👔 Staff:   staff.admin@waitwise.campus / staff123 (Admin Office)');
    console.log('👔 Staff:   staff.exam@waitwise.campus / staff123 (Exam Section)');
    console.log('🎓 Student: student@waitwise.campus / student123 (Alex Johnson, has active token ADM-006)');
    console.log('🎓 Student: priya@waitwise.campus / student123 (Currently being served)');
    console.log('=======================================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();

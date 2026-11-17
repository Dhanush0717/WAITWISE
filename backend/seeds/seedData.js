require('dotenv').config();
const mongoose = require('mongoose');
const Organisation = require('../models/Organisation');
const Branch = require('../models/Branch');
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
    console.log(`[Seed] Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    console.log('[Seed] Clearing all existing collections...');
    await Promise.all([
      Organisation.deleteMany(),
      Branch.deleteMany(),
      User.deleteMany(),
      Service.deleteMany(),
      Counter.deleteMany(),
      QueueSession.deleteMany(),
      Ticket.deleteMany(),
      Notification.deleteMany(),
      AuditLog.deleteMany(),
    ]);

    const today = new Date().toISOString().split('T')[0];

    console.log('[Seed] Creating Platform Super Admin...');
    const superAdmin = await User.create({
      name: 'Platform Super Administrator',
      email: 'superadmin@waitwise.io',
      password: 'admin123',
      role: 'super_admin',
      identifier: 'SA-001',
      phone: '+1 800 555 0100',
    });

    // ==========================================
    // 1. HEALTHCARE: Metro Health General Hospital
    // ==========================================
    console.log('[Seed] Seeding 1. Healthcare: Metro Health General Hospital...');
    const hospitalOrg = await Organisation.create({
      name: 'Metro Health General Hospital',
      slug: 'metro-health',
      type: 'healthcare',
      description: 'Premier tertiary care hospital, specialty outpatient clinics, diagnostic laboratories, and pharmacy.',
      logoUrl: '',
      branding: { primaryColor: '#059669', accentColor: '#10b981' },
      contact: { email: 'contact@metrohealth.org', phone: '+1 555 012 3456', website: 'https://metrohealth.org' },
      terminology: {
        visitorLabel: 'Patient',
        operatorLabel: 'Doctor / Triage Nurse',
        serviceLabel: 'Clinic / Department',
        stationLabel: 'Consultation Room / Bay',
        identifierLabel: 'Patient MRN ID',
      },
      status: 'active',
    });

    const hospitalBranch1 = await Branch.create({
      organisationId: hospitalOrg._id,
      name: 'Central Hospital Pavilion',
      code: 'MAIN',
      address: { street: '100 Medical Plaza Blvd', city: 'Metro City', state: 'NY', postalCode: '10001', country: 'USA' },
      coordinates: { lat: 40.7128, lng: -74.0060 },
      phone: '+1 555 012 3456',
      operatingHours: { open: '08:00', close: '20:00', days: [1, 2, 3, 4, 5, 6, 7] },
      status: 'active',
    });

    const hospitalAdmin = await User.create({
      name: 'Dr. Evelyn Reed (Chief Medical Officer)',
      email: 'admin@metrohealth.org',
      password: 'admin123',
      role: 'org_admin',
      organisationId: hospitalOrg._id,
      branchId: hospitalBranch1._id,
      identifier: 'EMP-MED-01',
    });

    const doctorUser = await User.create({
      name: 'Dr. Marcus Vance (Cardiologist)',
      email: 'doctor@metrohealth.org',
      password: 'staff123',
      role: 'staff',
      organisationId: hospitalOrg._id,
      branchId: hospitalBranch1._id,
      identifier: 'DOC-102',
    });

    const hospitalServices = await Service.create([
      {
        organisationId: hospitalOrg._id,
        branchId: hospitalBranch1._id,
        name: 'General Outpatient Clinic (OPD)',
        code: 'OPD',
        description: 'Primary physician consultation, health check-ups, follow-ups, and specialist referrals.',
        category: 'Consultation',
        location: { building: 'West Wing Pavilion', room: 'Consultation Suites 1-4', coordinates: { lat: 40.7130, lng: -74.0058 } },
        operatingHours: { open: '08:00', close: '18:00', days: [1, 2, 3, 4, 5, 6] },
        estimatedServiceTimeMinutes: 8,
        maxQueueCapacity: 60,
        overflowThreshold: 10,
        status: 'active',
      },
      {
        organisationId: hospitalOrg._id,
        branchId: hospitalBranch1._id,
        name: 'Clinical Diagnostics & Blood Lab',
        code: 'LAB',
        description: 'Blood collection, pathology specimens, routine biochemical analysis, and swab testing.',
        category: 'Diagnostics',
        location: { building: 'Diagnostic Center', room: 'Phlebotomy Room 2', coordinates: { lat: 40.7125, lng: -74.0062 } },
        operatingHours: { open: '07:30', close: '19:00', days: [1, 2, 3, 4, 5, 6] },
        estimatedServiceTimeMinutes: 5,
        maxQueueCapacity: 80,
        overflowThreshold: 12,
        status: 'active',
      },
      {
        organisationId: hospitalOrg._id,
        branchId: hospitalBranch1._id,
        name: 'Outpatient Pharmacy & Medication',
        code: 'PHARM',
        description: 'Prescription fulfillment, medication counseling, insulin kit issue, and refills.',
        category: 'Pharmacy',
        location: { building: 'Ground Floor Lobby', room: 'Dispensary Counters 1-3', coordinates: { lat: 40.7127, lng: -74.0059 } },
        operatingHours: { open: '08:00', close: '22:00', days: [1, 2, 3, 4, 5, 6, 7] },
        estimatedServiceTimeMinutes: 4,
        maxQueueCapacity: 100,
        overflowThreshold: 15,
        status: 'active',
      },
    ]);

    // Counters for Hospital OPD
    const opdCounter1 = await Counter.create({
      organisationId: hospitalOrg._id,
      branchId: hospitalBranch1._id,
      serviceId: hospitalServices[0]._id,
      counterNumber: 1,
      name: 'Consultation Room 1',
      assignedStaff: doctorUser._id,
      status: 'open',
    });
    await Counter.create({
      organisationId: hospitalOrg._id,
      branchId: hospitalBranch1._id,
      serviceId: hospitalServices[0]._id,
      counterNumber: 2,
      name: 'Consultation Room 2',
      status: 'closed',
    });

    await User.findByIdAndUpdate(doctorUser._id, {
      assignedService: hospitalServices[0]._id,
      assignedCounter: opdCounter1._id,
    });

    // ==========================================
    // 2. BANKING: Horizon Trust Bank
    // ==========================================
    console.log('[Seed] Seeding 2. Banking: Horizon Trust Bank...');
    const bankOrg = await Organisation.create({
      name: 'Horizon Trust Bank',
      slug: 'horizon-bank',
      type: 'banking',
      description: 'Full-service commercial bank offering cash tellers, foreign exchange, personal loans, and business banking.',
      branding: { primaryColor: '#1d4ed8', accentColor: '#3b82f6' },
      contact: { email: 'support@horizontrust.com', phone: '+1 800 555 4679', website: 'https://horizontrust.com' },
      terminology: {
        visitorLabel: 'Customer',
        operatorLabel: 'Teller / Loan Officer',
        serviceLabel: 'Banking Counter Desk',
        stationLabel: 'Teller Window',
        identifierLabel: 'Account / CIF Number',
      },
      status: 'active',
    });

    const bankBranch1 = await Branch.create({
      organisationId: bankOrg._id,
      name: 'Downtown Financial Center',
      code: 'DWTN',
      address: { street: '500 Wall Street', city: 'Financial District', state: 'NY', postalCode: '10005', country: 'USA' },
      coordinates: { lat: 40.7068, lng: -74.0090 },
      phone: '+1 800 555 4679',
      operatingHours: { open: '09:00', close: '16:30', days: [1, 2, 3, 4, 5] },
      status: 'active',
    });

    const bankAdmin = await User.create({
      name: 'Victoria Sterling (Branch Director)',
      email: 'admin@horizonbank.com',
      password: 'admin123',
      role: 'org_admin',
      organisationId: bankOrg._id,
      branchId: bankBranch1._id,
      identifier: 'EMP-BNK-01',
    });

    const tellerUser = await User.create({
      name: 'Jonathan Miller (Head Teller)',
      email: 'teller@horizonbank.com',
      password: 'staff123',
      role: 'staff',
      organisationId: bankOrg._id,
      branchId: bankBranch1._id,
      identifier: 'TEL-201',
    });

    const bankServices = await Service.create([
      {
        organisationId: bankOrg._id,
        branchId: bankBranch1._id,
        name: 'Cash Deposit & Withdrawal',
        code: 'CASH',
        description: 'Teller cash transactions, business cash deposits, cashier checks, and split withdrawals.',
        category: 'Cash Operations',
        location: { building: 'Main Hall', room: 'Teller Windows 1-4', coordinates: { lat: 40.7069, lng: -74.0089 } },
        operatingHours: { open: '09:00', close: '16:00', days: [1, 2, 3, 4, 5] },
        estimatedServiceTimeMinutes: 4,
        maxQueueCapacity: 80,
        overflowThreshold: 12,
        status: 'active',
      },
      {
        organisationId: bankOrg._id,
        branchId: bankBranch1._id,
        name: 'Foreign Exchange & International Wire',
        code: 'FOREX',
        description: 'Multi-currency buy/sell, traveler cards, overseas SWIFT transfers, and currency drafts.',
        category: 'Foreign Exchange',
        location: { building: 'Mezzanine', room: 'Forex Desk 2', coordinates: { lat: 40.7070, lng: -74.0091 } },
        operatingHours: { open: '09:30', close: '15:30', days: [1, 2, 3, 4, 5] },
        estimatedServiceTimeMinutes: 7,
        maxQueueCapacity: 40,
        overflowThreshold: 8,
        status: 'active',
      },
      {
        organisationId: bankOrg._id,
        branchId: bankBranch1._id,
        name: 'Loan Verification & Mortgages',
        code: 'LOAN',
        description: 'Personal loans, auto financing, mortgage pre-qualification, and debt consolidation.',
        category: 'Credit & Loans',
        location: { building: 'Executive Wing', room: 'Advisory Office 104', coordinates: { lat: 40.7071, lng: -74.0088 } },
        operatingHours: { open: '10:00', close: '16:00', days: [1, 2, 3, 4, 5] },
        estimatedServiceTimeMinutes: 12,
        maxQueueCapacity: 30,
        overflowThreshold: 6,
        status: 'active',
      },
    ]);

    const bankCounter1 = await Counter.create({
      organisationId: bankOrg._id,
      branchId: bankBranch1._id,
      serviceId: bankServices[0]._id,
      counterNumber: 1,
      name: 'Teller Window 1',
      assignedStaff: tellerUser._id,
      status: 'open',
    });
    await Counter.create({
      organisationId: bankOrg._id,
      branchId: bankBranch1._id,
      serviceId: bankServices[0]._id,
      counterNumber: 2,
      name: 'Teller Window 2 (Overflow Support)',
      status: 'closed',
    });

    await User.findByIdAndUpdate(tellerUser._id, {
      assignedService: bankServices[0]._id,
      assignedCounter: bankCounter1._id,
    });

    // ==========================================
    // 3. GOVERNMENT: State Citizen Services Center
    // ==========================================
    console.log('[Seed] Seeding 3. Government: State Citizen Services Center...');
    const govtOrg = await Organisation.create({
      name: 'State Citizen Services Center',
      slug: 'citizen-services',
      type: 'government',
      description: 'One-stop public administrative bureau for passports, driver licensing (DMV/RTO), and civic registrations.',
      branding: { primaryColor: '#7c3aed', accentColor: '#8b5cf6' },
      contact: { email: 'info@citizenservices.gov', phone: '+1 888 555 7828', website: 'https://citizenservices.gov' },
      terminology: {
        visitorLabel: 'Citizen',
        operatorLabel: 'Public Service Officer',
        serviceLabel: 'Citizen Service Desk',
        stationLabel: 'Service Window',
        identifierLabel: 'Application Ref Number',
      },
      status: 'active',
    });

    const govtBranch = await Branch.create({
      organisationId: govtOrg._id,
      name: 'Central Civic Plaza HQ',
      code: 'CIVIC-1',
      address: { street: '200 Government Center Way', city: 'Capital City', state: 'DC', postalCode: '20001', country: 'USA' },
      coordinates: { lat: 38.8951, lng: -77.0364 },
      phone: '+1 888 555 7828',
      operatingHours: { open: '08:30', close: '16:30', days: [1, 2, 3, 4, 5] },
      status: 'active',
    });

    const govtAdmin = await User.create({
      name: 'Commissioner Robert Harris',
      email: 'admin@citizenservices.gov',
      password: 'admin123',
      role: 'org_admin',
      organisationId: govtOrg._id,
      branchId: govtBranch._id,
      identifier: 'GOV-DIR-01',
    });

    const govtOfficer = await User.create({
      name: 'Counter Desk Officer',
      email: 'clerk@citizenservices.gov',
      password: 'staff123',
      role: 'staff',
      organisationId: govtOrg._id,
      branchId: govtBranch._id,
      identifier: 'GOV-CLK-42',
    });

    const govtServices = await Service.create([
      {
        organisationId: govtOrg._id,
        branchId: govtBranch._id,
        name: 'Passport Issuance & Renewal',
        code: 'PASS',
        description: 'Biometric capture, passport booklet collection, fast-track emergency travel documents.',
        category: 'Travel Documents',
        location: { building: 'Federal Annex', room: 'Hall A, Windows 1-6', coordinates: { lat: 38.8953, lng: -77.0362 } },
        operatingHours: { open: '08:30', close: '16:00', days: [1, 2, 3, 4, 5] },
        estimatedServiceTimeMinutes: 7,
        maxQueueCapacity: 100,
        overflowThreshold: 15,
        status: 'active',
      },
      {
        organisationId: govtOrg._id,
        branchId: govtBranch._id,
        name: 'Driver Licensing & Vehicle RTO',
        code: 'DMV',
        description: 'License renewal, road test bookings, commercial vehicle permits, address updates.',
        category: 'Transport & Licensing',
        location: { building: 'Licensing Bureau', room: 'Hall B, Windows 7-12', coordinates: { lat: 38.8949, lng: -77.0366 } },
        operatingHours: { open: '08:30', close: '16:00', days: [1, 2, 3, 4, 5] },
        estimatedServiceTimeMinutes: 6,
        maxQueueCapacity: 120,
        overflowThreshold: 18,
        status: 'active',
      },
    ]);

    const govtCounter1 = await Counter.create({
      organisationId: govtOrg._id,
      branchId: govtBranch._id,
      serviceId: govtServices[0]._id,
      counterNumber: 1,
      name: 'Window 1 - Biometrics & Intake',
      assignedStaff: govtOfficer._id,
      status: 'open',
    });

    await User.findByIdAndUpdate(govtOfficer._id, {
      assignedService: govtServices[0]._id,
      assignedCounter: govtCounter1._id,
    });

    // ==========================================
    // 4. EDUCATION (Retained & Generalised): Central University Campus
    // ==========================================
    console.log('[Seed] Seeding 4. Education: Central University Campus...');
    const campusOrg = await Organisation.create({
      name: 'Central University Campus',
      slug: 'central-univ',
      type: 'education',
      description: 'Comprehensive collegiate administration, student degree examination division, and library center.',
      branding: { primaryColor: '#2563eb', accentColor: '#4f46e5' },
      contact: { email: 'admin@waitwise.campus', phone: '+1 800 234 5678', website: 'https://waitwise.campus' },
      terminology: {
        visitorLabel: 'Student',
        operatorLabel: 'Desk Officer',
        serviceLabel: 'Campus Section Desk',
        stationLabel: 'Service Counter',
        identifierLabel: 'Student Roll Number',
      },
      status: 'active',
    });

    const campusBranch = await Branch.create({
      organisationId: campusOrg._id,
      name: 'Main University Grounds',
      code: 'MAIN',
      address: { street: 'Academic Quad 1', city: 'Campus Town', state: 'IL', postalCode: '61801', country: 'USA' },
      coordinates: { lat: 28.5452, lng: 77.1925 },
      operatingHours: { open: '09:00', close: '17:00', days: [1, 2, 3, 4, 5] },
      status: 'active',
    });

    const campusAdmin = await User.create({
      name: 'Campus Administrator',
      email: 'admin@waitwise.campus',
      password: 'admin123',
      role: 'org_admin',
      organisationId: campusOrg._id,
      branchId: campusBranch._id,
      identifier: 'EMP-ADM-001',
    });

    const campusStaff = await User.create({
      name: 'Sarah Jenkins (Registrar)',
      email: 'staff.admin@waitwise.campus',
      password: 'staff123',
      role: 'staff',
      organisationId: campusOrg._id,
      branchId: campusBranch._id,
      identifier: 'EMP-STF-101',
    });

    const campusServices = await Service.create([
      {
        organisationId: campusOrg._id,
        branchId: campusBranch._id,
        name: 'College Administration Office',
        code: 'ADM',
        description: 'Degree certificates, migration documentation, transcripts, and general academic inquiries.',
        category: 'Administration',
        location: { building: 'Administrative Block A', room: 'Room 102', coordinates: { lat: 28.5452, lng: 77.1925 } },
        operatingHours: { open: '09:00', close: '17:00', days: [1, 2, 3, 4, 5] },
        estimatedServiceTimeMinutes: 5,
        maxQueueCapacity: 80,
        overflowThreshold: 12,
        status: 'active',
      },
      {
        organisationId: campusOrg._id,
        branchId: campusBranch._id,
        name: 'Student Examination Section',
        code: 'EXM',
        description: 'Admit cards, mark sheets, grade revisions, and transcript verification.',
        category: 'Academic',
        location: { building: 'Examination Complex', room: 'Hall B', coordinates: { lat: 28.5460, lng: 77.1932 } },
        operatingHours: { open: '09:30', close: '16:30', days: [1, 2, 3, 4, 5] },
        estimatedServiceTimeMinutes: 6,
        maxQueueCapacity: 100,
        overflowThreshold: 15,
        status: 'active',
      },
    ]);

    const campusCounter1 = await Counter.create({
      organisationId: campusOrg._id,
      branchId: campusBranch._id,
      serviceId: campusServices[0]._id,
      counterNumber: 1,
      name: 'ADM Counter 1',
      assignedStaff: campusStaff._id,
      status: 'open',
    });

    await User.findByIdAndUpdate(campusStaff._id, {
      assignedService: campusServices[0]._id,
      assignedCounter: campusCounter1._id,
    });

    // Seed Demo Student with active ticket
    const demoStudent = await User.create({
      name: 'Alex Johnson',
      email: 'student@waitwise.campus',
      password: 'student123',
      role: 'customer',
      organisationId: campusOrg._id,
      branchId: campusBranch._id,
      identifier: '2024-CS-042',
    });

    const campusSession = await QueueSession.create({
      organisationId: campusOrg._id,
      branchId: campusBranch._id,
      serviceId: campusServices[0]._id,
      sessionDate: today,
      tokenSequence: 5,
      totalTokensIssued: 5,
      status: 'active',
    });

    // Historical completed tickets to feed prediction engine
    await Ticket.create([
      {
        ticketNumber: 'ADM-001',
        sequenceNumber: 1,
        organisationId: campusOrg._id,
        branchId: campusBranch._id,
        serviceId: campusServices[0]._id,
        queueSessionId: campusSession._id,
        customerName: 'Marcus Aurelius',
        joinMethod: 'web_portal',
        status: 'COMPLETED',
        joinedAt: new Date(Date.now() - 50 * 60 * 1000),
        calledAt: new Date(Date.now() - 44 * 60 * 1000),
        serviceStartedAt: new Date(Date.now() - 43 * 60 * 1000),
        completedAt: new Date(Date.now() - 38 * 60 * 1000),
        actualDurationMinutes: 5,
      },
      {
        ticketNumber: 'ADM-002',
        sequenceNumber: 2,
        organisationId: campusOrg._id,
        branchId: campusBranch._id,
        serviceId: campusServices[0]._id,
        queueSessionId: campusSession._id,
        customerName: 'Samantha Ray',
        joinMethod: 'qr_mobile',
        status: 'COMPLETED',
        joinedAt: new Date(Date.now() - 35 * 60 * 1000),
        calledAt: new Date(Date.now() - 29 * 60 * 1000),
        serviceStartedAt: new Date(Date.now() - 28 * 60 * 1000),
        completedAt: new Date(Date.now() - 23 * 60 * 1000),
        actualDurationMinutes: 5,
      },
    ]);

    // Active serving ticket
    const servingTicket = await Ticket.create({
      ticketNumber: 'ADM-003',
      sequenceNumber: 3,
      organisationId: campusOrg._id,
      branchId: campusBranch._id,
      serviceId: campusServices[0]._id,
      queueSessionId: campusSession._id,
      customerName: 'Priya Sharma',
      joinMethod: 'web_portal',
      status: 'SERVING',
      assignedCounter: campusCounter1._id,
      servedBy: campusStaff._id,
      joinedAt: new Date(Date.now() - 20 * 60 * 1000),
      calledAt: new Date(Date.now() - 5 * 60 * 1000),
      serviceStartedAt: new Date(Date.now() - 4 * 60 * 1000),
    });

    await Counter.findByIdAndUpdate(campusCounter1._id, {
      currentTicket: servingTicket._id,
      status: 'busy',
      todayServedCount: 2,
    });

    // Active waiting tickets (including Alex Johnson)
    await Ticket.create([
      {
        ticketNumber: 'ADM-004',
        sequenceNumber: 4,
        organisationId: campusOrg._id,
        branchId: campusBranch._id,
        serviceId: campusServices[0]._id,
        queueSessionId: campusSession._id,
        customerName: 'Walk-in Visitor #4',
        joinMethod: 'kiosk',
        status: 'WAITING',
        joinedAt: new Date(Date.now() - 12 * 60 * 1000),
      },
      {
        ticketNumber: 'ADM-005',
        sequenceNumber: 5,
        organisationId: campusOrg._id,
        branchId: campusBranch._id,
        serviceId: campusServices[0]._id,
        queueSessionId: campusSession._id,
        userId: demoStudent._id,
        customerName: 'Alex Johnson',
        customerIdentifier: '2024-CS-042',
        joinMethod: 'qr_mobile',
        status: 'WAITING',
        joinedAt: new Date(Date.now() - 8 * 60 * 1000),
      },
    ]);

    await Notification.create({
      organisationId: campusOrg._id,
      recipient: demoStudent._id,
      title: 'Queue Position Update',
      message: 'You are #2 in line for College Administration Office. Estimated wait: ~6-10 minutes.',
      type: 'turn_approaching',
    });

    console.log('===================================================================');
    console.log('✅ WAITWISE Universal Multi-Tenant Database Seeded Successfully!');
    console.log('===================================================================');
    console.log('🏢 ORGANISATIONS CREATED:');
    console.log('  1. 🏥 Healthcare: Metro Health General Hospital (/org/metro-health)');
    console.log('  2. 🏦 Banking:    Horizon Trust Bank            (/org/horizon-bank)');
    console.log('  3. 🏛️ Government: State Citizen Services Center (/org/citizen-services)');
    console.log('  4. 🎓 Education:  Central University Campus     (/org/central-univ)');
    console.log('-------------------------------------------------------------------');
    console.log('🔑 DEMO ACCOUNTS:');
    console.log('  👑 Super Admin: superadmin@waitwise.io          / admin123 (Platform Overview)');
    console.log('  🏥 Doctor:      doctor@metrohealth.org          / staff123 (Hospital Consultation)');
    console.log('  🏦 Bank Teller: teller@horizonbank.com          / staff123 (Bank Cashier)');
    console.log('  🏛️ Govt Clerk:  clerk@citizenservices.gov       / staff123 (Passport Desk)');
    console.log('  🎓 Staff:       staff.admin@waitwise.campus     / staff123 (Campus Desk)');
    console.log('  🎓 Student:     student@waitwise.campus         / student123 (Active Ticket ADM-005)');
    console.log('===================================================================');

    if (require.main === module) {
      await mongoose.disconnect();
      process.exit(0);
    }
  } catch (err) {
    console.error('Seeding error:', err);
    if (require.main === module) {
      process.exit(1);
    }
  }
};

if (require.main === module) {
  seedData();
}

module.exports = { seedData };

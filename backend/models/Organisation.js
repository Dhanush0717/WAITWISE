const mongoose = require('mongoose');

const organisationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide an organisation name'],
      trim: true,
      maxlength: 120,
    },
    slug: {
      type: String,
      required: [true, 'Please provide a unique organisation slug'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'healthcare',     // Hospitals, clinics, labs, pharmacies
        'banking',        // Banks, credit unions, finance
        'government',     // Municipal, passport, RTO, public offices
        'corporate',      // Enterprise HQs, IT desks, visitor centers
        'retail',         // Service centers, support stores
        'education',      // Universities, colleges, libraries
        'hospitality',    // Hotels, restaurants, transit hubs
        'other',
      ],
      default: 'corporate',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    logoUrl: {
      type: String,
      default: '',
    },
    branding: {
      primaryColor: { type: String, default: '#2563eb' },
      accentColor: { type: String, default: '#4f46e5' },
    },
    contact: {
      email: { type: String, trim: true, default: '' },
      phone: { type: String, trim: true, default: '' },
      website: { type: String, trim: true, default: '' },
    },
    // Dynamic terminology dictionary customized for this organization
    terminology: {
      visitorLabel: { type: String, default: 'Customer' },      // Patient / Customer / Citizen / Visitor / Student
      operatorLabel: { type: String, default: 'Operator' },     // Doctor / Teller / Officer / Host / Staff
      serviceLabel: { type: String, default: 'Service' },       // Clinic / Department / Desk / Window / Counter
      stationLabel: { type: String, default: 'Counter' },       // Room / Window / Bay / Counter / Desk
      identifierLabel: { type: String, default: 'ID Number' },  // MRN / Account No / Application ID / Roll No
    },
    settings: {
      isKioskEnabled: { type: Boolean, default: true },
      isSelfJoinEnabled: { type: Boolean, default: true },
      allowGuestQueue: { type: Boolean, default: true },
      defaultSafetyBufferMinutes: { type: Number, default: 3 },
      soundAlertEnabled: { type: Boolean, default: true },
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'pending'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

organisationSchema.index({ type: 1 });

module.exports = mongoose.model('Organisation', organisationSchema);

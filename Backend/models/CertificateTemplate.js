const mongoose = require('mongoose');

const ElementConfigSchema = new mongoose.Schema({
  x: { type: Number, required: true, default: 50 }, // % from left (0 - 100)
  y: { type: Number, required: true, default: 50 }, // % from top (0 - 100)
  width: { type: Number, default: 40 },             // % of total width
  height: { type: Number, default: 10 },            // % of total height
  fontFamily: {
    type: String,
    enum: [
      'Alex Brush',
      'Great Vibes',
      'Playfair Display',
      'Cinzel',
      'Montserrat',
      'Inter',
      'Caveat',
      'Roboto'
    ],
    default: 'Playfair Display'
  },
  fontSize: { type: Number, default: 48 },          // Base font size in px
  fontWeight: { type: String, default: 'bold' },
  fontStyle: { type: String, default: 'normal' },
  color: { type: String, default: '#1e293b' },
  textAlign: {
    type: String,
    enum: ['left', 'center', 'right'],
    default: 'center'
  },
  uppercase: { type: Boolean, default: false },
  visible: { type: Boolean, default: true }
}, { _id: false });

const CertificateTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  backgroundImageUrl: {
    type: String,
    required: true,
    trim: true
  },
  originalWidth: {
    type: Number,
    default: 1920
  },
  originalHeight: {
    type: Number,
    default: 1080
  },
  elements: {
    name: {
      type: ElementConfigSchema,
      default: () => ({
        x: 15,
        y: 40,
        width: 70,
        height: 12,
        fontFamily: 'Great Vibes',
        fontSize: 56,
        fontWeight: 'normal',
        color: '#0f172a',
        textAlign: 'center',
        uppercase: false,
        visible: true
      })
    },
    vacancy: {
      type: ElementConfigSchema,
      default: () => ({
        x: 15,
        y: 56,
        width: 70,
        height: 8,
        fontFamily: 'Montserrat',
        fontSize: 24,
        fontWeight: 'bold',
        color: '#334155',
        textAlign: 'center',
        uppercase: true,
        visible: true
      })
    },
    qr: {
      type: ElementConfigSchema,
      default: () => ({
        x: 74,
        y: 72,
        width: 16,
        height: 16,
        visible: true
      })
    },
    date: {
      type: ElementConfigSchema,
      default: () => ({
        x: 10,
        y: 82,
        width: 28,
        height: 6,
        fontFamily: 'Inter',
        fontSize: 18,
        fontWeight: '500',
        color: '#475569',
        textAlign: 'center',
        visible: true
      })
    },
    certificateNumber: {
      type: ElementConfigSchema,
      default: () => ({
        x: 35,
        y: 90,
        width: 30,
        height: 5,
        fontFamily: 'Inter',
        fontSize: 16,
        fontWeight: '600',
        color: '#64748b',
        textAlign: 'center',
        uppercase: true,
        visible: true
      })
    }
  },

  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CertificateTemplate', CertificateTemplateSchema);

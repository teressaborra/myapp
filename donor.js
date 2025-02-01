const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Increase payload size limit
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Configure CORS with specific options
app.use(cors({
  origin: '*', // In production, replace with your specific domain
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// MongoDB connection string
const mongoURI = 'mongodb://127.0.0.1:27017/demo';

// Connect to MongoDB with updated options
mongoose.connect(mongoURI, {})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1); // Exit if cannot connect to database
});

// Enhanced donation schema with validation
const donationSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true
  },
  amount: { 
    type: Number, 
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  donation_type: { 
    type: String, 
    required: true,
    enum: ['One-Time', 'Recurring']
  },
  cause: { 
    type: String, 
    required: true 
  },
  fund_type: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String,
    trim: true
  },
  communication: { 
    type: String, 
    required: true 
  },
  interaction: { 
    type: String, 
    required: true,
    enum: ['Yes', 'No']
  },
  mentorship: { 
    type: String, 
    required: true,
    enum: ['Yes', 'No']
  },
  tax_exemption: { 
    type: String, 
    required: true,
    enum: ['Yes', 'No']
  },
  motivation: { 
    type: String, 
    required: true,
    trim: true
  }
}, {
  timestamps: true // Add created_at and updated_at timestamps
});

const Donation = mongoose.model('donations', donationSchema);

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: 'An error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Donation route with enhanced validation and error handling
app.post('/api/donate', async (req, res) => {
  console.log('Received donation data:', req.body);

  try {
    // Validate required fields
    const requiredFields = [
      'name', 'email', 'amount', 'donation_type', 'cause', 'fund_type', 
      'communication', 'interaction', 'mentorship', 'tax_exemption', 'motivation'
    ];

    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Create and save donation
    const donationData = new Donation(req.body);
    await donationData.save();

    console.log('Donation saved successfully!');
    res.status(200).json({
      success: true,
      message: 'Donation saved successfully',
      donationId: donationData._id
    });

  } catch (error) {
    console.error('Error saving donation:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving donation',
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
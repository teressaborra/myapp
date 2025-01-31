const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Setup body-parser middleware for JSON and URL-encoded data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors()); // Allow cross-origin requests (useful for local development)

// MongoDB connection string
const mongoURI = 'mongodb://127.0.0.1:27017/donor'; // Ensure this is the correct MongoDB URI

// Connect to MongoDB
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.log('MongoDB connection error:', err);
  });

// Donation schema
const donationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  amount: { type: Number, required: true },
  donation_type: { type: String, required: true },
  cause: { type: String, required: true },
  fund_type: { type: String, required: true },
  message: { type: String },
  communication: { type: String, required: true },
  interaction: { type: String, required: true },
  mentorship: { type: String, required: true },
  tax_exemption: { type: String, required: true },
  motivation: { type: String, required: true },
});

// Donation model
const Donation = mongoose.model('donations', donationSchema);

// Route to handle form submissions
app.post('/api/donate', async (req, res) => {
  console.log('Received donation data:', req.body); // Log the incoming data for debugging

  // Check if all required fields are present
  const requiredFields = [
    'name', 'email', 'amount', 'donation_type', 'cause', 'fund_type', 
    'communication', 'interaction', 'mentorship', 'tax_exemption', 'motivation'
  ];

  const missingFields = requiredFields.filter(field => !req.body[field]);

  if (missingFields.length > 0) {
    console.error(`Missing required fields: ${missingFields.join(', ')}`);
    return res.status(400).json({ message: `Missing required fields: ${missingFields.join(', ')}` });
  }

  try {
    // Log the donation data before saving
    console.log('Saving donation data:', req.body);

    // Create and save the donation data
    const donationData = new Donation(req.body);
    await donationData.save();

    console.log('Donation saved successfully!');
    res.status(200).json({ message: 'Donation saved successfully' });
  } catch (error) {
    console.error('Error saving donation:', error);
    res.status(500).json({ message: 'Error saving donation', error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

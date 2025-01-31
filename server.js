const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Initialize the app
const app = express();
const port = 3000;

// Setup body-parser middleware for JSON and URL-encoded data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Set static folder for images, CSS, and JS
app.use(express.static(path.join(__dirname, 'public')));

// Create 'uploads' folder if it doesn't exist
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// MongoDB Connection
mongoose.connect('mongodb://127.0.0.1:27017/demo', {})
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.log('MongoDB connection error:', err);
  });

// File Upload Setup using Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/'); // Image files saved here
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
  fileFilter: (req, file, cb) => {
    // Only allow certain file types
    const allowedFileTypes = /pdf|jpeg|jpg|png/;
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = allowedFileTypes.test(file.mimetype);
    if (extname && mimeType) {
      return cb(null, true);
    } else {
      cb(new Error('Only .pdf, .jpg, .jpeg, .png files are allowed'));
    }
  }
});

// Mongoose Schema for Scholarship Application
const scholarshipSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  phone: String,
  grade: String,
  essay: String,
  adhaarCard: String,
  rationCard: String,
  incomeCertificate: String,
  marksheet: String,
  attendanceSheet: String,
  fatherName: String,
  fatherOccupation: String,
  motherName: String,
  motherOccupation: String,
  annualIncome: Number,
  bankAccountNumber: String,
  ifscCode: String,
});

// Define the Scholarship model
const Scholarship = mongoose.model('Scholarship', scholarshipSchema);

// Handle scholarship application submission
app.post('/submit_application', upload.fields([
  { name: 'adhaarCard', maxCount: 1 },
  { name: 'rationCard', maxCount: 1 },
  { name: 'incomeCertificate', maxCount: 1 },
  { name: 'marksheet', maxCount: 1 },
  { name: 'attendanceSheet', maxCount: 1 }
]), (req, res) => {
  console.log("Received form data:", req.body);  // Log form data
  console.log("Files uploaded:", req.files);     // Log the uploaded files

  // Check if all required fields and files are provided
  const missingFields = [];
  
  if (!req.body.fullName) missingFields.push('Full Name');
  if (!req.body.email) missingFields.push('Email');
  if (!req.body.phone) missingFields.push('Phone');
  if (!req.body.grade) missingFields.push('Grade');
  if (!req.body.essay) missingFields.push('About Yourself');
  if (!req.files || !req.files.adhaarCard) missingFields.push('Aadhaar Card');
  if (!req.files || !req.files.rationCard) missingFields.push('Ration Card');
  if (!req.files || !req.files.incomeCertificate) missingFields.push('Income Certificate');
  if (!req.files || !req.files.marksheet) missingFields.push('Marks Sheet');
  if (!req.files || !req.files.attendanceSheet) missingFields.push('Attendance Sheet');

  if (missingFields.length > 0) {
    return res.status(400).send(`The following fields are missing: ${missingFields.join(', ')}`);
  }

  const newScholarship = new Scholarship({
    fullName: req.body.fullName,
    email: req.body.email,
    phone: req.body.phone,
    grade: req.body.grade,
    essay: req.body.essay,
    adhaarCard: req.files.adhaarCard[0].filename,
    rationCard: req.files.rationCard[0].filename,
    incomeCertificate: req.files.incomeCertificate[0].filename,
    marksheet: req.files.marksheet[0].filename,
    attendanceSheet: req.files.attendanceSheet[0].filename,
    fatherName: req.body.fatherName,
    fatherOccupation: req.body.fatherOccupation,
    motherName: req.body.motherName,
    motherOccupation: req.body.motherOccupation,
    annualIncome: req.body.annualIncome,
    bankAccountNumber: req.body.bankAccountNumber,
    ifscCode: req.body.ifscCode,
  });

  newScholarship.save()
    .then(() => {
      console.log("Application saved successfully!");
      res.status(200).send("Application submitted successfully!");
    })
    .catch((err) => {
      console.error("Error saving application:", err);
      res.status(500).send("Error submitting application");
    });
});

// Serve the HTML form (if you want to test it via a browser)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'apply.html')); // Serve static HTML file
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
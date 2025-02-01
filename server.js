const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors'); // Make sure to install cors: npm install cors

const app = express();
const port = 3000;

// Enable CORS
app.use(cors());

// Increase payload limit
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));

// Create uploads directory if it doesn't exist
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// MongoDB Connection with updated options
mongoose.connect('mongodb://127.0.0.1:27017/demo',{})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only .pdf, .jpeg, .jpg and .png files are allowed'));
  }
}).fields([
  { name: 'adhaarCard', maxCount: 1 },
  { name: 'rationCard', maxCount: 1 },
  { name: 'incomeCertificate', maxCount: 1 },
  { name: 'marksheet', maxCount: 1 },
  { name: 'attendanceSheet', maxCount: 1 }
]);

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
  }
  next(err);
});

// Rest of your schemas and models remain the same
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
  ifscCode: String
});

const Scholarship = mongoose.model('Scholarship', scholarshipSchema);

// Updated submission endpoint
app.post('/submit_application', (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    try {
      // Validate required fields
      if (!req.body || !req.files) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields or files'
        });
      }

      const scholarshipData = {
        ...req.body,
        adhaarCard: req.files.adhaarCard ? req.files.adhaarCard[0].filename : null,
        rationCard: req.files.rationCard ? req.files.rationCard[0].filename : null,
        incomeCertificate: req.files.incomeCertificate ? req.files.incomeCertificate[0].filename : null,
        marksheet: req.files.marksheet ? req.files.marksheet[0].filename : null,
        attendanceSheet: req.files.attendanceSheet ? req.files.attendanceSheet[0].filename : null
      };

      const scholarship = new Scholarship(scholarshipData);
      await scholarship.save();

      res.status(200).json({
        success: true,
        message: 'Application submitted successfully!'
      });
    } catch (error) {
      console.error('Submission error:', error);
      res.status(500).json({
        success: false,
        message: 'Error submitting application'
      });
    }
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});




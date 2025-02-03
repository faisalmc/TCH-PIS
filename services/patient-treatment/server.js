const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('../../shared/db');  // Use shared database connection
const treatmentRoutes = require('./routes/treatmentRoutes');  // Import API routes

// dotenv.config({ path: '../../.env' });  // Load shared environment variables
dotenv.config({ path: './.env' });  // Load local .env
dotenv.config({ path: '../../.env' });  // Load shared .env as fallback

const app = express();
app.use(express.json());  // Allows JSON request bodies
app.use(cors());  // Enables cross-origin requests

connectDB();  // Connect to MongoDB using shared db.js

app.use('/treatment', treatmentRoutes);  // Register treatment API routes

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Patient Treatment Service running on port ${PORT}`));

// 3.1
// Adding model/Treatment.js to store diagnosis, medications, vitals.
// Linked patientID and doctorID to Patient and User

const Treatment = require('./models/Treatment');

// 3.2
// below is duplicate, so ignore
// const treatmentRoutes = require('./routes/treatmentRoutes');

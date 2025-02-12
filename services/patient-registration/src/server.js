const express = require('express');
const mongoose = require('mongoose');
const connectDB = require('../../../shared/db');
const patientRoutes = require('./routes/patientRoutes');
require('dotenv').config({ path: '../../../.env' });

const app = express();

// Middleware
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use('/patients', patientRoutes);

// Start the server
const PORT = 3001;
app.listen(PORT, () => console.log(`Patient service running on port ${PORT}`));

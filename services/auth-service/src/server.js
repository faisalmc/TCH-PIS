const express = require('express');
const mongoose = require('mongoose');
const connectDB = require('../../../shared/db');
const authRoutes = require('./routes/authRoutes');
require('dotenv').config({ path: '../../../.env' });

const app = express();

// Middleware
app.use(express.json()); // This allows us to parse JSON bodies in requests

// Connect to MongoDB
connectDB();

//Routes
app.use('/auth',authRoutes);

// Add a new route to insert a record
app.post('/add-record', async (req, res) => {
  try {
    const collection = mongoose.connection.db.collection('test_collection');
    const result = await collection.insertOne(req.body);
    res.status(201).json({ message: 'Record inserted', insertedId: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to insert record', error: err.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

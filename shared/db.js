const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    // await mongoose.connect(process.env.MONGO_URI, { 
    //   useNewUrlParser: true, 
    //   useUnifiedTopology: true 
      
    // });
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1); // Exit process if connection fails
  }
};

// Check if the connection was successful
mongoose.connection.on('connected', () => {
  console.log('Mongoose is connected to the database');
});

mongoose.connection.on('error', (err) => {
  console.error('Error with MongoDB connection:', err.message);
});

module.exports = connectDB;

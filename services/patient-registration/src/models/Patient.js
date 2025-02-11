const mongoose = require('mongoose');
const Counter = require('../../../../shared/counterModel');


const patientSchema = new mongoose.Schema({
  patientId: {
    type: String,
    unique: true
  },
  firstName: { 
    type: String, 
    required: true 
  },
  lastName: { 
    type: String, 
    required: true 
  },
  mobile: { 
    type: String, 
    required: true, 
    unique: true 
  },
  email: { 
    type: String, 
    required: true, 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});



patientSchema.pre('save', async function (next) {
  if (!this.patientId) { // Only generate if not already set
    try {
      const counter = await Counter.findOneAndUpdate(
        { model: 'Patient' }, 
        { $inc: { count: 1 } }, 
        { new: true, upsert: true }
      );

      if (!counter || !counter.count) {
        return next(new Error("Counter update failed"));
      }

      this.patientId = counter.count;
    } catch (error) {
      return next(error);
    }
  }
  next();
});


module.exports = mongoose.model('Patient', patientSchema);

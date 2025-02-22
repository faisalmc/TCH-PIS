const mongoose = require('mongoose');

const treatmentSchema = new mongoose.Schema({
    patientID: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Patient', 
        required: true 
    },
    doctorID: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: false 
    },
    diagnosis: { 
        type: String, 
        required: false 
    },
    medications: { 
        type: [String] 
    },
    vitals: [{
        temperature: Number,
        bloodPressure: String,
        time: { type: Date, default: Date.now }
    }],
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Treatment', treatmentSchema);

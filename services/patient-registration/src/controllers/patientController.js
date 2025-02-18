const Patient = require('../models/Patient');

// Register a new patient (Only for clerks)
exports.registerPatient = async (req, res) => {
  try {
    const { firstName, lastName, mobile, email, diseaseHistory } = req.body;

    // Check if patient already exists
    const existingPatient = await Patient.findOne({ mobile });

    if (existingPatient) {
      return res.status(400).json({ message: 'Patient with this mobile number already exists' });
    }

    // Create and save new patient
    const newPatient = new Patient({ firstName, lastName, mobile, email, diseaseHistory });
    await newPatient.save();

    res.status(201).json({ message: 'Patient registered successfully', patientId: newPatient.patientId });
  } catch (error) {
    res.status(500).json({ message: 'Error registering patient', error: error.message });
  }
};

// Query all patients
exports.getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find(); // Fetch all patients from MongoDB
    res.status(200).json(patients);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching patients', error: error.message });
  }
};

// Query a patient by objectId 
exports.getPatientById = async (req, res) => {
  try {
    const { pid } = req.params;
    const patient = await Patient.findOne({ patientId: pid });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.status(200).json(patient);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching patient', error: error.message });
  }
};
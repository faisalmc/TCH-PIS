const express = require('express');
const router = express.Router();
const treatmentController = require('../controllers/treatmentController');
const { verifyToken, checkDoctorRole, checkNurseRole } = require('../middleware/authMiddleware');

// ✅ Only doctors can add a diagnosis
router.post('/treatment/diagnosis', verifyToken, checkDoctorRole, treatmentController.addDiagnosis);

// ✅ Only nurses can log patient vitals
router.post('/treatment/vitals', verifyToken, checkNurseRole, treatmentController.addVitals);

// ✅ Retrieve a patient's treatment history
router.get('/treatment/:patientID', verifyToken, treatmentController.getTreatmentByPatientID);

// ✅ New Route: Update medications separately (Doctors Only)
router.put('/treatment/medications/:patientID', verifyToken, checkDoctorRole, treatmentController.updateMedications);

// ✅ New Route: Remove a specific medication (Doctors Only)
router.delete('/treatment/medications/:patientID/:medication', verifyToken, checkDoctorRole, treatmentController.removeMedication);

// ✅ New Route: Get only medications for a patient (Doctors & Nurses)
router.get('/treatment/medications/:patientID', verifyToken, treatmentController.getMedications);

module.exports = router;

const express = require('express');
const router = express.Router();
const treatmentController = require('../controllers/treatmentController');
const { verifyToken, checkDoctorRole, checkNurseRole } = require('../middleware/authMiddleware');

// Only doctors can add a diagnosis
router.post('/treatment/diagnosis', verifyToken, checkDoctorRole, treatmentController.addDiagnosis);

// Only nurses can log patient vitals
// router.post('/treatment/vitals', verifyToken, checkNurseRole, treatmentController.addVitals);
router.post('/treatment/vitals', verifyToken, checkNurseRole, treatmentController.addVitals);

// Retrieve a patient's treatment history
router.get('/treatment/:patientID', verifyToken, treatmentController.getTreatmentByPatientID);

module.exports = router;


const express = require('express');
const router = express.Router();
const treatmentController = require('../controllers/treatmentController');
const { verifyToken, checkDoctorRole, checkNurseRole } = require('../middleware/authMiddleware');

// Only doctors can add a diagnosis
router.post('/addDiagnosis', verifyToken, checkDoctorRole, treatmentController.addDiagnosis);

// Only nurses can log patient vitals
router.post('/addVitals', verifyToken, checkNurseRole, treatmentController.addVitals);

// Retrieve a patient's treatment history
router.get('/:patientID', verifyToken, treatmentController.getTreatmentByPatientID);

module.exports = router;


// // duplicate (in 3.2.2)
// const express = require('express');
// const router = express.Router();
// const { verifyToken, checkDoctorRole, checkNurseRole } = require('../middleware/authMiddleware');

// // Test route to check authentication
// router.get('/protected', verifyToken, (req, res) => {
//     res.json({ message: 'Access granted', user: req.user });
// });

// // Example: Only doctors can diagnose
// router.post('/addDiagnosis', verifyToken, checkDoctorRole, (req, res) => {
//     res.json({ message: 'Diagnosis added successfully', doctor: req.user });
// });

// // Example: Only nurses can log vitals
// router.post('/addVitals', verifyToken, checkNurseRole, (req, res) => {
//     res.json({ message: 'Vitals recorded successfully', nurse: req.user });
// });

// module.exports = router;

// // 3.2.2
// // duplicate
// // const express = require('express');
// // const router = express.Router();
// const treatmentController = require('../controllers/treatmentController');
// // const { verifyToken, checkDoctorRole, checkNurseRole } = require('../middleware/authMiddleware');

// // // Only doctors can add a diagnosis
// // router.post('/addDiagnosis', verifyToken, checkDoctorRole, treatmentController.addDiagnosis);

// // // Only nurses can log patient vitals
// // router.post('/addVitals', verifyToken, checkNurseRole, treatmentController.addVitals);

// // Retrieve a patient's treatment history
// router.get('/:patientID', verifyToken, treatmentController.getTreatmentByPatientID);

// module.exports = router;

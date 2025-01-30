const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { verifyToken, checkClerkRole } = require('../middlewares/authMiddleware');

router.post('/register', verifyToken, checkClerkRole, patientController.registerPatient);
router.get('/all', verifyToken, checkClerkRole, patientController.getAllPatients);
router.get('/:id', verifyToken, checkClerkRole, patientController.getPatientById);

module.exports = router;

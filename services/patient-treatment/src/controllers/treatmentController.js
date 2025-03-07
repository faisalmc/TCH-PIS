const mongoose = require('mongoose');
const Treatment = require('../models/Treatment');

// ✅ Add a new diagnosis (Doctors Only)
exports.addDiagnosis = async (req, res) => {
    try {
        const { patientID, diagnosis, medications } = req.body;
        const doctorID = req.user.userId;

        

        if (!patientID || !diagnosis) {
            
            return res.status(400).json({ message: "Error: patientID and diagnosis are required" });
        }

        const objectIdPatientID = new mongoose.Types.ObjectId(patientID);
        let treatment = await Treatment.findOne({ patientID: objectIdPatientID, diagnosis });

        if (treatment) {
            console.log("✏️ Updating existing diagnosis...");
            treatment.medications = medications;
        } else {
            
            treatment = new Treatment({ patientID: objectIdPatientID, doctorID, diagnosis, medications });
        }

        const savedTreatment = await treatment.save();
        
        res.status(201).json({ message: 'Diagnosis recorded successfully', treatment: savedTreatment });

    } catch (error) {
        
        res.status(500).json({ message: 'Error recording diagnosis', error: error.message });
    }
};

// ✅ Update Medications Separately (Doctors Only)
exports.updateMedications = async (req, res) => {
    try {
        const { patientID } = req.params;
        const { medications } = req.body;

      

        if (!medications || !Array.isArray(medications)) {
            return res.status(400).json({ message: "Error: Medications must be an array" });
        }

        const objectIdPatientID = new mongoose.Types.ObjectId(patientID);
        let treatment = await Treatment.findOne({ patientID: objectIdPatientID });

        if (!treatment) {
            return res.status(404).json({ message: "No treatment record found for this patient" });
        }

        treatment.medications = medications;
        await treatment.save();

        
        res.status(200).json({ message: "Medications updated successfully", treatment });

    } catch (error) {
 
        res.status(500).json({ message: 'Error updating medications', error: error.message });
    }
};

// ✅ Remove a Specific Medication (Doctors Only)
exports.removeMedication = async (req, res) => {
    try {
        const { patientID, medication } = req.params;



        const objectIdPatientID = new mongoose.Types.ObjectId(patientID);

        let treatment = await Treatment.findOne({ patientID: objectIdPatientID });

        if (!treatment) {
            return res.status(404).json({ message: "No treatment record found for this patient" });
        }

        

        // 🔎 Debug: Show comparison between stored and requested medication
        treatment.medications.forEach(med => {
            
        });

        // ✅ Use case-insensitive, whitespace-trimmed comparison
        const updatedMedications = treatment.medications.filter(
            med => med.trim().toLowerCase() !== medication.trim().toLowerCase()
        );

        if (updatedMedications.length === treatment.medications.length) {
            return res.status(400).json({ message: "Medication not found in treatment record" });
        }

        treatment.medications = updatedMedications;
        await treatment.save();

        
        res.status(200).json({ message: "Medication removed successfully", treatment });

    } catch (error) {
        
        res.status(500).json({ message: 'Error removing medication', error: error.message });
    }
};





// ✅ Retrieve Medications Only (Doctors & Nurses)
exports.getMedications = async (req, res) => {
    try {
        const { patientID } = req.params;
        

        const objectIdPatientID = new mongoose.Types.ObjectId(patientID);
        let treatment = await Treatment.findOne({ patientID: objectIdPatientID });

        if (!treatment || !treatment.medications.length) {
            return res.status(404).json({ message: "No medications found for this patient" });
        }

        
        res.status(200).json({ medications: treatment.medications });

    } catch (error) {
        
        res.status(500).json({ message: 'Error retrieving medications', error: error.message });
    }
};

// ✅ Log patient vitals (Nurses Only)
exports.addVitals = async (req, res) => {
    try {
        const { patientID, temperature, bloodPressure } = req.body;
        const update = { temperature, bloodPressure, time: new Date() };

    

        if (!patientID || !temperature || !bloodPressure) {
         
            return res.status(400).json({ message: "Error: patientID, temperature, and bloodPressure are required" });
        }

        const objectIdPatientID = new mongoose.Types.ObjectId(patientID);
        let treatment = await Treatment.findOne({ patientID: objectIdPatientID });

        if (!treatment) {
           
            treatment = new Treatment({ patientID: objectIdPatientID, vitals: [update] });
        } else {
           
            treatment.vitals.push(update);
        }

        const savedTreatment = await treatment.save();
        
        res.status(201).json({ message: 'Vitals recorded successfully', treatment: savedTreatment });

    } catch (error) {
     
        res.status(500).json({ message: 'Error logging vitals', error: error.message });
    }
};

// ✅ Retrieve a patient's treatment history
exports.getTreatmentByPatientID = async (req, res) => {
    try {
        const { patientID } = req.params;
    

        const objectIdPatientID = new mongoose.Types.ObjectId(patientID);
        const treatment = await Treatment.find({ patientID: objectIdPatientID });

        if (!treatment.length) {
        
            return res.status(404).json({ message: 'No treatment records found for this patient' });
        }

        res.status(200).json({ treatment });

    } catch (error) {
        
        res.status(500).json({ message: 'Error fetching treatment history', error: error.message });
    }
};

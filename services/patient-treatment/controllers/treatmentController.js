const axios = require('axios');
const mongoose = require('mongoose');
const Treatment = require('../models/Treatment');

// Add a new diagnosis (Doctors Only)
exports.addDiagnosis = async (req, res) => {
    try {
        const { patientID, diagnosis, medications } = req.body;
        const doctorID = req.user.userId; // Extract doctor ID from JWT

        console.log("🟡 Received diagnosis request for patientID:", patientID);

        // ✅ Data Validation: Ensure required fields are provided
        if (!patientID || !diagnosis) {
            console.error("❌ Missing required fields");
            return res.status(400).json({ message: "Error: patientID and diagnosis are required" });
        }

        // ✅ Convert patientID to ObjectId
        const objectIdPatientID = new mongoose.Types.ObjectId(patientID);

        // ✅ Ensure Patient Exists
        const patientServiceURL = `http://localhost:3001/patient/${patientID}`;
        try {
            console.log("🔍 Checking patient existence via URL:", patientServiceURL);
            const response = await axios.get(patientServiceURL, {
                headers: { Authorization: req.headers.authorization }
            });
            console.log("✅ Patient found:", response.data);
        } catch (error) {
            console.error("❌ Patient does not exist:", error.response?.data || error.message);
            return res.status(400).json({ message: "Error: Patient does not exist" });
        }

        // ✅ Check for Existing Diagnosis (Prevent Duplicates)
        const existingTreatment = await Treatment.findOne({ patientID: objectIdPatientID, diagnosis });
        if (existingTreatment) {
            console.error("❌ Duplicate Diagnosis Entry");
            return res.status(400).json({ message: "Error: Diagnosis already exists for this patient" });
        }

        // ✅ Create New Treatment Record
        const newTreatment = new Treatment({ patientID: objectIdPatientID, doctorID, diagnosis, medications });
        const savedTreatment = await newTreatment.save();

        console.log("🟢 Diagnosis successfully saved in MongoDB:", savedTreatment);
        res.status(201).json({ message: 'Diagnosis recorded successfully', treatment: savedTreatment });

    } catch (error) {
        console.error("❌ Error saving diagnosis:", error.message);
        res.status(500).json({ message: 'Error recording diagnosis', error: error.message });
    }
};

// Log patient vitals (Nurses Only)
exports.addVitals = async (req, res) => {
    try {
        const { patientID, temperature, bloodPressure } = req.body;
        const update = { temperature, bloodPressure, time: new Date() };

        console.log("🟡 Received vitals request for patientID:", patientID);

        // ✅ Data Validation: Ensure required fields are provided
        if (!patientID || !temperature || !bloodPressure) {
            console.error("❌ Missing required fields");
            return res.status(400).json({ message: "Error: patientID, temperature, and bloodPressure are required" });
        }

        // ✅ Load Clerk Token for Patient Verification
        const patientServiceURL = `http://localhost:3001/patient/${patientID}`;
        const clerkAuthToken = process.env.CLERK_AUTH_TOKEN;

        if (!clerkAuthToken) {
            console.error("❌ Clerk token is missing in .env file.");
            return res.status(500).json({ message: "Internal Server Error: Missing clerk token" });
        }

        // ✅ Verify Patient Exists using Clerk Token
        try {
            console.log("🔍 Checking patient existence via URL:", patientServiceURL);
            console.log("🔑 Using clerk token for verification:", clerkAuthToken);

            const response = await axios.get(patientServiceURL, {
                headers: { Authorization: `Bearer ${clerkAuthToken}` }
            });

            console.log("✅ Patient verification successful:", response.data);
        } catch (error) {
            console.error("❌ Patient verification failed:", error.response?.data || error.message);
            return res.status(400).json({ message: "Error: Patient does not exist" });
        }

        // ✅ Convert patientID to ObjectId before storing in MongoDB
        const objectIdPatientID = new mongoose.Types.ObjectId(patientID);
        let treatment = await Treatment.findOne({ patientID: objectIdPatientID });

        if (!treatment) {
            console.log("⚠️ No existing treatment record. Creating a new one...");
            treatment = new Treatment({ patientID: objectIdPatientID, vitals: [update] });
        } else {
            console.log("✏️ Existing treatment found. Updating vitals...");
            treatment.vitals.push(update);
        }

        const savedTreatment = await treatment.save();
        console.log("🟢 Vitals successfully saved in MongoDB:", savedTreatment);
        res.status(201).json({ message: 'Vitals recorded successfully', treatment: savedTreatment });

    } catch (error) {
        console.error("❌ Error logging vitals:", error.message);
        res.status(500).json({ message: 'Error logging vitals', error: error.message });
    }
};

// Retrieve a patient's treatment history
exports.getTreatmentByPatientID = async (req, res) => {
    try {
        const { patientID } = req.params;
        console.log("🔍 Fetching treatment history for patientID:", patientID);

        // ✅ Convert patientID to ObjectId before querying
        const objectIdPatientID = new mongoose.Types.ObjectId(patientID);
        const treatment = await Treatment.find({ patientID: objectIdPatientID });

        if (!treatment.length) {
            console.log("⚠️ No treatment found for patient:", patientID);
            return res.status(404).json({ message: 'No treatment records found for this patient' });
        }

        res.status(200).json({ treatment });

    } catch (error) {
        console.error("❌ Error fetching treatment history:", error.message);
        res.status(500).json({ message: 'Error fetching treatment history', error: error.message });
    }
};

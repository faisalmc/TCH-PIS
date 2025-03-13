const chai = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const Treatment = require('../src/models/Treatment');
const treatmentController = require('../src/controllers/treatmentController');
const { expect } = chai;

describe('Treatment Controller - addDiagnosis - Unit - Test', () => {
  afterEach(() => {
    sinon.restore(); 
  });

//-------------------------- Test Case: 1 ---------------------------
//Positive Test: Successfully create a new diagnosis

  it('should create a new diagnosis successfully', async () => {
    // Arrange
    const req = {
      body: {
        patientID: '67abada98e7056a95b8599ee',
        diagnosis: 'Sample diagnosis',
        medications: ['Med1', 'Med2']
      },
      user: { userId: '67bb267e763edeab0e1753f5' }
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };

    // Stub Treatment.findOne to simulate "no existing diagnosis"
    sinon.stub(Treatment, 'findOne').resolves(null);

    // Create a mock Treatment instance that returns the same values as in the controller
    const mockTreatment = {
      _id: new mongoose.Types.ObjectId(),
      patientID: req.body.patientID,
      doctorID: req.user.userId,
      diagnosis: req.body.diagnosis,
      medications: req.body.medications,
      save: sinon.stub().resolvesThis() // allow .save() to resolve with the same object
    };

    sinon.stub(Treatment, 'constructor').returns(mockTreatment);
    sinon.stub(Treatment.prototype, 'save').resolves(mockTreatment);


    await treatmentController.addDiagnosis(req, res);

    // Assert
    expect(res.status.calledOnceWithExactly(201)).to.be.true;

    // Grab the actual response argument
    const responseData = res.json.getCall(0).args[0];
    expect(responseData).to.have.property('message', 'Diagnosis recorded successfully');
    expect(responseData).to.have.property('treatment');
    expect(responseData.treatment).to.include({
      patientID: req.body.patientID,
      diagnosis: req.body.diagnosis
    });
    // Check array content for medications if desired
    expect(responseData.treatment.medications).to.deep.equal(req.body.medications);
  });

  // ----------------------------------- Test Case: 2 ---------------------------------
  it('should return 400 if patientID or diagnosis is missing', async () => {
   
    const req = {
      body: {
        // patientID is missing
        diagnosis: 'Some diagnosis'
      },
      user: { userId: '67bb267e763edeab0e1753f5' }
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };

  
    await treatmentController.addDiagnosis(req, res);

   
    expect(res.status.calledOnceWithExactly(400)).to.be.true;
    expect(res.json.calledWithMatch({
      message: 'Error: patientID and diagnosis are required'
    })).to.be.true;
  });

  // ---------------------------------------- Test Case: 3 ----------------------
  it('should return 500 if an exception is thrown', async () => {
    // Arrange
    const req = {
      body: {
        patientID: '67abada98e7056a95b8599ee',
        diagnosis: 'Throw error test'
      },
      user: { userId: '67bb267e763edeab0e1753f5' }
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };

    // Force an error when calling Treatment.findOne
    sinon.stub(Treatment, 'findOne').throws(new Error('DB error'));

    // Act
    await treatmentController.addDiagnosis(req, res);

    // Assert
    expect(res.status.calledOnceWithExactly(500)).to.be.true;
    expect(res.json.calledWithMatch({
      message: 'Error recording diagnosis',
      error: 'DB error'
    })).to.be.true;
  });

});


describe('Treatment Controller - updateMedications - UNIT - TEST', () => {
    afterEach(() => {
      sinon.restore(); // Reset all stubs after each test
    });

// -------------------------------- Test Case: 1 -----------------------
it('should update medications successfully', async () => {
    // Arrange
    const req = {
      params: { patientID: '67abada98e7056a95b8599ee' },
      body: { medications: ['MedA', 'MedB'] }
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };

    // Stub Treatment.findOne to simulate a found record
    const mockTreatment = {
      _id: new mongoose.Types.ObjectId(),
      patientID: req.params.patientID,
      medications: ['OldMed1'],
      save: sinon.stub().resolvesThis() // Simulate successful save()
    };
    sinon.stub(Treatment, 'findOne').resolves(mockTreatment);

    // Act
    await treatmentController.updateMedications(req, res);

    // Assert
    expect(res.status.calledOnceWithExactly(200)).to.be.true;
    expect(res.json.calledWithMatch({
      message: 'Medications updated successfully',
      treatment: { patientID: req.params.patientID, medications: req.body.medications }
    })).to.be.true;
    expect(mockTreatment.medications).to.deep.equal(req.body.medications); // Ensure medications are updated
  });    

// ------------------------------------------------- Test Case: 2 --------------------------------
// Negative Test: Returns 400 if medications field is missing or not an array  
it('should return 400 if medications field is missing', async () => {
    // Arrange
    const req = {
      params: { patientID: '67abada98e7056a95b8599ee' },
      body: {} // No medications field
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };

    // Act
    await treatmentController.updateMedications(req, res);

    // Assert
    expect(res.status.calledOnceWithExactly(400)).to.be.true;
    expect(res.json.calledWithMatch({
      message: 'Error: Medications must be an array'
    })).to.be.true;
  });


  // --------------------------------- Test Case: 3  ----------------------------
  it('should return 400 if medications is not an array', async () => {
    // Arrange
    const req = {
      params: { patientID: '67abada98e7056a95b8599ee' },
      body: { medications: 'Not an array' } // Invalid data type
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };

    // Act
    await treatmentController.updateMedications(req, res);

    // Assert
    expect(res.status.calledOnceWithExactly(400)).to.be.true;
    expect(res.json.calledWithMatch({
      message: 'Error: Medications must be an array'
    })).to.be.true;
  });


  // -------------------------------- Test Case:4 --------------------
  // Negative Test: Returns 404 if no treatment record is found
  it('should return 404 if no treatment record is found', async () => {
    // Arrange
    const req = {
      params: { patientID: '67abada98e7056a95b8599ee' },
      body: { medications: ['MedX', 'MedY'] }
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };

    // Stub Treatment.findOne to return null (patient not found)
    sinon.stub(Treatment, 'findOne').resolves(null);

    // Act
    await treatmentController.updateMedications(req, res);

    // Assert
    expect(res.status.calledOnceWithExactly(404)).to.be.true;
    expect(res.json.calledWithMatch({
      message: 'No treatment record found for this patient'
    })).to.be.true;
  });

  // ----------------------------------- Test Case:5 ------------------
  //  Negative Test: Returns 500 if a database error occurs
  it('should return 500 if an internal error occurs', async () => {
    // Arrange
    const req = {
      params: { patientID: '67abada98e7056a95b8599ee' },
      body: { medications: ['MedX', 'MedY'] }
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };

    // Force an error when calling Treatment.findOne
    sinon.stub(Treatment, 'findOne').throws(new Error('Database failure'));

    // Act
    await treatmentController.updateMedications(req, res);

    // Assert
    expect(res.status.calledOnceWithExactly(500)).to.be.true;
    expect(res.json.calledWithMatch({
      message: 'Error updating medications',
      error: 'Database failure'
    })).to.be.true;
  });

});

describe('Treatment Controller - removeMedication - UNIT - TEST', () => {
    afterEach(() => {
      sinon.restore(); // Reset all stubs after each test
    });

// ------------------------------------ Test Case: 1 ------------------------
// Positive Test: Successfully remove a medication   
it('should remove a medication successfully', async () => {
    // Arrange
    const req = {
      params: { patientID: '67abada98e7056a95b8599ee', medication: 'MedA' }
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };

    // Stub Treatment.findOne to simulate a found record
    const mockTreatment = {
      _id: new mongoose.Types.ObjectId(),
      patientID: req.params.patientID,
      medications: ['MedA', 'MedB'],
      save: sinon.stub().resolvesThis() // Simulate successful save()
    };
    sinon.stub(Treatment, 'findOne').resolves(mockTreatment);

    // Act
    await treatmentController.removeMedication(req, res);

    // Assert
    expect(res.status.calledOnceWithExactly(200)).to.be.true;
    expect(res.json.calledWithMatch({
      message: 'Medication removed successfully',
      treatment: { patientID: req.params.patientID }
    })).to.be.true;
    expect(mockTreatment.medications).to.deep.equal(['MedB']); // Ensure MedA was removed
  }); 


// ----------------------------- Test Case 2: -----------------------------  
// Negative Test: Returns 404 if no treatment record is found
it('should return 404 if no treatment record is found', async () => {
    // Arrange
    const req = {
      params: { patientID: '67abada98e7056a95b8599ee', medication: 'MedA' }
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };

    // Stub Treatment.findOne to return null (patient not found)
    sinon.stub(Treatment, 'findOne').resolves(null);

    // Act
    await treatmentController.removeMedication(req, res);

    // Assert
    expect(res.status.calledOnceWithExactly(404)).to.be.true;
    expect(res.json.calledWithMatch({
      message: 'No treatment record found for this patient'
    })).to.be.true;
  });


// ----------------------------- Test Case: 3 --------------------------
// Negative Test: Returns 400 if the medication is not found in the treatment record
it('should return 400 if the medication does not exist in the treatment record', async () => {
    // Arrange
    const req = {
      params: { patientID: '67abada98e7056a95b8599ee', medication: 'MedX' }
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };

    // Stub Treatment.findOne to simulate an existing patient but without the requested medication
    const mockTreatment = {
      _id: new mongoose.Types.ObjectId(),
      patientID: req.params.patientID,
      medications: ['MedA', 'MedB'], // MedX is not present
      save: sinon.stub().resolvesThis()
    };
    sinon.stub(Treatment, 'findOne').resolves(mockTreatment);

    // Act
    await treatmentController.removeMedication(req, res);

    // Assert
    expect(res.status.calledOnceWithExactly(400)).to.be.true;
    expect(res.json.calledWithMatch({
      message: 'Medication not found in treatment record'
    })).to.be.true;
  });  


// ----------------------------- Test Case: 4 --------------------------
// Negative Test: Returns 500 if an internal error occurs
it('should return 500 if an internal error occurs', async () => {
    // Arrange
    const req = {
      params: { patientID: '67abada98e7056a95b8599ee', medication: 'MedA' }
    };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };

    // Force an error when calling Treatment.findOne
    sinon.stub(Treatment, 'findOne').throws(new Error('Database failure'));

    // Act
    await treatmentController.removeMedication(req, res);

    // Assert
    expect(res.status.calledOnceWithExactly(500)).to.be.true;
    expect(res.json.calledWithMatch({
      message: 'Error removing medication',
      error: 'Database failure'
    })).to.be.true;
  });  


});

describe('Treatment Controller - getMedications - UNIT - TEST ', () => {
    afterEach(() => {
      sinon.restore(); // Reset all stubs after each test
    });

// ----------------------------- Test Case: 1 -----------------------    
// Positive Test: Successfully retrieves medications
it('should retrieve medications successfully', async () => {
    // Arrange
    const req = { params: { patientID: '67abada98e7056a95b8599ee' } };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };

    // Stub Treatment.findOne to simulate a found record with medications
    const mockTreatment = {
      _id: new mongoose.Types.ObjectId(),
      patientID: req.params.patientID,
      medications: ['MedA', 'MedB']
    };
    sinon.stub(Treatment, 'findOne').resolves(mockTreatment);

    // Act
    await treatmentController.getMedications(req, res);

    // Assert
    expect(res.status.calledOnceWithExactly(200)).to.be.true;
    expect(res.json.calledWithMatch({ medications: ['MedA', 'MedB'] })).to.be.true;
  });

// --------------------------------------------- Test Case: 2 -------------------
// Negative Test: Returns 404 if no treatment record is found
it('should return 404 if no treatment record is found', async () => {
    // Arrange
    const req = { params: { patientID: '67abada98e7056a95b8599ee' } };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };

    // Stub Treatment.findOne to return null (patient not found)
    sinon.stub(Treatment, 'findOne').resolves(null);

    // Act
    await treatmentController.getMedications(req, res);

    // Assert
    expect(res.status.calledOnceWithExactly(404)).to.be.true;
    expect(res.json.calledWithMatch({
      message: 'No medications found for this patient'
    })).to.be.true;
  });
  
// ------------------------------------- Test Case: 3 ------------------------
// Negative Test: Returns 404 if treatment exists but has no medication
it('should return 404 if the treatment record exists but has no medications', async () => {
    // Arrange
    const req = { params: { patientID: '67abada98e7056a95b8599ee' } };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };

    // Stub Treatment.findOne to simulate an existing treatment record with empty medications
    const mockTreatment = {
      _id: new mongoose.Types.ObjectId(),
      patientID: req.params.patientID,
      medications: []
    };
    sinon.stub(Treatment, 'findOne').resolves(mockTreatment);

    // Act
    await treatmentController.getMedications(req, res);

    // Assert
    expect(res.status.calledOnceWithExactly(404)).to.be.true;
    expect(res.json.calledWithMatch({
      message: 'No medications found for this patient'
    })).to.be.true;
  });  

  // ------------------------------------- Test Case: 4 ------------------------
  // Negative Test: Returns 500 if an internal error occurs
  it('should return 500 if an internal error occurs', async () => {
    // Arrange
    const req = { params: { patientID: '67abada98e7056a95b8599ee' } };
    const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };

    // Force an error when calling Treatment.findOne
    sinon.stub(Treatment, 'findOne').throws(new Error('Database failure'));

    // Act
    await treatmentController.getMedications(req, res);

    // Assert
    expect(res.status.calledOnceWithExactly(500)).to.be.true;
    expect(res.json.calledWithMatch({
      message: 'Error retrieving medications',
      error: 'Database failure'
    })).to.be.true;
  });


});

describe(' Treatment Controller - addVitals  - UNIT - TEST', () => {
    afterEach(() => {
        sinon.restore(); // Reset all stubs after each test
    });

// -------------------------- Test Case:1 -----------
// Positive Test: Logs vitals successfully for an existing patient record
it('should log vitals for an existing treatment record', async () => {
    // Arrange
    const req = {
        body: {
            patientID: '67abada98e7056a95b8599ee',
            temperature: 98.6,
            bloodPressure: '120/80'
        }
    };
    const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub()
    };

    // Stub Treatment.findOne to return an existing record
    const mockTreatment = {
        _id: new mongoose.Types.ObjectId(),
        patientID: req.body.patientID,
        vitals: [],
        save: sinon.stub().resolvesThis() // Mock save method
    };
    sinon.stub(Treatment, 'findOne').resolves(mockTreatment);

    // Act
    await treatmentController.addVitals(req, res);

    // Assert
    expect(mockTreatment.vitals).to.have.length(1); // Ensure vitals were added
    expect(res.status.calledOnceWithExactly(201)).to.be.true;
    expect(res.json.calledWithMatch({
        message: 'Vitals recorded successfully'
    })).to.be.true;
});
// ------------ Test case: 2 -----------
// Positive Test: Creates a new treatment record if no existing record is found
it('should create a new treatment record if patient has no existing record', async () => {
    // Arrange
    const req = {
        body: {
            patientID: '67abada98e7056a95b8599ee',
            temperature: 99.1,
            bloodPressure: '130/85'
        }
    };
    const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub()
    };

    // Stub Treatment.findOne to return null (no existing record)
    sinon.stub(Treatment, 'findOne').resolves(null);

    // Stub Treatment.prototype.save to simulate saving a new record
    const mockNewTreatment = new Treatment({
        patientID: req.body.patientID,
        vitals: [{ temperature: req.body.temperature, bloodPressure: req.body.bloodPressure, time: new Date() }]
    });
    sinon.stub(Treatment.prototype, 'save').resolves(mockNewTreatment);

    // Act
    await treatmentController.addVitals(req, res);

    // Assert
    expect(res.status.calledOnceWithExactly(201)).to.be.true;
    expect(res.json.calledWithMatch({
        message: 'Vitals recorded successfully'
    })).to.be.true;
});

// ---------------------- Test Case 3: ----------------------
// Negative Test: Returns 400 if required fields are missing
it('should return 400 if required fields are missing', async () => {
    // Arrange
    const req = { body: { patientID: '67abada98e7056a95b8599ee' } }; // Missing temperature & bloodPressure
    const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub()
    };

    // Act
    await treatmentController.addVitals(req, res);

    // Assert
    expect(res.status.calledOnceWithExactly(400)).to.be.true;
    expect(res.json.calledWithMatch({
        message: 'Error: patientID, temperature, and bloodPressure are required'
    })).to.be.true;
});

// -------------------- Test Case:4 --------------------
it('should return 500 if an internal server error occurs', async () => {
    // Arrange
    const req = {
        body: {
            patientID: '67abada98e7056a95b8599ee',
            temperature: 97.5,
            bloodPressure: '110/75'
        }
    };
    const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub()
    };

    // Stub Treatment.findOne to throw an error
    sinon.stub(Treatment, 'findOne').throws(new Error('Database failure'));

    // Act
    await treatmentController.addVitals(req, res);

    // Assert
    expect(res.status.calledOnceWithExactly(500)).to.be.true;
    expect(res.json.calledWithMatch({
        message: 'Error logging vitals',
        error: 'Database failure'
    })).to.be.true;
});


});

describe('  Treatment Controller - getTreatmentByPatientID - UNIT - TEST  ', () => {
    afterEach(() => {
        sinon.restore(); // Reset all stubs after each test
    });

// -------------------- Test Case:1 --------------------
// Positive Test: Successfully retrieves treatment history for a valid patient ID
it('should return treatment history for a valid patient ID', async () => {
    // Arrange
    const req = { params: { patientID: '67abada98e7056a95b8599ee' } };
    const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub()
    };

    // Mock treatment data
    const mockTreatment = [
        { patientID: req.params.patientID, medications: ['Paracetamol'], vitals: [{ temperature: 98.6, bloodPressure: '120/80' }] }
    ];

    // Stub Treatment.find to return treatment history
    sinon.stub(Treatment, 'find').resolves(mockTreatment);

    // Act
    await treatmentController.getTreatmentByPatientID(req, res);

    // Assert
    expect(res.status.calledOnceWithExactly(200)).to.be.true;
    expect(res.json.calledWithMatch({ treatment: mockTreatment })).to.be.true;
});

// ------------------------- Test Case: 2 ------------------------
// Positive Test: Handles case where no treatment history is found (returns 404)
it('should return 404 if no treatment records are found for the patient', async () => {
    // Arrange
    const req = { params: { patientID: '67abada98e7056a95b8599ff' } };
    const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub()
    };

    // Stub Treatment.find to return an empty array
    sinon.stub(Treatment, 'find').resolves([]);

    // Act
    await treatmentController.getTreatmentByPatientID(req, res);

    // Assert
    expect(res.status.calledOnceWithExactly(404)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'No treatment records found for this patient' })).to.be.true;
});

// ------------- Test Case: 3 ----------------
// Negative Test: Returns 400 if patientID is missing or invalid
it('should return 404 if patientID is invalid or not found', async () => {
    // Arrange
    const req = { params: { patientID: 9999999 } }; // Invalid patient ID
    const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub()
    };

    // Stub Treatment.find to return an empty array (simulating no records found)
    sinon.stub(Treatment, 'find').resolves([]);

    // Act
    await treatmentController.getTreatmentByPatientID(req, res);

    // Assert
    expect(res.status.calledOnceWithExactly(404)).to.be.true;
    expect(res.json.calledWithMatch({ message: 'No treatment records found for this patient' })).to.be.true;
});

// ----------------- Test Case:5 -----------------
// Negative Test: Returns 500 if an internal server error occur
it('should return 500 if a database error occurs', async () => {
    // Arrange
    const req = { params: { patientID: '67abada98e7056a95b8599ee' } };
    const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub()
    };

    // Stub Treatment.find to throw an error
    sinon.stub(Treatment, 'find').throws(new Error('Database failure'));

    // Act
    await treatmentController.getTreatmentByPatientID(req, res);

    // Assert
    expect(res.status.calledOnceWithExactly(500)).to.be.true;
    expect(res.json.calledWithMatch({
        message: 'Error fetching treatment history',
        error: 'Database failure'
    })).to.be.true;
});


});

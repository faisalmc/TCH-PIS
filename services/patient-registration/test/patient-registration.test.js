const chai = require('chai');
const sinon = require('sinon');
const Patient = require('../src/models/Patient');
const patientController = require('../src/controllers/patientController');

const expect = chai.expect;

describe('Patient Controller - Register - Unit - Test', () => {
    afterEach(() => {
        sinon.restore();
    });

  // ------------------------- Test Case: 1 --------------------  
    // Positive Test Case: Successful Patient Registration
    it('should register a new patient successfully', async () => {
        const req = {
            body: {
                firstName: 'John',
                lastName: 'Doe',
                mobile: '1234567890',
                email: 'john.doe@example.com',
                diseaseHistory: 'None'
            }
        };

        const res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub()
        };

        // Stub Patient.findOne to simulate no existing patient
        const findOneStub = sinon.stub(Patient, 'findOne').resolves(null);

        // Create a mock patient
        const mockPatient = new Patient(req.body);
        mockPatient.patientId = 'generated-id'; // Use a placeholder

        // Stub Patient.prototype.save to resolve with the mock patient
        const saveStub = sinon.stub(Patient.prototype, 'save').callsFake(function() {
            // Simulate the auto-increment behavior
            this.patientId = Math.floor(Math.random() * 10000).toString();
            return Promise.resolve(this);
        });

        // Call the controller method
        await patientController.registerPatient(req, res);


        // Assertions
        expect(res.status.calledWith(201)).to.be.true;
      
        const jsonCall = res.json.getCall(0);

        // Check the response structure
        expect(jsonCall.args[0]).to.be.an('object');
        expect(jsonCall.args[0]).to.have.property('message', 'Patient registered successfully');
        expect(jsonCall.args[0]).to.have.property('patientId');
        
        // Verify method calls
        expect(findOneStub.calledOnceWith({ mobile: req.body.mobile })).to.be.true;
        expect(saveStub.calledOnce).to.be.true;
    });

// ----------------------------- Test Case: 2 ---------------------------------
 // Negative Test Case: Patient with Mobile Number Already Exists
 it('should return an error if patient with mobile number already exists', async () => {
  const req = {
      body: {
          firstName: 'John',
          lastName: 'Doe',
          mobile: '1234567890',
          email: 'john.doe@example.com',
          diseaseHistory: 'None'
      }
  };

  const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
  };

  // Stub Patient.findOne to simulate existing patient
  sinon.stub(Patient, 'findOne').resolves({
      mobile: '1234567890'
  });

  await patientController.registerPatient(req, res);

  // Assertions
  expect(res.status.calledWith(400)).to.be.true;
  expect(res.json.calledWith({
      message: 'Patient with this mobile number already exists'
  })).to.be.true;
});


// ---------------------------- Test Case: 3 ----------------------------
// Negative Test Case: Server Error During Registration
it('should handle server errors during patient registration', async () => {
  const req = {
      body: {
          firstName: 'John',
          lastName: 'Doe',
          mobile: '1234567890',
          email: 'john.doe@example.com',
          diseaseHistory: 'None'
      }
  };

  const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
  };

  // Stub Patient.findOne to throw an error
  sinon.stub(Patient, 'findOne').throws(new Error('Database connection error'));

  await patientController.registerPatient(req, res);

  // Assertions
  expect(res.status.calledWith(500)).to.be.true;
  expect(res.json.calledWith(sinon.match({
      message: 'Error registering patient',
      error: sinon.match.string
  }))).to.be.true;
});

// Negative Test Case: Incomplete Patient Information
it('should return an error if required fields are missing', async () => {
  const req = {
      body: {
          // Intentionally leaving out some required fields
          firstName: '',
          lastName: '',
          mobile: '',
          email: ''
      }
  };

  const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
  };

  // Stub Patient.findOne to simulate no existing patient
  sinon.stub(Patient, 'findOne').resolves(null);

  // Stub Patient.prototype.save to simulate save failure
  sinon.stub(Patient.prototype, 'save').rejects(new Error('Validation failed'));

  await patientController.registerPatient(req, res);

  // Assertions
  expect(res.status.calledWith(500)).to.be.true;
  expect(res.json.calledWith(sinon.match({
      message: 'Error registering patient',
      error: sinon.match.string
  }))).to.be.true;
});

});

describe('Patient Controller - Get All Patients - Unit - Test', () => {
  afterEach(() => {
      sinon.restore();
  });

//--------------------------- Test Case : 1 ---------------------------
// Positive Test Case: Successfully retrieve patients
it('should successfully retrieve all patients with complete details', async () => {
  const mockPatients = [
      {
          "_id": "67abada98e7056a95b8599ee",
          "firstName": "aa",
          "lastName": "aa",
          "mobile": "1212",
          "email": "aa@aa.aaa",
          "createdAt": "2025-02-11T20:06:01.811Z",
          "patientId": "1012",
          "__v": 0
      }
  ];

  const req = {};
  const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
  };

  // Stub Patient.find to return mock patients
  sinon.stub(Patient, 'find').resolves(mockPatients);

  await patientController.getAllPatients(req, res);

  // Assertions
  expect(res.status.calledWith(200)).to.be.true;
  
  // Verify the structure of the returned patient
  const returnedPatients = res.json.getCall(0).args[0];
  expect(returnedPatients).to.be.an('array');
  expect(returnedPatients[0]).to.have.all.keys(
      '_id', 
      'firstName', 
      'lastName', 
      'mobile', 
      'email', 
      'createdAt', 
      'patientId', 
      '__v'
  );
  
  // Specific field validations
  expect(returnedPatients[0].patientId).to.equal('1012');
  expect(returnedPatients[0].mobile).to.equal('1212');
});

// -------------------------------------- Test Case: 2 ------------------------
 // Negative Test Case: Error retrieving patients
 it('should handle errors when fetching patients', async () => {
  const req = {};
  const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
  };

  // Stub Patient.find to throw an error
  sinon.stub(Patient, 'find').throws(new Error('Database connection error'));

  await patientController.getAllPatients(req, res);

  // Assertions
  expect(res.status.calledWith(500)).to.be.true;
  expect(res.json.calledWith(sinon.match({
      message: 'Error fetching patients',
      error: sinon.match.string
  }))).to.be.true;
});

// ------------------------------------ Test Case: 3 -----------------------
 // Negative Test Case: No patients found (empty result)
 it('should return an empty array when no patients exist', async () => {
  const req = {};
  const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
  };

  // Stub Patient.find to return an empty array
  sinon.stub(Patient, 'find').resolves([]);

  await patientController.getAllPatients(req, res);

  // Assertions
  expect(res.status.calledWith(200)).to.be.true;
  expect(res.json.calledWith([])).to.be.true;
});

// --------------------------------------- Test Case: 4 -----------------------------
// Additional Test Case: Verify returned patients have correct fields
it('should validate returned patient fields', async () => {
  const mockPatients = [
      {
          "_id": "67abada98e7056a95b8599ee",
          "firstName": "aa",
          "lastName": "aa",
          "mobile": "1212",
          "email": "aa@aa.aaa",
          "createdAt": "2025-02-11T20:06:01.811Z",
          "patientId": "1012",
          "__v": 0
      }
  ];

  const req = {};
  const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
  };

  // Stub Patient.find to return mock patients
  sinon.stub(Patient, 'find').resolves(mockPatients);

  await patientController.getAllPatients(req, res);

  // Detailed field validations
  const returnedPatients = res.json.getCall(0).args[0];
  
  // Verify _id
  expect(returnedPatients[0]._id).to.be.a('string');
  expect(returnedPatients[0]._id).to.equal('67abada98e7056a95b8599ee');

  // Verify createdAt is a valid date
  expect(new Date(returnedPatients[0].createdAt).toString()).to.not.equal('Invalid Date');

  // Verify __v is a number
  expect(returnedPatients[0].__v).to.be.a('number');
  expect(returnedPatients[0].__v).to.equal(0);
});

});

describe('Patient Controller - Get Patient By ID - UNIT TEST', () => {
  afterEach(() => {
      sinon.restore();
  });

  // ----------------------------------- Test Case 1:  ----------------
   // Positive Test Case: Successfully retrieve patient by ID
   it('should successfully retrieve a patient by patientId', async () => {
    const mockPatient = {
        "_id": "67abada98e7056a95b8599ee",
        "firstName": "John",
        "lastName": "Doe",
        "mobile": "1234567890",
        "email": "john.doe@example.com",
        "createdAt": "2025-02-11T20:06:01.811Z",
        "patientId": "1012",
        "__v": 0
    };

    const req = {
        params: {
            pid: '1012' // patientId to search
        }
    };

    const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub()
    };

    // Stub Patient.findOne to return mock patient
    sinon.stub(Patient, 'findOne').resolves(mockPatient);

    await patientController.getPatientById(req, res);

    // Assertions
    expect(Patient.findOne.calledOnceWith({ patientId: '1012' })).to.be.true;
    expect(res.status.calledWith(200)).to.be.true;
    
    // Verify returned patient details
    const returnedPatient = res.json.getCall(0).args[0];
    expect(returnedPatient).to.deep.equal(mockPatient);
    expect(returnedPatient.patientId).to.equal('1012');
});

// ------------------------- Test Case:2 ------------------------------
    // Negative Test Case: Patient Not Found
    it('should return 404 when patient is not found', async () => {
      const req = {
          params: {
              pid: '9999' // Non-existent patient ID
          }
      };

      const res = {
          status: sinon.stub().returnsThis(),
          json: sinon.stub()
      };

      // Stub Patient.findOne to return null
      sinon.stub(Patient, 'findOne').resolves(null);

      await patientController.getPatientById(req, res);

      // Assertions
      expect(Patient.findOne.calledOnceWith({ patientId: '9999' })).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'Patient not found' })).to.be.true;
  });

// --------------------------------- Test Case: 3  ------------------------
// Negative Test Case: Server Error
it('should handle server errors when fetching patient', async () => {
  const req = {
      params: {
          pid: '1012'
      }
  };

  const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
  };

  // Stub Patient.findOne to throw an error
  sinon.stub(Patient, 'findOne').throws(new Error('Database connection error'));

  await patientController.getPatientById(req, res);

  // Assertions
  expect(res.status.calledWith(500)).to.be.true;
  expect(res.json.calledWith(sinon.match({
      message: 'Error fetching patient',
      error: sinon.match.string
  }))).to.be.true;
});


// --------------------------------------- Test Case: 4 ----------------------
// Additional Test Case: Validate Patient Fields
it('should validate returned patient fields', async () => {
  const mockPatient = {
      "_id": "67abada98e7056a95b8599ee",
      "firstName": "John",
      "lastName": "Doe",
      "mobile": "1234567890",
      "email": "john.doe@example.com",
      "createdAt": "2025-02-11T20:06:01.811Z",
      "patientId": "1012",
      "__v": 0
  };

  const req = {
      params: {
          pid: '1012'
      }
  };

  const res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
  };

  // Stub Patient.findOne to return mock patient
  sinon.stub(Patient, 'findOne').resolves(mockPatient);

  await patientController.getPatientById(req, res);

  // Detailed field validations
  const returnedPatient = res.json.getCall(0).args[0];
  
  // Verify specific fields
  expect(returnedPatient).to.have.all.keys(
      '_id', 
      'firstName', 
      'lastName', 
      'mobile', 
      'email', 
      'createdAt', 
      'patientId', 
      '__v'
  );

  // Validate field types
  expect(returnedPatient._id).to.be.a('string');
  expect(returnedPatient.firstName).to.be.a('string');
  expect(returnedPatient.mobile).to.be.a('string');
  expect(new Date(returnedPatient.createdAt).toString()).to.not.equal('Invalid Date');
});


});
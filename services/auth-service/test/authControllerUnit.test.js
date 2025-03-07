// 1. Import required libraries
const chai = require('chai');
const sinon = require('sinon');
const User = require('../src/models/User');
const authController = require('../src/controllers/authController');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


// 2. Configure Chai for assertions
const expect = chai.expect;


// 3. Describe the test suite for the Auth Controller's register function
describe('Auth Controller - Register - Unit - Test', () => {
    // 4. After each test, restore all stubs to their original state
    afterEach(() => {
      sinon.restore();
});

// ------------------------  Test Case: 1 ------------------------------
// 5. Define a test case for successful user registration
it('should register a new user', async () => {
    // 6. Mock the request object (req)
    const req = {
      body: {
        username: 'testuser',
        password: 'testpassword',
        role: 'clerk',
      },
    };

// 7. Mock the response object (res)
const res = {
    status: sinon.stub().returnsThis(), // Stub res.status to return the response object
    json: sinon.stub(), // Stub res.json to capture the response
  };
  
  
    // 8. Stub User.findOne to simulate no existing user
    sinon.stub(User, 'findOne').resolves(null);

    // 9. Stub bcrypt.hash to simulate password hashing
    sinon.stub(bcrypt, 'hash').resolves('hashedpassword');

    // 10. Stub User.prototype.save to simulate saving a user to the database
    sinon.stub(User.prototype, 'save').resolves();

    // 11. Call the register function from authController
    await authController.register(req, res);

    // 12. Assertions to verify the function's behavior
    expect(res.status.calledWith(2012)).to.be.true; // Check if status 201 was sent
    expect(res.json.calledWith({ message: 'User registered successfully' })).to.be.true; // Check if the correct message was sent
  });  
    
// ------------------------  Test Case: 2 ------------------------------
it('should return an error if username already exists', async()=>
{
    const req={
        body:{
            username: 'existinguser',
            password: 'testpassword',
            role:'clerk',
        },
    };

    const res={
        status:sinon.stub().returnsThis(),
        json: sinon.stub(),
    };

    sinon.stub(User,'findOne').resolves({username:'existinguser'});
    
    await authController.register(req,res);

    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledWith({message: 'Username already exists'})).to.be.true;

}
);

//    ----------- Test Case: 3 ------------

it('should return an error if required fields are missing', async () => {
    const req={
        body:{
            username:'',
            password:'',
            role:'',

        },
    };
const res={
    status:sinon.stub().returnsThis(),
    json: sinon.stub(),
};

await authController.register(req, res);

expect(res.status.calledWith(400)).to.be.true;
expect(res.json.calledWith({ message: 'Missing required fields' })).to.be.true;

});

//  --------------  Test Case: 4 -------------
it('should return an error if role is invalid', async () => {
    const req = {
        body: {
            username: 'testuser',
            password: 'testpassword',
            role: 'testrole', // Invalid role
        },
    };
    const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
    };


    // Stub User.findOne to simulate no existing user
    sinon.stub(User, 'findOne').resolves(null);
        
    // Stub bcrypt.hash to simulate password hashing
    sinon.stub(bcrypt, 'hash').resolves('hashedpassword');
       
    // Create a validation error that MongoDB would throw for invalid role
    const validationError = new Error("User validation failed: role: `testrole` is not a valid enum value for path `role`.");
       
    // Stub User.prototype.save to reject with the validation error
    sinon.stub(User.prototype, 'save').rejects(validationError);


    await authController.register(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWith(sinon.match({
        message: 'Error registering user',
        error: sinon.match.string
    }))).to.be.true;
});
// ----------------------   Test Case - 5
it('should return an error if username already exists', async () => {
    // Stub the User.findOne method
    const findOneStub = sinon.stub(User, 'findOne').resolves({ username: 'existinguser' });

    const req = {
        body: {
            username: 'existinguser',
            password: 'testpassword',
            role: 'clerk',
        },
    };
    const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
    };

    await authController.register(req, res);

    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledWith({ message: 'Username already exists' })).to.be.true;

    // Restore the stubbed method
    findOneStub.restore();
});

});

describe('Auth Controller - Login - Unit - Test', () => {
    afterEach(() => {
        sinon.restore();
    });

    // ------------------------  Test Case: 1 ------------------------------
    it('should log in a user with valid credentials', async () => {
        const req = {
            body: {
                username: 'testuser',
                password: 'testpassword',
            },
        };
        const res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub(),
        };

        // Stub User.findOne to simulate finding the user
        const findOneStub = sinon.stub(User, 'findOne').resolves({
            _id: 'userId',
            username: 'testuser',
            password: 'hashedpassword',
            role: 'clerk',
        });

        // Stub bcrypt.compare to simulate password comparison
        const compareStub = sinon.stub(bcrypt, 'compare').resolves(true);

        // Stub jwt.sign to simulate token generation
        const signStub = sinon.stub(jwt, 'sign').returns('fakeToken');

        await authController.login(req, res);

        expect(res.status.calledWith(200)).to.be.true;
        expect(res.json.calledWith({ token: 'fakeToken', role: 'clerk' })).to.be.true;

        // Restore the stubbed methods
        findOneStub.restore();
        compareStub.restore();
        signStub.restore();
    });


    //  ------------------------  Test Case: 2 ------------------------------
    it('should return an error if username is not found',async () =>{
        const req = {
            body: {
                username: 'nonexistentuser',
                password: 'testpassword',
            },
    };
    const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
    };
    // Stub User.findOne to simulate user not found
    const findOneStub = sinon.stub(User, 'findOne').resolves(null);
    await authController.login(req, res);

        expect(res.status.calledWith(401)).to.be.true;
        expect(res.json.calledWith({ message: 'Invalid credentials' })).to.be.true;

        // Restore the stubbed method
        findOneStub.restore();
    });

    // ------------------------  Test Case: 3 ------------------------------
    it('should return an error if password is incorrect', async () => {
        const req = {
            body: {
                username: 'testuser',
                password: 'wrongpassword',
            },
        };
        const res = {
            status: sinon.stub().returnsThis(),
            json: sinon.stub(),
        };

        // Stub User.findOne to simulate finding the user
        const findOneStub = sinon.stub(User, 'findOne').resolves({
            _id: 'userId',
            username: 'testuser',
            password: 'hashedpassword',
            role: 'clerk',
        });

        // Stub bcrypt.compare to simulate password comparison
        const compareStub = sinon.stub(bcrypt, 'compare').resolves(false);

        await authController.login(req, res);

        expect(res.status.calledWith(401)).to.be.true;
        expect(res.json.calledWith({ message: 'Invalid credentials' })).to.be.true;

        // Restore the stubbed methods
        findOneStub.restore();
        compareStub.restore();
    });

// ------------------------  Test Case: 4 ------------------------------
it('should return an error if there is a server error', async () => {
    const req = {
        body: {
            username: 'testuser',
            password: 'testpassword',
        },
    };
    const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub(),
    };

    // Stub User.findOne to simulate a server error
    const findOneStub = sinon.stub(User, 'findOne').throws(new Error('Server error'));

    await authController.login(req, res);

    expect(res.status.calledWith(500)).to.be.true;
    expect(res.json.calledWith(sinon.match({
        message: 'Error logging in',
        error: sinon.match.string,
    }))).to.be.true;

    // Restore the stubbed method
    findOneStub.restore();
});

});
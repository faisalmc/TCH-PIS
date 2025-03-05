const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

//User Registration
exports.register= async (req, res) =>{
    try{
        const { username, password, role } = req.body;

             // Check for missing required fields
             if (!username || !password || !role) {
              return res.status(400).json({ message: 'Missing required fields' });}

        // Check if user already exists
        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
          }

       // Hash the password
       const hashedPassword = await bcrypt.hash(password, 10);   

       // Create new user
        const newUser = new User({
        username,
        password: hashedPassword,
        role
      });

    // Save user to database
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });

} 
    catch (error) {
    res.status(500).json({ message: 'Error registering user', error: error.message });
}

};

//User Login
exports.login = async (req, res) =>{
    try{
        const { username, password } = req.body;

        // Find user by username
        const user = await User.findOne({ username });
        if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

    // Generate JWT token
    const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );  
      // Set status to 200 and send the response
      return res.status(200).json({ token, role: user.role });
    }
    catch (error) {
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
};
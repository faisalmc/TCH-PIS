const express = require('express');
const mongoose = require('mongoose');
const connectDB = require('../../../shared/db');
const treatmentRoutes = require('./routes/treatmentRoutes');
// require('dotenv').config({ path: '../../../.env' });
// require('dotenv').config({ path: '../../../.env' });
require('dotenv').config({ path: __dirname + '/../../../.env' });

// console.log(`🔍 DEBUG: Loaded PORT from .env: ${process.env.PORT}`);
// console.log(`🔍 DEBUG: Loaded Treatment Service Port: ${process.env.TREATMENT_SERVICE_PORT}`);

const app = express();

// Middleware
app.use(express.json());

// Connect to MongoDB
connectDB();

// ✅ Mount Treatment Routes
app.use('/api', treatmentRoutes);

// ✅ Debug: Log Registered Routes
// const listRoutes = (app) => {
//     console.log("\n📌 Registered Routes:");
//     app._router.stack.forEach((middleware) => {
//         if (middleware.route) {
//             console.log(`✅ ${Object.keys(middleware.route.methods).join(', ').toUpperCase()} ${middleware.route.path}`);
//         } else if (middleware.name === 'router') {
//             middleware.handle.stack.forEach((handler) => {
//                 if (handler.route) {
//                     console.log(`✅ ${Object.keys(handler.route.methods).join(', ').toUpperCase()} /api${handler.route.path}`);
//                 }
//             });
//         }
//     });
// };

// Start the server
// const PORT = process.env.PORT || 3002;
// app.listen(PORT, () => {
//     console.log(`Patient Treatment Service running on port ${PORT}`);
//     listRoutes(app); // ✅ Log routes after server starts
// });

const PORT = process.env.SERVICE_NAME === "treatment" ? 3002 : process.env.PORT || 3002;

app.listen(PORT, () => {
    console.log(`Patient Treatment Service running on port ${PORT}`);
});


// const express = require('express');
// const mongoose = require('mongoose');
// const connectDB = require('../../shared/db');
// const treatmentRoutes = require('./routes/treatmentRoutes');
// require('dotenv').config({ path: '../../.env' });

// const app = express();

// // Middleware
// app.use(express.json());

// // Connect to MongoDB
// connectDB();

// // ✅ Mount Treatment Routes
// app.use('/api', treatmentRoutes);

// // Start the server
// const PORT = process.env.PORT || 3002;
// app.listen(PORT, () => console.log(`Patient Treatment Service running on port ${PORT}`));

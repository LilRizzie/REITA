require('dotenv').config();

const dns = require('dns');

dns.setServers(['8.8.8.8', '1.1.1.1']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const User = require('./models/User');

const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const reportRoutes = require('./routes/reportRoutes');
const analysisRoutes = require('./routes/analysisRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://reita.vercel.app',
  'https://reita.com.ng',
  'https://www.reita.com.ng',
];

app.use(cors());

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/analyses', analysisRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'REITA server is running',
  });
});

const PORT = process.env.PORT || 5000 || 4600;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    return User.collection.dropIndex('googleId_1').catch((error) => {
      if (error.code !== 27 && error.codeName !== 'IndexNotFound') {
        throw error;
      }
    });
  })
  .then(() => {

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`REITA server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:");
    console.error(error.message)
    process.exit(1);
  });
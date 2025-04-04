const mongoose = require('mongoose');
const express = require('express');
const app = express();

const adminRoutes = require('./routes/admin_routes');
app.use('/api/admin', adminRoutes);

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

module.exports = app;
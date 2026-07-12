const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middlewares
app.use(cors({
  origin: '*', // Allow all origins for local deployment flexibility, can restrict in production
  credentials: true,
}));
app.use(express.json());

// API logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} to ${req.originalUrl}`);
  next();
});

// Import Routes
const authRoutes = require('./routes/authRoutes');
const vidwanRoutes = require('./routes/vidwanRoutes');
const programRoutes = require('./routes/programRoutes');

const path = require('path');

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/vidwans', vidwanRoutes);
app.use('/api/programs', programRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// // Serve frontend in production
// if (process.env.NODE_ENV === 'production') {
//   app.use(express.static(path.join(__dirname, '../public')));

//   app.get('*', (req, res) => {
//     if (req.originalUrl.startsWith('/api')) {
//       return res.status(404).json({ message: `API route not found - ${req.originalUrl}` });
//     }
//     res.sendFile(path.resolve(__dirname, '../public', 'index.html'));
//   });
// } else {
//   // 404 handler for development
//   app.use((req, res, next) => {
//     res.status(404).json({ message: `Route not found - ${req.originalUrl}` });
//   });
// }

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in development mode on port ${PORT}`);
});

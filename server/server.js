import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'https://ace-shop-two.vercel.app'
];
app.use(
  cors({
    origin: allowedOrigins
  })
);

app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'smartcart-api'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);

  res.status(err.status || 500).json({
    message: err.message || 'Internal server error'
  });
});

const port = Number(process.env.PORT || 5000);

connectDB()
  .then(() => {
    app.listen(port, '0.0.0.0', () => {
      console.log(
        `SmartCart API running on port ${port}`
      );
    });
  })
  .catch((err) => {
    console.error(
      'Database connection failed:',
      err.message
    );

    process.exit(1);
  });
import 'dotenv/config';
import 'express-async-errors'; // let async route handlers throw into the error middleware
import express, { Express, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import apiRoutes from './routes';
import { connectMongo } from './config/mongo';

const app: Express = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // base64 images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api', apiRoutes);
app.get('/', (_req: Request, res: Response) => { res.send('RealtySarv Server is running!'); });

// Anything that throws in a route ends up here instead of crashing the process.
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set. Add it to server/.env');
  process.exit(1);
}

connectMongo()
  .then(() => app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`)))
  .catch((e) => { console.error('MongoDB connection failed:', e.message); process.exit(1); });

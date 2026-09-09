import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { uploadMiddleware } from "./middleware/upload";

dotenv.config();

const app: Application = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Secure File Upload Route
app.post('/api/upload', uploadMiddleware.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    // If we reach here without a file, Multer stripped it due to a limit or none was provided
    return res.status(400).json({ success: false, message: 'No file securely parsed.' });
  }
  res.status(201).json({
    success: true,
    message: 'File successfully persisted locally.',
    filename: req.file.filename,
    size: req.file.size
  });
});

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("[Express Error]", err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

export default app;

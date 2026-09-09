import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Resolve uploads directory absolutely to prevent traversal attacks
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.resolve(process.cwd(), 'uploads');

// Ensure the directory exists securely
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log(`[Storage] Initialized secure uploads directory at: ${UPLOADS_DIR}`);
}

// Configure local disk storage with strict filename sanitization
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Generate an unguessable timestamped filename, stripping out malicious characters
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${safeName}`);
  }
});

// Configure Multer with tight security limits (5MB, images/pdfs only)
export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB strict limit to prevent DOS (Denial of Service) via disk exhaustion
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`[Security] Unsupported file type rejected: ${file.mimetype}`));
    }
  }
});

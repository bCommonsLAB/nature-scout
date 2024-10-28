import dotenv from 'dotenv';

dotenv.config();

import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import cors from 'cors';
import { initializeConfig } from './config';
import { ImageAnalysisResult } from './types/types';

initializeConfig();

import { analyzeImage, analyzeImageStructured } from './services/openAiService';

const app = express();
const port = process.env.PORT ||3001; // Oder ein anderer Port Ihrer Wahl

app.use(cors());
app.use(express.json()); // Fügen Sie diese Zeile hinzu

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));


// Konfigurieren Sie multer für Datei-Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Stellen Sie sicher, dass dieses Verzeichnis existiert
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Eindeutiger Dateiname
  },
});


const upload = multer({ storage: storage });

// Definieren Sie den Typ für die Request mit der Datei
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}


// Route für Datei-Uploads
app.post('/upload', upload.single('image'), async (req: MulterRequest, res: Response) => {
  if (!req.file) {
    res.status(400).send('Kein Bild hochgeladen.');
    return;
  }
  const imagePath = path.join('uploads', req.file.filename);
  res.json({ success: true, filename: req.file.filename });
});

// Neue Route für die Analyse
app.post('/analyze', async (req: Request, res: Response) => {
  const { images } = req.body;

  if (!images || !Array.isArray(images)) {
    res.status(400).send('Keine Bilder übergeben.');
    return;
  }
  try {
    const analysisResult: ImageAnalysisResult = await analyzeImageStructured(images);
    res.json(analysisResult);
  } catch (error) {
    console.error('Fehler bei der Bildanalyse:', error);
    res.status(500).send('Fehler bei der Bildanalyse');
  }
});

app.get('/getimage/:filename', (req, res) => {
  const filename = req.params.filename;
  const imagePath = path.join(__dirname, '/../uploads', filename);
  res.sendFile(imagePath);
});

app.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
});

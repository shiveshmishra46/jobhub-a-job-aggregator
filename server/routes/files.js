import express from 'express';
import multer from 'multer';
import GridFS from 'gridfs-stream';
import mongoose from 'mongoose';
import { authenticateToken } from '../middleware/auth.js';
import User from '../models/User.js';
import pdf from 'pdf-parse';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images, PDFs, and documents
    if (file.mimetype.startsWith('image/') || 
        file.mimetype === 'application/pdf' ||
        file.mimetype.includes('document')) {
      cb(null, true);
    } else {
      cb(new Error('Only images, PDF, and document files are allowed'), false);
    }
  }
});

// Initialize GridFS
let gfs;
mongoose.connection.once('open', () => {
  gfs = GridFS(mongoose.connection.db, mongoose.mongo);
  gfs.collection('uploads');
});

// Upload resume and extract text
router.post('/upload-resume', authenticateToken, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    let extractedText = '';

    // Extract text based on file type
    if (req.file.mimetype === 'application/pdf') {
      const pdfData = await pdf(req.file.buffer);
      extractedText = pdfData.text;
    } else if (req.file.mimetype.includes('document')) {
      // For DOC/DOCX files, you'd need a library like mammoth
      extractedText = 'Document text extraction not implemented yet';
    } else {
      return res.status(400).json({ message: 'Unsupported file type for text extraction' });
    }

    if (!gfs) {
      return res.status(500).json({ message: 'GridFS not initialized' });
    }

    // Save file to GridFS
    const writeStream = gfs.createWriteStream({
      filename: `${req.user._id}_resume_${Date.now()}_${req.file.originalname}`,
      contentType: req.file.mimetype,
      metadata: {
        userId: req.user._id,
        fileType: 'resume',
        originalName: req.file.originalname,
        uploadDate: new Date(),
        extractedText: extractedText
      }
    });

    writeStream.on('close', async (file) => {
      try {
        // Update user profile with resume reference
        await User.findByIdAndUpdate(req.user._id, {
          'profile.resume': {
            fileId: file._id,
            filename: file.filename,
            contentType: file.contentType,
            uploadDate: new Date()
          }
        });

        res.json({
          message: 'Resume uploaded and processed successfully',
          text: extractedText,
          file: {
            id: file._id,
            filename: file.filename,
            contentType: file.contentType,
            size: file.length
          }
        });

      } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Error updating user profile' });
      }
    });

    writeStream.on('error', (error) => {
      console.error('GridFS write error:', error);
      res.status(500).json({ message: 'Error uploading file' });
    });

    // Write file buffer to GridFS
    writeStream.end(req.file.buffer);

  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ message: 'Server error during resume upload' });
  }
});

// Upload file (general)
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { fileType } = req.body; // 'resume', 'profilePicture', 'companyLogo'

    if (!gfs) {
      return res.status(500).json({ message: 'GridFS not initialized' });
    }

    // Create GridFS write stream
    const writeStream = gfs.createWriteStream({
      filename: `${req.user._id}_${fileType}_${Date.now()}_${req.file.originalname}`,
      contentType: req.file.mimetype,
      metadata: {
        userId: req.user._id,
        fileType,
        originalName: req.file.originalname,
        uploadDate: new Date()
      }
    });

    // Handle stream events
    writeStream.on('close', async (file) => {
      try {
        // Update user profile with file reference
        const updateData = {};
        
        if (fileType === 'resume') {
          updateData['profile.resume'] = {
            fileId: file._id,
            filename: file.filename,
            contentType: file.contentType,
            uploadDate: new Date()
          };
        } else if (fileType === 'profilePicture') {
          updateData['profile.profilePicture'] = {
            fileId: file._id,
            filename: file.filename,
            contentType: file.contentType
          };
        } else if (fileType === 'companyLogo') {
          updateData['company.logo'] = {
            fileId: file._id,
            filename: file.filename,
            contentType: file.contentType
          };
        }

        await User.findByIdAndUpdate(req.user._id, updateData);

        res.json({
          message: 'File uploaded successfully',
          file: {
            id: file._id,
            filename: file.filename,
            contentType: file.contentType,
            size: file.length,
            uploadDate: file.uploadDate
          }
        });

      } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Error updating user profile' });
      }
    });

    writeStream.on('error', (error) => {
      console.error('GridFS write error:', error);
      res.status(500).json({ message: 'Error uploading file' });
    });

    // Write file buffer to GridFS
    writeStream.end(req.file.buffer);

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error during file upload' });
  }
});

// Get file by ID
router.get('/:id', async (req, res) => {
  try {
    if (!gfs) {
      return res.status(500).json({ message: 'GridFS not initialized' });
    }

    const file = await gfs.files.findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Set appropriate headers
    if (file.contentType.startsWith('image/')) {
      res.set('Content-Type', file.contentType);
    } else {
      res.set('Content-Type', 'application/octet-stream');
      res.set('Content-Disposition', `attachment; filename="${file.filename}"`);
    }

    // Create read stream
    const readStream = gfs.createReadStream({ _id: file._id });
    
    readStream.on('error', (error) => {
      console.error('GridFS read error:', error);
      res.status(500).json({ message: 'Error reading file' });
    });

    readStream.pipe(res);

  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ message: 'Server error while fetching file' });
  }
});

export default router;
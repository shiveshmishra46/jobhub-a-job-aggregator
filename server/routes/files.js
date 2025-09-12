import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import { authenticateToken } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// Multer memory storage for small files like resumes/avatars
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const isImage = file.mimetype.startsWith('image/');
    if (isImage || allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only images, PDF, and DOC/DOCX files are allowed'), false);
  }
});

// Safe helper to fetch shared GridFS instance
function getGFS(req) {
  const gfs = req.app.get('gfs');
  if (!gfs) throw new Error('GridFS not initialized');
  return gfs;
}

// Upload resume, extract text (PDF supported), store in GridFS with metadata
router.post('/upload-resume', authenticateToken, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    let extractedText = '';

    if (req.file.mimetype === 'application/pdf') {
      try {
        const { default: pdf } = await import('pdf-parse'); // lazy import to avoid startup crash
        const pdfData = await pdf(req.file.buffer);
        extractedText = pdfData.text || '';
      } catch (err) {
        console.warn('PDF extraction unavailable:', err.message);
        extractedText = '';
      }
    } else if (
      req.file.mimetype === 'application/msword' ||
      req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      extractedText = 'Document text extraction not implemented yet';
    } else if (!req.file.mimetype.startsWith('image/')) {
      return res.status(400).json({ message: 'Unsupported file type for text extraction' });
    }

    const gfs = getGFS(req);

    const writeStream = gfs.createWriteStream({
      filename: `${req.user._id}_resume_${Date.now()}_${req.file.originalname}`,
      contentType: req.file.mimetype,
      metadata: {
        userId: req.user._id,
        fileType: 'resume',
        originalName: req.file.originalname,
        uploadDate: new Date(),
        extractedText
      }
    });

    writeStream.on('close', async (file) => {
      try {
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

    writeStream.end(req.file.buffer);
  } catch (error) {
    console.error('Upload resume error:', error);
    res.status(500).json({ message: 'Server error during resume upload' });
  }
});

// Stream a file by id
router.get('/:id', async (req, res) => {
  try {
    const gfs = getGFS(req);
    const fileId = new mongoose.Types.ObjectId(req.params.id);

    gfs.files.findOne({ _id: fileId }, (err, file) => {
      if (err || !file) return res.status(404).json({ message: 'File not found' });

      res.set('Content-Type', file.contentType || 'application/octet-stream');
      res.set('Content-Disposition', `inline; filename="${file.filename}"`);

      const readStream = gfs.createReadStream({ _id: fileId, root: 'uploads' });
      readStream.on('error', (e) => {
        console.error('GridFS read error:', e);
        res.status(500).end();
      });
      readStream.pipe(res);
    });
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ message: 'Server error retrieving file' });
  }
});

// Download a file as attachment
router.get('/:id/download', async (req, res) => {
  try {
    const gfs = getGFS(req);
    const fileId = new mongoose.Types.ObjectId(req.params.id);

    gfs.files.findOne({ _id: fileId }, (err, file) => {
      if (err || !file) return res.status(404).json({ message: 'File not found' });

      res.set('Content-Type', 'application/octet-stream');
      res.set('Content-Disposition', `attachment; filename="${file.filename}"`);

      const readStream = gfs.createReadStream({ _id: fileId, root: 'uploads' });
      readStream.on('error', (e) => {
        console.error('GridFS read error:', e);
        res.status(500).end();
      });
      readStream.pipe(res);
    });
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({ message: 'Server error downloading file' });
  }
});

// Get file metadata
router.get('/:id/meta', async (req, res) => {
  try {
    const gfs = getGFS(req);
    const fileId = new mongoose.Types.ObjectId(req.params.id);

    gfs.files.findOne({ _id: fileId }, (err, file) => {
      if (err || !file) return res.status(404).json({ message: 'File not found' });
      res.json({
        id: file._id,
        filename: file.filename,
        length: file.length,
        contentType: file.contentType,
        uploadDate: file.uploadDate,
        metadata: file.metadata || {}
      });
    });
  } catch (error) {
    console.error('Get metadata error:', error);
    res.status(500).json({ message: 'Server error getting file metadata' });
  }
});

// List current user's files
router.get('/user/me/list', authenticateToken, async (req, res) => {
  try {
    const gfs = getGFS(req);
    gfs.files.find({ 'metadata.userId': req.user._id }).toArray((err, files) => {
      if (err) {
        console.error('List files error:', err);
        return res.status(500).json({ message: 'Error listing files' });
      }
      res.json({
        files: (files || []).map(f => ({
          id: f._id,
          filename: f.filename,
          length: f.length,
          contentType: f.contentType,
          uploadDate: f.uploadDate,
          metadata: f.metadata || {}
        }))
      });
    });
  } catch (error) {
    console.error('List user files error:', error);
    res.status(500).json({ message: 'Server error listing files' });
  }
});

// Delete a file by id (owner or admin)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const gfs = getGFS(req);
    const fileId = new mongoose.Types.ObjectId(req.params.id);

    gfs.files.findOne({ _id: fileId }, (err, file) => {
      if (err || !file) return res.status(404).json({ message: 'File not found' });

      const isOwner = file.metadata?.userId?.toString?.() === req.user._id.toString();
      const isAdmin = req.user.role === 'admin';
      if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Not authorized to delete this file' });

      gfs.remove({ _id: fileId, root: 'uploads' }, (removeErr) => {
        if (removeErr) {
          console.error('GridFS remove error:', removeErr);
          return res.status(500).json({ message: 'Error deleting file' });
        }
        res.json({ message: 'File deleted successfully' });
      });
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ message: 'Server error deleting file' });
  }
});

export default router;
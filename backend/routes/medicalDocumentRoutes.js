const express = require('express');
const router = express.Router();
const { uploadDocument, getDocuments, deleteDocument } = require('../controllers/medicalDocumentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, authorize('patient', 'hospital'), uploadDocument)
  .get(protect, getDocuments);

router.delete('/:id', protect, deleteDocument);

module.exports = router;

const express = require('express');
const router = express.Router();
const { uploadDocument, getDocuments, deleteDocument } = require('../controllers/medicalDocumentController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, uploadDocument)
  .get(protect, getDocuments);

router.delete('/:id', protect, deleteDocument);

module.exports = router;

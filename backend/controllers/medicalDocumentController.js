const MedicalDocument = require('../models/MedicalDocument');
const Hospital = require('../models/Hospital');
const User = require('../models/User');
const { sendError, isValidObjectId, parsePagination } = require('../utils/http');

const DOCUMENT_TYPES = MedicalDocument.schema.path('type').enumValues;
const DEFAULT_FILE_URL = 'https://example.com/simulated-document.pdf';

// Only http(s) links or inline data URIs; "javascript:" and similar schemes would
// be a stored XSS vector wherever the link is rendered.
const isSafeFileUrl = (url) => typeof url === 'string' && /^(https?:\/\/|data:(application\/pdf|image\/[a-z0-9.+-]+);base64,)/i.test(url.trim());

// @desc    Upload / Register a medical document
// @route   POST /api/documents
// @access  Private (Patient, or Hospital admin uploading for a patient)
const uploadDocument = async (req, res) => {
  try {
    const { title, type, fileUrl, notes, patientId } = req.body;

    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ message: 'title is required.' });
    }
    if (!DOCUMENT_TYPES.includes(type)) {
      return res.status(400).json({ message: `type must be one of: ${DOCUMENT_TYPES.join(', ')}` });
    }
    if (fileUrl !== undefined && fileUrl !== null && fileUrl !== '' && !isSafeFileUrl(fileUrl)) {
      return res.status(400).json({ message: 'fileUrl must be an http(s) link or a base64 PDF/image data URI.' });
    }

    let targetPatientId = req.user._id;
    let uploadedByHospital = null;

    if (req.user.role === 'hospital') {
      const hospital = await Hospital.findOne({ user: req.user._id });
      if (!hospital) {
        return res.status(404).json({ message: 'Hospital profile not found' });
      }
      if (!patientId) {
        return res.status(400).json({ message: 'Patient ID is required when hospital uploads document.' });
      }
      if (!isValidObjectId(patientId)) {
        return res.status(400).json({ message: 'Invalid patient ID.' });
      }
      // Previously any id was accepted, creating documents for non-existent patients.
      const patient = await User.findOne({ _id: patientId, role: 'patient' }).select('_id');
      if (!patient) {
        return res.status(404).json({ message: 'Patient not found.' });
      }
      uploadedByHospital = hospital._id;
      targetPatientId = patient._id;
    }

    const document = await MedicalDocument.create({
      patient: targetPatientId,
      title: title.trim(),
      type,
      fileUrl: fileUrl ? fileUrl.trim() : DEFAULT_FILE_URL,
      notes: typeof notes === 'string' ? notes.trim() : undefined,
      uploadedByHospital,
    });

    res.status(201).json(document);
  } catch (error) {
    sendError(res, error);
  }
};

// @desc    Get patient's documents
// @route   GET /api/documents
// @access  Private
const getDocuments = async (req, res) => {
  try {
    const { patientId } = req.query;
    if (patientId !== undefined && !isValidObjectId(patientId)) {
      return res.status(400).json({ message: 'Invalid patient ID.' });
    }

    let query = {};
    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    } else if (req.user.role === 'hospital') {
      const hospital = await Hospital.findOne({ user: req.user._id });
      if (!hospital) {
        return res.status(404).json({ message: 'Hospital profile not found' });
      }
      // Hospitals only see documents they uploaded themselves.
      query = { uploadedByHospital: hospital._id };
      if (patientId) query.patient = patientId;
    } else if (patientId) {
      // admin / superadmin
      query.patient = patientId;
    }

    const { skip, limit } = parsePagination(req.query, { defaultLimit: 50, maxLimit: 100 });
    const documents = await MedicalDocument.find(query)
      .populate('uploadedByHospital', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    res.json(documents);
  } catch (error) {
    sendError(res, error);
  }
};

// @desc    Delete a medical document
// @route   DELETE /api/documents/:id
// @access  Private
const deleteDocument = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid document id' });
    }

    const document = await MedicalDocument.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    let allowed = document.patient.equals(req.user._id) || ['admin', 'superadmin'].includes(req.user.role);
    if (!allowed && req.user.role === 'hospital' && document.uploadedByHospital) {
      const hospital = await Hospital.findOne({ user: req.user._id }).select('_id');
      allowed = !!hospital && document.uploadedByHospital.equals(hospital._id);
    }
    if (!allowed) {
      return res.status(403).json({ message: 'Not authorized to delete this document' });
    }

    await document.deleteOne();
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    sendError(res, error);
  }
};

module.exports = {
  uploadDocument,
  getDocuments,
  deleteDocument,
};

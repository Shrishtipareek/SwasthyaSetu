const MedicalDocument = require('../models/MedicalDocument');
const Hospital = require('../models/Hospital');

// @desc    Upload / Register a medical document
// @route   POST /api/documents
// @access  Private (Patient / Hospital admin authorized)
const uploadDocument = async (req, res) => {
  try {
    const { title, type, fileUrl, notes, patientId } = req.body;

    let targetPatientId = req.user._id;
    let uploadedByHospital = null;

    if (req.user.role === 'hospital') {
      const hospital = await Hospital.findOne({ user: req.user._id });
      if (!hospital) {
        return res.status(404).json({ message: 'Hospital profile not found' });
      }
      uploadedByHospital = hospital._id;
      targetPatientId = patientId; // Hospital uploading on behalf of patient
      if (!targetPatientId) {
        return res.status(400).json({ message: 'Patient ID is required when hospital uploads document.' });
      }
    }

    const document = await MedicalDocument.create({
      patient: targetPatientId,
      title,
      type,
      fileUrl: fileUrl || 'https://example.com/simulated-document.pdf',
      notes,
      uploadedByHospital
    });

    res.status(201).json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get patient's documents
// @route   GET /api/documents
// @access  Private
const getDocuments = async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'patient') {
      query.patient = req.user._id;
    } else if (req.user.role === 'hospital') {
      // Hospitals can only see documents they uploaded, or if they have explicit permission
      const hospital = await Hospital.findOne({ user: req.user._id });
      if (!hospital) {
        return res.status(404).json({ message: 'Hospital profile not found' });
      }
      // For demo purposes, we will return documents uploaded by this hospital or assigned to patients who had appointments at this hospital
      query = {
        $or: [
          { uploadedByHospital: hospital._id },
          // allow view if the document was explicitly shared (for simplicity, we return documents where patient's query matches)
        ]
      };
      
      const { patientId } = req.query;
      if (patientId) {
        query.patient = patientId;
      }
    }

    const documents = await MedicalDocument.find(query).sort({ createdAt: -1 });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a medical document
// @route   DELETE /api/documents/:id
// @access  Private
const deleteDocument = async (req, res) => {
  try {
    const document = await MedicalDocument.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check ownership
    if (document.patient.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to delete this document' });
    }

    await document.deleteOne();
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadDocument,
  getDocuments,
  deleteDocument
};

const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');
const Ambulance = require('../models/Ambulance');
const ResourceRequest = require('../models/ResourceRequest');
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const { calculateDistance } = require('../utils/geo');
const { fallbackHospitals, verifiedRegionalHospitals } = require('../utils/fallbackData');

const getHospitals = async (req, res) => {
  try {
    const { name, location, department, specialization, needsEmergency, needsIcu, needsBlood, lat, lng, maxDistance } = req.query;

    let query = { verifiedStatus: 'verified' };

    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }

    if (location) {
      query.address = { $regex: location, $options: 'i' };
    }

    if (department) {
      query.departments = { $in: [department] };
    }

    if (needsEmergency === 'true') {
      query['beds.emergencyAvailable'] = { $gt: 0 };
    }

    if (needsIcu === 'true') {
      query['beds.icuAvailable'] = { $gt: 0 };
    }

    if (needsBlood) {
      query[`bloodInventory.${needsBlood}.availableUnits`] = { $gt: 0 };
    }

    let hospitals = [];
    try {
      hospitals = await Hospital.find(query);
    } catch (dbErr) {
      console.warn('DB query error, serving seed fallback hospitals:', dbErr.message);
      hospitals = fallbackHospitals;
    }

    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      
      hospitals = hospitals.map(h => {
        const obj = typeof h.toObject === 'function' ? h.toObject() : h;
        const distance = calculateDistance(userLat, userLng, obj.location.lat, obj.location.lng);
        return { ...obj, distance };
      });

      if (maxDistance) {
        const maxDistNum = parseFloat(maxDistance);
        hospitals = hospitals.filter(h => h.distance <= maxDistNum);
      }

      hospitals.sort((a, b) => a.distance - b.distance);
    }

    res.json(hospitals);
  } catch (error) {
    res.json(fallbackHospitals);
  }
};

// @desc    Get public aggregate stats for public dashboard
// @route   GET /api/hospitals/stats
// @access  Public
const getPublicStats = async (req, res) => {
  try {
    let hospitals = [];
    let ambulancesCount = 0;
    try {
      hospitals = await Hospital.find({});
      ambulancesCount = await Ambulance.countDocuments({ status: 'available' });
    } catch (dbErr) {
      console.warn('DB query error in getPublicStats:', dbErr.message);
      return res.status(500).json({ message: 'Database error fetching hospital statistics' });
    }

    let totalBeds = 0;
    let availableBeds = 0;
    let totalIcu = 0;
    let availableIcu = 0;
    let bloodUnits = 0;

    hospitals.forEach(h => {
      totalBeds += h.beds?.total || 0;
      availableBeds += h.beds?.available || 0;
      totalIcu += h.beds?.icuTotal || 0;
      availableIcu += h.beds?.icuAvailable || 0;
      
      if (h.bloodInventory) {
        Object.keys(h.bloodInventory).forEach(group => {
          bloodUnits += h.bloodInventory[group]?.availableUnits || 0;
        });
      }
    });

    const emergencyHospitalsCount = hospitals.filter(h => (h.beds?.emergencyAvailable || 0) > 0).length;

    res.json({
      hospitalsConnected: hospitals.length,
      availableBeds,
      totalBeds,
      availableIcuBeds: availableIcu,
      totalIcuBeds: totalIcu,
      availableAmbulances: ambulancesCount,
      availableBloodUnits: bloodUnits,
      bloodUnitsAvailable: bloodUnits,
      emergencyHospitalsCount,
      hospitals: hospitals.map(h => ({
        _id: h._id,
        name: h.name,
        address: h.address,
        hospitalType: h.hospitalType || 'Hospital',
        verifiedStatus: h.verifiedStatus || 'pending',
        emergencyPhone: h.emergencyPhone,
        contactPhone: h.contactPhone,
        website: h.website || null,
        availableBeds: h.beds?.available || 0,
        icuAvailable: h.beds?.icuAvailable || 0
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get list of all connected/registered hospitals for public modal
// @route   GET /api/hospitals/connected
// @access  Public
const getConnectedHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find({})
      .select('name address emergencyPhone contactPhone website hospitalType verifiedStatus beds location operatingHours')
      .sort({ createdAt: -1 });
    res.json(hospitals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single hospital by ID
// @route   GET /api/hospitals/:id
// @access  Public
const getHospitalById = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    const doctors = await Doctor.find({ hospital: hospital._id });
    const ambulances = await Ambulance.find({ hospital: hospital._id });

    res.json({
      hospital,
      doctors,
      ambulances
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateResources = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ user: req.user._id });
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found for this user' });
    }

    const { beds, bloodInventory, organs, thresholds } = req.body;

    if (beds) {
      const sanitizedBeds = {};
      Object.keys(beds).forEach(key => {
        if (typeof beds[key] === 'number') {
          sanitizedBeds[key] = Math.max(0, beds[key]);
        } else {
          sanitizedBeds[key] = beds[key];
        }
      });
      hospital.beds = { ...hospital.beds, ...sanitizedBeds };
      if (sanitizedBeds.occupied !== undefined || sanitizedBeds.total !== undefined) {
        const total = sanitizedBeds.total !== undefined ? sanitizedBeds.total : hospital.beds.total;
        const occupied = sanitizedBeds.occupied !== undefined ? sanitizedBeds.occupied : hospital.beds.occupied;
        hospital.beds.available = Math.max(0, total - occupied);
      }
    }

    if (bloodInventory) {
      Object.keys(bloodInventory).forEach(group => {
        if (hospital.bloodInventory[group]) {
          hospital.bloodInventory[group].availableUnits = Math.max(0, parseInt(bloodInventory[group].availableUnits) || 0);
          hospital.bloodInventory[group].lastUpdated = Date.now();
        }
      });
    }

    if (organs) {
      Object.keys(organs).forEach(org => {
        if (hospital.organs[org]) {
          hospital.organs[org].available = organs[org].available;
          hospital.organs[org].lastUpdated = Date.now();
        }
      });
    }

    if (thresholds) {
      hospital.thresholds = { ...hospital.thresholds, ...thresholds };
    }

    await hospital.save();

    const alerts = [];
    if (hospital.beds.icuAvailable <= hospital.thresholds.icuLow) {
      alerts.push(`ICU Beds are low: only ${hospital.beds.icuAvailable} available.`);
    }
    if (hospital.beds.emergencyAvailable <= hospital.thresholds.emergencyLow) {
      alerts.push(`Emergency Beds are low: only ${hospital.beds.emergencyAvailable} available.`);
    }

    Object.keys(hospital.bloodInventory).forEach(group => {
      const units = hospital.bloodInventory[group].availableUnits;
      if (units <= hospital.thresholds.bloodCritical) {
        alerts.push(`CRITICAL: Blood group ${group.replace('p', '+').replace('n', '-')} is critically low (${units} units remaining).`);
      } else if (units <= hospital.thresholds.bloodLow) {
        alerts.push(`WARNING: Blood group ${group.replace('p', '+').replace('n', '-')} is low (${units} units remaining).`);
      }
    });

    if (alerts.length > 0) {
      for (const alertMsg of alerts) {
        await Notification.create({
          recipient: req.user._id,
          message: alertMsg,
          type: alertMsg.includes('CRITICAL') ? 'critical' : 'warning'
        });
      }
    }
    if (req.app.get('socketio')) {
      const io = req.app.get('socketio');
      io.emit('resource_update', {
        hospitalId: hospital._id,
        name: hospital.name,
        beds: hospital.beds,
        bloodInventory: hospital.bloodInventory,
        organs: hospital.organs
      });
    }

    res.json({ message: 'Resources updated successfully', hospital });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getHospitalDashboardStats = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ user: req.user._id });
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    const doctorsCount = await Doctor.countDocuments({ hospital: hospital._id });
    const ambulancesCount = await Ambulance.countDocuments({ hospital: hospital._id });
    const appointmentsCount = await Appointment.countDocuments({ hospital: hospital._id });
    const pendingRequestsCount = await ResourceRequest.countDocuments({
      providingHospital: hospital._id,
      status: 'pending'
    });

    const recentRequests = await ResourceRequest.find({
      $or: [
        { requestingHospital: hospital._id },
        { providingHospital: hospital._id }
      ]
    })
    .populate('requestingHospital', 'name')
    .populate('providingHospital', 'name')
    .sort({ createdAt: -1 })
    .limit(5);

    const recentAppointments = await Appointment.find({ hospital: hospital._id })
      .populate('patient', 'name email phone')
      .populate('doctor', 'name specialization')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      hospital,
      doctorsCount,
      ambulancesCount,
      appointmentsCount,
      pendingRequestsCount,
      recentRequests,
      recentAppointments
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// In-memory cache with 10-minute TTL to prevent hammering Overpass API
const osmCache = new Map();
const OSM_CACHE_TTL = 10 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of osmCache.entries()) {
    if (now - entry.timestamp > OSM_CACHE_TTL) {
      osmCache.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];

/**
 * @desc    Discover real hospitals and healthcare facilities from OpenStreetMap via Overpass API
 * @route   GET /api/hospitals/nearby-real
 * @access  Public
 */
const getNearbyRealHospitals = async (req, res) => {
  try {
    const { lat, lng, radius = 10000, type } = req.query;

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    if (isNaN(userLat) || userLat < -90 || userLat > 90 || isNaN(userLng) || userLng < -180 || userLng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates. Please provide valid latitude (-90 to 90) and longitude (-180 to 180).'
      });
    }

    const radiusMeters = Math.min(50000, Math.max(1000, parseInt(radius, 10) || 10000));
    const cacheKey = `${userLat.toFixed(3)}_${userLng.toFixed(3)}_${radiusMeters}`;

    if (osmCache.has(cacheKey)) {
      const cached = osmCache.get(cacheKey);
      if (Date.now() - cached.timestamp < OSM_CACHE_TTL) {
        let results = cached.data;
        if (type && type !== 'all') {
          results = results.filter(h => h.category?.toLowerCase().includes(type.toLowerCase()));
        }
        return res.json({
          success: true,
          cached: true,
          source: 'OpenStreetMap / Overpass API (Cached)',
          userCoordinates: { lat: userLat, lng: userLng },
          radiusMeters,
          count: results.length,
          hospitals: results
        });
      }
    }

    // Overpass QL Query
    const overpassQuery = `[out:json][timeout:25];
(
  node["amenity"="hospital"](around:${radiusMeters},${userLat},${userLng});
  way["amenity"="hospital"](around:${radiusMeters},${userLat},${userLng});
  relation["amenity"="hospital"](around:${radiusMeters},${userLat},${userLng});
  node["amenity"="clinic"](around:${radiusMeters},${userLat},${userLng});
  way["amenity"="clinic"](around:${radiusMeters},${userLat},${userLng});
  node["healthcare"~"hospital|clinic"](around:${radiusMeters},${userLat},${userLng});
  way["healthcare"~"hospital|clinic"](around:${radiusMeters},${userLat},${userLng});
  node["emergency"="yes"](around:${radiusMeters},${userLat},${userLng});
  way["emergency"="yes"](around:${radiusMeters},${userLat},${userLng});
);
out center tags qt;`;

    let overpassData = null;
    let lastError = null;

    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 18000);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'SwasthyaSetu-EmergencyNetwork/1.0'
          },
          body: `data=${encodeURIComponent(overpassQuery)}`,
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          overpassData = await response.json();
          break;
        } else {
          lastError = new Error(`Overpass server responded with status: ${response.status}`);
        }
      } catch (err) {
        lastError = err;
      }
    }

    if (!overpassData || !Array.isArray(overpassData.elements)) {
      console.warn('Overpass API query failed across endpoints:', lastError?.message);

      let registeredHospitals = [];
      try {
        registeredHospitals = await Hospital.find({});
      } catch (e) {
        registeredHospitals = [];
      }

      const registeredMatches = registeredHospitals.map(h => {
        const obj = typeof h.toObject === 'function' ? h.toObject() : h;
        const hLat = obj.location?.coordinates?.[1] || obj.location?.lat || obj.lat;
        const hLng = obj.location?.coordinates?.[0] || obj.location?.lng || obj.lng;
        const dist = (hLat && hLng) ? calculateDistance(userLat, userLng, hLat, hLng) : 999;
        return {
          id: String(obj._id || 'hosp-' + Math.random()),
          name: obj.name,
          address: obj.address || 'Address on record',
          lat: hLat,
          lng: hLng,
          distanceKm: Number(dist.toFixed(1)),
          category: 'Hospital (SwasthyaSetu Network)',
          phone: obj.emergencyPhone || obj.contactPhone || null,
          website: obj.website || null,
          isEmergency: Boolean(obj.beds?.emergencyAvailable > 0),
          isRegisteredNetwork: true,
          beds: obj.beds
        };
      }).filter(h => h.distanceKm <= (radiusMeters / 1000) * 1.5);

      const regionalMatches = (verifiedRegionalHospitals || []).map(h => {
        const dist = calculateDistance(userLat, userLng, h.lat, h.lng);
        return {
          ...h,
          distanceKm: Number(dist.toFixed(1)),
          isRegisteredNetwork: false
        };
      }).filter(h => h.distanceKm <= (radiusMeters / 1000) * 1.5);

      const fallbackList = [...registeredMatches, ...regionalMatches]
        .sort((a, b) => a.distanceKm - b.distanceKm);

      return res.json({
        success: true,
        source: 'SwasthyaSetu Verified Network (OSM Gateway Fallback)',
        warning: 'Live OpenStreetMap query temporarily unavailable. Displaying verified healthcare facilities.',
        userCoordinates: { lat: userLat, lng: userLng },
        radiusMeters,
        count: fallbackList.length,
        hospitals: fallbackList
      });
    }

    // Process Overpass elements
    const rawElements = overpassData.elements;
    const facilities = [];
    const seenMap = new Map();

    for (const elem of rawElements) {
      const tags = elem.tags || {};
      const rawName = tags.name || tags['name:en'] || tags['name:hi'] || tags.official_name || tags.operator;

      const isHospital = tags.amenity === 'hospital' || tags.healthcare === 'hospital';
      const isClinic = tags.amenity === 'clinic' || tags.healthcare === 'clinic';
      const isEmergency = tags.emergency === 'yes' || tags['healthcare:emergency'] === 'yes';

      if (!rawName && !isHospital && !isEmergency) {
        continue;
      }

      const hLat = elem.type === 'node' ? elem.lat : elem.center?.lat;
      const hLng = elem.type === 'node' ? elem.lon : elem.center?.lon;

      if (hLat == null || hLng == null) continue;

      const dist = calculateDistance(userLat, userLng, hLat, hLng);
      if (dist > (radiusMeters / 1000) * 1.05) continue;

      const displayName = rawName || (isEmergency ? 'Emergency Healthcare Facility' : isClinic ? 'Community Health Clinic' : 'Healthcare Facility');

      const addrParts = [
        tags['addr:housenumber'],
        tags['addr:street'],
        tags['addr:suburb'] || tags['addr:neighbourhood'] || tags['addr:district'],
        tags['addr:city'] || tags['addr:state_district'] || tags['addr:county'],
        tags['addr:state'],
        tags['addr:postcode']
      ].filter(Boolean);
      const address = tags['addr:full'] || (addrParts.length > 0 ? addrParts.join(', ') : 'Address not listed in OSM registry');

      const phone = tags.phone || tags['contact:phone'] || tags['contact:mobile'] || tags['emergency:phone'] || null;
      const website = tags.website || tags['contact:website'] || tags.url || null;

      let category = 'General Hospital';
      if (isEmergency) {
        category = 'Emergency Medical Center';
      } else if (tags['operator:type'] === 'government' || tags['operator:type'] === 'public' || tags.government === 'hospital') {
        category = 'Government Hospital';
      } else if (tags['operator:type'] === 'private') {
        category = 'Private Hospital';
      } else if (isClinic) {
        category = 'Clinic / Medical Centre';
      } else if (tags['healthcare:speciality']) {
        category = `Multi-Specialty (${tags['healthcare:speciality'].replace(/_/g, ' ')})`;
      }

      const normKey = `${displayName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${hLat.toFixed(2)}_${hLng.toFixed(2)}`;
      if (seenMap.has(normKey)) {
        continue;
      }
      seenMap.set(normKey, true);

      facilities.push({
        id: `osm-${elem.type}-${elem.id}`,
        osmId: elem.id,
        osmType: elem.type,
        name: displayName,
        address,
        lat: Number(hLat.toFixed(6)),
        lng: Number(hLng.toFixed(6)),
        distanceKm: Number(dist.toFixed(1)),
        category,
        phone,
        website,
        isEmergency,
        openingHours: tags.opening_hours || null,
        operator: tags.operator || null,
        bedsEstimate: tags.beds ? parseInt(tags.beds, 10) : null
      });
    }

    facilities.sort((a, b) => a.distanceKm - b.distanceKm);

    osmCache.set(cacheKey, {
      timestamp: Date.now(),
      data: facilities
    });

    let results = facilities;
    if (type && type !== 'all') {
      results = results.filter(h => h.category?.toLowerCase().includes(type.toLowerCase()));
    }

    res.json({
      success: true,
      cached: false,
      source: 'OpenStreetMap / Overpass API',
      userCoordinates: { lat: userLat, lng: userLng },
      radiusMeters,
      count: results.length,
      hospitals: results
    });
  } catch (error) {
    console.error('Error in getNearbyRealHospitals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to discover nearby healthcare facilities. ' + error.message
    });
  }
};

module.exports = {
  getHospitals,
  getPublicStats,
  getConnectedHospitals,
  getHospitalById,
  updateResources,
  getHospitalDashboardStats,
  getNearbyRealHospitals
};

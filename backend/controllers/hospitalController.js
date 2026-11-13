const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');
const Ambulance = require('../models/Ambulance');
const ResourceRequest = require('../models/ResourceRequest');
const Appointment = require('../models/Appointment');
const { notify, emitAll } = require('../utils/notify');
const {
  sendError,
  isDbConnected,
  isValidObjectId,
  escapeRegex,
  isNumeric,
  BLOOD_KEYS,
  bloodGroupToKey,
  bloodKeyToLabel,
} = require('../utils/http');
const { calculateDistance } = require('../utils/geo');
const { fallbackHospitals, verifiedRegionalHospitals } = require('../utils/fallbackData');

// Shared demo data (utils/fallbackData) served only while the database is unreachable.
const seedHospitalsFallback = fallbackHospitals;

// Apply the same filters to the offline fallback list so results stay consistent.
const filterFallbackHospitals = ({ name, location, department, needsEmergency, needsIcu, bloodKey }) =>
  seedHospitalsFallback.filter((h) => {
    if (name && !h.name.toLowerCase().includes(String(name).toLowerCase())) return false;
    if (location && !h.address.toLowerCase().includes(String(location).toLowerCase())) return false;
    if (department && !h.departments.includes(department)) return false;
    if (needsEmergency === 'true' && !(h.beds.emergencyAvailable > 0)) return false;
    if (needsIcu === 'true' && !(h.beds.icuAvailable > 0)) return false;
    if (bloodKey && !(h.bloodInventory[bloodKey]?.availableUnits > 0)) return false;
    return true;
  });

// @desc    Get all hospitals with optional search/filters
// @route   GET /api/hospitals
// @access  Public
const getHospitals = async (req, res) => {
  try {
    const { name, location, department, specialization, needsEmergency, needsIcu, needsBlood, lat, lng, maxDistance } = req.query;

    const query = { verifiedStatus: 'verified' };

    // User input is escaped: a search such as "(" used to throw an invalid-regex error.
    if (name) {
      query.name = { $regex: escapeRegex(name), $options: 'i' };
    }

    if (location) {
      query.address = { $regex: escapeRegex(location), $options: 'i' };
    }

    const dept = department || specialization;
    if (dept) {
      query.departments = { $regex: `^${escapeRegex(dept)}$`, $options: 'i' };
    }

    if (needsEmergency === 'true') {
      query['beds.emergencyAvailable'] = { $gt: 0 };
    }

    if (needsIcu === 'true') {
      query['beds.icuAvailable'] = { $gt: 0 };
    }

    let bloodKey = null;
    if (needsBlood) {
      bloodKey = bloodGroupToKey(needsBlood);
      if (!bloodKey) {
        return res.status(400).json({ message: `Invalid blood group: ${needsBlood}` });
      }
      query[`bloodInventory.${bloodKey}.availableUnits`] = { $gt: 0 };
    }

    let hospitals;
    if (isDbConnected()) {
      hospitals = await Hospital.find(query).lean();
    } else {
      console.warn('Database not connected, serving seed fallback hospitals.');
      hospitals = filterFallbackHospitals({ name, location, department: dept, needsEmergency, needsIcu, bloodKey });
    }

    if (lat !== undefined && lng !== undefined && isNumeric(lat) && isNumeric(lng)) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);

      hospitals = hospitals
        .filter((h) => h.location && isNumeric(h.location.lat) && isNumeric(h.location.lng))
        .map((h) => ({ ...h, distance: calculateDistance(userLat, userLng, h.location.lat, h.location.lng) }));

      if (maxDistance && isNumeric(maxDistance)) {
        const maxDistNum = parseFloat(maxDistance);
        hospitals = hospitals.filter((h) => h.distance <= maxDistNum);
      }

      hospitals.sort((a, b) => a.distance - b.distance);
    }

    res.json(hospitals);
  } catch (error) {
    sendError(res, error);
  }
};

// @desc    List connected (verified) hospitals for the public dashboard modal
// @route   GET /api/hospitals/connected
// @access  Public
const CONNECTED_FIELDS = 'name address emergencyPhone contactPhone website hospitalType verifiedStatus beds location operatingHours';

const getConnectedHospitals = async (req, res) => {
  try {
    if (!isDbConnected()) {
      res.set('X-Data-Source', 'fallback');
      return res.json(
        seedHospitalsFallback.map(({ _id, name, address, emergencyPhone, phone, hospitalType, verifiedStatus, beds, location }) => ({
          _id, name, address, emergencyPhone, contactPhone: phone, hospitalType, verifiedStatus, beds, location, isFallback: true,
        }))
      );
    }
    // Only verified institutions are "connected"; pending / rejected registrations
    // must not be advertised to the public.
    const hospitals = await Hospital.find({ verifiedStatus: 'verified' })
      .select(CONNECTED_FIELDS)
      .sort({ name: 1 })
      .lean();
    res.json(hospitals);
  } catch (error) {
    sendError(res, error);
  }
};

/** Compact per-hospital summary shown in the public dashboard's hospital list. */
const toPublicSummary = (h) => ({
  _id: h._id,
  name: h.name,
  address: h.address,
  hospitalType: h.hospitalType || 'Hospital',
  verifiedStatus: h.verifiedStatus || 'verified',
  emergencyPhone: h.emergencyPhone,
  contactPhone: h.contactPhone || h.phone,
  website: h.website || null,
  availableBeds: h.beds?.available || 0,
  icuAvailable: h.beds?.icuAvailable || 0,
});

// The public dashboard reads `availableBloodUnits` and `emergencyHospitalsCount`;
// the API used to send only `bloodUnitsAvailable` / `emergencyHospitals`, so those
// two cards were always blank. Both spellings are sent for compatibility.
const withStatAliases = (stats) => ({
  ...stats,
  availableBloodUnits: stats.bloodUnitsAvailable,
  emergencyHospitalsCount: stats.emergencyHospitals,
});

const FALLBACK_STATS = withStatAliases({
  hospitalsConnected: 10,
  availableBeds: 500,
  totalBeds: 2400,
  availableIcuBeds: 50,
  totalIcuBeds: 300,
  availableAmbulances: 12,
  bloodUnitsAvailable: 1500,
  emergencyHospitals: 8,
});

// @desc    Get public aggregate stats for public dashboard
// @route   GET /api/hospitals/stats
// @access  Public
const getPublicStats = async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.json({ ...FALLBACK_STATS, hospitals: seedHospitalsFallback.map(toPublicSummary), isFallback: true });
    }

    const hospitals = await Hospital.find({ verifiedStatus: 'verified' })
      .select('name address hospitalType verifiedStatus emergencyPhone contactPhone website beds bloodInventory')
      .lean();
    const verifiedIds = hospitals.map((h) => h._id);
    const ambulancesCount = await Ambulance.countDocuments({ status: 'available', hospital: { $in: verifiedIds } });

    let totalBeds = 0;
    let availableBeds = 0;
    let totalIcu = 0;
    let availableIcu = 0;
    let bloodUnits = 0;

    hospitals.forEach((h) => {
      totalBeds += h.beds?.total || 0;
      availableBeds += h.beds?.available || 0;
      totalIcu += h.beds?.icuTotal || 0;
      availableIcu += h.beds?.icuAvailable || 0;

      BLOOD_KEYS.forEach((group) => {
        bloodUnits += h.bloodInventory?.[group]?.availableUnits || 0;
      });
    });

    const emergencyHospitalsCount = hospitals.filter((h) => h.beds?.emergencyAvailable > 0).length;

    // Real numbers (including genuine zeros) are reported when the DB is reachable;
    // previously any 0 was silently replaced with made-up numbers.
    res.json(
      withStatAliases({
        hospitalsConnected: hospitals.length,
        availableBeds,
        totalBeds,
        availableIcuBeds: availableIcu,
        totalIcuBeds: totalIcu,
        availableAmbulances: ambulancesCount,
        bloodUnitsAvailable: bloodUnits,
        emergencyHospitals: emergencyHospitalsCount,
        hospitals: hospitals.map(toPublicSummary),
      })
    );
  } catch (error) {
    console.warn('Stats query failed, serving fallback stats:', error.message);
    res.json({ ...FALLBACK_STATS, hospitals: seedHospitalsFallback.map(toPublicSummary), isFallback: true });
  }
};

// @desc    Get single hospital by ID
// @route   GET /api/hospitals/:id
// @access  Public
const getHospitalById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid hospital id' });
    }

    if (!isDbConnected()) {
      const fallback = seedHospitalsFallback.find((h) => h._id === req.params.id);
      if (!fallback) return res.status(404).json({ message: 'Hospital not found' });
      return res.json({ hospital: fallback, doctors: [], ambulances: [] });
    }

    const hospital = await Hospital.findById(req.params.id);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    const [doctors, ambulances] = await Promise.all([
      Doctor.find({ hospital: hospital._id }),
      Ambulance.find({ hospital: hospital._id }),
    ]);

    res.json({
      hospital,
      doctors,
      ambulances,
    });
  } catch (error) {
    sendError(res, error);
  }
};

const BED_FIELDS = [
  'total',
  'occupied',
  'icuTotal',
  'icuAvailable',
  'emergencyTotal',
  'emergencyAvailable',
  'ventilatorsTotal',
  'ventilatorsAvailable',
];
const ORGAN_KEYS = ['kidney', 'liver', 'heart', 'lungs'];
const THRESHOLD_KEYS = ['bloodLow', 'bloodCritical', 'icuLow', 'emergencyLow'];

/** Alert level per tracked resource: 0 = ok, 1 = low, 2 = critical (blood only). */
const getAlertLevels = (h) => {
  const t = h.thresholds || {};
  const levels = {
    icu: h.beds.icuAvailable <= t.icuLow ? 1 : 0,
    emergency: h.beds.emergencyAvailable <= t.emergencyLow ? 1 : 0,
  };
  BLOOD_KEYS.forEach((group) => {
    const units = h.bloodInventory[group]?.availableUnits ?? 0;
    levels[group] = units <= t.bloodCritical ? 2 : units <= t.bloodLow ? 1 : 0;
  });
  return levels;
};

const toNonNegativeInt = (value, label) => {
  if (!isNumeric(value) || Number(value) < 0) {
    const err = new Error(`${label} must be a non-negative number`);
    err.statusCode = 400;
    throw err;
  }
  return Math.floor(Number(value));
};

// @desc    Update real-time resources/inventory
// @route   PUT /api/hospitals/resources
// @access  Private (Hospital admin only)
const updateResources = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ user: req.user._id });
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital profile not found for this user' });
    }

    const { beds, bloodInventory, organs, thresholds } = req.body;
    const levelsBefore = getAlertLevels(hospital);

    if (beds && typeof beds === 'object') {
      // Assign field by field. The previous `{ ...hospital.beds, ...beds }` spread a
      // Mongoose nested object, which does not reliably copy the stored values.
      BED_FIELDS.forEach((field) => {
        if (beds[field] !== undefined) {
          hospital.beds[field] = toNonNegativeInt(beds[field], `beds.${field}`);
        }
      });

      const b = hospital.beds;
      if (b.occupied > b.total) {
        return res.status(400).json({ message: 'Occupied beds cannot exceed total beds.' });
      }
      // Keep the "available <= total" invariant: raise capacity if a hospital reports
      // more available units than its configured total.
      if (b.icuAvailable > b.icuTotal) b.icuTotal = b.icuAvailable;
      if (b.emergencyAvailable > b.emergencyTotal) b.emergencyTotal = b.emergencyAvailable;
      if (b.ventilatorsAvailable > b.ventilatorsTotal) b.ventilatorsTotal = b.ventilatorsAvailable;
      // Available general beds are always derived from total - occupied.
      b.available = Math.max(0, b.total - b.occupied);
    }

    if (bloodInventory && typeof bloodInventory === 'object') {
      Object.keys(bloodInventory).forEach((group) => {
        const key = bloodGroupToKey(group);
        if (!key) return; // ignore unknown keys instead of writing arbitrary paths
        const entry = bloodInventory[group];
        const units = entry && typeof entry === 'object' ? entry.availableUnits : entry;
        if (units === undefined) return;
        hospital.bloodInventory[key].availableUnits = toNonNegativeInt(units, `bloodInventory.${group}`);
        hospital.bloodInventory[key].lastUpdated = Date.now();
      });
    }

    if (organs && typeof organs === 'object') {
      Object.keys(organs).forEach((org) => {
        if (!ORGAN_KEYS.includes(org)) return;
        const entry = organs[org];
        const available = entry && typeof entry === 'object' ? entry.available : entry;
        if (available === undefined) return;
        hospital.organs[org].available = toNonNegativeInt(available, `organs.${org}`);
        hospital.organs[org].lastUpdated = Date.now();
      });
    }

    if (thresholds && typeof thresholds === 'object') {
      THRESHOLD_KEYS.forEach((key) => {
        if (thresholds[key] !== undefined) {
          hospital.thresholds[key] = toNonNegativeInt(thresholds[key], `thresholds.${key}`);
        }
      });
    }

    await hospital.save();

    // Check critical thresholds. Every current alert is returned to the dashboard,
    // but a notification is only created when a level gets worse with this update;
    // otherwise each save re-sent the same ~10 warnings.
    const levelsAfter = getAlertLevels(hospital);
    const alerts = [];
    if (levelsAfter.icu) {
      alerts.push({ key: 'icu', type: 'warning', message: `ICU Beds are low: only ${hospital.beds.icuAvailable} available.` });
    }
    if (levelsAfter.emergency) {
      alerts.push({ key: 'emergency', type: 'warning', message: `Emergency Beds are low: only ${hospital.beds.emergencyAvailable} available.` });
    }
    BLOOD_KEYS.forEach((group) => {
      const units = hospital.bloodInventory[group]?.availableUnits ?? 0;
      if (levelsAfter[group] === 2) {
        alerts.push({ key: group, type: 'critical', message: `CRITICAL: Blood group ${bloodKeyToLabel(group)} is critically low (${units} units remaining).` });
      } else if (levelsAfter[group] === 1) {
        alerts.push({ key: group, type: 'warning', message: `WARNING: Blood group ${bloodKeyToLabel(group)} is low (${units} units remaining).` });
      }
    });

    for (const alert of alerts) {
      if (levelsAfter[alert.key] > levelsBefore[alert.key]) {
        await notify(req.user._id, alert.message, alert.type);
      }
    }

    // Trigger Socket.io real-time resource update
    emitAll('resource_update', {
      hospitalId: hospital._id,
      name: hospital.name,
      beds: hospital.beds,
      bloodInventory: hospital.bloodInventory,
      organs: hospital.organs,
    });

    res.json({ message: 'Resources updated successfully', hospital, alerts: alerts.map((a) => a.message) });
  } catch (error) {
    sendError(res, error);
  }
};

// @desc    Get Stats for Hospital Admin Dashboard
// @route   GET /api/hospitals/dashboard/stats
// @access  Private (Hospital admin only)
const getHospitalDashboardStats = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ user: req.user._id });
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    const [doctorsCount, ambulancesCount, appointmentsCount, pendingRequestsCount, recentRequests, recentAppointments] =
      await Promise.all([
        Doctor.countDocuments({ hospital: hospital._id }),
        Ambulance.countDocuments({ hospital: hospital._id }),
        Appointment.countDocuments({ hospital: hospital._id }),
        ResourceRequest.countDocuments({ providingHospital: hospital._id, status: 'pending' }),
        ResourceRequest.find({
          $or: [{ requestingHospital: hospital._id }, { providingHospital: hospital._id }],
        })
          .populate('requestingHospital', 'name')
          .populate('providingHospital', 'name')
          .sort({ createdAt: -1 })
          .limit(5),
        Appointment.find({ hospital: hospital._id })
          .populate('patient', 'name email phone')
          .populate('doctor', 'name specialization')
          .sort({ createdAt: -1 })
          .limit(5),
      ]);

    res.json({
      hospital,
      doctorsCount,
      ambulancesCount,
      appointmentsCount,
      pendingRequestsCount,
      recentRequests,
      recentAppointments,
    });
  } catch (error) {
    sendError(res, error);
  }
};

// In-memory cache (10-minute TTL, bounded size) so the public Overpass API is not hammered.
const osmCache = new Map();
const OSM_CACHE_TTL = 10 * 60 * 1000;
const OSM_CACHE_MAX_ENTRIES = 500;

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of osmCache.entries()) {
    if (now - entry.timestamp > OSM_CACHE_TTL) osmCache.delete(key);
  }
}, 5 * 60 * 1000).unref();

const cacheOsmResult = (key, data) => {
  if (osmCache.size >= OSM_CACHE_MAX_ENTRIES) {
    // Map preserves insertion order: drop the oldest entry.
    osmCache.delete(osmCache.keys().next().value);
  }
  osmCache.set(key, { timestamp: Date.now(), data });
};

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];
// Total budget for the live lookup. It must stay well below the frontend's 20s
// request timeout (querying the mirrors one after another took ~36s when they hung).
const OVERPASS_TIMEOUT_MS = Number(process.env.OVERPASS_TIMEOUT_MS) || 10000;
const OVERPASS_FAILURE_COOLDOWN_MS = 60 * 1000;
let overpassUnavailableUntil = 0;

/** Query all mirrors in parallel and return the first valid answer. */
const queryOverpass = async (overpassQuery) => {
  if (Date.now() < overpassUnavailableUntil) {
    throw new Error('Overpass API recently failed; serving the verified fallback list');
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OVERPASS_TIMEOUT_MS);
  try {
    return await Promise.any(
      OVERPASS_ENDPOINTS.map(async (endpoint) => {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
            'User-Agent': 'SwasthyaSetu-EmergencyNetwork/1.0'
          },
          body: `data=${encodeURIComponent(overpassQuery)}`,
          signal: controller.signal
        });
        if (!response.ok) throw new Error(`${endpoint} responded with status ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data?.elements)) throw new Error(`${endpoint} returned an unexpected payload`);
        return data;
      })
    );
  } catch (error) {
    // All mirrors failed: skip them for a minute so every search does not wait again.
    overpassUnavailableUntil = Date.now() + OVERPASS_FAILURE_COOLDOWN_MS;
    throw error instanceof AggregateError ? new Error(error.errors.map((e) => e.message).join('; ')) : error;
  } finally {
    clearTimeout(timer);
    controller.abort(); // cancel the slower mirrors once one has answered
  }
};

const filterByCategory = (list, type) =>
  type && type !== 'all' ? list.filter((h) => h.category?.toLowerCase().includes(String(type).toLowerCase())) : list;

/**
 * @desc    Discover real hospitals and healthcare facilities from OpenStreetMap via Overpass API
 * @route   GET /api/hospitals/nearby-real?lat=&lng=&radius=&type=
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

    const cached = osmCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < OSM_CACHE_TTL) {
      const results = filterByCategory(cached.data, type);
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
    try {
      overpassData = await queryOverpass(overpassQuery);
    } catch (err) {
      lastError = err;
    }

    if (!overpassData || !Array.isArray(overpassData.elements)) {
      console.warn('Overpass API query failed across endpoints:', lastError?.message);

      // Fall back to verified SwasthyaSetu hospitals (never pending / rejected ones)
      // plus the curated regional list.
      let registeredHospitals = [];
      if (isDbConnected()) {
        try {
          registeredHospitals = await Hospital.find({ verifiedStatus: 'verified' }).lean();
        } catch (e) {
          registeredHospitals = [];
        }
      }

      const maxKm = (radiusMeters / 1000) * 1.5;
      const registeredMatches = registeredHospitals
        .filter((h) => h.location && isNumeric(h.location.lat) && isNumeric(h.location.lng))
        .map((h) => {
          const dist = calculateDistance(userLat, userLng, h.location.lat, h.location.lng);
          return {
            id: String(h._id),
            name: h.name,
            address: h.address || 'Address on record',
            lat: h.location.lat,
            lng: h.location.lng,
            distanceKm: Number(dist.toFixed(1)),
            category: 'Hospital (SwasthyaSetu Network)',
            phone: h.emergencyPhone || h.contactPhone || null,
            website: h.website || null,
            isEmergency: Boolean(h.beds?.emergencyAvailable > 0),
            isRegisteredNetwork: true,
            beds: h.beds
          };
        })
        .filter((h) => h.distanceKm <= maxKm);

      const regionalMatches = (verifiedRegionalHospitals || [])
        .map((h) => ({
          ...h,
          distanceKm: Number(calculateDistance(userLat, userLng, h.lat, h.lng).toFixed(1)),
          isRegisteredNetwork: false
        }))
        .filter((h) => h.distanceKm <= maxKm);

      const fallbackList = filterByCategory(
        [...registeredMatches, ...regionalMatches].sort((a, b) => a.distanceKm - b.distanceKm),
        type
      );

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
    const facilities = [];
    const seen = new Set();

    for (const elem of overpassData.elements) {
      const tags = elem.tags || {};
      const rawName = tags.name || tags['name:en'] || tags['name:hi'] || tags.official_name || tags.operator;

      const isHospital = tags.amenity === 'hospital' || tags.healthcare === 'hospital';
      const isClinic = tags.amenity === 'clinic' || tags.healthcare === 'clinic';
      const isEmergency = tags.emergency === 'yes' || tags['healthcare:emergency'] === 'yes';

      if (!rawName && !isHospital && !isEmergency) continue;

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

      // The same facility is often mapped as both a node and a way.
      const dedupeKey = `${displayName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${hLat.toFixed(2)}_${hLng.toFixed(2)}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

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
        bedsEstimate: tags.beds ? parseInt(tags.beds, 10) || null : null
      });
    }

    facilities.sort((a, b) => a.distanceKm - b.distanceKm);
    cacheOsmResult(cacheKey, facilities);

    const results = filterByCategory(facilities, type);
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
      message: 'Failed to discover nearby healthcare facilities. Please try again shortly.'
    });
  }
};

module.exports = {
  getHospitals,
  getConnectedHospitals,
  getPublicStats,
  getHospitalById,
  updateResources,
  getHospitalDashboardStats,
  getNearbyRealHospitals,
  seedHospitalsFallback,
};

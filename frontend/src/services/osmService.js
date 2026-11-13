/**
 * OpenStreetMap & Healthcare Discovery Service for SwasthyaSetu
 * Handles live Overpass healthcare discovery, Nominatim geocoding, and multi-tier resilient fallback.
 */

export const POPULAR_LOCATIONS = [
  { name: 'Mumbai (South Mumbai / Parel / KEM)', lat: 18.9986, lng: 72.8436 },
  { name: 'Delhi NCR (AIIMS / Connaught Place)', lat: 28.6139, lng: 77.2090 },
  { name: 'South Delhi (Saket / Max)', lat: 28.5284, lng: 77.2198 },
  { name: 'Bengaluru (Koramangala / St. John)', lat: 12.9352, lng: 77.6245 },
  { name: 'Hyderabad (Banjara Hills / Apollo)', lat: 17.4168, lng: 78.4382 },
  { name: 'Kolkata (Park Circus / Chittaranjan)', lat: 22.5411, lng: 88.3639 },
  { name: 'Chennai (Greams Road / Apollo)', lat: 13.0604, lng: 80.2520 },
  { name: 'Pune (Shivaji Nagar / Sassoon)', lat: 18.5284, lng: 73.8739 }
];

/**
 * Verified Real Regional Healthcare Facilities (Real addresses, phone numbers, GPS coordinates)
 * Used as immediate reliable fallback when public Overpass servers are rate-limited or offline.
 */
export const VERIFIED_REGIONAL_HOSPITALS = [
  // --- MUMBAI ---
  {
    id: 'osm-mumbai-1',
    name: 'King Edward Memorial (KEM) Hospital',
    address: 'Acharya Donde Marg, Parel, Mumbai, Maharashtra 400012',
    lat: 19.0028,
    lng: 72.8428,
    category: 'Government Multi-Specialty Hospital',
    phone: '+91 22 2410 7000',
    website: 'https://kem.edu',
    isEmergency: true,
    openingHours: '24/7'
  },
  {
    id: 'osm-mumbai-2',
    name: 'Tata Memorial Hospital',
    address: 'Dr. Ernest Borges Road, Parel, Mumbai, Maharashtra 400012',
    lat: 19.0064,
    lng: 72.8432,
    category: 'Specialized Oncology & Research Hospital',
    phone: '+91 22 2417 7000',
    website: 'https://tmc.gov.in',
    isEmergency: true,
    openingHours: '24/7'
  },
  {
    id: 'osm-mumbai-3',
    name: 'Gleneagles Global Hospital Parel',
    address: '35, Dr. Ernest Borges Rd, Opp Shirodkar High School, Parel, Mumbai, Maharashtra 400012',
    lat: 19.0042,
    lng: 72.8425,
    category: 'Multi-Specialty Private Hospital',
    phone: '+91 22 6767 0101',
    website: 'https://gleneaglesmumbai.com',
    isEmergency: true,
    openingHours: '24/7'
  },
  {
    id: 'osm-mumbai-4',
    name: 'Bai Jerbai Wadia Hospital for Children',
    address: 'Acharya Donde Marg, Parel, Mumbai, Maharashtra 400012',
    lat: 19.0035,
    lng: 72.8441,
    category: 'Specialized Pediatric Hospital',
    phone: '+91 22 2419 7200',
    website: 'https://wadiahospitals.org',
    isEmergency: true,
    openingHours: '24/7'
  },
  {
    id: 'osm-mumbai-5',
    name: 'Nowrosjee Wadia Maternity Hospital',
    address: 'Acharya Donde Marg, Parel, Mumbai, Maharashtra 400012',
    lat: 19.0032,
    lng: 72.8446,
    category: 'Specialized Maternity Hospital',
    phone: '+91 22 2419 7100',
    website: 'https://wadiahospitals.org',
    isEmergency: true,
    openingHours: '24/7'
  },
  {
    id: 'osm-mumbai-6',
    name: 'Mahatma Gandhi Memorial (MGM) Hospital',
    address: 'Dr. S.S. Rao Marg, Parel, Mumbai, Maharashtra 400012',
    lat: 19.0015,
    lng: 72.8415,
    category: 'General Hospital',
    phone: '+91 22 2413 5189',
    website: null,
    isEmergency: true,
    openingHours: '24/7'
  },
  {
    id: 'osm-mumbai-7',
    name: 'Kasturba Hospital for Infectious Diseases',
    address: 'Sane Guruji Marg, Arthur Road, Chinchpokli, Mumbai, Maharashtra 400011',
    lat: 18.9882,
    lng: 72.8315,
    category: 'Government Hospital',
    phone: '+91 22 2308 3901',
    website: null,
    isEmergency: true,
    openingHours: '24/7'
  },
  {
    id: 'osm-mumbai-8',
    name: 'Sir J.J. Group of Hospitals (Grant Government Medical College)',
    address: 'J.J. Marg, Nagpada, Off Byculla, Mumbai, Maharashtra 400008',
    lat: 18.9633,
    lng: 72.8339,
    category: 'Government Teaching Hospital',
    phone: '+91 22 2373 5555',
    website: 'https://ggmcjjh.com',
    isEmergency: true,
    openingHours: '24/7'
  },
  {
    id: 'osm-mumbai-9',
    name: 'Bhatia Hospital',
    address: 'Tukaram Javji Road, Tardeo, Mumbai, Maharashtra 400007',
    lat: 18.9667,
    lng: 72.8142,
    category: 'Private Multi-Specialty Hospital',
    phone: '+91 22 6666 0000',
    website: 'https://bhatiahospital.org',
    isEmergency: true,
    openingHours: '24/7'
  },
  {
    id: 'osm-mumbai-10',
    name: 'Saifee Hospital',
    address: '15/17, Maharshi Karve Road, Opposite Charni Road Railway Station, Mumbai 400004',
    lat: 18.9525,
    lng: 72.8189,
    category: 'Multi-Specialty Hospital',
    phone: '+91 22 6757 0111',
    website: 'https://saifeehospital.com',
    isEmergency: true,
    openingHours: '24/7'
  },
  {
    id: 'osm-mumbai-11',
    name: 'P.D. Hinduja National Hospital',
    address: 'Veer Savarkar Marg, Mahim West, Mumbai, Maharashtra 400016',
    lat: 19.0330,
    lng: 72.8390,
    category: 'Multi-Specialty Private Hospital',
    phone: '+91 22 2445 1515',
    website: 'https://hindujahospital.com',
    isEmergency: true,
    openingHours: '24/7'
  },
  {
    id: 'osm-mumbai-12',
    name: 'Lilavati Hospital & Research Centre',
    address: 'A-791, Bandra Reclamation, Bandra West, Mumbai, Maharashtra 400050',
    lat: 19.0514,
    lng: 72.8290,
    category: 'Multi-Specialty Private Hospital',
    phone: '+91 22 2675 1000',
    website: 'https://lilavatihospital.com',
    isEmergency: true,
    openingHours: '24/7'
  },

  // --- DELHI NCR ---
  {
    id: 'osm-delhi-1',
    name: 'All India Institute of Medical Sciences (AIIMS)',
    address: 'Sri Aurobindo Marg, Ansari Nagar, New Delhi 110029',
    lat: 28.5672,
    lng: 77.2100,
    category: 'Apex Government Hospital',
    phone: '+91 11 2658 8500',
    website: 'https://aiims.edu',
    isEmergency: true,
    openingHours: '24/7'
  },
  {
    id: 'osm-delhi-2',
    name: 'Safdarjung Hospital',
    address: 'Ring Road, Opposite AIIMS, New Delhi 110029',
    lat: 28.5685,
    lng: 77.2065,
    category: 'Government Multi-Specialty Hospital',
    phone: '+91 11 2616 5060',
    website: 'https://vmmc-sjh.nic.in',
    isEmergency: true,
    openingHours: '24/7'
  },
  {
    id: 'osm-delhi-3',
    name: 'Max Super Speciality Hospital Saket',
    address: '1, 2, Press Enclave Road, Saket Institutional Area, New Delhi 110017',
    lat: 28.5284,
    lng: 77.2198,
    category: 'Private Multi-Specialty Hospital',
    phone: '+91 11 2651 5050',
    website: 'https://maxhealthcare.in',
    isEmergency: true,
    openingHours: '24/7'
  },
  {
    id: 'osm-delhi-4',
    name: 'Indraprastha Apollo Hospitals',
    address: 'Sarita Vihar, Delhi Mathura Road, New Delhi 110076',
    lat: 28.5361,
    lng: 77.2882,
    category: 'Multi-Specialty Super Hospital',
    phone: '+91 11 2692 5858',
    website: 'https://apollohospitals.com',
    isEmergency: true,
    openingHours: '24/7'
  },
  {
    id: 'osm-delhi-5',
    name: 'Sir Ganga Ram Hospital',
    address: 'Sir Ganga Ram Hospital Marg, Old Rajinder Nagar, New Delhi 110060',
    lat: 28.6385,
    lng: 77.1895,
    category: 'Multi-Specialty Hospital',
    phone: '+91 11 4225 4000',
    website: 'https://sgrh.com',
    isEmergency: true,
    openingHours: '24/7'
  },
  {
    id: 'osm-delhi-6',
    name: 'Fortis Escorts Heart Institute',
    address: 'Okhla Road, Sukhdev Vihar Metro Station, New Delhi 110025',
    lat: 28.5604,
    lng: 77.2750,
    category: 'Cardiology Speciality Hospital',
    phone: '+91 11 4713 5000',
    website: 'https://fortishealthcare.com',
    isEmergency: true,
    openingHours: '24/7'
  },

  // --- BENGALURU ---
  {
    id: 'osm-blr-1',
    name: "St. John's Medical College Hospital",
    address: 'Sarjapur Road, John Nagar, Koramangala, Bengaluru, Karnataka 560034',
    lat: 12.9304,
    lng: 77.6190,
    category: 'Teaching Multi-Specialty Hospital',
    phone: '+91 80 2206 5000',
    website: 'https://stjohns.in',
    isEmergency: true,
    openingHours: '24/7'
  },
  {
    id: 'osm-blr-2',
    name: 'Manipal Hospital Old Airport Road',
    address: '98, HAL Old Airport Rd, Kodihalli, Bengaluru, Karnataka 560017',
    lat: 12.9592,
    lng: 77.6496,
    category: 'Private Multi-Specialty Hospital',
    phone: '+91 80 2502 4444',
    website: 'https://manipalhospitals.com',
    isEmergency: true,
    openingHours: '24/7'
  },
  {
    id: 'osm-blr-3',
    name: 'Apollo Hospitals Bannerghatta',
    address: '154/11, Opp. IIMB, Bannerghatta Road, Bengaluru, Karnataka 560076',
    lat: 12.8942,
    lng: 77.5985,
    category: 'Multi-Specialty Super Hospital',
    phone: '+91 80 2630 4050',
    website: 'https://apollohospitals.com',
    isEmergency: true,
    openingHours: '24/7'
  },
  {
    id: 'osm-blr-4',
    name: 'Victoria Hospital',
    address: 'Fort Road, Near City Market, Kalasipalya, Bengaluru, Karnataka 560002',
    lat: 12.9635,
    lng: 77.5750,
    category: 'Government Hospital',
    phone: '+91 80 2670 1150',
    website: 'https://bmcri.edu.in',
    isEmergency: true,
    openingHours: '24/7'
  },

  // --- HYDERABAD ---
  {
    id: 'osm-hyd-1',
    name: 'Apollo Health City Jubilee Hills',
    address: 'Road No 72, Opp. Bharatiya Vidya Bhavan School, Film Nagar, Jubilee Hills, Hyderabad 500033',
    lat: 17.4168,
    lng: 78.4382,
    category: 'Multi-Specialty Super Hospital',
    phone: '+91 40 2360 7777',
    website: 'https://hyderabad.apollohospitals.com',
    isEmergency: true,
    openingHours: '24/7'
  },
  {
    id: 'osm-hyd-2',
    name: 'Nizams Institute of Medical Sciences (NIMS)',
    address: 'Punjagutta, Hyderabad, Telangana 500082',
    lat: 17.4216,
    lng: 78.4528,
    category: 'Autonomous State Government Hospital',
    phone: '+91 40 2348 9000',
    website: 'https://nims.edu.in',
    isEmergency: true,
    openingHours: '24/7'
  },

  // --- KOLKATA ---
  {
    id: 'osm-kol-1',
    name: 'IPGMER and SSKM Hospital',
    address: '244, Acharya Jagadish Chandra Bose Rd, Bhowanipore, Kolkata, West Bengal 700020',
    lat: 22.5385,
    lng: 88.3448,
    category: 'Government Multi-Specialty Hospital',
    phone: '+91 33 2223 1589',
    website: 'https://ipgmer.gov.in',
    isEmergency: true,
    openingHours: '24/7'
  },

  // --- CHENNAI ---
  {
    id: 'osm-chn-1',
    name: 'Apollo Hospitals Greams Road',
    address: '21, Greams Lane, Thousand Lights, Chennai, Tamil Nadu 600006',
    lat: 13.0604,
    lng: 80.2520,
    category: 'Multi-Specialty Super Hospital',
    phone: '+91 44 2829 0200',
    website: 'https://chennai.apollohospitals.com',
    isEmergency: true,
    openingHours: '24/7'
  },

  // --- PUNE ---
  {
    id: 'osm-pun-1',
    name: 'Sassoon General Hospital & B.J. Medical College',
    address: 'Station Road, Near Pune Railway Station, Pune, Maharashtra 411001',
    lat: 18.5284,
    lng: 73.8739,
    category: 'Government Teaching Hospital',
    phone: '+91 20 2612 8000',
    website: 'https://bjmcpune.org',
    isEmergency: true,
    openingHours: '24/7'
  }
];

/**
 * Calculates Great Circle distance between two GPS coordinates in kilometers (Haversine formula)
 */
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
};

/**
 * Geocode user manual search input (e.g. city name or landmark) via OpenStreetMap Nominatim
 */
export const geocodeManualLocation = async (query) => {
  if (!query || !query.trim()) return [];
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query.trim())}&limit=5&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SwasthyaSetu-EmergencyHealthcarePlatform/1.0'
      }
    });
    if (!res.ok) throw new Error('Geocoding service unavailable');
    const data = await res.json();
    return data.map(item => ({
      displayName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: item.type,
      importance: item.importance
    }));
  } catch (err) {
    console.warn('Nominatim geocode failed:', err.message);
    const q = query.toLowerCase();
    return POPULAR_LOCATIONS.filter(p => p.name.toLowerCase().includes(q)).map(p => ({
      displayName: p.name,
      lat: p.lat,
      lng: p.lng
    }));
  }
};

/**
 * Reverse geocode latitude and longitude to a human-readable city/district
 */
export const reverseGeocode = async (lat, lng) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SwasthyaSetu-EmergencyHealthcarePlatform/1.0'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address || {};
    const city = addr.city || addr.town || addr.suburb || addr.city_district || addr.county || addr.state;
    const road = addr.road || addr.neighbourhood || addr.suburb || '';
    if (road && city) return `${road}, ${city}`;
    return data.display_name ? data.display_name.split(',').slice(0, 3).join(', ') : null;
  } catch {
    return null;
  }
};

/**
 * Direct client-side Overpass & Nominatim query with verified regional fallback
 */
export const fetchOverpassDirect = async (lat, lng, radiusMeters = 10000) => {
  // 1. Try Fast Indexed Overpass API Query
  const overpassQuery = `[out:json][timeout:8];
(
  node["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
  way["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
  node["amenity"="clinic"](around:${radiusMeters},${lat},${lng});
  way["amenity"="clinic"](around:${radiusMeters},${lat},${lng});
  node["healthcare"="hospital"](around:${radiusMeters},${lat},${lng});
  way["healthcare"="hospital"](around:${radiusMeters},${lat},${lng});
  node["healthcare"="clinic"](around:${radiusMeters},${lat},${lng});
  way["healthcare"="clinic"](around:${radiusMeters},${lat},${lng});
);
out center tags qt 50;`;

  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter'
  ];

  let rawData = null;
  for (const ep of endpoints) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(overpassQuery)}`,
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (res.ok) {
        rawData = await res.json();
        break;
      }
    } catch {
      // try next endpoint
    }
  }

  if (rawData && Array.isArray(rawData.elements) && rawData.elements.length > 0) {
    const facilities = [];
    const seenMap = new Map();

    for (const elem of rawData.elements) {
      const tags = elem.tags || {};
      const rawName = tags.name || tags['name:en'] || tags['name:hi'] || tags.official_name || tags.operator;
      const isHospital = tags.amenity === 'hospital' || tags.healthcare === 'hospital';
      const isClinic = tags.amenity === 'clinic' || tags.healthcare === 'clinic';
      const isEmergency = tags.emergency === 'yes' || tags['healthcare:emergency'] === 'yes';

      if (!rawName && !isHospital && !isEmergency) continue;

      const hLat = elem.type === 'node' ? elem.lat : elem.center?.lat;
      const hLng = elem.type === 'node' ? elem.lon : elem.center?.lon;
      if (hLat == null || hLng == null) continue;

      const dist = calculateDistanceKm(lat, lng, hLat, hLng);
      if (dist > (radiusMeters / 1000) * 1.1) continue;

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
      if (seenMap.has(normKey)) continue;
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
        openingHours: tags.opening_hours || null
      });
    }

    if (facilities.length > 0) {
      facilities.sort((a, b) => a.distanceKm - b.distanceKm);
      return facilities;
    }
  }

  // 2. Fallback: Search verified regional facilities matching within radius (1.2x tolerance)
  const maxKm = (radiusMeters / 1000) * 1.2;
  const regionalMatches = VERIFIED_REGIONAL_HOSPITALS.map(h => {
    const dist = calculateDistanceKm(lat, lng, h.lat, h.lng);
    return {
      ...h,
      distanceKm: dist
    };
  })
  .filter(h => h.distanceKm <= maxKm)
  .sort((a, b) => a.distanceKm - b.distanceKm);

  if (regionalMatches.length > 0) {
    return regionalMatches;
  }

  // No regional hospitals within radius — return empty array so the UI shows a clear empty state
  return [];
};

/**
 * Centralized Seed & Fallback Data for SwasthyaSetu
 * Used gracefully when the database connection is in standby
 */

const fallbackHospitals = [
  {
    _id: "65d000000000000000000001",
    name: "All India Institute of Medical Sciences (AIIMS)",
    email: "admin@aiims.edu",
    phone: "011-26588500",
    emergencyPhone: "011-26594405",
    address: "Ansari Nagar, New Delhi",
    hospitalType: "Government",
    location: { lat: 28.5672, lng: 77.2100 },
    departments: ['Cardiology', 'Pediatrics', 'Neurology', 'Orthopedics', 'General Medicine'],
    verifiedStatus: 'verified',
    beds: {
      total: 1200,
      occupied: 1150,
      available: 50,
      icuTotal: 150,
      icuAvailable: 2,
      emergencyTotal: 80,
      emergencyAvailable: 0,
      ventilatorsTotal: 100,
      ventilatorsAvailable: 5
    },
    bloodInventory: {
      Ap: { availableUnits: 45 }, An: { availableUnits: 12 },
      Bp: { availableUnits: 50 }, Bn: { availableUnits: 8 },
      Op: { availableUnits: 65 }, On: { availableUnits: 1 },
      ABp: { availableUnits: 20 }, ABn: { availableUnits: 4 }
    },
    isFallback: true
  },
  {
    _id: "65d000000000000000000002",
    name: "Apollo Hospital Delhi",
    email: "info@apollohospitals.com",
    phone: "011-26925858",
    emergencyPhone: "011-26925801",
    address: "Sarita Vihar, Delhi Mathura Road, New Delhi",
    hospitalType: "Private",
    location: { lat: 28.5361, lng: 77.2882 },
    departments: ['Cardiology', 'Pediatrics', 'Neurology', 'Orthopedics', 'General Medicine'],
    verifiedStatus: 'verified',
    beds: {
      total: 700,
      occupied: 520,
      available: 180,
      icuTotal: 80,
      icuAvailable: 15,
      emergencyTotal: 40,
      emergencyAvailable: 12,
      ventilatorsTotal: 50,
      ventilatorsAvailable: 14
    },
    bloodInventory: {
      Ap: { availableUnits: 30 }, An: { availableUnits: 6 },
      Bp: { availableUnits: 32 }, Bn: { availableUnits: 5 },
      Op: { availableUnits: 40 }, On: { availableUnits: 10 },
      ABp: { availableUnits: 15 }, ABn: { availableUnits: 2 }
    },
    isFallback: true
  },
  {
    _id: "65d000000000000000000003",
    name: "Max Super Speciality Hospital Saket",
    email: "contact@maxhealthcare.com",
    phone: "011-26515050",
    emergencyPhone: "011-40554055",
    address: "1-2, Press Enclave Road, Saket, New Delhi",
    hospitalType: "Private",
    location: { lat: 28.5284, lng: 77.2198 },
    departments: ['Cardiology', 'Pediatrics', 'Neurology', 'Orthopedics', 'General Medicine'],
    verifiedStatus: 'verified',
    beds: {
      total: 500,
      occupied: 450,
      available: 50,
      icuTotal: 60,
      icuAvailable: 4,
      emergencyTotal: 30,
      emergencyAvailable: 2,
      ventilatorsTotal: 30,
      ventilatorsAvailable: 4
    },
    bloodInventory: {
      Ap: { availableUnits: 18 }, An: { availableUnits: 4 },
      Bp: { availableUnits: 20 }, Bn: { availableUnits: 3 },
      Op: { availableUnits: 25 }, On: { availableUnits: 3 },
      ABp: { availableUnits: 8 }, ABn: { availableUnits: 1 }
    },
    isFallback: true
  }
];

const fallbackDonors = [
  {
    _id: "65d000000000000000000081",
    bloodGroup: "O+",
    cityArea: "Connaught Place, New Delhi",
    availabilityStatus: true,
    contactPreference: "Phone",
    user: { name: "Rohan Varma", phone: "9876001101" },
    isFallback: true
  },
  {
    _id: "65d000000000000000000082",
    bloodGroup: "A+",
    cityArea: "Saket, New Delhi",
    availabilityStatus: true,
    contactPreference: "Phone",
    user: { name: "Ananya Iyer", phone: "9876001102" },
    isFallback: true
  },
  {
    _id: "65d000000000000000000083",
    bloodGroup: "B+",
    cityArea: "Vasant Kunj, New Delhi",
    availabilityStatus: true,
    contactPreference: "Phone",
    user: { name: "Priya Sharma", phone: "9876001103" },
    isFallback: true
  }
];

const fallbackDoctors = [
  {
    _id: "65d000000000000000000071",
    // Names without "Dr.": the UI adds the prefix itself ("Dr. Dr. Ramesh Kumar" otherwise).
    name: "Ramesh Kumar",
    specialization: "Cardiologist",
    contact: "9876541001",
    experience: 12,
    schedule: { days: ["Monday", "Wednesday", "Friday"], slots: ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM"] },
    status: "available",
    // Hospital ids match fallbackHospitals so ?hospitalId= filtering also works offline.
    hospital: { _id: "65d000000000000000000001", name: "All India Institute of Medical Sciences (AIIMS)", address: "Ansari Nagar, New Delhi" },
    isFallback: true
  },
  {
    _id: "65d000000000000000000072",
    name: "Sita Sharma",
    specialization: "Pediatrician",
    contact: "9876541002",
    experience: 8,
    schedule: { days: ["Tuesday", "Thursday", "Saturday"], slots: ["10:00 AM", "11:00 AM", "03:00 PM"] },
    status: "available",
    hospital: { _id: "65d000000000000000000002", name: "Apollo Hospital Delhi", address: "Sarita Vihar, Delhi Mathura Road, New Delhi" },
    isFallback: true
  },
  {
    _id: "65d000000000000000000073",
    name: "Ajay Tyagi",
    specialization: "General Medicine",
    contact: "9876541003",
    experience: 15,
    schedule: { days: ["Monday", "Tuesday", "Wednesday"], slots: ["09:00 AM", "02:00 PM", "04:00 PM"] },
    status: "available",
    hospital: { _id: "65d000000000000000000003", name: "Max Super Speciality Hospital Saket", address: "1-2, Press Enclave Road, Saket, New Delhi" },
    isFallback: true
  }
];

// Dates are relative to "now" so the demo drives are always upcoming
// (fixed dates had already passed and showed as expired).
const daysFromToday = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const getFallbackCampaigns = () => [
  {
    _id: "65d000000000000000000091",
    title: "Mega Blood Donation Camp",
    description: "Join us for our annual blood donation camp to save lives in emergency situations. Free health screening checks for all donors.",
    type: "blood_camp",
    date: daysFromToday(14),
    time: "09:00 AM - 05:00 PM",
    venue: "AIIMS Main Auditorium Area, New Delhi",
    organizer: "All India Institute of Medical Sciences (AIIMS)",
    status: "active",
    hospital: { name: "All India Institute of Medical Sciences (AIIMS)" },
    registeredUsers: [],
    isFallback: true
  },
  {
    _id: "65d000000000000000000092",
    title: "Free Vaccination Drive",
    description: "Hepatitis B and Influenza vaccination drive for senior citizens and young children.",
    type: "vaccination",
    date: daysFromToday(30),
    time: "10:00 AM - 03:00 PM",
    venue: "Apollo Hospital Complex, New Delhi",
    organizer: "Apollo Hospital Delhi",
    status: "upcoming",
    hospital: { name: "Apollo Hospital Delhi" },
    registeredUsers: [],
    isFallback: true
  }
];

const verifiedRegionalHospitals = [
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
    isEmergency: true
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
    isEmergency: true
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
    isEmergency: true
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
    isEmergency: true
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
    isEmergency: true
  },
  {
    id: 'osm-mumbai-6',
    name: 'MGM Hospital Parel',
    address: 'Dr. S.S. Rao Marg, Parel, Mumbai, Maharashtra 400012',
    lat: 19.0015,
    lng: 72.8415,
    category: 'General Hospital',
    phone: '+91 22 2413 5189',
    website: null,
    isEmergency: true
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
    isEmergency: true
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
    isEmergency: true
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
    isEmergency: true
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
    isEmergency: true
  },
  {
    id: 'osm-mumbai-11',
    name: 'P.D. Hinduja Hospital',
    address: 'Veer Savarkar Marg, Mahim West, Mumbai, Maharashtra 400016',
    lat: 19.0330,
    lng: 72.8390,
    category: 'Multi-Specialty Private Hospital',
    phone: '+91 22 2445 1515',
    website: 'https://hindujahospital.com',
    isEmergency: true
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
    isEmergency: true
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
    isEmergency: true
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
    isEmergency: true
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
    isEmergency: true
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
    isEmergency: true
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
    isEmergency: true
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
    isEmergency: true
  }
];

module.exports = {
  fallbackHospitals,
  fallbackDonors,
  fallbackDoctors,
  getFallbackCampaigns,
  // Static snapshot kept for backwards compatibility; prefer getFallbackCampaigns().
  get fallbackCampaigns() { return getFallbackCampaigns(); },
  verifiedRegionalHospitals
};


const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Doctor = require('../models/Doctor');
const Ambulance = require('../models/Ambulance');
const BloodDonor = require('../models/BloodDonor');
const HealthCampaign = require('../models/HealthCampaign');

dotenv.config();

const hospitalsData = [
  {
    name: "All India Institute of Medical Sciences (AIIMS)",
    email: "admin@aiims.edu",
    phone: "011-26588500",
    emergencyPhone: "011-26594405",
    licenseNumber: "HOSP-AIIMS-110029",
    address: "Ansari Nagar, New Delhi",
    website: "https://www.aiims.edu",
    hospitalType: "Government",
    location: { lat: 28.5672, lng: 77.2100 }, // Ansari Nagar
    beds: { total: 1200, occupied: 1150, available: 50, icuTotal: 150, icuAvailable: 2, emergencyTotal: 80, emergencyAvailable: 0, ventilatorsTotal: 100, ventilatorsAvailable: 5 },
    bloodInventory: {
      Ap: { availableUnits: 45, lastUpdated: new Date() },
      An: { availableUnits: 12, lastUpdated: new Date() },
      Bp: { availableUnits: 50, lastUpdated: new Date() },
      Bn: { availableUnits: 8, lastUpdated: new Date() },
      Op: { availableUnits: 65, lastUpdated: new Date() },
      On: { availableUnits: 1, lastUpdated: new Date() }, // Critical
      ABp: { availableUnits: 20, lastUpdated: new Date() },
      ABn: { availableUnits: 4, lastUpdated: new Date() }
    },
    organs: {
      kidney: { available: 1, lastUpdated: new Date() },
      liver: { available: 0, lastUpdated: new Date() },
      heart: { available: 0, lastUpdated: new Date() },
      lungs: { available: 0, lastUpdated: new Date() }
    }
  },
  {
    name: "Apollo Hospital Delhi",
    email: "info@apollohospitals.com",
    phone: "011-26925858",
    emergencyPhone: "011-26925801",
    licenseNumber: "HOSP-APOLLO-110076",
    address: "Sarita Vihar, Delhi Mathura Road, New Delhi",
    website: "https://delhi.apollohospitals.com",
    hospitalType: "Private",
    location: { lat: 28.5361, lng: 77.2882 }, // Sarita Vihar
    beds: { total: 700, occupied: 520, available: 180, icuTotal: 80, icuAvailable: 15, emergencyTotal: 40, emergencyAvailable: 12, ventilatorsTotal: 50, ventilatorsAvailable: 14 },
    bloodInventory: {
      Ap: { availableUnits: 30, lastUpdated: new Date() },
      An: { availableUnits: 6, lastUpdated: new Date() },
      Bp: { availableUnits: 32, lastUpdated: new Date() },
      Bn: { availableUnits: 5, lastUpdated: new Date() },
      Op: { availableUnits: 40, lastUpdated: new Date() },
      On: { availableUnits: 10, lastUpdated: new Date() },
      ABp: { availableUnits: 15, lastUpdated: new Date() },
      ABn: { availableUnits: 2, lastUpdated: new Date() }
    },
    organs: {
      kidney: { available: 2, lastUpdated: new Date() },
      liver: { available: 1, lastUpdated: new Date() },
      heart: { available: 0, lastUpdated: new Date() },
      lungs: { available: 0, lastUpdated: new Date() }
    }
  },
  {
    name: "Max Super Speciality Hospital Saket",
    email: "contact@maxhealthcare.com",
    phone: "011-26515050",
    emergencyPhone: "011-40554055",
    licenseNumber: "HOSP-MAX-Saket",
    address: "1-2, Press Enclave Road, Saket, New Delhi",
    website: "https://www.maxhealthcare.in",
    hospitalType: "Private",
    location: { lat: 28.5284, lng: 77.2198 }, // Saket
    beds: { total: 500, occupied: 450, available: 50, icuTotal: 60, icuAvailable: 4, emergencyTotal: 30, emergencyAvailable: 2, ventilatorsTotal: 30, ventilatorsAvailable: 4 },
    bloodInventory: {
      Ap: { availableUnits: 18, lastUpdated: new Date() },
      An: { availableUnits: 4, lastUpdated: new Date() },
      Bp: { availableUnits: 20, lastUpdated: new Date() },
      Bn: { availableUnits: 3, lastUpdated: new Date() },
      Op: { availableUnits: 25, lastUpdated: new Date() },
      On: { availableUnits: 3, lastUpdated: new Date() },
      ABp: { availableUnits: 8, lastUpdated: new Date() },
      ABn: { availableUnits: 1, lastUpdated: new Date() }
    },
    organs: {
      kidney: { available: 0, lastUpdated: new Date() },
      liver: { available: 0, lastUpdated: new Date() },
      heart: { available: 0, lastUpdated: new Date() },
      lungs: { available: 0, lastUpdated: new Date() }
    }
  },
  {
    name: "Fortis Flt. Lt. Rajan Dhall Hospital",
    email: "enquiry@fortishealthcare.com",
    phone: "011-42776222",
    emergencyPhone: "011-42776444",
    licenseNumber: "HOSP-FORTIS-Vasant",
    address: "Sector B, Pocket 1, Aruna Asaf Ali Marg, Vasant Kunj, New Delhi",
    website: "https://www.fortishealthcare.com",
    hospitalType: "Private",
    location: { lat: 28.5244, lng: 77.1594 }, // Vasant Kunj
    beds: { total: 300, occupied: 220, available: 80, icuTotal: 40, icuAvailable: 12, emergencyTotal: 20, emergencyAvailable: 7, ventilatorsTotal: 20, ventilatorsAvailable: 9 },
    bloodInventory: {
      Ap: { availableUnits: 15, lastUpdated: new Date() },
      An: { availableUnits: 2, lastUpdated: new Date() },
      Bp: { availableUnits: 18, lastUpdated: new Date() },
      Bn: { availableUnits: 4, lastUpdated: new Date() },
      Op: { availableUnits: 22, lastUpdated: new Date() },
      On: { availableUnits: 6, lastUpdated: new Date() },
      ABp: { availableUnits: 10, lastUpdated: new Date() },
      ABn: { availableUnits: 2, lastUpdated: new Date() }
    }
  },
  {
    name: "Sir Ganga Ram Hospital",
    email: "gangaram@sgrh.com",
    phone: "011-25750000",
    emergencyPhone: "011-42251000",
    licenseNumber: "HOSP-SGRH-Rajendra",
    address: "Sir Ganga Ram Hospital Marg, Rajendra Nagar, New Delhi",
    website: "https://sgrh.com",
    hospitalType: "Charitable",
    location: { lat: 28.6385, lng: 77.1894 }, // Rajendra Nagar
    beds: { total: 675, occupied: 630, available: 45, icuTotal: 90, icuAvailable: 1, emergencyTotal: 35, emergencyAvailable: 0, ventilatorsTotal: 60, ventilatorsAvailable: 3 },
    bloodInventory: {
      Ap: { availableUnits: 4, lastUpdated: new Date() }, // Low
      An: { availableUnits: 1, lastUpdated: new Date() }, // Critical
      Bp: { availableUnits: 3, lastUpdated: new Date() }, // Low
      Bn: { availableUnits: 0, lastUpdated: new Date() }, // Critical
      Op: { availableUnits: 5, lastUpdated: new Date() },
      On: { availableUnits: 0, lastUpdated: new Date() },
      ABp: { availableUnits: 2, lastUpdated: new Date() },
      ABn: { availableUnits: 0, lastUpdated: new Date() }
    }
  },
  {
    name: "Safdarjung Hospital",
    email: "safdarjung@nic.in",
    phone: "011-26165060",
    emergencyPhone: "011-26730000",
    licenseNumber: "HOSP-SFJ-110029",
    address: "Ansari Nagar East, near AIIMS Metro Station, New Delhi",
    website: "http://www.vmmc-sjh.nic.in",
    hospitalType: "Government",
    location: { lat: 28.5662, lng: 77.2064 }, // Safdarjung
    beds: { total: 2900, occupied: 2850, available: 50, icuTotal: 200, icuAvailable: 6, emergencyTotal: 150, emergencyAvailable: 5, ventilatorsTotal: 150, ventilatorsAvailable: 11 },
    bloodInventory: {
      Ap: { availableUnits: 80, lastUpdated: new Date() },
      An: { availableUnits: 15, lastUpdated: new Date() },
      Bp: { availableUnits: 75, lastUpdated: new Date() },
      Bn: { availableUnits: 10, lastUpdated: new Date() },
      Op: { availableUnits: 90, lastUpdated: new Date() },
      On: { availableUnits: 5, lastUpdated: new Date() },
      ABp: { availableUnits: 30, lastUpdated: new Date() },
      ABn: { availableUnits: 6, lastUpdated: new Date() }
    }
  },
  {
    name: "Medanta - The Medicity Gurugram",
    email: "info@medanta.org",
    phone: "0124-4141414",
    emergencyPhone: "0124-4141414",
    licenseNumber: "HOSP-MEDANTA-122001",
    address: "CH Baktawar Singh Road, Sector 38, Gurugram, Haryana",
    website: "https://www.medanta.org",
    hospitalType: "Private",
    location: { lat: 28.4262, lng: 77.0422 }, // Gurugram Sector 38
    beds: { total: 1250, occupied: 980, available: 270, icuTotal: 250, icuAvailable: 34, emergencyTotal: 60, emergencyAvailable: 20, ventilatorsTotal: 120, ventilatorsAvailable: 28 },
    bloodInventory: {
      Ap: { availableUnits: 60, lastUpdated: new Date() },
      An: { availableUnits: 10, lastUpdated: new Date() },
      Bp: { availableUnits: 55, lastUpdated: new Date() },
      Bn: { availableUnits: 8, lastUpdated: new Date() },
      Op: { availableUnits: 70, lastUpdated: new Date() },
      On: { availableUnits: 12, lastUpdated: new Date() },
      ABp: { availableUnits: 25, lastUpdated: new Date() },
      ABn: { availableUnits: 4, lastUpdated: new Date() }
    }
  },
  {
    name: "Fortis Memorial Research Institute",
    email: "fmri@fortishealthcare.com",
    phone: "0124-4962200",
    emergencyPhone: "0124-4962200",
    licenseNumber: "HOSP-FMRI-122002",
    address: "Sector 44, opposite HUDA City Centre Metro Station, Gurugram, Haryana",
    website: "https://www.fmri.in",
    hospitalType: "Private",
    location: { lat: 28.4590, lng: 77.0725 }, // Gurugram Sector 44
    beds: { total: 400, occupied: 340, available: 60, icuTotal: 50, icuAvailable: 8, emergencyTotal: 25, emergencyAvailable: 4, ventilatorsTotal: 25, ventilatorsAvailable: 6 },
    bloodInventory: {
      Ap: { availableUnits: 20, lastUpdated: new Date() },
      An: { availableUnits: 3, lastUpdated: new Date() },
      Bp: { availableUnits: 22, lastUpdated: new Date() },
      Bn: { availableUnits: 2, lastUpdated: new Date() },
      Op: { availableUnits: 28, lastUpdated: new Date() },
      On: { availableUnits: 4, lastUpdated: new Date() },
      ABp: { availableUnits: 12, lastUpdated: new Date() },
      ABn: { availableUnits: 1, lastUpdated: new Date() }
    }
  },
  {
    name: "Ram Manohar Lohia Hospital (RML)",
    email: "rmlhosp@nic.in",
    phone: "011-23365525",
    emergencyPhone: "011-23404483",
    licenseNumber: "HOSP-RML-110001",
    address: "Baba Kharak Singh Marg, Connaught Place, New Delhi",
    website: "http://rmlh.nic.in",
    hospitalType: "Government",
    location: { lat: 28.6253, lng: 77.2017 }, // CP / RML
    beds: { total: 1400, occupied: 1350, available: 50, icuTotal: 100, icuAvailable: 4, emergencyTotal: 70, emergencyAvailable: 2, ventilatorsTotal: 60, ventilatorsAvailable: 5 },
    bloodInventory: {
      Ap: { availableUnits: 35, lastUpdated: new Date() },
      An: { availableUnits: 5, lastUpdated: new Date() },
      Bp: { availableUnits: 38, lastUpdated: new Date() },
      Bn: { availableUnits: 4, lastUpdated: new Date() },
      Op: { availableUnits: 42, lastUpdated: new Date() },
      On: { availableUnits: 3, lastUpdated: new Date() },
      ABp: { availableUnits: 18, lastUpdated: new Date() },
      ABn: { availableUnits: 2, lastUpdated: new Date() }
    }
  },
  {
    name: "Lok Nayak Jai Prakash Hospital (LNJP)",
    email: "lnjph@nic.in",
    phone: "011-23236000",
    emergencyPhone: "011-23232400",
    licenseNumber: "HOSP-LNJP-110002",
    address: "Jawaharlal Nehru Marg, near Delhi Gate, New Delhi",
    website: "http://lnjph.delhigovt.nic.in",
    hospitalType: "Government",
    location: { lat: 28.6346, lng: 77.2405 }, // Delhi Gate
    beds: { total: 2000, occupied: 1940, available: 60, icuTotal: 120, icuAvailable: 5, emergencyTotal: 80, emergencyAvailable: 3, ventilatorsTotal: 80, ventilatorsAvailable: 8 },
    bloodInventory: {
      Ap: { availableUnits: 50, lastUpdated: new Date() },
      An: { availableUnits: 8, lastUpdated: new Date() },
      Bp: { availableUnits: 48, lastUpdated: new Date() },
      Bn: { availableUnits: 6, lastUpdated: new Date() },
      Op: { availableUnits: 55, lastUpdated: new Date() },
      On: { availableUnits: 4, lastUpdated: new Date() },
      ABp: { availableUnits: 22, lastUpdated: new Date() },
      ABn: { availableUnits: 3, lastUpdated: new Date() }
    }
  }
];

const doctorNames = [
  "Ramesh Kumar", "Sita Sharma", "Ajay Tyagi", "Pooja Gupta", "Vikram Rathore",
  "Nisha Patel", "Karan Malhotra", "Sneha Roy", "Alok Deshmukh", "Priti Joshi",
  "Rajesh Nair", "Sunita Rao", "Deepak Verma", "Anjali Mehta", "Sanjay Singhania",
  "Manju Goyal", "Varun Dhawan", "Kirti Sen", "Aditya Birla", "Swati Kapoor",
  "Arun Goel", "Meena Iyer", "Harish Salve", "Ritu Karidhal", "Anil Kumble",
  "Kavita Devi", "Rohan Bopanna", "Preeti Zinta", "Vijay Shekhar", "Shreya Ghoshal"
];

const specializations = [
  "Cardiologist", "Pediatrician", "Dermatologist", "Neurologist", "Orthopedist",
  "Gynecologist", "General Medicine", "Oncologist", "Psychiatrist", "Ophthalmologist"
];

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/SwasthyaSetu';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Hospital.deleteMany({});
    await Doctor.deleteMany({});
    await Ambulance.deleteMany({});
    await BloodDonor.deleteMany({});
    await HealthCampaign.deleteMany({});

    console.log('Cleared existing collections.');

    // 1. Seed Super Admin
    const superadmin = await User.create({
      name: "SwasthyaSetu Super Admin",
      email: "admin@SwasthyaSetu.com",
      password: "adminpassword", // Will be hashed by pre-save middleware
      role: "admin",
      phone: "9999999999",
      location: { lat: 28.6139, lng: 77.2090 }
    });
    console.log('Super Admin user created.');

    // 2. Seed Patient accounts
    const patientUser = await User.create({
      name: "Rahul Sharma",
      email: "rahul@gmail.com",
      password: "password123",
      role: "patient",
      phone: "9876543210",
      location: { lat: 28.6129, lng: 77.2290 },
      medicalInfo: {
        dob: new Date('1994-06-15'),
        gender: "Male",
        bloodGroup: "O+",
        allergies: ["Peanuts", "Penicillin"],
        chronicConditions: ["Asthma"],
        emergencyContactName: "Sita Sharma",
        emergencyContactPhone: "9876543211",
        emergencyContactRelation: "Spouse"
      }
    });
    console.log('Demo Patient user created.');

    // 3. Seed Hospitals (and their user accounts)
    const hospitalsList = [];
    for (let i = 0; i < hospitalsData.length; i++) {
      const hData = hospitalsData[i];
      // Create user login account for hospital
      const hUser = await User.create({
        name: hData.name + " Admin",
        email: hData.email,
        password: "hospitalpassword",
        role: "hospital",
        phone: hData.phone,
        location: hData.location
      });

      // Create hospital profile linked to user account
      const hospitalProfile = await Hospital.create({
        user: hUser._id,
        name: hData.name,
        licenseNumber: hData.licenseNumber,
        address: hData.address,
        emergencyPhone: hData.emergencyPhone,
        contactPhone: hData.phone,
        website: hData.website,
        hospitalType: hData.hospitalType,
        facilities: ['Emergency Room', 'Pharmacy', 'Diagnostic Lab', 'Oxygen Plant', 'Blood Bank'],
        departments: ['Cardiology', 'Pediatrics', 'Neurology', 'Orthopedics', 'General Medicine'],
        location: hData.location,
        verifiedStatus: 'verified',
        beds: hData.beds,
        bloodInventory: hData.bloodInventory,
        organs: hData.organs || {
          kidney: { available: 0, lastUpdated: new Date() },
          liver: { available: 0, lastUpdated: new Date() },
          heart: { available: 0, lastUpdated: new Date() },
          lungs: { available: 0, lastUpdated: new Date() }
        }
      });
      hospitalsList.push(hospitalProfile);
    }
    console.log(`${hospitalsList.length} Hospital profiles and hospital users created.`);

    // 4. Seed 30 Doctors across hospitals
    const doctorsList = [];
    for (let i = 0; i < 30; i++) {
      const hosp = hospitalsList[i % hospitalsList.length];
      const spec = specializations[i % specializations.length];
      const doc = await Doctor.create({
        hospital: hosp._id,
        name: doctorNames[i],
        specialization: spec,
        contact: "987654" + (1000 + i),
        experience: 5 + (i % 15),
        schedule: {
          days: ["Monday", "Wednesday", "Friday"],
          slots: ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM", "04:00 PM"]
        },
        status: "available"
      });
      doctorsList.push(doc);
    }
    console.log(`${doctorsList.length} Doctors seeded.`);

    // 5. Seed Ambulances
    const ambulanceStatus = ["available", "busy", "maintenance"];
    for (let i = 0; i < hospitalsList.length; i++) {
      const hosp = hospitalsList[i];
      // Create 2 ambulances per hospital
      await Ambulance.create({
        hospital: hosp._id,
        licensePlate: `DL-3C-CA-${1000 + i}`,
        driverName: `Driver ${i + 1}`,
        driverContact: `99887766${10 + i}`,
        status: ambulanceStatus[i % ambulanceStatus.length],
        location: {
          lat: hosp.location.lat + (Math.random() - 0.5) * 0.02,
          lng: hosp.location.lng + (Math.random() - 0.5) * 0.02
        }
      });
      await Ambulance.create({
        hospital: hosp._id,
        licensePlate: `DL-3C-CB-${2000 + i}`,
        driverName: `Driver ${i + 11}`,
        driverContact: `99887755${10 + i}`,
        status: 'available',
        location: hosp.location
      });
    }
    console.log(`Ambulances seeded for all hospitals.`);

    // 6. Seed Voluntary Blood Donors
    const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
    const cities = ["Connaught Place", "Saket", "Vasant Kunj", "Sarita Vihar", "Ansari Nagar", "Rajendra Nagar"];
    for (let i = 0; i < 5; i++) {
      const dUser = await User.create({
        name: `Donor ${i + 1}`,
        email: `donor${i + 1}@gmail.com`,
        password: "password123",
        role: "patient",
        phone: `987600110${i}`
      });

      await BloodDonor.create({
        user: dUser._id,
        bloodGroup: bloodGroups[i % bloodGroups.length],
        cityArea: cities[i % cities.length],
        availabilityStatus: true,
        contactPreference: "Phone",
        lastDonationDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 * (i + 1))
      });
    }
    console.log('Voluntary Blood Donors seeded.');

    // 7. Seed Health Campaigns
    await HealthCampaign.create({
      hospital: hospitalsList[0]._id, // AIIMS
      title: "Mega Blood Donation Camp",
      description: "Join us for our annual blood donation camp to save lives in emergency situations. Free health screening checks for all donors.",
      type: "blood_camp",
      date: "2026-09-15",
      time: "09:00 AM - 05:00 PM",
      venue: "AIIMS Main Auditorium Area, New Delhi"
    });

    await HealthCampaign.create({
      hospital: hospitalsList[1]._id, // Apollo
      title: "Free Vaccination Drive",
      description: "Hepatitis B and Influenza vaccination drive for senior citizens and young children.",
      type: "vaccination",
      date: "2026-10-10",
      time: "10:00 AM - 03:00 PM",
      venue: "Apollo Hospital Complex, New Delhi"
    });
    console.log('Health Campaigns seeded.');

    console.log('Database Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDatabase();

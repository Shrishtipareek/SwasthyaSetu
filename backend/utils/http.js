const mongoose = require('mongoose');

/**
 * Error with an attached HTTP status code. Throw it from controllers / helpers
 * when the client sent something invalid so it is reported with the right code.
 */
class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Translate any thrown error into a JSON response with a sensible status code
 * instead of blindly returning 500 for client mistakes.
 */
const DB_UNAVAILABLE_ERRORS = ['MongooseServerSelectionError', 'MongoServerSelectionError', 'MongoNetworkError', 'MongoNotConnectedError'];

const isDbUnavailableError = (error) =>
  !!error &&
  (DB_UNAVAILABLE_ERRORS.includes(error.name) ||
    /buffering timed out|Client must be connected|connection .* closed/i.test(error.message || ''));

const sendError = (res, error) => {
  if (res.headersSent) return;

  let statusCode = error.statusCode || error.status || 500;
  let message = error.message || 'Internal server error';

  if (isDbUnavailableError(error)) {
    statusCode = 503;
    message = 'Database is currently unavailable. Please try again shortly.';
    console.error(`[db-unavailable] ${error.message}`);
  } else if (error instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid value for ${error.path}: ${JSON.stringify(error.value)}`;
  } else if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = Object.values(error.errors).map((e) => e.message).join(', ');
  } else if (error && error.code === 11000) {
    statusCode = 409;
    const fields = Object.keys(error.keyValue || error.keyPattern || {});
    message = fields.length
      ? `A record with this ${fields.join(', ')} already exists.`
      : 'Duplicate record.';
  } else if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({ message });
};

const isDbConnected = () => mongoose.connection.readyState === 1;

const isValidObjectId = (id) => !!id && /^[a-f\d]{24}$/i.test(String(id));

/** Escape user input before embedding it in a RegExp (prevents invalid-regex errors / ReDoS). */
const escapeRegex = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Returns the names of the fields in `fields` that are missing / empty in `body`. */
const missingFields = (body = {}, fields = []) =>
  fields.filter((f) => body[f] === undefined || body[f] === null || (typeof body[f] === 'string' && body[f].trim() === ''));

const isNumeric = (v) =>
  (typeof v === 'number' && Number.isFinite(v)) ||
  (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v)));

// lng must stay inside [-180, 180): the 2d indexes on location reject 180 exactly.
const isValidLocation = (loc) =>
  !!loc &&
  typeof loc === 'object' &&
  isNumeric(loc.lat) &&
  isNumeric(loc.lng) &&
  Math.abs(Number(loc.lat)) <= 90 &&
  Number(loc.lng) >= -180 &&
  Number(loc.lng) < 180;

/** Positive integer check for quantities such as units of blood or beds. */
const toPositiveInt = (value) => {
  if (!isNumeric(value)) return null;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
};

const formatLocalDate = (d) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** Today's date as YYYY-MM-DD in the server's local timezone. */
const todayISO = () => formatLocalDate(new Date());

/** Shift today's date by `days`, as YYYY-MM-DD (used for demo/seed data). */
const isoDateFromToday = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return formatLocalDate(d);
};

/** Accepts only real calendar dates in YYYY-MM-DD format (rejects 2026-02-31). */
const isValidISODate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
};

/**
 * ?page=&limit= parsing that never produces NaN / negative values
 * (parseInt('abc') used to reach .skip()/.limit() as NaN).
 */
const parsePagination = (query = {}, { defaultLimit = 50, maxLimit = 100 } = {}) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number.parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
};

/** "9876543210" -> "98******10" so guests cannot harvest contact numbers. */
const maskPhone = (phone) => {
  if (!phone) return phone;
  const s = String(phone);
  if (s.length <= 4) return '*'.repeat(s.length);
  return `${s.slice(0, 2)}${'*'.repeat(s.length - 4)}${s.slice(-2)}`;
};

const normalizeLocation = (loc) => ({ lat: Number(loc.lat), lng: Number(loc.lng) });

// Blood groups: the API accepts both human readable ("O+") and storage keys ("Op").
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const BLOOD_KEYS = ['Ap', 'An', 'Bp', 'Bn', 'Op', 'On', 'ABp', 'ABn'];

/** "O+", "o+", "O " (URL-decoded "+"), "Op" -> "O+". Returns null when invalid. */
const normalizeBloodGroup = (value) => {
  if (value === undefined || value === null) return null;
  let v = String(value).toUpperCase();
  // A literal "+" in a query string is decoded as a space, e.g. ?bloodGroup=O+ -> "O "
  if (/^\s*(A|B|O|AB) $/.test(v)) v = `${v.trim()}+`;
  v = v.trim();
  if (/^(A|B|O|AB)P$/.test(v)) v = `${v.slice(0, -1)}+`;
  if (/^(A|B|O|AB)N$/.test(v)) v = `${v.slice(0, -1)}-`;
  return BLOOD_GROUPS.includes(v) ? v : null;
};

/** "O+" / "Op" -> "Op" (key used inside Hospital.bloodInventory). */
const bloodGroupToKey = (value) => {
  if (BLOOD_KEYS.includes(value)) return value;
  const g = normalizeBloodGroup(value);
  return g ? g.replace('+', 'p').replace('-', 'n') : null;
};

const bloodKeyToLabel = (key) => key.replace(/p$/, '+').replace(/n$/, '-');

module.exports = {
  HttpError,
  sendError,
  isDbUnavailableError,
  isDbConnected,
  isValidObjectId,
  escapeRegex,
  missingFields,
  isNumeric,
  isValidLocation,
  normalizeLocation,
  toPositiveInt,
  todayISO,
  isValidISODate,
  isoDateFromToday,
  maskPhone,
  parsePagination,
  BLOOD_GROUPS,
  BLOOD_KEYS,
  normalizeBloodGroup,
  bloodGroupToKey,
  bloodKeyToLabel,
};

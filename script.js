/* ==========================================================================
   Afya kwa wote — Doctor Appointment Booking
   Vanilla JS: doctor data, search/filter, booking panel,
   localStorage-backed appointments and dashboard.
   ========================================================================== */

const APPT_KEY = "docbook_appointments";

const SPECIALTY_COLORS = {
  Cardiology: { bg: "#ffe1e1", fg: "#b23b3b" },
  Dermatology: { bg: "#f3e5ff", fg: "#7b4fa3" },
  Pediatrics: { bg: "#fff6d9", fg: "#a9790a" },
  Orthopedics: { bg: "#e3edff", fg: "#2c5aa0" },
  Neurology: { bg: "#e9e4ff", fg: "#5b3fae" },
  Dentistry: { bg: "#dcf7ee", fg: "#1f8f6b" },
  "General Medicine": { bg: "#dff0ff", fg: "#2c6298" },
  Gynecology: { bg: "#ffe3ee", fg: "#b23b74" },
};

const DOCTORS = [
  {
    id: "d1",
    name: "Dr. Amara Achieng",
    specialty: "Cardiology",
    hospital: "Nairobi General Hospital",
    location: "Nairobi CBD",
    fee: 3500,
    rating: 4.8,
    reviews: 124,
    availability: "today",
    bio: "Specialist in heart health and preventive cardiac care, focused on clear, calm explanations for every patient.",
  },
  {
    id: "d2",
    name: "Dr. Brian Otieno",
    specialty: "Dermatology",
    hospital: "Riverside Medical Center",
    location: "Westlands",
    fee: 2200,
    rating: 4.6,
    reviews: 89,
    availability: "few",
    bio: "Treats skin, hair, and nail conditions with a gentle, evidence-based approach.",
  },
  {
    id: "d3",
    name: "Dr. Grace Wanjiru",
    specialty: "Pediatrics",
    hospital: "Sunrise Family Clinic",
    location: "Kilimani",
    fee: 1500,
    rating: 4.9,
    reviews: 210,
    availability: "today",
    bio: "Warm, patient-first care for infants through teens, from check-ups to same-day illness visits.",
  },
  {
    id: "d4",
    name: "Dr. Samuel Kiptoo",
    specialty: "Orthopedics",
    hospital: "Lakeview Hospital",
    location: "Karen",
    fee: 3000,
    rating: 4.7,
    reviews: 95,
    availability: "week",
    bio: "Focuses on joint, bone, and sports injury recovery with a practical, movement-first philosophy.",
  },
  {
    id: "d5",
    name: "Dr. Fatima Noor",
    specialty: "Neurology",
    hospital: "St. Mary's Medical Center",
    location: "Parklands",
    fee: 4000,
    rating: 4.9,
    reviews: 67,
    availability: "few",
    bio: "Diagnoses and manages headaches, nerve conditions, and neurological disorders.",
  },
  {
    id: "d6",
    name: "Dr. James Mwangi",
    specialty: "Dentistry",
    hospital: "Bright Smile Dental Clinic",
    location: "Lavington",
    fee: 1800,
    rating: 4.5,
    reviews: 150,
    availability: "today",
    bio: "General and cosmetic dentistry, with a focus on making every visit anxiety-free.",
  },
  {
    id: "d7",
    name: "Dr. Linda Chebet",
    specialty: "General Medicine",
    hospital: "Nairobi General Hospital",
    location: "Nairobi CBD",
    fee: 1000,
    rating: 4.6,
    reviews: 180,
    availability: "today",
    bio: "Your first stop for everyday health concerns, check-ups, and referrals.",
  },
  {
    id: "d8",
    name: "Dr. Peter Njoroge",
    specialty: "Gynecology",
    hospital: "Riverside Medical Center",
    location: "Westlands",
    fee: 2500,
    rating: 4.8,
    reviews: 102,
    availability: "few",
    bio: "Comprehensive women's health care delivered with respect and discretion.",
  },
];

const BASE_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
];

const AVAILABILITY_LABELS = {
  today: { text: "Available today", cls: "badge-today" },
  few: { text: "Few slots left", cls: "badge-few" },
  week: { text: "Next available this week", cls: "badge-week" },
};
/* ---------------- helpers ---------------- */

// Returns up to 2 uppercase initials from a doctor's name, used for the
// avatar circle in place of a photo (e.g. "Dr. Amara Achieng" -> "AA").
function initials(name) {
  return name
    .replace("Dr.", "")
    .trim()
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function specialtyColor(specialty) {
  return SPECIALTY_COLORS[specialty] || { bg: "#e3edff", fg: "#2c5aa0" };
}

function starIcon() {
  return '<svg viewBox="0 0 20 20"><polygon points="10,1 12.6,7 19,7.6 14.2,11.9 15.6,18.2 10,14.9 4.4,18.2 5.8,11.9 1,7.6 7.4,7"/></svg>';
}

// Reads the saved appointments array from localStorage. This is what makes
// bookings made on doctors.html show up on booking.html: both pages read
// and write the same key, so data persists across page loads and page
// navigation without a backend.
function getAppointments() {
  try {
    return JSON.parse(localStorage.getItem(APPT_KEY) || "[]");
  } catch (e) {
    return [];
  }
}

// Writes the full appointments array back to localStorage.
function saveAppointments(list) {
  localStorage.setItem(APPT_KEY, JSON.stringify(list));
}

// Formats a fee as Kenyan Shillings, e.g. 3500 -> "KSh 3,500"
function fmtMoney(n) {
  return "KSh " + Number(n).toLocaleString("en-KE");
}

function next7Days() {
  const days = [];
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    days.push({
      iso,
      dow: i === 0 ? "Today" : dow[d.getDay()],
      dom: d.getDate(),
    });
  }
  return days;
}

function fmtDateLabel(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Slots for a given doctor + date, minus already-booked slots for that
 * doctor+date, and reduced in count for "few"/"week" availability doctors
 * to simulate scarcity.
 */
function getSlotsForDate(doctor, iso, dayIndex) {
  let pool = BASE_SLOTS.slice();

  if (doctor.availability === "few") {
    pool = pool.filter((_, i) => i % 3 === 0).slice(0, 5);
  } else if (doctor.availability === "week") {
    if (dayIndex < 2) return [];
    pool = pool.filter((_, i) => i % 2 === 0).slice(0, 6);
  }

  const booked = getAppointments()
    .filter((a) => a.doctorId === doctor.id && a.date === iso)
    .map((a) => a.time);

  return pool.filter((t) => !booked.includes(t));
}
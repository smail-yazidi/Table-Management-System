// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export const API_ENDPOINTS = {
  TUTORS: `${API_BASE_URL}/api/tutors`,
  TABLES: `${API_BASE_URL}/api/tables`,
  RESERVATIONS: `${API_BASE_URL}/api/reservations`,
  TABLES_WITH_RESERVATIONS: `${API_BASE_URL}/api/tables-with-reservations`,
}

export default API_BASE_URL

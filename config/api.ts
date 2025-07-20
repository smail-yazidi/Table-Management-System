
// config/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ""

export const API_ENDPOINTS = {
  TUTORS: `${API_BASE_URL}/api/tutors`,
  TABLES: `${API_BASE_URL}/api/tables`,
  RESERVATIONS: `${API_BASE_URL}/api/reservations`,
  TABLES_WITH_RESERVATIONS: `${API_BASE_URL}/api/tables-with-reservations`,
  DELETE_OLD_RESERVATIONS: `${API_BASE_URL}/api/delete-old-reservations`,
}

export default API_BASE_URL



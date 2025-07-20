"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Clock, User, Coffee } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { API_ENDPOINTS } from "./config/api"
import API_BASE_URL from "./config/api"
import DELETE_OLD_RESERVATIONS from "./config/api"
interface Table {
  _id: string
  tableNumber: number
  reservedTutor?: {
    _id: string
    firstName: string
    lastName: string
    image?: string
  } | null
}

const HomePage = () => {
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  const fetchTables = async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.TABLES_WITH_RESERVATIONS)
      setTables(res.data)
      setLoading(false)
    } catch (error) {
      console.error("Failed to fetch tables:", error)
      setLoading(false)
    }
  }
  useEffect(() => {
    fetchTables()
    const interval = setInterval(fetchTables, 10000) // every 10 seconds
    return () => clearInterval(interval)
  }, [])

  // Your existing useEffect for currentTime
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // New useEffect for deleting old reservations every 30 seconds

  useEffect(() => {
    const deleteOldReservations = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.DELETE_OLD_RESERVATIONS, {
          method: 'POST', // or 'DELETE' depending on your API
        });
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        console.log('Deleted old reservations:', data);
      } catch (err) {
        console.error('Error deleting old reservations:', err);
      }
    };

    deleteOldReservations(); // call immediately on mount

    const deleteInterval = setInterval(deleteOldReservations, 30000); // every 30 seconds

    return () => clearInterval(deleteInterval);
  }, []);
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-amber-800 text-lg font-medium">Loading tables...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen relative"
      style={{
        // backgroundImage: 'url("/floor.png")',
        backgroundColor: "#f4a261",
        backgroundRepeat: "repeat",
        backgroundSize: "200px 200px",
        backgroundPosition: "top left",
      }}
    >
      {/* Header */}
      <div className="relative z-10 bg-gradient-to-r from-amber-900/90 to-orange-900/90 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="text-center sm:text-left mb-4 sm:mb-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center justify-center sm:justify-start">
                <Coffee className="w-8 h-8 mr-3 text-amber-300" />
                Study Hall - Live View
              </h1>
              <p className="text-amber-100 mt-1">Real-time table availability</p>
            </div>
            <div className="text-center">
              <Badge className="bg-white/20 text-white border-white/30 px-4 py-2 text-sm">
                <Clock className="w-4 h-4 mr-2" />
                {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tables.map((table) => {
            const isReserved = Boolean(table.reservedTutor)

            return (
              <Card
                key={table._id}
                className={`relative overflow-hidden transition-all duration-300 ${isReserved
                  ? "bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-red-200/50"
                  : "bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-green-200/50"
                  } shadow-lg`}
              >
                <div className="relative h-64 sm:h-72">
                  {/* Table Image */}
                  <div
                    className="absolute inset-0 bg-center bg-no-repeat bg-contain"
                    style={{
                      backgroundImage: 'url("/image.png")',
                      backgroundSize: "80%",
                      backgroundPosition: "center",
                    }}
                  />

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <Badge
                      className={`${isReserved ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
                        } text-white shadow-lg`}
                    >
                      {isReserved ? "Reserved" : "Available"}
                    </Badge>
                  </div>

                  {/* Table Number */}
                  <div className="absolute bottom-3 left-3">
                    <Badge variant="outline" className="bg-white/90 text-gray-800 font-bold text-lg px-3 py-1">
                      Table {table.tableNumber}
                    </Badge>
                  </div>

                  {/* Tutor Information */}
                  {isReserved && table.reservedTutor && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                      <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200">
                        {/* Tutor Avatar */}
                        <div className="mb-3">
                          {table.reservedTutor.image ? (
                            <img
                              src={`${API_BASE_URL}${table.reservedTutor.image}`}
                              alt={`${table.reservedTutor.firstName} ${table.reservedTutor.lastName}`}
                              className="w-12 h-12 rounded-full mx-auto border-2 border-amber-300 shadow-md"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full mx-auto bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center border-2 border-amber-300 shadow-md">
                              <User className="w-6 h-6 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Tutor Name */}
                        <div className="text-sm font-semibold text-gray-800 animate-pulse">
                          {table.reservedTutor.firstName} {table.reservedTutor.lastName}
                        </div>

                        {/* Study Session Indicator */}
                        <div className="text-xs text-gray-600 mt-1 flex items-center justify-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                          In Session
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Available Table Animation */}
                  {!isReserved && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="bg-green-500/90 backdrop-blur-sm rounded-full p-4 shadow-lg animate-pulse">
                        <Coffee className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Table Footer */}
                <div className={`p-3 ${isReserved ? "bg-red-100" : "bg-green-100"}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Table {table.tableNumber}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${isReserved ? "bg-red-200 text-red-800" : "bg-green-200 text-green-800"
                        }`}
                    >
                      {isReserved ? "Occupied" : "Free"}
                    </span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Summary Stats - View Only */}
        <div className="mt-12 bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">📊 Current Status</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{tables.length}</div>
              <div className="text-sm text-gray-600">Total Tables</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{tables.filter((t) => t.reservedTutor).length}</div>
              <div className="text-sm text-gray-600">Reserved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{tables.filter((t) => !t.reservedTutor).length}</div>
              <div className="text-sm text-gray-600">Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((tables.filter((t) => t.reservedTutor).length / tables.length) * 100) || 0}%
              </div>
              <div className="text-sm text-gray-600">Occupancy</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes moveText {
          0% { transform: translateY(0); }
          100% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  )
}

export default HomePage


"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  User,
  Clock,
  CheckCircle,
  Home,
  TableIcon,
  Search,
  Calendar,
  Star,
  Sparkles,
  Coffee,
  BookOpen, BookOpenText
} from "lucide-react"
import axios from "axios"
import { API_ENDPOINTS } from "../config/api"

type Step = "welcome" | "name-input" | "loading" | "existing-reservation" | "table-selection" | "success"

interface Tutor {
  _id: string
  firstName: string
  lastName: string
  image?: string
}

interface Table {
  _id: string
  tableNumber: number
}

// --- CORRECTED Reservation interface ---
interface Reservation {
  _id: string
  // Changed 'table' to 'tableId' to match your backend response
  // Assuming tableId is always populated to an object with _id and tableNumber
  tableId: { _id: string; tableNumber: number } | null
  // tutorId is also an object based on your latest debug logs
  tutorId: { _id: string; firstName: string; lastName: string; image?: string } | null
  datetime: string
}

export default function TutorPage() {
  const [currentStep, setCurrentStep] = useState<Step>("welcome")
  const [fullName, setFullName] = useState("")
  const [tutor, setTutor] = useState<Tutor | null>(null)
  const [existingReservation, setExistingReservation] = useState<Reservation | null>(null)
  const [availableTables, setAvailableTables] = useState<Table[]>([])
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const currentTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  useEffect(() => {
    if (currentStep === "welcome") {
      const timer = setTimeout(() => setCurrentStep("name-input"), 3000)
      return () => clearTimeout(timer)
    }
  }, [currentStep])


  const findTutorByName = async (fullName: string): Promise<Tutor | null> => {
    try {
      const response = await axios.get(API_ENDPOINTS.TUTORS);
      const tutors = response.data;

      const nameParts = fullName.toLowerCase().split(" ").filter(Boolean);
      if (nameParts.length !== 2) {
        setError("Please enter exactly two names (first and last).");
        return null;
      }

      const [name1, name2] = nameParts;

      const foundTutor = tutors.find((tutor: Tutor) => {
        if (typeof tutor.firstName !== "string" || typeof tutor.lastName !== "string") {
          return false;
        }

        const first = tutor.firstName.toLowerCase();
        const last = tutor.lastName.toLowerCase();

        return (
          (first === name1 && last === name2) ||
          (first === name2 && last === name1)
        );
      });

      if (!foundTutor) {
        setError("Tutor not found. Please check you typed the correct full name.");
      }

      return foundTutor || null;
    } catch (error) {
      console.error("Error finding tutor:", error);
      setError("Failed to connect to tutor database. Please try again.");
      return null;
    }
  };


  const checkExistingReservation = async (tutorId: string): Promise<Reservation | null> => {
    try {
      console.log(`DEBUG: checkExistingReservation called for tutorId: ${tutorId}`);
      const response = await axios.get(API_ENDPOINTS.RESERVATIONS);
      const reservations: Reservation[] = response.data; // Explicitly type the response data

      console.log("DEBUG: All reservations fetched:", reservations);

      const existingReservation = reservations.find((r: Reservation, index) => {
        console.log(`DEBUG: Checking reservation ${index}:`, r);

        // Access r.tutorId directly as per your backend response
        if (r.tutorId && typeof r.tutorId === 'object' && '_id' in r.tutorId) {
          const currentReservationTutorId = r.tutorId._id;
          console.log(`DEBUG: Reservation ${index} tutor ID (from tutorId object): ${currentReservationTutorId}`);
          const isMatch = currentReservationTutorId === tutorId;
          console.log(`DEBUG: Comparing ${currentReservationTutorId} === ${tutorId} ? Result: ${isMatch}`);
          return isMatch;
        } else {
          console.log(`DEBUG: Reservation ${index} has no valid 'tutorId' object or it's not populated correctly.`);
          return false;
        }
      });

      console.log("DEBUG: Result of find (existingReservation):", existingReservation);
      return existingReservation || null;
    } catch (error) {
      console.error("Error checking reservations:", error);
      setError("Failed to check for existing reservation.");
      return null;
    }
  };

  const getAvailableTables = async (): Promise<Table[]> => {
    try {
      const [tablesResponse, reservationsResponse] = await Promise.all([
        axios.get(API_ENDPOINTS.TABLES),
        axios.get(API_ENDPOINTS.RESERVATIONS),
      ])

      const allTables: Table[] = tablesResponse.data
      const allReservations: Reservation[] = reservationsResponse.data

      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

      const reservedTableIds = allReservations
        .filter((r: Reservation) => {
          if (!r.datetime || !r.tableId) return false // Changed r.table to r.tableId
          const resTime = new Date(r.datetime)
          // Filter out tables that are currently reserved (within the last hour)
          // or are about to start in the next hour.
          return resTime > oneHourAgo && resTime < new Date(now.getTime() + 60 * 60 * 1000)
        })
        .map((r: Reservation) => r.tableId?._id) // Access _id from tableId object
        .filter(Boolean) as string[]; // Filter out any null/undefined and assert as string array

      // Return only tables that are NOT in the reservedTableIds list
      return allTables.filter((table: Table) => !reservedTableIds.includes(table._id))
    } catch (error) {
      console.error("Error getting available tables:", error)
      setError("Failed to fetch available tables.");
      return []
    }
  }

  const makeReservation = async (tutorId: string, tableId: string): Promise<boolean> => {
    try {
      const now = new Date();
      const datetimeISO = now.toISOString();

      console.log("Attempting to make reservation with:", {
        tableId,
        tutorId,
        datetime: datetimeISO,
      });

      const response = await axios.post(API_ENDPOINTS.RESERVATIONS, {
        tableId,
        tutorId,
        datetime: datetimeISO,
      });

      console.log("Reservation successful:", response.data);
      return true;
    } catch (error: any) {
      console.error("Error making reservation:", error);
      const serverErrorMessage = error.response?.data?.error || "Failed to make reservation. Please try again.";
      setError(serverErrorMessage);
      return false;
    }
  };

  const handleNameSubmit = async () => {
    if (!fullName.trim()) {
      setError("Please enter your full name")
      return
    }

    setLoading(true)
    setError("")
    setCurrentStep("loading")

    try {
      const foundTutor = await findTutorByName(fullName.trim())

      if (!foundTutor) {
        // Error message already set by findTutorByName
        setCurrentStep("name-input")
        return
      }

      setTutor(foundTutor)

      const reservation = await checkExistingReservation(foundTutor._id)

      if (reservation) {
        // If tutor has ANY reservation, go directly to existing-reservation step
        setExistingReservation(reservation)
        setCurrentStep("existing-reservation")
      } else {
        // Only if no existing reservation, fetch and display *only* available tables
        const tables = await getAvailableTables() // This now returns only available tables
        setAvailableTables(tables)
        setCurrentStep("table-selection")
      }
    } catch (err) {
      console.error("Error in handleNameSubmit flow:", err);
      setError("An unexpected error occurred during check-in. Please try again.");
      setCurrentStep("name-input");
    } finally {
      setLoading(false)
    }
  }

  const handleTableSelection = async (table: Table) => {
    if (!tutor || !table) {
      setError("Tutor or selected table is missing.");
      return;
    }

    setLoading(true);
    setSelectedTable(table);
    setError("");

    try {
      const success = await makeReservation(tutor._id, table._id);
      if (success) {
        setCurrentStep("success");
      } else {
        // Error is already set by makeReservation
      }
    } catch (err) {
      console.error("Error in handleTableSelection flow:", err);
      setError("An unexpected error occurred during table selection. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const goHome = () => {
    window.location.href = "/"
  }

  const resetFlow = () => {
    setCurrentStep("name-input")
    setFullName("")
    setTutor(null)
    setExistingReservation(null)
    setAvailableTables([])
    setSelectedTable(null)
    setError("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-2 sm:p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-4 -left-4 w-32 sm:w-72 h-32 sm:h-72 bg-white opacity-10 rounded-full animate-pulse"></div>
        <div className="absolute top-1/4 right-1/4 w-16 sm:w-32 h-16 sm:h-32 bg-yellow-300 opacity-20 rounded-full animate-bounce"></div>
        <div className="absolute bottom-1/4 left-1/4 w-24 sm:w-48 h-24 sm:h-48 bg-blue-300 opacity-15 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 right-1/3 w-12 sm:w-24 h-12 sm:h-24 bg-green-300 opacity-25 rounded-full animate-bounce delay-500"></div>
      </div>

      <div className="w-full max-w-sm sm:max-w-md relative z-10">
        {/* Use a switch-like structure for exclusive rendering */}
        {currentStep === "welcome" && (
          <Card className="text-center border-0 shadow-2xl bg-gradient-to-br from-white to-blue-50 animate-fade-in">
            <CardHeader className="pb-6 sm:pb-8">
              <div className="mx-auto w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center mb-4 sm:mb-6 animate-bounce shadow-lg">
                <Sparkles className="w-8 sm:w-10 h-8 sm:h-10 text-white animate-pulse" />
              </div>
              <CardTitle className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
                Hello Tutor! 👋
              </CardTitle>
              <CardDescription className="text-base sm:text-lg text-gray-600 mt-2">
                Welcome to the reservation system ✨
              </CardDescription>
              <div className="flex justify-center space-x-2 mt-4">
                <BookOpenText className="w-5 sm:w-6 h-5 sm:h-6 text-amber-500 animate-bounce" />
                <BookOpen className="w-5 sm:w-6 h-5 sm:h-6 text-green-500 animate-bounce delay-200" />
                <Star className="w-5 sm:w-6 h-5 sm:h-6 text-yellow-500 animate-bounce delay-400" />
              </div>
            </CardHeader>
          </Card>
        )}

        {currentStep === "loading" && (
          <Card className="text-center border-0 shadow-2xl bg-gradient-to-br from-white to-indigo-50">
            <CardHeader className="pb-6 sm:pb-8">
              <div className="mx-auto w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-full flex items-center justify-center mb-4 sm:mb-6 animate-spin shadow-lg">
                <Search className="w-8 sm:w-10 h-8 sm:h-10 text-white" />
              </div>
              <CardTitle className="text-xl sm:text-2xl font-bold text-indigo-600 animate-pulse">
                Checking your information...
              </CardTitle>
              <CardDescription className="text-gray-600">Please wait a moment</CardDescription>
            </CardHeader>
          </Card>
        )}

        {currentStep === "name-input" && (
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-green-50 animate-slide-up">
            <CardHeader className="pb-4">
              <div className="mx-auto w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mb-3 sm:mb-4 animate-pulse shadow-lg">
                <User className="w-6 sm:w-8 h-6 sm:h-8 text-white" />
              </div>
              <CardTitle className="text-center text-lg sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Enter Your Full Name
              </CardTitle>
              <CardDescription className="text-center text-sm sm:text-base text-gray-600">
                Please type your first and last name to check in 📝
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleNameSubmit()}
                  className="text-center text-base sm:text-lg py-4 sm:py-6 border-2 border-green-200 focus:border-green-400 rounded-xl shadow-lg bg-gradient-to-r from-white to-green-50"
                  disabled={loading}
                />
                <Search className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-green-400" />
              </div>
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50 animate-shake">
                  <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
                </Alert>
              )}
              <Button
                onClick={handleNameSubmit}
                className="w-full py-4 sm:py-6 text-base sm:text-lg font-semibold bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
                disabled={loading || !fullName.trim()}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 sm:h-5 w-4 sm:w-5 border-b-2 border-white mr-2"></div>
                    Checking...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Search className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                    Check In
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === "existing-reservation" && tutor && existingReservation && (
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-orange-50 animate-slide-up">
            <CardHeader className="pb-4">
              <div className="mx-auto w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mb-4 sm:mb-6 animate-pulse shadow-lg">
                <Clock className="w-8 sm:w-10 h-8 sm:h-10 text-white" />
              </div>
              <CardTitle className="text-center text-lg sm:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Hello {tutor.firstName}! 👋
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 text-center">
              <Alert className="border-orange-200 bg-gradient-to-r from-orange-50 to-red-50 animate-pulse">
                <Clock className="h-4 sm:h-5 w-4 sm:w-5 text-orange-600" />
                <AlertDescription className="text-orange-800 font-medium text-sm sm:text-base">
                  Tutor already has a reservation around this time 🎯
                </AlertDescription>
              </Alert>

              <div className="space-y-2 sm:space-y-3">
                <Badge
                  variant="outline"
                  className="text-xs sm:text-sm py-1 sm:py-2 px-2 sm:px-4 bg-gradient-to-r from-blue-100 to-purple-100 border-blue-300"
                >
                  <Clock className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                  Current Time: {currentTime}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-xs sm:text-sm py-1 sm:py-2 px-2 sm:px-4 bg-gradient-to-r from-green-100 to-blue-100 border-green-300"
                >
                  <TableIcon className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                  Your Table: {
                    // --- CORRECTED ACCESS HERE ---
                    existingReservation.tableId && typeof existingReservation.tableId === 'object'
                      ? existingReservation.tableId.tableNumber
                      : 'N/A' // Fallback if tableId is null or not an object
                  }
                </Badge>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  onClick={goHome}
                  className="flex-1 py-4 sm:py-6 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  <Home className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                  Go to Live View
                </Button>
                <Button
                  variant="outline"
                  onClick={resetFlow}
                  className="flex-1 py-4 sm:py-6 border-2 border-purple-300 text-purple-600 hover:bg-purple-50 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 bg-transparent"
                >
                  <Search className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                  Check Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === "table-selection" && tutor && (
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-purple-50 animate-slide-up">
            <CardHeader className="pb-4">
              <div className="mx-auto w-12 sm:w-16 h-12 sm:h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mb-3 sm:mb-4 animate-bounce shadow-lg">
                <TableIcon className="w-6 sm:w-8 h-6 sm:h-8 text-white" />
              </div>
              <CardTitle className="text-center text-lg sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Hello {tutor.firstName}! 🌟
              </CardTitle>
              <CardDescription className="text-center text-sm sm:text-base text-gray-600">
                Choose an available table for your study session ✨
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="text-center">
                <Badge
                  variant="outline"
                  className="py-1 sm:py-2 px-2 sm:px-4 bg-gradient-to-r from-blue-100 to-purple-100 border-blue-300 text-xs sm:text-sm"
                >
                  <Calendar className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                  Current Time: {currentTime}
                </Badge>
              </div>

              {availableTables.length === 0 ? (
                <Alert className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
                  <Clock className="h-4 sm:h-5 w-4 sm:w-5 text-yellow-600" />
                  <AlertDescription className="text-yellow-800 text-sm sm:text-base">
                    No tables are available at this time. Please try again later. ⏰
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  {availableTables.map((table, index) => (
                    <Button
                      key={table._id}
                      onClick={() => handleTableSelection(table)}
                      disabled={loading}
                      variant="outline"
                      className={`h-16 sm:h-24 flex flex-col items-center justify-center border-2 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 bg-gradient-to-br from-white to-green-50 hover:from-green-100 hover:to-blue-100 border-green-300 hover:border-green-400 animate-fade-in text-xs sm:text-base`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <TableIcon className="w-5 sm:w-8 h-5 sm:h-8 mb-1 sm:mb-2 text-green-600" />
                      <span className="font-semibold text-green-700">
                        Table {table.tableNumber}
                      </span>
                    </Button>
                  ))}
                </div>
              )}

              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50 animate-shake">
                  <AlertDescription className="text-red-700 text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                variant="ghost"
                onClick={resetFlow}
                className="w-full py-3 sm:py-4 text-purple-600 hover:bg-purple-100 rounded-xl transform hover:scale-105 transition-all duration-200 text-sm sm:text-base"
              >
                <User className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                Back to Name Input
              </Button>
            </CardContent>
          </Card>
        )}

        {currentStep === "success" && tutor && selectedTable && (
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-green-50 animate-bounce-in">
            <CardHeader className="pb-4">
              <div className="mx-auto w-16 sm:w-20 h-16 sm:h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mb-4 sm:mb-6 animate-pulse shadow-lg">
                <CheckCircle className="w-10 sm:w-12 h-10 sm:h-12 text-white" />
              </div>
              <CardTitle className="text-center text-xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Reservation Successful! 🎉
              </CardTitle>
              <CardDescription className="text-center text-gray-600 text-base sm:text-lg">
                Your table has been reserved ✅
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 text-center">
              <div className="space-y-3 sm:space-y-4">
                <p className="text-lg sm:text-xl font-semibold text-gray-800">
                  Hello {tutor.firstName} {tutor.lastName}! 👋
                </p>
                <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-3">
                  <Badge className="bg-gradient-to-r from-green-500 to-blue-500 text-white py-1 sm:py-2 px-2 sm:px-4 text-xs sm:text-sm">
                    <TableIcon className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                    Table {selectedTable.tableNumber} Reserved
                  </Badge>
                  <Badge
                    variant="outline"
                    className="py-1 sm:py-2 px-2 sm:px-4 bg-gradient-to-r from-blue-100 to-purple-100 border-blue-300 text-xs sm:text-sm"
                  >
                    <Clock className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                    Time: {currentTime}
                  </Badge>
                </div>
              </div>

              <Alert className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200 animate-pulse">
                <CheckCircle className="h-4 sm:h-5 w-4 sm:w-5 text-green-600" />
                <AlertDescription className="text-green-800 font-medium text-sm sm:text-base">
                  Your reservation is confirmed! Please proceed to your table and start studying. 📚
                </AlertDescription>
              </Alert>

              <Button
                onClick={goHome}
                className="w-full py-4 sm:py-6 text-base sm:text-lg font-semibold bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <Home className="w-5 sm:w-6 h-5 sm:h-6 mr-2" />
                View Live Status
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes bounce-in {
          0% { opacity: 0; transform: scale(0.3); }
          50% { opacity: 1; transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
          20%, 40%, 60%, 80% { transform: translateX(10px); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.8s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}


"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  TableIcon,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
  Plus,
  Trash2,
  Edit,
} from "lucide-react"
import axios from "axios"
import { API_ENDPOINTS } from "./config/api"
import API_BASE_URL from "./config/api"

interface DashboardStats {
  totalTutors: number
  totalTables: number
  activeReservations: number
  availableTables: number
  todayReservations: number
  thisHourReservations: number
}

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

interface Reservation {
  _id: string
  table: { _id: string; tableNumber: number }
  tutor: { _id: string; firstName: string; lastName: string; image?: string }
  datetime: string
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTutors: 0,
    totalTables: 0,
    activeReservations: 0,
    availableTables: 0,
    todayReservations: 0,
    thisHourReservations: 0,
  })
  const [tutors, setTutors] = useState<Tutor[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [recentReservations, setRecentReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)

  // Tutor Management States
  const [newTutor, setNewTutor] = useState({ firstName: "", lastName: "" })
  const [newTutorImage, setNewTutorImage] = useState<File | null>(null)
  const [editingTutor, setEditingTutor] = useState<Tutor | null>(null)
  const [editingTutorData, setEditingTutorData] = useState({ firstName: "", lastName: "" })
  const [editingTutorImage, setEditingTutorImage] = useState<File | null>(null)

  // Table Management States
  const [newTableNumber, setNewTableNumber] = useState("")

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const [tutorsRes, tablesRes, reservationsRes] = await Promise.all([
        axios.get(API_ENDPOINTS.TUTORS),
        axios.get(API_ENDPOINTS.TABLES),
        axios.get(API_ENDPOINTS.RESERVATIONS),
      ])

      const tutorsData = tutorsRes.data
      const tablesData = tablesRes.data
      const reservations = reservationsRes.data

      setTutors(tutorsData)
      setTables(tablesData)

      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const currentHour = now.getHours()

      const activeReservations = reservations.filter((r: Reservation) => {
        const resTime = new Date(r.datetime)
        const oneHourLater = new Date(resTime.getTime() + 60 * 60 * 1000)
        return now >= resTime && now <= oneHourLater
      }).length

      const todayReservations = reservations.filter((r: Reservation) => {
        const resTime = new Date(r.datetime)
        return resTime >= today
      }).length

      const thisHourReservations = reservations.filter((r: Reservation) => {
        const resTime = new Date(r.datetime)
        return (
          resTime.getDate() === now.getDate() &&
          resTime.getMonth() === now.getMonth() &&
          resTime.getFullYear() === now.getFullYear() &&
          resTime.getHours() === currentHour
        )
      }).length

      setStats({
        totalTutors: tutorsData.length,
        totalTables: tablesData.length,
        activeReservations,
        availableTables: tablesData.length - activeReservations,
        todayReservations,
        thisHourReservations,
      })

      const sortedReservations = reservations
        .sort((a: Reservation, b: Reservation) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())
        .slice(0, 10)

      setRecentReservations(sortedReservations)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Tutor Management Functions
  const addTutor = async () => {
    try {
      const formData = new FormData();
      formData.append("firstName", newTutor.firstName);
      formData.append("lastName", newTutor.lastName);
      if (newTutorImage) {
        formData.append("image", newTutorImage);
      }

      await axios.post(API_ENDPOINTS.TUTORS, formData);


      setNewTutor({ firstName: "", lastName: "" })
      setNewTutorImage(null)
      fetchDashboardData()
    } catch (error) {
      console.error("Error adding tutor:", error)
    }
  }

  const updateTutor = async () => {
    if (!editingTutor) return

    try {
      const formData = new FormData()
      formData.append("firstName", editingTutorData.firstName)
      formData.append("lastName", editingTutorData.lastName)
      if (editingTutorImage) formData.append("image", editingTutorImage)

      await axios.put(`${API_ENDPOINTS.TUTORS}/${editingTutor._id}`, formData)
      setEditingTutor(null)
      setEditingTutorData({ firstName: "", lastName: "" })
      setEditingTutorImage(null)
      fetchDashboardData()
    } catch (error) {
      console.error("Error updating tutor:", error)
    }
  }

  const deleteTutor = async (id: string) => {
    if (confirm("Are you sure you want to delete this tutor?")) {
      try {
        await axios.delete(`${API_ENDPOINTS.TUTORS}/${id}`)
        fetchDashboardData()
      } catch (error) {
        console.error("Error deleting tutor:", error)
      }
    }
  }

  const startEditTutor = (tutor: Tutor) => {
    setEditingTutor(tutor)
    setEditingTutorData({ firstName: tutor.firstName, lastName: tutor.lastName })
  }

  // Table Management Functions
  const addTable = async () => {
    try {
      await axios.post(API_ENDPOINTS.TABLES, {
        tableNumber: Number.parseInt(newTableNumber),
      })
      setNewTableNumber("")
      fetchDashboardData()
    } catch (error) {
      console.error("Error adding table:", error)
    }
  }

  const deleteTable = async (id: string) => {
    if (confirm("Are you sure you want to delete this table?")) {
      try {
        await axios.delete(`${API_ENDPOINTS.TABLES}/${id}`)
        fetchDashboardData()
      } catch (error) {
        console.error("Error deleting table:", error)
      }
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            🛠️ Admin Dashboard
          </h1>
          <p className="text-gray-600">Manage tables, tutors, and monitor system activity</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-6 h-6" />
                <div>
                  <p className="text-xs opacity-90">Total Tutors</p>
                  <p className="text-xl font-bold">{stats.totalTutors}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TableIcon className="w-6 h-6" />
                <div>
                  <p className="text-xs opacity-90">Total Tables</p>
                  <p className="text-xl font-bold">{stats.totalTables}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-6 h-6" />
                <div>
                  <p className="text-xs opacity-90">Active Now</p>
                  <p className="text-xl font-bold">{stats.activeReservations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-6 h-6" />
                <div>
                  <p className="text-xs opacity-90">Available</p>
                  <p className="text-xl font-bold">{stats.availableTables}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-6 h-6" />
                <div>
                  <p className="text-xs opacity-90">Today</p>
                  <p className="text-xl font-bold">{stats.todayReservations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-6 h-6" />
                <div>
                  <p className="text-xs opacity-90">This Hour</p>
                  <p className="text-xl font-bold">{stats.thisHourReservations}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="tutors" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tutors">👨‍🏫 Manage Tutors</TabsTrigger>
            <TabsTrigger value="tables">🪑 Manage Tables</TabsTrigger>
            <TabsTrigger value="activity">📊 Recent Activity</TabsTrigger>
          </TabsList>

          {/* Tutors Management */}
          <TabsContent value="tutors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-blue-600">
                  <Plus className="w-5 h-5" />
                  <span>Add New Tutor</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Input
                    placeholder="First Name"
                    value={newTutor.firstName}
                    onChange={(e) => setNewTutor({ ...newTutor, firstName: e.target.value })}
                  />
                  <Input
                    placeholder="Last Name"
                    value={newTutor.lastName}
                    onChange={(e) => setNewTutor({ ...newTutor, lastName: e.target.value })}
                  />
                  <Input type="file" accept="image/*" onChange={(e) => setNewTutorImage(e.target.files?.[0] || null)} />
                  <Button
                    onClick={addTutor}
                    disabled={!newTutor.firstName || !newTutor.lastName}
                    className="bg-gradient-to-r from-blue-500 to-blue-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Tutor
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-purple-600">All Tutors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tutors.map((tutor) => (
                    <Card key={tutor._id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-3">

                          {tutor ? (
                            <div className="flex items-center space-x-3 mb-3">
                              {tutor.image ? (
                                <img
                                  src={`${API_BASE_URL}${tutor.image}`}
                                  alt={`${tutor.firstName} ${tutor.lastName}`}
                                  className="w-12 h-12 rounded-full"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                                  <Users className="w-6 h-6 text-white" />
                                </div>
                              )}
                              <div>
                                <p className="font-semibold">
                                  {tutor.firstName} {tutor.lastName}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center">
                                <Users className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-500 italic">No tutor assigned</p>
                              </div>
                            </div>
                          )}
                          <div>
                            <p className="font-semibold">
                              {tutor.firstName} {tutor.lastName}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => startEditTutor(tutor)} className="flex-1">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteTutor(tutor._id)}
                            className="flex-1"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tables Management */}
          <TabsContent value="tables" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-600">
                  <Plus className="w-5 h-5" />
                  <span>Add New Table</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4">
                  <Input
                    type="number"
                    placeholder="Table Number"
                    value={newTableNumber}
                    onChange={(e) => setNewTableNumber(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={addTable}
                    disabled={!newTableNumber}
                    className="bg-gradient-to-r from-green-500 to-green-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Table
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">All Tables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {tables.map((table) => (
                    <Card key={table._id} className="border border-gray-200">
                      <CardContent className="p-4 text-center">
                        <TableIcon className="w-8 h-8 mx-auto mb-2 text-green-600" />
                        <p className="font-semibold mb-3">Table {table.tableNumber}</p>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteTable(table._id)}
                          className="w-full"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Activity */}
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-purple-600">
                  <Calendar className="w-5 h-5" />
                  <span>Recent Reservations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {recentReservations.length === 0 ? (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>No recent reservations found.</AlertDescription>
                    </Alert>
                  ) : (
                    recentReservations.map((reservation) => (
                      <div
                        key={reservation._id}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100"
                      >
                        <div className="flex items-center space-x-3">
                          {reservation.tutor.image ? (
                            <img
                              src={`${API_BASE_URL}${reservation.tutor.image}`}
                              alt={`${reservation.tutor.firstName} ${reservation.tutor.lastName}`}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                              <Users className="w-5 h-5 text-white" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">
                              {reservation.tutor.firstName} {reservation.tutor.lastName}
                            </p>
                            <p className="text-sm text-gray-500">Table {reservation.table.tableNumber}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatTime(reservation.datetime)}</p>
                          <p className="text-xs text-gray-500">{formatDate(reservation.datetime)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Tutor Modal */}
        {editingTutor && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Edit Tutor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="First Name"
                  value={editingTutorData.firstName}
                  onChange={(e) => setEditingTutorData({ ...editingTutorData, firstName: e.target.value })}
                />
                <Input
                  placeholder="Last Name"
                  value={editingTutorData.lastName}
                  onChange={(e) => setEditingTutorData({ ...editingTutorData, lastName: e.target.value })}
                />
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEditingTutorImage(e.target.files?.[0] || null)}
                />
                <div className="flex space-x-2">
                  <Button onClick={updateTutor} className="flex-1">
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingTutor(null)
                      setEditingTutorData({ firstName: "", lastName: "" })
                      setEditingTutorImage(null)
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Refresh Button */}
        <div className="text-center">
          <Button
            onClick={fetchDashboardData}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Refreshing...
              </div>
            ) : (
              <div className="flex items-center">
                <Activity className="w-4 h-4 mr-2" />
                Refresh Data
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

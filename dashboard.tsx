
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card" // CardDescription added here
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
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
  Loader2,
  Image as ImageIcon,
} from "lucide-react"
import axios from "axios"
import { API_ENDPOINTS } from "./config/api"
// API_BASE_URL is not needed for Vercel Blob URLs directly in <img> src

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
  image?: string | null
  createdAt?: string;
  updatedAt?: string;
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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loadingAddTutor, setLoadingAddTutor] = useState(false);
  const [addTutorError, setAddTutorError] = useState<string | null>(null);
  const [addTutorSuccess, setAddTutorSuccess] = useState<string | null>(null);

  const [editingTutor, setEditingTutor] = useState<Tutor | null>(null)
  const [editingTutorData, setEditingTutorData] = useState({ firstName: "", lastName: "" })
  const [editingTutorImage, setEditingTutorImage] = useState<File | null>(null)
  const [editingImagePreview, setEditingImagePreview] = useState<string | null>(null);
  const [loadingUpdateTutor, setLoadingUpdateTutor] = useState(false);
  const [updateTutorError, setUpdateTutorError] = useState<string | null>(null);
  const [updateTutorSuccess, setUpdateTutorSuccess] = useState<string | null>(null);


  // Table Management States
  const [newTableNumber, setNewTableNumber] = useState("")
  const [loadingAddTable, setLoadingAddTable] = useState(false);
  const [addTableError, setAddTableError] = useState<string | null>(null);
  const [addTableSuccess, setAddTableSuccess] = useState<string | null>(null);


  useEffect(() => {
    fetchDashboardData()
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
      // Potentially set a global error state here
    } finally {
      setLoading(false)
    }
  }

  // Handle file input change for new tutor image
  const handleNewTutorImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewTutorImage(file);
      setImagePreview(URL.createObjectURL(file)); // Create a URL for image preview
      setAddTutorError(null); // Clear previous errors
      setAddTutorSuccess(null); // Clear previous success messages
    } else {
      setNewTutorImage(null);
      setImagePreview(null);
    }
  };

  // Tutor Management Functions
  const addTutor = async () => {
    setLoadingAddTutor(true);
    setAddTutorError(null);
    setAddTutorSuccess(null);

    if (!newTutor.firstName.trim() || !newTutor.lastName.trim()) {
      setAddTutorError("First Name and Last Name are required.");
      setLoadingAddTutor(false);
      return;
    }

    let imageUrl: string | null = null;

    // Phase 1: Upload image to Vercel Blob if a file is selected
    if (newTutorImage) {
      try {
        const formData = new FormData();
        formData.append('file', newTutorImage);

        console.log("Client: Uploading image for new tutor to Vercel Blob...");
        const uploadResponse = await axios.post('/api/upload-tutor-image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        imageUrl = uploadResponse.data.url;
        console.log("Client: New tutor image uploaded successfully. URL:", imageUrl);
      } catch (uploadError: any) {
        console.error("Client: Error uploading new tutor image to Vercel Blob:", uploadError);
        setAddTutorError(uploadError.response?.data?.error || "Failed to upload image.");
        setLoadingAddTutor(false);
        return; // Stop the process if image upload fails
      }
    }

    // Phase 2: Save tutor data (including image URL) to MongoDB
    try {
      const payload = {
        firstName: newTutor.firstName.trim(),
        lastName: newTutor.lastName.trim(),
        image: imageUrl, // This will be the Vercel Blob URL or null
      };

      console.log("Client: Saving new tutor data to MongoDB:", payload);
      const response = await axios.post(API_ENDPOINTS.TUTORS, payload, {
        headers: { "Content-Type": "application/json" },
      });

      setAddTutorSuccess(`Tutor ${response.data.firstName} ${response.data.lastName} added successfully!`);
      setNewTutor({ firstName: "", lastName: "" }); // Clear form
      setNewTutorImage(null); // Clear selected file
      setImagePreview(null); // Clear image preview
      fetchDashboardData(); // Refresh the list of tutors
    } catch (error: any) {
      console.error("Client: Error adding tutor to MongoDB:", error);
      setAddTutorError(error.response?.data?.error || "Failed to add tutor to database.");
    } finally {
      setLoadingAddTutor(false);
    }
  };

  // Handle file input change for editing tutor image
  const handleEditingTutorImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditingTutorImage(file);
      setEditingImagePreview(URL.createObjectURL(file)); // Create a URL for preview
      setUpdateTutorError(null);
      setUpdateTutorSuccess(null);
    } else {
      setEditingTutorImage(null);
      setEditingImagePreview(editingTutor?.image || null); // Revert to current image if no new file
    }
  };


  const updateTutor = async () => {
    if (!editingTutor) return

    setLoadingUpdateTutor(true);
    setUpdateTutorError(null);
    setUpdateTutorSuccess(null);

    let updatedImageUrl: string | null = editingTutor.image || null; // Start with current image URL

    // Phase 1: Upload new image to Vercel Blob if a new file is selected
    if (editingTutorImage) {
      try {
        const formData = new FormData();
        formData.append('file', editingTutorImage);

        console.log("Client: Uploading new image for existing tutor to Vercel Blob...");
        const uploadResponse = await axios.post('/api/upload-tutor-image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        updatedImageUrl = uploadResponse.data.url;
        console.log("Client: New image uploaded successfully. URL:", updatedImageUrl);
      } catch (uploadError: any) {
        console.error("Client: Error uploading new image for existing tutor to Vercel Blob:", uploadError);
        setUpdateTutorError(uploadError.response?.data?.error || "Failed to upload new image.");
        setLoadingUpdateTutor(false);
        return; // Stop the process if image upload fails
      }
    }

    // Phase 2: Update tutor data (including potentially new image URL) in MongoDB
    try {
      const payload = {
        firstName: editingTutorData.firstName.trim(),
        lastName: editingTutorData.lastName.trim(),
        image: updatedImageUrl, // Use the new URL or the existing one
      };

      console.log("Client: Updating tutor data in MongoDB:", payload);
      await axios.put(`${API_ENDPOINTS.TUTORS}/${editingTutor._id}`, payload);

      setUpdateTutorSuccess(`Tutor ${editingTutorData.firstName} ${editingTutorData.lastName} updated successfully!`);
      setEditingTutor(null); // Close modal
      setEditingTutorData({ firstName: "", lastName: "" });
      setEditingTutorImage(null);
      setEditingImagePreview(null);
      fetchDashboardData(); // Refresh the list of tutors
    } catch (error: any) {
      console.error("Client: Error updating tutor in MongoDB:", error);
      setUpdateTutorError(error.response?.data?.error || "Failed to update tutor.");
    } finally {
      setLoadingUpdateTutor(false);
    }
  }


  const deleteTutor = async (tutorId: string) => {
    // Replaced window.confirm with a custom modal logic if needed, but keeping for now
    if (window.confirm("Are you sure you want to delete this tutor?")) {
      try {
        await axios.delete(`${API_ENDPOINTS.TUTORS}/${tutorId}`)
        fetchDashboardData()
      } catch (error) {
        console.error("Error deleting tutor:", error)
        // Handle error display
      }
    }
  }


  const startEditTutor = (tutor: Tutor) => {
    setEditingTutor(tutor)
    setEditingTutorData({ firstName: tutor.firstName, lastName: tutor.lastName })
    setEditingImagePreview(tutor.image || null); // Set initial preview to current image
    setEditingTutorImage(null); // Clear any previously selected file for editing
    setUpdateTutorError(null); // Clear previous errors
    setUpdateTutorSuccess(null); // Clear previous success messages
  }

  // Table Management Functions
  const addTable = async () => {
    setLoadingAddTable(true);
    setAddTableError(null);
    setAddTableSuccess(null);

    if (!newTableNumber.trim() || isNaN(Number(newTableNumber))) {
      setAddTableError("Please enter a valid table number.");
      setLoadingAddTable(false);
      return;
    }

    try {
      const payload = {
        tableNumber: Number.parseInt(newTableNumber),
      };
      await axios.post(API_ENDPOINTS.TABLES, payload);
      setAddTableSuccess(`Table ${newTableNumber} added successfully!`);
      setNewTableNumber("");
      fetchDashboardData();
    } catch (error: any) {
      console.error("Error adding table:", error);
      setAddTableError(error.response?.data?.error || "Failed to add table.");
    } finally {
      setLoadingAddTable(false);
    }
  }


  const deleteTable = async (tableId: string) => {
    if (window.confirm("Are you sure you want to delete this table?")) {
      try {
        await axios.delete(`${API_ENDPOINTS.TABLES}/${tableId}`)
        console.log("Table deleted")
        fetchDashboardData();
      } catch (error) {
        console.error("Failed to delete table:", error)
        // Handle error display
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
            <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
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
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-2 mb-6">
            {/* Replaced emojis with Lucide React Icons */}
            <TabsTrigger value="tutors">
              <Users className="w-5 h-5 mr-2" /> Manage Tutors
            </TabsTrigger>
            <TabsTrigger value="tables">
              <TableIcon className="w-5 h-5 mr-2" /> Manage Tables
            </TabsTrigger>
          </TabsList>          {/* Tutors Management */}
          <TabsContent value="tutors" className="space-y-6">
            {/* Add New Tutor Card */}
            <Card className="rounded-xl shadow-lg border-none bg-gradient-to-br from-white to-blue-50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-blue-600">
                  <Plus className="w-5 h-5" />
                  <span>Add New Tutor</span>
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Fill in the details to add a new tutor to the system.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                  <Input
                    placeholder="First Name"
                    value={newTutor.firstName}
                    onChange={(e) => setNewTutor({ ...newTutor, firstName: e.target.value })}
                    disabled={loadingAddTutor}
                    className="rounded-lg border-gray-300 focus:border-blue-500"
                  />
                  <Input
                    placeholder="Last Name"
                    value={newTutor.lastName}
                    onChange={(e) => setNewTutor({ ...newTutor, lastName: e.target.value })}
                    disabled={loadingAddTutor}
                    className="rounded-lg border-gray-300 focus:border-blue-500"
                  />
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="new-tutor-image-upload" className="text-sm font-medium text-gray-700 flex items-center">
                      <ImageIcon className="w-4 h-4 mr-1" /> Profile Image (Optional)
                    </Label>
                    <Input
                      id="new-tutor-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleNewTutorImageChange}
                      disabled={loadingAddTutor}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100 cursor-pointer"
                    />
                    {imagePreview && (
                      <div className="mt-2 text-center">
                        <img src={imagePreview} alt="Image Preview" className="w-20 h-20 object-cover rounded-full mx-auto border-2 border-blue-200" />
                        <p className="text-xs text-gray-500 mt-1">Preview</p>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={addTutor}
                    disabled={loadingAddTutor || !newTutor.firstName.trim() || !newTutor.lastName.trim()}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center"
                  >
                    {loadingAddTutor ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Tutor
                      </>
                    )}
                  </Button>
                </div>
                {addTutorError && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertDescription>{addTutorError}</AlertDescription>
                  </Alert>
                )}
                {addTutorSuccess && (
                  <Alert className="mt-4 bg-green-50 border-green-200 text-green-700">
                    <AlertDescription>{addTutorSuccess}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* All Tutors Card */}
            <Card className="rounded-xl shadow-lg border-none bg-gradient-to-br from-white to-purple-50">
              <CardHeader className="pb-4">
                <CardTitle className="text-purple-600">All Tutors</CardTitle>
                <CardDescription className="text-gray-600">
                  View and manage all registered tutors.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tutors.length === 0 ? (
                    <p className="col-span-full text-center text-gray-500">No tutors added yet.</p>
                  ) : (
                    tutors.map((tutor) => (
                      <Card key={tutor._id} className="border border-gray-200 rounded-lg shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3 mb-3">
                            {tutor.image ? (
                              <img
                                src={tutor.image}
                                alt={`${tutor.firstName} ${tutor.lastName}`}
                                className="w-12 h-12 rounded-full object-cover border-2 border-purple-300"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                                <Users className="w-6 h-6 text-white" />
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-gray-800">
                                {tutor.firstName} {tutor.lastName}
                              </p>
                              <p className="text-sm text-gray-500">ID: {tutor._id}</p>
                            </div>
                          </div>

                          <div className="flex space-x-2 mt-3">
                            <Button size="sm" variant="outline" onClick={() => startEditTutor(tutor)} className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-50">
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteTutor(tutor._id)}
                              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tables Management */}
          <TabsContent value="tables" className="space-y-6">
            <Card className="rounded-xl shadow-lg border-none bg-gradient-to-br from-white to-green-50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-green-600">
                  <Plus className="w-5 h-5" />
                  <span>Add New Table</span>
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Add a new study table to the system.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4 items-end">
                  <Input
                    type="number"
                    placeholder="Table Number"
                    value={newTableNumber}
                    onChange={(e) => setNewTableNumber(e.target.value)}
                    className="flex-1 rounded-lg border-gray-300 focus:border-green-500"
                    disabled={loadingAddTable}
                  />
                  <Button
                    onClick={addTable}
                    disabled={loadingAddTable || !newTableNumber.trim()}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2 rounded-lg shadow-md transition-all duration-200 flex items-center justify-center"
                  >
                    {loadingAddTable ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Table
                      </>
                    )}
                  </Button>
                </div>
                {addTableError && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertDescription>{addTableError}</AlertDescription>
                  </Alert>
                )}
                {addTableSuccess && (
                  <Alert className="mt-4 bg-green-50 border-green-200 text-green-700">
                    <AlertDescription>{addTableSuccess}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow-lg border-none bg-gradient-to-br from-white to-orange-50">
              <CardHeader className="pb-4">
                <CardTitle className="text-green-600">All Tables</CardTitle>
                <CardDescription className="text-gray-600">
                  View and manage all registered tables.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {tables.length === 0 ? (
                    <p className="col-span-full text-center text-gray-500">No tables added yet.</p>
                  ) : (
                    tables.map((table) => (
                      <Card key={table._id} className="border border-gray-200 rounded-lg shadow-sm">
                        <CardContent className="p-4 text-center">
                          <TableIcon className="w-8 h-8 mx-auto mb-2 text-green-600" />
                          <p className="font-semibold mb-3">Table {table.tableNumber}</p>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteTable(table._id)}
                            className="w-full bg-red-500 hover:bg-red-600 text-white"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </CardContent>
                      </Card>
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
            <Card className="w-full max-w-md rounded-xl shadow-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-center text-xl font-bold text-blue-700">Edit Tutor</CardTitle>
                <CardDescription className="text-center text-gray-600">
                  Update tutor details and profile image.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="First Name"
                  value={editingTutorData.firstName}
                  onChange={(e) => setEditingTutorData({ ...editingTutorData, firstName: e.target.value })}
                  disabled={loadingUpdateTutor}
                  className="rounded-lg border-gray-300 focus:border-blue-500"
                />
                <Input
                  placeholder="Last Name"
                  value={editingTutorData.lastName}
                  onChange={(e) => setEditingTutorData({ ...editingTutorData, lastName: e.target.value })}
                  disabled={loadingUpdateTutor}
                  className="rounded-lg border-gray-300 focus:border-blue-500"
                />
                <div className="flex flex-col space-y-2">
                  <Label htmlFor="edit-tutor-image-upload" className="text-sm font-medium text-gray-700 flex items-center">
                    <ImageIcon className="w-4 h-4 mr-1" /> Profile Image (Optional)
                  </Label>
                  <Input
                    id="edit-tutor-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleEditingTutorImageChange}
                    disabled={loadingUpdateTutor}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100 cursor-pointer"
                  />
                  {(editingImagePreview || editingTutor.image) && (
                    <div className="mt-2 text-center">
                      <img
                        src={editingImagePreview || editingTutor.image || ''}
                        alt="Image Preview"
                        className="w-24 h-24 object-cover rounded-full mx-auto border-2 border-blue-200"
                      />
                      <p className="text-xs text-gray-500 mt-1">Current/New Image Preview</p>
                    </div>
                  )}
                </div>

                {updateTutorError && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertDescription>{updateTutorError}</AlertDescription>
                  </Alert>
                )}
                {updateTutorSuccess && (
                  <Alert className="mt-4 bg-green-50 border-green-200 text-green-700">
                    <AlertDescription>{updateTutorSuccess}</AlertDescription>
                  </Alert>
                )}

                <div className="flex space-x-2">
                  <Button onClick={updateTutor} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center" disabled={loadingUpdateTutor}>
                    {loadingUpdateTutor ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingTutor(null)
                      setEditingTutorData({ firstName: "", lastName: "" })
                      setEditingTutorImage(null)
                      setEditingImagePreview(null);
                      setUpdateTutorError(null);
                      setUpdateTutorSuccess(null);
                    }}
                    className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100"
                    disabled={loadingUpdateTutor}
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
                <Loader2 className="animate-spin h-4 w-4 border-b-2 border-white mr-2" />
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


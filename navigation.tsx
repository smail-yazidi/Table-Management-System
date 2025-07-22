"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Home, User, Settings, Menu, X } from "lucide-react"
import HomePage from "./home-page"
import TutorPage from "./tutor-page"
import Dashboard from "./dashboard"

export default function Navigation() {
  const [currentPage, setCurrentPage] = useState<"home" | "tutor" | "dashboard">("home")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const renderPage = () => {
    switch (currentPage) {
      case "tutor":
        return <TutorPage />
      case "dashboard":
        return <Dashboard />
      default:
        return <HomePage />
    }
  }

  const navItems = [
    {
      id: "home",
      label: "Live View",
      icon: Home,
      color: "from-blue-500 to-blue-600",
      description: "View table status",
    },
    {
      id: "tutor",
      label: "Check In",
      icon: User,
      color: "from-green-500 to-green-600",
      description: "Make reservation",
    },
    {
      id: "dashboard",
      label: "Admin",
      icon: Settings,
      color: "from-purple-500 to-purple-600",
      description: "Manage system",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                <Home className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-800">CLE</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-2">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id as any)}
                  className={`px-6 py-2 rounded-lg transition-all duration-200 ${currentPage === item.id
                    ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  title={item.description}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.label}
                </Button>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <Button className="md:hidden p-2" variant="ghost" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="space-y-2">
                {navItems.map((item) => (
                  <Button
                    key={item.id}
                    onClick={() => {
                      setCurrentPage(item.id as any)
                      setMobileMenuOpen(false)
                    }}
                    className={`w-full justify-start px-4 py-3 rounded-lg transition-all duration-200 ${currentPage === item.id
                      ? `bg-gradient-to-r ${item.color} text-white`
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs opacity-75">{item.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Page Content */}
      <main className="min-h-screen">{renderPage()}</main>
    </div>
  )
}

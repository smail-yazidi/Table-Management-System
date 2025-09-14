"use client"

import { useState } from "react"
import ImprovedTutorPage from "@/components/improved-tutor-page"
import Dashboard from "@/components/dashboard"
import Navigation from "@/components/navigation"

export default function Page() {
  const [currentPage, setCurrentPage] = useState<"home" | "tutor" | "dashboard">("home")

  if (currentPage === "tutor") {
    return <ImprovedTutorPage />
  }

  if (currentPage === "dashboard") {
    return <Dashboard />
  }

  return <Navigation />
}

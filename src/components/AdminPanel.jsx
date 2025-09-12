import React, { useState } from "react";
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  MessageSquare,
  LogOut,
} from "lucide-react";
import AdminDashboard from "./admin/AdminDashboard";
import UserManagement from "./admin/UserManagement";
import EventManagement from "./admin/EventManagement";
import RegistrationManagement from "./admin/RegistrationManagement";
import FeedbackReview from "./admin/FeedbackReview";
import axiosInstance from "../utils/axiosInstance";

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const TABS = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "users", label: "Users", icon: Users },
    { key: "events", label: "Events", icon: Calendar },
    { key: "registrations", label: "Registrations", icon: FileText },
    { key: "feedback", label: "Feedback", icon: MessageSquare },
  ];

  // Logout function to clear both localStorage and cookies
  const handleLogout = async () => {
    try {
      // Make API call to logout endpoint
      await axiosInstance.post("/auth/logout", null, {
        withCredentials: true,
      });
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      // Clear localStorage
      localStorage.clear();

      // Clear all cookies by setting them to expire in the past
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos) : c;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        // Also clear with domain specification for broader compatibility
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
      });

      // Redirect to login
      window.location.href = "/login";
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <AdminDashboard />;
      case "users":
        return <UserManagement />;
      case "events":
        return <EventManagement />;
      case "registrations":
        return <RegistrationManagement />;
      case "feedback":
        return <FeedbackReview />;
      default:
        return <AdminDashboard />;
    }
  };

  const handleTabClick = (tabKey) => {
    setActiveTab(tabKey);
    setSidebarOpen(false); // Close sidebar on mobile after selection
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Desktop Layout */}
      <div className="hidden lg:flex lg:flex-col">
        {/* Desktop Header */}
        <header className="bg-blue-700 text-white px-6 py-3 shadow-md">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Admin Panel</h1>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
            >
              <LogOut size={18} className="mr-2" />
              Logout
            </button>
          </div>
        </header>

        {/* Desktop Navbar */}
        <nav className="bg-white border-b border-gray-200 px-6 py-3 shadow-sm">
          <div className="flex flex-wrap gap-3">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`
                    flex items-center px-4 py-2 rounded-lg transition-colors duration-200
                    ${
                      activeTab === tab.key
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                    }
                  `}
                >
                  <Icon size={18} className="mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Desktop Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">{renderTabContent()}</main>
      </div>

      <div className="lg:hidden">
        {/* Mobile Header */}
        <header className="bg-blue-700 text-white px-4 py-3 shadow-md">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-semibold">Admin Panel</h1>
            <button
              onClick={handleLogout}
              className="p-2 rounded-md hover:bg-red-600 bg-red-500 transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Mobile Sidebar */}
        <div
          className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        >
          {/* Mobile Sidebar Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-blue-700 text-white">
            <h1 className="text-lg font-semibold">Menu</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-md hover:bg-blue-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Mobile Navigation Links */}
          <nav className="mt-6 px-3">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabClick(tab.key)}
                  className={`
                    w-full flex items-center px-3 py-3 mb-2 text-left rounded-lg transition-colors duration-200
                    ${
                      activeTab === tab.key
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-gray-700 hover:bg-gray-100"
                    }
                  `}
                >
                  <Icon size={18} className="mr-3" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}

            {/* Mobile Logout Button in Sidebar */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-3 mt-4 text-left rounded-lg transition-colors duration-200 text-red-600 hover:bg-red-50 border-t border-gray-200"
            >
              <LogOut size={18} className="mr-3" />
              <span className="font-medium">Logout</span>
            </button>
          </nav>
        </div>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Mobile Main Content */}
        <main className="p-4 overflow-y-auto">{renderTabContent()}</main>
      </div>
    </div>
  );
};

export default AdminPanel;

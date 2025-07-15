import React, { useState } from "react";
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  MessageSquare,
} from "lucide-react";
import AdminDashboard from "./admin/AdminDashboard";
import UserManagement from "./admin/UserManagement";
import EventManagement from "./admin/EventManagement";
import RegistrationManagement from "./admin/RegistrationManagement";
import FeedbackReview from "./admin/FeedbackReview";

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
    <div className="min-h-screen  bg-gray-100">
      {/* Desktop Layout */}
      <div className="hidden lg:flex  lg:flex-col">
        {/* Desktop Header */}
        <header className="bg-blue-700 text-white px-6 py-3 shadow-md">
          <h1 className="text-xl font-semibold">Admin Panel</h1>
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
        <main className="flex-1 p-6  overflow-y-auto">
          {renderTabContent()}
        </main>
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
            <div className="w-8"></div> {/* Spacer for centering */}
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

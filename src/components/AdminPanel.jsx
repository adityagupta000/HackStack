import React, { useState } from "react";
import AdminDashboard from "./admin/AdminDashboard";
import UserManagement from "./admin/UserManagement";
import EventManagement from "./admin/EventManagement";
import RegistrationManagement from "./admin/RegistrationManagement";
import FeedbackReview from "./admin/FeedbackReview";

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const TABS = [
    { key: "dashboard", label: "Dashboard" },
    { key: "users", label: "Users" },
    { key: "events", label: "Events" },
    { key: "registrations", label: "Registrations" },
    { key: "feedback", label: "Feedback" },
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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-blue-700 text-white px-6 py-4 shadow">
        <h1 className="text-xl font-semibold">Admin Panel</h1>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex flex-wrap gap-3">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded transition duration-200 ${
              activeTab === tab.key
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">{renderTabContent()}</main>
    </div>
  );
};

export default AdminPanel;

import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    userCount: 0,
    eventCount: 0,
    registrationCount: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axiosInstance.get("/admin/stats");
        setStats(res.data);
      } catch (err) {
        console.error("Error fetching admin stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="text-center mt-10">Loading stats...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <h2 className="text-lg text-gray-600">Total Users</h2>
          <p className="text-3xl font-bold text-blue-500">{stats.userCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <h2 className="text-lg text-gray-600">Total Events</h2>
          <p className="text-3xl font-bold text-green-500">
            {stats.eventCount}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <h2 className="text-lg text-gray-600">Total Registrations</h2>
          <p className="text-3xl font-bold text-purple-500">
            {stats.registrationCount}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

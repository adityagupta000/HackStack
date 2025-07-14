import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";

const RegistrationManagement = () => {
  const [registrations, setRegistrations] = useState([]);
  const [search, setSearch] = useState("");

  const fetchRegistrations = async () => {
    try {
      const res = await axiosInstance.get("/admin/registrations", {
        params: { search },
      });
      setRegistrations(res.data);
    } catch (err) {
      console.error("Failed to fetch registrations:", err.message);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [search]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">All Event Registrations</h2>

      <input
        type="text"
        placeholder="Search by user or event..."
        className="border rounded px-4 py-2 mb-4 w-full sm:w-96"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-700 text-xs uppercase">
            <tr>
              <th className="px-4 py-2">User</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Event</th>
              <th className="px-4 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {registrations.map((r) => (
              <tr key={r._id} className="border-t">
                <td className="px-4 py-2">{r.user?.name}</td>
                <td className="px-4 py-2">{r.user?.email}</td>
                <td className="px-4 py-2">{r.event?.title}</td>
                <td className="px-4 py-2">
                  {new Date(r.registeredAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {registrations.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center py-6 text-gray-500">
                  No registrations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RegistrationManagement;

import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";

const RegistrationManagement = () => {
  const [registrations, setRegistrations] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/admin/registrations", {
        params: { search },
      });
      setRegistrations(res.data);
    } catch (err) {
      console.error("Failed to fetch registrations:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [search]);

  return (
    <div className="p-6 w-full max-w-full mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">
        Event Registrations
      </h1>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <input
          type="text"
          placeholder="Search by user or event..."
          className="w-full sm:w-96 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {loading ? (
          <div className="text-center p-6 text-gray-500">Loading...</div>
        ) : (
          <table className="min-w-full text-sm text-left table-auto">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Event</th>
                <th className="px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {registrations.length > 0 ? (
                registrations.map((r) => (
                  <tr key={r._id} className="border-b hover:bg-gray-50">
                    <td className="px-5 py-3">{r.user?.name || "N/A"}</td>
                    <td className="px-5 py-3">{r.user?.email || "N/A"}</td>
                    <td className="px-5 py-3">{r.event?.title || "N/A"}</td>
                    <td className="px-5 py-3">
                      {new Date(r.registeredAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="text-center py-6 text-gray-500 italic"
                  >
                    No registrations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default RegistrationManagement;

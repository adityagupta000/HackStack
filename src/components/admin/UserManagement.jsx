import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";

// Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const color =
    {
      success: "bg-green-500",
      error: "bg-red-500",
      info: "bg-blue-500",
    }[type] || "bg-gray-600";

  return (
    <div
      className={`fixed top-6 right-6 z-50 p-3 text-white rounded shadow ${color}`}
    >
      {message}
    </div>
  );
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [confirmUserId, setConfirmUserId] = useState(null); // for popup

  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/admin/users?search=${search}`);
      setUsers(res.data);
    } catch (err) {
      showToast("Error fetching users", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const handleRoleChange = async (id, newRole) => {
    try {
      await axiosInstance.put(`/admin/users/${id}/role`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, role: newRole } : u))
      );
      showToast("User role updated", "success");
    } catch (err) {
      showToast("Failed to update role", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/admin/users/${confirmUserId}`);
      setUsers((prev) => prev.filter((u) => u._id !== confirmUserId));
      showToast("User deleted successfully", "success");
    } catch (err) {
      showToast("Failed to delete user", "error");
    } finally {
      setConfirmUserId(null);
    }
  };

  return (
    <div className="p-6 w-full max-w-full mx-auto relative">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">User Management</h1>

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          className="w-full sm:w-96 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {loading ? (
          <div className="text-center p-6 text-gray-500">Loading users...</div>
        ) : (
          <table className="min-w-full text-sm text-left table-auto">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user._id} className="border-b hover:bg-gray-50">
                    <td className="px-5 py-3">{user.name}</td>
                    <td className="px-5 py-3">{user.email}</td>
                    <td className="px-5 py-3">
                      <select
                        className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring focus:ring-blue-400"
                        value={user.role}
                        onChange={(e) =>
                          handleRoleChange(user._id, e.target.value)
                        }
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => setConfirmUserId(user._id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded transition duration-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="text-center py-6 text-gray-500 italic"
                  >
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Centered Confirmation Popup */}
      {confirmUserId && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl w-11/12 sm:w-96 text-center">
            <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this user?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setConfirmUserId(null)}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default UserManagement;

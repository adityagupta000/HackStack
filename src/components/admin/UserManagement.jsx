import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { sanitizeInput } from "../../utils/sanitize";
import { validateSearchQuery } from "../../utils/validation";
import { handleAPIError } from "../../utils/errorHandler";
import logger from "../../utils/logger";
import toast from "react-hot-toast";

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
      className={`fixed top-6 right-6 z-50 p-3 text-white rounded shadow ${color} transition-all duration-300`}
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
  const [confirmUserId, setConfirmUserId] = useState(null);

  const showToast = (message, type = "info") => {
    setToast({ message, type });
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const res = await axiosInstance.get(`/admin/users?search=${search}`);
      setUsers(res.data);

      logger.info("Users fetched in admin panel", { count: res.data.length });
    } catch (err) {
      logger.error("Failed to fetch users", err);
      handleAPIError(err, {
        fallbackMessage: "Error fetching users",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const handleSearchChange = (e) => {
    const value = e.target.value;

    // Validate search query
    const validation = validateSearchQuery(value);
    if (!validation.isValid) {
      showToast(validation.error, "error");
      return;
    }

    const sanitized = sanitizeInput(value);
    setSearch(sanitized);
  };

  const handleRoleChange = async (id, newRole) => {
    if (!["admin", "user"].includes(newRole)) {
      showToast("Invalid role", "error");
      return;
    }

    try {
      await axiosInstance.put(`/admin/users/${id}/role`, { role: newRole });

      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, role: newRole } : u))
      );

      showToast("User role updated", "success");

      logger.info("User role updated", { userId: id, newRole });
      logger.action("user_role_changed", { userId: id, newRole });
    } catch (err) {
      logger.error("Failed to update role", err, { userId: id });
      handleAPIError(err, {
        fallbackMessage: "Failed to update role",
      });
    }
  };

  const handleDelete = async () => {
    if (!confirmUserId) return;

    try {
      await axiosInstance.delete(`/admin/users/${confirmUserId}`);

      setUsers((prev) => prev.filter((u) => u._id !== confirmUserId));
      showToast("User deleted successfully", "success");

      logger.info("User deleted", { userId: confirmUserId });
      logger.action("user_deleted", { userId: confirmUserId });
    } catch (err) {
      logger.error("Failed to delete user", err, { userId: confirmUserId });
      handleAPIError(err, {
        fallbackMessage: "Failed to delete user",
      });
    } finally {
      setConfirmUserId(null);
    }
  };

  return (
    <div className="p-6 w-full max-w-full mx-auto relative">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">User Management</h1>

      {/* Search Bar */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          className="w-full sm:w-96 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={search}
          onChange={handleSearchChange}
          maxLength={100}
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {loading ? (
          <div className="text-center p-6 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            Loading users...
          </div>
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
                        className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring focus:ring-blue-300"
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

      {/* Confirmation Modal */}
      {confirmUserId && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl w-11/12 sm:w-96 text-center">
            <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this user? This action cannot be
              undone.
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

import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";

const FeedbackReview = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/admin/feedbacks", {
        params: { search },
      });
      setFeedbacks(res.data);
    } catch (err) {
      console.error("Failed to fetch feedbacks:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [search]);

  return (
    <div className="p-6 w-full max-w-full mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">User Feedback</h1>

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
                <th className="px-5 py-3">Event</th>
                <th className="px-5 py-3">Feedback</th>
                <th className="px-5 py-3">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {feedbacks.length > 0 ? (
                feedbacks.map((fb) => (
                  <tr key={fb._id} className="border-b hover:bg-gray-50">
                    <td className="px-5 py-3">{fb.user?.name || "N/A"}</td>
                    <td className="px-5 py-3">{fb.event?.title || "N/A"}</td>
                    <td className="px-5 py-3">{fb.text}</td>
                    <td className="px-5 py-3">
                      {new Date(fb.submittedAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="text-center py-6 text-gray-500 italic"
                  >
                    No feedback found.
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

export default FeedbackReview;

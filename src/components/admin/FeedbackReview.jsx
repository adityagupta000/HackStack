import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { sanitizeInput } from "../../utils/sanitize";
import { validateSearchQuery } from "../../utils/validation";
import { handleAPIError } from "../../utils/errorHandler";
import logger from "../../utils/logger";
import DOMPurify from "dompurify";

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

      logger.info("Feedbacks fetched in admin panel", {
        count: res.data.length,
      });
    } catch (err) {
      logger.error("Failed to fetch feedbacks", err);
      handleAPIError(err, {
        fallbackMessage: "Failed to fetch feedbacks",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [search]);

  const handleSearchChange = (e) => {
    const value = e.target.value;

    // Validate search query
    const validation = validateSearchQuery(value);
    if (!validation.isValid) {
      return;
    }

    const sanitized = sanitizeInput(value);
    setSearch(sanitized);
  };

  return (
    <div className="p-6 w-full max-w-full mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">User Feedback</h1>

      {/* Search Bar */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <input
          type="text"
          placeholder="Search by user or event..."
          className="w-full sm:w-96 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={search}
          onChange={handleSearchChange}
          maxLength={100}
        />
      </div>

      {/* Feedback Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {loading ? (
          <div className="text-center p-6 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            Loading feedbacks...
          </div>
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
                    <td className="px-5 py-3 max-w-md">
                      <div
                        className="line-clamp-3"
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(fb.text),
                        }}
                      />
                    </td>
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

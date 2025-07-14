import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";

const FeedbackReview = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [search, setSearch] = useState("");

  const fetchFeedbacks = async () => {
    try {
      const res = await axiosInstance.get("/admin/feedbacks", {
        params: { search },
      });
      setFeedbacks(res.data);
    } catch (err) {
      console.error("Failed to fetch feedbacks:", err.message);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [search]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">User Feedbacks</h2>

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
              <th className="px-4 py-2">Event</th>
              <th className="px-4 py-2">Feedback</th>
              <th className="px-4 py-2">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {feedbacks.map((fb) => (
              <tr key={fb._id} className="border-t">
                <td className="px-4 py-2">{fb.user?.name}</td>
                <td className="px-4 py-2">{fb.event?.title}</td>
                <td className="px-4 py-2">{fb.text}</td>
                <td className="px-4 py-2">
                  {new Date(fb.submittedAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {feedbacks.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center py-6 text-gray-500">
                  No feedback found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FeedbackReview;

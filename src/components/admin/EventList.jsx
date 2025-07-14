import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: "",
    category: "",
    date: "",
    time: "",
    price: "",
  });

  // Fetch all events
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await axiosInstance.get("/events");
      setEvents(res.data);
    } catch (err) {
      console.error("Failed to fetch events");
    }
  };

  // Delete Event
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;

    try {
      await axiosInstance.delete(`/events/${id}`);
      setEvents((prev) => prev.filter((e) => e._id !== id));
      setMessage("Event deleted successfully.");
    } catch (err) {
      setMessage("Failed to delete event.");
    }
  };

  // Start Editing
  const startEdit = (event) => {
    setEditing(event._id);
    setForm({
      title: event.title,
      category: event.category,
      date: event.date?.split("T")[0],
      time: event.time || "",
      price: event.price || "",
    });
  };

  // Save Edited Event
  const saveEdit = async () => {
    try {
      await axiosInstance.put(`/events/${editing}`, form);
      setMessage("Event updated.");
      setEditing(null);
      fetchEvents();
    } catch (err) {
      setMessage("Failed to update event.");
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">All Events</h2>

      {message && (
        <div className="mb-4 text-sm text-green-600 font-semibold">
          {message}
        </div>
      )}

      {events.map((event) =>
        editing === event._id ? (
          <div key={event._id} className="bg-gray-100 p-4 rounded shadow mb-4">
            <input
              type="text"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              className="p-2 border rounded w-full mb-2"
            />
            <input
              type="text"
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value }))
              }
              className="p-2 border rounded w-full mb-2"
            />
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="p-2 border rounded w-full mb-2"
            />
            <input
              type="time"
              value={form.time}
              onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
              className="p-2 border rounded w-full mb-2"
            />
            <input
              type="number"
              value={form.price}
              onChange={(e) =>
                setForm((f) => ({ ...f, price: e.target.value }))
              }
              className="p-2 border rounded w-full mb-2"
            />
            <div className="flex gap-2">
              <button
                onClick={saveEdit}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            key={event._id}
            className="bg-white p-4 rounded shadow mb-4 flex justify-between items-center"
          >
            <div>
              <h3 className="font-bold text-lg">{event.title}</h3>
              <p className="text-sm text-gray-600">
                {event.category} | {event.date?.substring(0, 10)}
              </p>
              <p className="text-sm text-gray-500">₹ {event.price}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => startEdit(event)}
                className="bg-blue-500 text-white px-3 py-1 rounded"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(event._id)}
                className="bg-red-600 text-white px-3 py-1 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default EventList;

import React, { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = [
  "#6366F1", // Indigo
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#3B82F6", // Blue
  "#8B5CF6", // Violet
  "#EC4899", // Pink
];

const AdminDashboard = () => {
  const [data, setData] = useState({
    userCount: 0,
    eventCount: 0,
    registrationCount: 0,
    feedbackCount: 0,
    domainBreakdown: {},
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await axiosInstance.get("/admin/dashboard-summary");
        setData(res.data);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const chartData = [
    { name: "Users", value: data.userCount },
    { name: "Events", value: data.eventCount },
    { name: "Registrations", value: data.registrationCount },
    { name: "Feedback", value: data.feedbackCount },
  ];

  const domainData = Object.entries(data.domainBreakdown || {}).map(
    ([domain, count]) => ({
      name: domain,
      value: count,
    })
  );

  // Custom label renderer for pie chart to prevent overlap
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;

  return (
    <div className="p-4 sm:p-6 max-w-full mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        Admin Dashboard
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-10">
        <Card
          title="Total Users"
          value={data.userCount}
          color="text-indigo-600"
        />
        <Card
          title="Total Events"
          value={data.eventCount}
          color="text-emerald-600"
        />
        <Card
          title="Registrations"
          value={data.registrationCount}
          color="text-yellow-600"
        />
        <Card
          title="Feedback"
          value={data.feedbackCount}
          color="text-red-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
        {/* Bar Chart */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-4">
            Overall Summary
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#4F46E5" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-4">
            Events by Category
          </h2>
          {domainData.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No event category data available.
            </p>
          ) : (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={domainData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    labelLine={false}
                    label={renderCustomizedLabel}
                  >
                    {domainData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [value, name]}
                    labelStyle={{ color: "#374151" }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Custom Legend */}
              <div className="flex flex-wrap gap-2 justify-center">
                {domainData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-gray-600">
                      {entry.name} ({entry.value})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Card = ({ title, value, color }) => (
  <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 text-center">
    <h2 className="text-xs sm:text-sm text-gray-500 mb-2">{title}</h2>
    <p className={`text-2xl sm:text-3xl font-bold ${color}`}>{value}</p>
  </div>
);

export default AdminDashboard;

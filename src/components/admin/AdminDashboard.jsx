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
    eventRegistrationStats: [],
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

  // Custom label for pie slices
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="11"
        fontWeight="600"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (loading) return <div className="text-center mt-8">Loading...</div>;

  return (
    <div className="p-3 md:p-4 max-w-full mx-auto">
      <h1 className="text-lg md:text-2xl lg:text-3xl font-bold mb-3 md:mb-4">
        Admin Dashboard
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
        {/* Bar Chart */}
        <div className="bg-white rounded-lg shadow-sm border p-3 md:p-4">
          <h2 className="text-sm md:text-base font-semibold mb-3">
            Overall Summary
          </h2>
          <div
            className="h-48 md:h-64 lg:h-72"
            style={{ minHeight: "200px", width: "100%" }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-lg shadow-sm border p-3 md:p-4">
          <h2 className="text-sm md:text-base font-semibold mb-3">
            Events by Category
          </h2>
          {domainData.length === 0 ? (
            <p className="text-gray-500 text-center py-8 text-sm">
              No event category data available.
            </p>
          ) : (
            <div className="flex flex-col items-center">
              <div
                className="h-48 md:h-64 lg:h-72 w-full"
                style={{ minHeight: "200px", width: "100%" }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <Pie
                      data={domainData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius="75%"
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
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Custom Legend */}
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {domainData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-xs text-gray-600">
                      {entry.name} ({entry.value})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full-width: Registrations per Event */}
      <div className="bg-white rounded-lg shadow-sm border p-3 md:p-4">
        <h2 className="text-sm md:text-base font-semibold mb-3">
          Registrations per Event
        </h2>
        {data.eventRegistrationStats &&
        data.eventRegistrationStats.length > 0 ? (
          <div
            className="h-64 md:h-80 lg:h-96"
            style={{ minHeight: "250px", width: "100%" }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.eventRegistrationStats}
                margin={{ top: 5, right: 5, left: 5, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="title"
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 9 }}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8 text-sm">
            No registration data available.
          </p>
        )}
      </div>
    </div>
  );
};

const Card = ({ title, value, color }) => (
  <div className="bg-white rounded-lg shadow-sm border p-3 text-center">
    <h2 className="text-xs text-gray-500 mb-1">{title}</h2>
    <p className={`text-lg md:text-xl lg:text-2xl font-bold ${color}`}>
      {value}
    </p>
  </div>
);

export default AdminDashboard;

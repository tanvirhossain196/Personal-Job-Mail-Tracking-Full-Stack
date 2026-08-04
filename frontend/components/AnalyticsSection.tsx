"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { ApplicationStatus, JobApplication } from "@/lib/types";
import { StatCard } from "./StatCard";
import { Target, TrendingUp, Building2, Percent } from "lucide-react";

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  Saved: "#556278",
  Applied: "#2C6E9E",
  Interviewing: "#E0871F",
  Offer: "#2F7D4F",
  Rejected: "#B3402F",
  Withdrawn: "#8B97A8",
};

function weekLabel(d: Date): string {
  const start = new Date(d);
  const day = start.getDay();
  start.setDate(start.getDate() - day);
  return start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function AnalyticsSection({ applications }: { applications: JobApplication[] }) {
  const total = applications.length;
  const appliedCount = applications.filter((a) => a.applied).length;
  const inProgress = applications.filter(
    (a) => a.status === "Interviewing" || a.status === "Offer"
  ).length;
  const responseRate = appliedCount > 0 ? Math.round((inProgress / appliedCount) * 100) : 0;

  const companyCounts = new Map<string, number>();
  applications.forEach((a) => {
    companyCounts.set(a.companyName, (companyCounts.get(a.companyName) ?? 0) + 1);
  });
  const topCompany = [...companyCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  const statusData = Object.entries(
    applications.reduce<Record<string, number>>((acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([status, count]) => ({ status, count }));

  const weekMap = new Map<string, number>();
  applications.forEach((a) => {
    const label = weekLabel(new Date(a.createdAt));
    weekMap.set(label, (weekMap.get(label) ?? 0) + 1);
  });
  const timelineData = [...weekMap.entries()]
    .map(([week, count]) => ({ week, count }))
    .slice(-8);

  const companyData = [...companyCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([company, count]) => ({ company, count }));

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total logged" value={total} icon={Target} accent="steel" />
        <StatCard label="Response rate" value={`${responseRate}%`} icon={Percent} accent="signal" hint="Interviewing + Offer / Applied" />
        <StatCard
          label="Top company"
          value={topCompany ? topCompany[1] : 0}
          icon={Building2}
          accent="circuit"
          hint={topCompany ? topCompany[0] : "—"}
        />
        <StatCard label="Active in pipeline" value={inProgress} icon={TrendingUp} accent="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 bg-white border border-steel-100 rounded-md shadow-panel p-5">
          <div className="font-display font-semibold text-ink text-sm mb-4">
            Status breakdown
          </div>
          {statusData.length === 0 ? (
            <p className="text-xs text-steel-500">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {statusData.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={STATUS_COLORS[entry.status as ApplicationStatus]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 4,
                    border: "1px solid #D7DCE3",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 justify-center">
            {statusData.map((entry) => (
              <div key={entry.status} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[entry.status as ApplicationStatus] }}
                />
                <span className="text-[11px] text-steel-700">
                  {entry.status} ({entry.count})
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 bg-white border border-steel-100 rounded-md shadow-panel p-5">
          <div className="font-display font-semibold text-ink text-sm mb-4">
            Applications logged over time
          </div>
          {timelineData.length === 0 ? (
            <p className="text-xs text-steel-500">No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={timelineData}>
                <CartesianGrid stroke="#E9ECF0" vertical={false} />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: "#556278" }}
                  axisLine={{ stroke: "#D7DCE3" }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#556278" }}
                  axisLine={false}
                  tickLine={false}
                  width={24}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 4,
                    border: "1px solid #D7DCE3",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#2C6E9E"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#2C6E9E" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-white border border-steel-100 rounded-md shadow-panel p-5">
        <div className="font-display font-semibold text-ink text-sm mb-4">
          Companies with multiple positions applied
        </div>
        {companyData.length === 0 ? (
          <p className="text-xs text-steel-500">No data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(160, companyData.length * 42)}>
            <BarChart data={companyData} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid stroke="#E9ECF0" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#556278" }} axisLine={{ stroke: "#D7DCE3" }} tickLine={false} />
              <YAxis
                type="category"
                dataKey="company"
                width={140}
                tick={{ fontSize: 12, fill: "#10151C" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 4,
                  border: "1px solid #D7DCE3",
                }}
              />
              <Bar dataKey="count" fill="#E0871F" radius={[0, 3, 3, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

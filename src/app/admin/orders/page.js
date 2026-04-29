"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AdminLogoutButton from "@/components/AdminLogoutButton";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [orders, activeFilter]);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrders(data.orders);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilter = () => {
    if (activeFilter === "ALL") {
      setFilteredOrders(orders);
    } else if (activeFilter === "PENDING") {
      setFilteredOrders(orders.filter(o => !o.status || (o.status !== "ACCEPTED" && o.status !== "SHIPPED")));
    } else {
      setFilteredOrders(orders.filter(o => o.status === activeFilter));
    }
  };

  const updateStatus = async (billId, newStatus) => {
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billId, status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      
      // Update local state
      setOrders(orders.map(o => o.billId === billId ? { ...o, status: newStatus } : o));
    } catch (err) {
      alert(err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "SHIPPED": return "bg-green-100 border-green-500";
      case "ACCEPTED": return "bg-yellow-100 border-yellow-500";
      default: return "bg-red-50 border-red-500"; // Initial state
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "SHIPPED": return "Shipment Completed";
      case "ACCEPTED": return "Order Accepted";
      default: return "Pending Action";
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#fbfaf7] text-[#8b001c] font-bold">Loading Orders...</div>;

  return (
    <main className="min-h-screen bg-[#fbfaf7] py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-5 rounded-[16px] border border-[#efe7dc] bg-white p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/admin" className="text-xs font-bold uppercase tracking-widest text-[#94773c] hover:text-[#8b001c] mb-2 inline-block">
              &larr; Back to Selection
            </Link>
            <h1 className="font-serif text-4xl text-[#43242d]">Order Management</h1>
            <p className="mt-2 text-[#6d6064]">Track and process customer orders</p>
          </div>
          <AdminLogoutButton />
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-3">
          {[
            { id: "ALL", label: "All Orders", color: "bg-[#43242d] text-white" },
            { id: "PENDING", label: "Pending (Red)", color: "bg-red-500 text-white" },
            { id: "ACCEPTED", label: "Accepted (Yellow)", color: "bg-yellow-500 text-[#43242d]" },
            { id: "SHIPPED", label: "Shipped (Green)", color: "bg-green-600 text-white" }
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`rounded-full px-6 py-2 text-xs font-bold uppercase tracking-widest shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0 ${
                activeFilter === filter.id ? `${filter.color} ring-2 ring-offset-2 ring-[#d8a734]` : "bg-white text-[#6d6064] border border-[#efe7dc] hover:bg-[#f9f7f3]"
              }`}
            >
              {filter.label}
              <span className="ml-2 opacity-60">
                ({filter.id === "ALL" ? orders.length : 
                  filter.id === "PENDING" ? orders.filter(o => !o.status || (o.status !== "ACCEPTED" && o.status !== "SHIPPED")).length :
                  orders.filter(o => o.status === filter.id).length
                })
              </span>
            </button>
          ))}
        </div>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

        <div className="overflow-hidden rounded-[16px] border border-[#efe7dc] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#f9f7f3] text-[10px] uppercase tracking-widest text-[#888]">
                <tr>
                  <th className="py-4 px-6">Bill ID & Date</th>
                  <th className="py-4 px-6">Customer</th>
                  <th className="py-4 px-6">Amount</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eee]">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-10 text-center text-[#999]">No {activeFilter.toLowerCase()} orders found.</td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.billId} className={`transition-colors ${getStatusColor(order.status)}`}>
                      <td className="py-5 px-6">
                        <p className="font-bold text-[#241f20]">{order.billId}</p>
                        <p className="text-[10px] text-[#777]">{new Date(order.orderDate).toLocaleString()}</p>
                      </td>
                      <td className="py-5 px-6">
                        <p className="font-medium text-[#241f20]">{order.address?.fullName || "N/A"}</p>
                        <p className="text-[10px] text-[#777]">{order.address?.mobileNo}</p>
                      </td>
                      <td className="py-5 px-6 font-serif font-bold text-[#8b001c]">
                        Rs. {order.totalAmount?.toLocaleString()}
                      </td>
                      <td className="py-5 px-6">
                        <span className={`inline-block px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                          order.status === 'SHIPPED' ? 'bg-green-500 text-white border-green-600' :
                          order.status === 'ACCEPTED' ? 'bg-yellow-500 text-[#43242d] border-yellow-600' :
                          'bg-red-500 text-white border-red-600'
                        }`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>
                      <td className="py-5 px-6 text-right">
                        <div className="flex items-center justify-end gap-4">
                          {/* Accept Checkbox */}
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={order.status === "ACCEPTED" || order.status === "SHIPPED"}
                              disabled={order.status === "SHIPPED"}
                              onChange={() => updateStatus(order.billId, "ACCEPTED")}
                              className="w-4 h-4 accent-[#d8a734]"
                            />
                            <span className="text-[10px] font-bold text-[#43242d]">Accept</span>
                          </label>

                          {/* Ship Checkbox */}
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={order.status === "SHIPPED"}
                              onChange={() => updateStatus(order.billId, "SHIPPED")}
                              className="w-4 h-4 accent-[#2f6b4f]"
                            />
                            <span className="text-[10px] font-bold text-[#43242d]">Shipped</span>
                          </label>

                          <a
                            href={`/api/orders/download?billId=${order.billId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded bg-[#8b001c] px-3 py-1.5 text-[10px] font-bold text-white hover:bg-[#6f1730] transition"
                          >
                            Download Bill
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

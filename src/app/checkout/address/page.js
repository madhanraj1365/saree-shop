"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getFirebaseClientAuth } from "@/lib/firebase-client";
import { indiaStates } from "@/lib/india-states";

export default function AddressPage() {
  const router = useRouter();
  const [addressType, setAddressType] = useState("HOME");
  const [isBillingDefault, setIsBillingDefault] = useState(false);
  const [isShippingDefault, setIsShippingDefault] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    mobileNo: "",
    city: "",
    pincode: "",
    state: "Tamil Nadu",
    completeAddress: "",
    landmark: "",
  });

  useEffect(() => {
    // Optionally pre-fill from user profile
    async function fetchProfile() {
      const auth = getFirebaseClientAuth();
      const user = auth.currentUser;
      if (user) {
        try {
          const token = await user.getIdToken();
          const res = await fetch("/api/users/profile", {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.profile) {
              setFormData((prev) => ({
                ...prev,
                fullName: data.profile.name || prev.fullName,
                mobileNo: data.profile.phone ? data.profile.phone.replace("+91", "") : prev.mobileNo,
              }));
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    router.push("/cart");
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.mobileNo || !formData.city || !formData.pincode || !formData.completeAddress) {
      alert("Please fill all required fields.");
      return;
    }

    setIsLoading(true);

    const addressData = {
      type: addressType,
      ...formData,
      country: "India",
      isDefaultBilling: isBillingDefault,
      isDefaultShipping: isShippingDefault,
    };

    sessionStorage.setItem("checkoutAddress", JSON.stringify(addressData));
    router.push("/checkout/summary");
  };

  return (
    <main className="min-h-screen bg-[#f4f4f4] py-12">
      <div className="mx-auto max-w-3xl rounded bg-white shadow-sm">
        
        <div className="border-b border-[#eee] p-6 text-center">
          <h1 className="text-xl font-normal text-[#241f20]">Add Shipping Address</h1>
        </div>

        <form onSubmit={handleAdd} className="p-8">
          {/* Address Type */}
          <div className="mb-8 flex flex-col items-center justify-center gap-6 sm:flex-row">
            {["HOME", "OFFICE", "OTHER"].map((type) => (
              <label key={type} className="flex cursor-pointer items-center gap-2">
                <div className={`grid h-5 w-5 place-items-center rounded-full border ${addressType === type ? 'border-[#8b001c] bg-[#8b001c]' : 'border-[#ccc] bg-white'}`}>
                  {addressType === type && <div className="h-2 w-2 rounded-full bg-white" />}
                </div>
                <span className="text-sm font-medium tracking-wide text-[#333]">{type}</span>
                <input
                  type="radio"
                  name="addressType"
                  value={type}
                  checked={addressType === type}
                  onChange={() => setAddressType(type)}
                  className="hidden"
                />
              </label>
            ))}
          </div>

          {/* Defaults Checkboxes */}
          <div className="mb-8 flex flex-col justify-center gap-6 sm:flex-row sm:gap-12">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={isBillingDefault}
                onChange={(e) => setIsBillingDefault(e.target.checked)}
                className="h-5 w-5 rounded border-[#ccc] text-[#8b001c] focus:ring-[#8b001c]"
              />
              <span className="text-sm text-[#555]">Mark as Default Billing Address</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={isShippingDefault}
                onChange={(e) => setIsShippingDefault(e.target.checked)}
                className="h-5 w-5 rounded border-[#ccc] text-[#8b001c] focus:ring-[#8b001c]"
              />
              <span className="text-sm text-[#555]">Mark as Default Shipping Address</span>
            </label>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Full Name */}
            <div className="flex flex-col gap-1 rounded border border-[#e0e0e0] p-3">
              <label className="text-xs text-[#888]">Full Name:</label>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="w-full border-none bg-transparent p-0 text-sm font-medium text-[#333] focus:ring-0"
              />
            </div>

            {/* Country */}
            <div className="flex flex-col gap-1 rounded border border-[#e0e0e0] p-3 opacity-70">
              <label className="text-xs text-[#888]">Country:</label>
              <select disabled className="w-full border-none bg-transparent p-0 text-sm font-medium text-[#333] focus:ring-0">
                <option>India</option>
              </select>
            </div>

            {/* Mobile No */}
            <div className="flex flex-col gap-1 rounded border border-[#e0e0e0] p-3">
              <label className="text-xs text-[#888]">Mobile No:</label>
              <div className="flex items-center">
                <select className="border-none bg-transparent p-0 pr-4 text-sm font-medium text-[#333] focus:ring-0">
                  <option>+91</option>
                </select>
                <div className="h-5 w-[1px] bg-[#e0e0e0] mx-2" />
                <input
                  type="tel"
                  name="mobileNo"
                  required
                  value={formData.mobileNo}
                  onChange={handleChange}
                  className="w-full border-none bg-transparent p-0 text-sm font-medium text-[#333] focus:ring-0"
                />
              </div>
            </div>

            {/* State */}
            <div className="flex flex-col gap-1 rounded border border-[#e0e0e0] p-3">
              <label className="text-xs text-[#888]">State:</label>
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full border-none bg-transparent p-0 text-sm font-medium text-[#333] focus:ring-0"
              >
                {indiaStates.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            {/* City */}
            <div className="flex flex-col gap-1 rounded border border-[#e0e0e0] p-3">
              <label className="text-xs text-[#888]">City:</label>
              <input
                type="text"
                name="city"
                required
                value={formData.city}
                onChange={handleChange}
                className="w-full border-none bg-transparent p-0 text-sm font-medium text-[#333] focus:ring-0"
              />
            </div>

            {/* Pincode */}
            <div className="flex flex-col gap-1 rounded border border-[#e0e0e0] p-3">
              <label className="text-xs text-[#888]">Pincode:</label>
              <input
                type="text"
                name="pincode"
                required
                value={formData.pincode}
                onChange={handleChange}
                className="w-full border-none bg-transparent p-0 text-sm font-medium text-[#333] focus:ring-0"
              />
            </div>
          </div>

          {/* Complete Address */}
          <div className="mt-6 flex flex-col gap-1 rounded border border-[#e0e0e0] p-3">
            <label className="text-xs text-[#888]">Complete Address:</label>
            <textarea
              name="completeAddress"
              required
              rows={3}
              value={formData.completeAddress}
              onChange={handleChange}
              className="w-full resize-y border-none bg-transparent p-0 text-sm font-medium text-[#333] focus:ring-0"
            />
          </div>

          {/* Landmark */}
          <div className="mt-6 flex flex-col gap-1 rounded border border-[#e0e0e0] p-3">
            <label className="text-xs text-[#888]">Landmark:</label>
            <input
              type="text"
              name="landmark"
              value={formData.landmark}
              onChange={handleChange}
              className="w-full border-none bg-transparent p-0 text-sm font-medium text-[#333] focus:ring-0"
            />
          </div>

          {/* Action Buttons */}
          <div className="mt-10 flex justify-end gap-4 border-t border-[#eee] pt-6">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-[4px] bg-[#fff9c4] px-8 py-3 text-sm font-bold text-[#b71c1c] transition hover:bg-[#fff59d]"
            >
              CLOSE
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-[4px] bg-[#ef5350] px-10 py-3 text-sm font-bold text-white transition hover:bg-[#e53935] disabled:opacity-70"
            >
              {isLoading ? "SAVING..." : "ADD"}
            </button>
          </div>
        </form>

      </div>
    </main>
  );
}

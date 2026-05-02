"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase-client";
import { indiaStates } from "@/lib/india-states";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [addressType, setAddressType] = useState("HOME");
  const [isShippingDefault, setIsShippingDefault] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [hasProfile, setHasProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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
    const auth = getFirebaseClientAuth();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }
      setUser(currentUser);

      try {
        const token = await currentUser.getIdToken();
        const res = await fetch("/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.profile && data.profile.name) {
            setHasProfile(true);
            setFormData((prev) => ({
              ...prev,
              fullName: data.profile.name || prev.fullName,
              mobileNo: data.profile.phone ? data.profile.phone.replace("+91", "") : prev.mobileNo,
              city: data.profile.city || prev.city,
              pincode: data.profile.pincode || prev.pincode,
              state: data.profile.state || prev.state,
              completeAddress: data.profile.address || prev.completeAddress,
              landmark: data.profile.landmark || prev.landmark,
            }));
            if (data.profile.addressType) setAddressType(data.profile.addressType);
            if (data.profile.isShippingDefault !== undefined) setIsShippingDefault(data.profile.isShippingDefault);
          } else {
            setIsEditing(true);
          }
        } else {
          setIsEditing(true);
        }
      } catch (e) {
        console.error(e);
        setIsEditing(true);
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogout = async () => {
    await signOut(getFirebaseClientAuth());
    router.push("/");
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.mobileNo || !formData.city || !formData.pincode || !formData.completeAddress) {
      alert("Please fill all required fields.");
      return;
    }

    setIsLoading(true);

    const addressData = {
      addressType,
      ...formData,
      country: "India",
      isShippingDefault,
    };

    try {
      const token = await user.getIdToken();
      await fetch("/api/users/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.fullName,
          phone: "+91" + formData.mobileNo,
          address: formData.completeAddress,
          city: formData.city,
          pincode: formData.pincode,
          state: formData.state,
          landmark: formData.landmark,
          addressType,
          isShippingDefault,
        }),
      });

      sessionStorage.setItem("checkoutAddress", JSON.stringify({
        ...addressData,
        type: addressType,
        isDefaultShipping: isShippingDefault,
      }));

      const redirectUrl = sessionStorage.getItem("postProfileRedirect");
      if (redirectUrl) {
        sessionStorage.removeItem("postProfileRedirect");
        router.push(redirectUrl);
      } else {
        alert("Profile saved successfully!");
        setHasProfile(true);
        setIsEditing(false);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save profile.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#f4f4f4] py-12 px-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#94773c]">My Account</p>
            <h1 className="mt-2 font-serif text-3xl text-[#241f20]">Account Hub</h1>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-[4px] border border-[#d8a734] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#8b001c] transition hover:bg-[#fff4b8]"
          >
            Sign Out
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8 flex gap-8 border-b border-[#ead8b7]">
          <Link href="/profile" className="border-b-2 border-[#8b001c] pb-2 text-sm font-bold uppercase tracking-widest text-[#8b001c]">
            Profile Details
          </Link>
          <Link href="/orders" className="border-b-2 border-transparent pb-2 text-sm font-bold uppercase tracking-widest text-[#555] hover:text-[#8b001c] transition">
            My Orders
          </Link>
        </div>

        {hasProfile && !isEditing ? (
          <div className="rounded bg-white p-6 sm:p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-serif text-xl text-[#241f20]">Your Details</h2>
              <button
                onClick={() => setIsEditing(true)}
                className="rounded border border-[#d8a734] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#8b001c] transition hover:bg-[#fff4b8]"
              >
                Edit Profile
              </button>
            </div>
            <div className="space-y-4 text-sm text-[#333]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 border-b border-[#eee] pb-4">
                <span className="font-bold text-[#555]">Full Name</span>
                <span className="sm:col-span-2">{formData.fullName}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 border-b border-[#eee] pb-4">
                <span className="font-bold text-[#555]">Mobile No</span>
                <span className="sm:col-span-2">+91 {formData.mobileNo}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 border-b border-[#eee] pb-4">
                <span className="font-bold text-[#555]">Address Type</span>
                <span className="sm:col-span-2">{addressType}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 border-b border-[#eee] pb-4">
                <span className="font-bold text-[#555]">Address</span>
                <span className="sm:col-span-2 leading-relaxed">
                  {formData.completeAddress}<br/>
                  {formData.landmark && <>{formData.landmark}<br/></>}
                  {formData.city}, {formData.state} - {formData.pincode}<br/>
                  India
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                <span className="font-bold text-[#555]">Defaults</span>
                <span className="sm:col-span-2 text-xs text-[#777] flex items-center gap-2 flex-wrap">
                  {isShippingDefault && <span className="bg-[#fff4b8] text-[#8b001c] px-2 py-1 rounded">Default Shipping</span>}
                  {!isShippingDefault && "None"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded bg-white shadow-sm">
            <form onSubmit={handleAdd} className="p-6 sm:p-8">
              {/* Address Type */}
              <div className="mb-8 flex flex-col items-center justify-center gap-6 sm:flex-row">
                {["HOME", "OFFICE", "OTHER"].map((type) => (
                  <label key={type} className="flex cursor-pointer items-center gap-2">
                    <div
                      className={`grid h-5 w-5 place-items-center rounded-full border ${
                        addressType === type ? "border-[#8b001c] bg-[#8b001c]" : "border-[#ccc] bg-white"
                      }`}
                    >
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
                    checked={isShippingDefault}
                    onChange={(e) => setIsShippingDefault(e.target.checked)}
                    className="h-5 w-5 rounded border-[#ccc] text-[#8b001c] focus:ring-[#8b001c]"
                  />
                  <span className="text-sm text-[#555]">Mark as Default Shipping Address</span>
                </label>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Full Name */}
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#555]">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full rounded-[4px] border border-[#e0e0e0] bg-[#fafafa] px-4 py-3 text-sm text-[#333] transition focus:border-[#d8a734] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#d8a734]"
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#555]">Country</label>
                  <select disabled className="w-full rounded-[4px] border border-[#e0e0e0] bg-[#f0f0f0] px-4 py-3 text-sm text-[#777] focus:outline-none cursor-not-allowed">
                    <option>India</option>
                  </select>
                </div>

                {/* Mobile No */}
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#555]">Mobile No</label>
                  <div className="flex items-center rounded-[4px] border border-[#e0e0e0] bg-[#fafafa] transition focus-within:border-[#d8a734] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#d8a734]">
                    <div className="flex h-full items-center pl-4 pr-3 text-sm font-medium text-[#555] border-r border-[#e0e0e0]">
                      +91
                    </div>
                    <input
                      type="tel"
                      name="mobileNo"
                      required
                      value={formData.mobileNo}
                      onChange={handleChange}
                      className="w-full border-none bg-transparent px-4 py-3 text-sm text-[#333] focus:outline-none focus:ring-0"
                    />
                  </div>
                </div>

                {/* State */}
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#555]">State</label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full rounded-[4px] border border-[#e0e0e0] bg-[#fafafa] px-4 py-3 text-sm text-[#333] transition focus:border-[#d8a734] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#d8a734]"
                  >
                    {indiaStates.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                {/* City */}
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#555]">City</label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full rounded-[4px] border border-[#e0e0e0] bg-[#fafafa] px-4 py-3 text-sm text-[#333] transition focus:border-[#d8a734] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#d8a734]"
                  />
                </div>

                {/* Pincode */}
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#555]">Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    required
                    value={formData.pincode}
                    onChange={handleChange}
                    className="w-full rounded-[4px] border border-[#e0e0e0] bg-[#fafafa] px-4 py-3 text-sm text-[#333] transition focus:border-[#d8a734] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#d8a734]"
                  />
                </div>
              </div>

              {/* Complete Address */}
              <div className="mt-6">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#555]">Complete Address</label>
                <textarea
                  name="completeAddress"
                  required
                  rows={3}
                  value={formData.completeAddress}
                  onChange={handleChange}
                  className="w-full resize-y rounded-[4px] border border-[#e0e0e0] bg-[#fafafa] px-4 py-3 text-sm text-[#333] transition focus:border-[#d8a734] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#d8a734]"
                />
              </div>

              {/* Landmark */}
              <div className="mt-6">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-[#555]">Landmark (Optional)</label>
                <input
                  type="text"
                  name="landmark"
                  value={formData.landmark}
                  onChange={handleChange}
                  className="w-full rounded-[4px] border border-[#e0e0e0] bg-[#fafafa] px-4 py-3 text-sm text-[#333] transition focus:border-[#d8a734] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#d8a734]"
                />
              </div>

              {/* Action Buttons */}
              <div className="mt-10 flex justify-end gap-4 border-t border-[#eee] pt-6">
                {hasProfile && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="rounded-[4px] px-8 py-3 text-sm font-bold tracking-wide text-[#555] transition hover:bg-[#eee]"
                  >
                    CANCEL
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-[4px] bg-[#ef5350] px-10 py-3 text-sm font-bold tracking-wide text-white transition hover:bg-[#e53935] disabled:opacity-70"
                >
                  {isLoading ? "SAVING..." : "SAVE & CONTINUE"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}

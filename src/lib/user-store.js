import "server-only";

import { getFirebaseAdminDb } from "@/lib/firebase-admin";

export async function getUserProfile(uid) {
  try {
    const db = getFirebaseAdminDb();
    const docRef = db.collection("users").doc(uid);
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

export async function updateUserProfile(uid, data) {
  try {
    const db = getFirebaseAdminDb();
    const docRef = db.collection("users").doc(uid);
    await docRef.set({ ...data, updatedAt: new Date() }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}

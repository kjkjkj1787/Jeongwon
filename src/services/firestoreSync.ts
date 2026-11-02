import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { EventItem, Profile } from "../types";

export interface StoredJobData {
  status: string;
  isFavorite: boolean;
  notes: string;
}

// 1. User Profile Sync
export async function saveUserProfileToFirestore(
  userId: string,
  profile: Profile,
  email?: string
): Promise<void> {
  const path = `users/${userId}`;
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(
      userRef,
      {
        userId,
        email: email || "",
        major: profile.major,
        skills: profile.skills,
        roles: profile.roles,
        regions: profile.regions,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadUserProfileFromFirestore(
  userId: string
): Promise<Profile | null> {
  const path = `users/${userId}`;
  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      major: data.major || "",
      skills: data.skills || "",
      roles: data.roles || "",
      regions: data.regions || "",
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

// 2. User Job Interactions Sync (Status, Favorite, Notes)
export async function saveUserJobDataToFirestore(
  userId: string,
  jobId: number,
  status: string,
  isFavorite: boolean,
  notes: string
): Promise<void> {
  const path = `users/${userId}/jobData/${jobId}`;
  try {
    const jobDataRef = doc(db, "users", userId, "jobData", String(jobId));
    await setDoc(jobDataRef, {
      userId,
      jobId: String(jobId),
      status,
      isFavorite,
      notes: notes || "",
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadUserJobDataFromFirestore(
  userId: string
): Promise<{
  statuses: Record<number, string>;
  favorites: number[];
  notes: Record<number, string>;
}> {
  const path = `users/${userId}/jobData`;
  const statuses: Record<number, string> = {};
  const favorites: number[] = [];
  const notes: Record<number, string> = {};

  try {
    const colRef = collection(db, "users", userId, "jobData");
    const snapshot = await getDocs(colRef);
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const numId = Number(docSnap.id);
      if (data.status) statuses[numId] = data.status;
      if (data.isFavorite) favorites.push(numId);
      if (data.notes) notes[numId] = data.notes;
    });
    return { statuses, favorites, notes };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return { statuses, favorites, notes };
  }
}

// 3. User Recruitment Milestones & Personal Events Sync
export async function saveUserEventToFirestore(
  userId: string,
  event: EventItem
): Promise<void> {
  const path = `users/${userId}/events/${event.id}`;
  try {
    const eventRef = doc(db, "users", userId, "events", event.id);
    await setDoc(eventRef, {
      ...event,
      userId,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserEventFromFirestore(
  userId: string,
  eventId: string
): Promise<void> {
  const path = `users/${userId}/events/${eventId}`;
  try {
    const eventRef = doc(db, "users", userId, "events", eventId);
    await deleteDoc(eventRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function loadUserEventsFromFirestore(
  userId: string
): Promise<EventItem[]> {
  const path = `users/${userId}/events`;
  try {
    const colRef = collection(db, "users", userId, "events");
    const snapshot = await getDocs(colRef);
    const list: EventItem[] = [];
    snapshot.forEach(docSnap => {
      const d = docSnap.data() as EventItem;
      list.push({
        id: docSnap.id,
        jobId: d.jobId,
        date: d.date,
        type: d.type,
        memo: d.memo,
      });
    });
    return list;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

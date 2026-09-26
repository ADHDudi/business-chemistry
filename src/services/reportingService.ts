import { db } from '../firebaseConfig';
import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    limit,
    serverTimestamp,
} from 'firebase/firestore';
import { Language } from '../types';

export interface UserReport {
    uid: string;
    createdAt: any;
    answers: Record<number, number>;
    scores: { formal: string; dominant: string };
    personaKey: string;
    language: Language;
}

export async function saveUserReport(
    uid: string,
    data: Omit<UserReport, 'uid' | 'createdAt'>
): Promise<void> {
    const ref = collection(db, 'users', uid, 'reports');
    await addDoc(ref, {
        uid,
        createdAt: serverTimestamp(),
        ...data,
    });
}

export async function getLatestReport(uid: string): Promise<UserReport | null> {
    const ref = collection(db, 'users', uid, 'reports');
    const q = query(ref, orderBy('createdAt', 'desc'), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as UserReport;
}

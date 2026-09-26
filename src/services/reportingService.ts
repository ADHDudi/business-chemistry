import { db } from '../firebaseConfig';
import {
    collection,
    addDoc,
    getDocsFromServer,
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

/**
 * Reads from the server only: plain getDocs() silently resolves with an empty
 * cached result when Firestore is unreachable, which would look like "no report".
 * getDocsFromServer() rejects ('unavailable') instead, so callers can show an error.
 */
export async function getLatestReport(uid: string): Promise<UserReport | null> {
    const ref = collection(db, 'users', uid, 'reports');
    const q = query(ref, orderBy('createdAt', 'desc'), limit(1));
    const snap = await getDocsFromServer(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as UserReport;
}

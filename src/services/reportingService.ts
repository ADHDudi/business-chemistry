import { db } from '../firebaseConfig';
import {
    collection,
    addDoc,
    doc,
    updateDoc,
    getDocsFromServer,
    query,
    orderBy,
    limit,
    serverTimestamp,
} from 'firebase/firestore';
import { Language, AICommunicationCoach } from '../types';

export interface UserReport {
    uid: string;
    createdAt: any;
    answers: Record<number, number>;
    scores: { formal: string; dominant: string };
    personaKey: string;
    language: Language;
    aiFeedback?: AIInsightFeedback;
}

/** A user's rating of the AI insight shown on their report. Stored on the report doc. */
export interface AIInsightFeedback {
    rating: number; // 1–5 stars
    comment: string;
    insight: AICommunicationCoach | null; // the insight that was rated
    targetProfile: string | null;
    submittedAt?: any;
}

export async function saveUserReport(
    uid: string,
    data: Omit<UserReport, 'uid' | 'createdAt'>
): Promise<string> {
    const ref = collection(db, 'users', uid, 'reports');
    const docRef = await addDoc(ref, {
        uid,
        createdAt: serverTimestamp(),
        ...data,
    });
    return docRef.id;
}

export async function saveInsightFeedback(
    uid: string,
    reportId: string,
    feedback: Omit<AIInsightFeedback, 'submittedAt'>
): Promise<void> {
    await updateDoc(doc(db, 'users', uid, 'reports', reportId), {
        aiFeedback: {
            ...feedback,
            // Firestore rejects undefined values; the AI payload may contain some
            insight: feedback.insight ? JSON.parse(JSON.stringify(feedback.insight)) : null,
            submittedAt: serverTimestamp(),
        },
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

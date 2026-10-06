import { useState, useEffect, useCallback } from 'react';
import {
    createSession,
    joinSession,
    updateAnswers,
    subscribeToSession,
    SessionData
} from '../services/sessionService';
import { checkAndMarkBothReady } from '../services/sessionStatusService';

export type SessionRole = 'A' | 'B' | null;

export const useSession = () => {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [myRole, setMyRole] = useState<SessionRole>(null);
    const [sessionData, setSessionData] = useState<SessionData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [unsubscribeRef, setUnsubscribeRef] = useState<(() => void) | null>(null);

    useEffect(() => {
        if (!sessionId) return;

        const unsubscribe = subscribeToSession(sessionId, (data) => {
            setSessionData(data);
        });
        setUnsubscribeRef(() => unsubscribe);

        return () => unsubscribe();
    }, [sessionId]);

    const startSession = async (name: string, email: string, uid: string) => {
        try {
            setError(null);
            const id = await createSession(name, email, uid);
            setSessionId(id);
            setMyRole('A');
            return id;
        } catch (err) {
            console.error(err);
            setError('Failed to create session');
            throw err;
        }
    };

    const joinExistingSession = async (id: string, name: string, email: string, uid: string) => {
        try {
            setError(null);
            const data = await joinSession(id, name, email, uid);
            setSessionId(id);
            setMyRole('B');
            setSessionData(data);
        } catch (err: any) {
            const msg = err?.message === 'Session not found'
                ? 'Session not found. Check the code and try again.'
                : err?.message === 'Session is full'
                    ? 'This session is already full.'
                    : 'Connection error, please try again.';
            setError(msg);
            throw err;
        }
    };

    const submitAnswers = useCallback(async (answers: Record<number, number>) => {
        if (!sessionId || !myRole || !sessionData) return;
        try {
            await updateAnswers(sessionId, myRole, answers);
            const answersA = myRole === 'A' ? answers : (sessionData.answersA || {});
            const answersB = myRole === 'B' ? answers : (sessionData.answersB || {});
            await checkAndMarkBothReady(sessionId, answersA, answersB);
        } catch (err) {
            console.error('Failed to sync answers:', err);
        }
    }, [sessionId, myRole, sessionData]);

    const exitSession = useCallback(async () => {
        if (sessionId) {
            try {
                const { doc, updateDoc } = await import('firebase/firestore');
                const { db } = await import('../firebaseConfig');
                await updateDoc(doc(db, 'sessions', sessionId), { partnerLeft: true });
            } catch (_) {
                // best-effort
            }
        }
        if (unsubscribeRef) unsubscribeRef();
        setSessionId(null);
        setMyRole(null);
        setSessionData(null);
        setError(null);
    }, [sessionId, unsubscribeRef]);

    return {
        sessionId,
        myRole,
        sessionData,
        error,
        startSession,
        joinExistingSession,
        submitAnswers,
        exitSession,
    };
};

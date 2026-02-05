import { useState, useEffect, useCallback } from 'react';
import {
    createSession,
    joinSession,
    updateAnswers,
    subscribeToSession,
    SessionData
} from '../services/sessionService';

export type SessionRole = 'A' | 'B' | null;

export const useSession = () => {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [myRole, setMyRole] = useState<SessionRole>(null);
    const [sessionData, setSessionData] = useState<SessionData | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Subscribe to session updates when sessionId is set
    useEffect(() => {
        if (!sessionId) return;

        const unsubscribe = subscribeToSession(sessionId, (data) => {
            setSessionData(data);
        });

        return () => unsubscribe();
    }, [sessionId]);

    const startSession = async (name: string, email: string) => {
        try {
            const id = await createSession(name, email);
            setSessionId(id);
            setMyRole('A');
            return id;
        } catch (err) {
            console.error(err);
            setError('Failed to create session');
            throw err;
        }
    };

    const joinExistingSession = async (id: string, name: string, email: string) => {
        try {
            const data = await joinSession(id, name, email);
            if (!data) {
                throw new Error('Session not found');
            }
            setSessionId(id);
            setMyRole('B');
            setSessionData(data); // Immediate update
        } catch (err) {
            console.error(err);
            setError('Failed to join session');
            throw err;
        }
    };

    const submitAnswers = useCallback(async (answers: Record<number, number>) => {
        if (!sessionId || !myRole) return;
        try {
            await updateAnswers(sessionId, myRole, answers);
        } catch (err) {
            console.error("Failed to sync answers:", err);
        }
    }, [sessionId, myRole]);

    return {
        sessionId,
        myRole,
        sessionData,
        error,
        startSession,
        joinExistingSession,
        submitAnswers
    };
};

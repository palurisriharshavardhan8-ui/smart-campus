/**
 * Shared complaint helper: appends a tracking entry and updates status.
 * Usage: await updateComplaintStatus(db, id, { status, actor, stage, message })
 */
import { arrayUnion, doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export async function updateComplaintStatus(complaintId, { status, actor, stage, message, extra = {} }) {
    const entry = {
        stage,
        actor,
        message,
        timestamp: Timestamp.now(),
    };
    await updateDoc(doc(db, 'complaints', complaintId), {
        status,
        updatedAt: serverTimestamp(),
        trackingHistory: arrayUnion(entry),
        ...extra,
    });
}

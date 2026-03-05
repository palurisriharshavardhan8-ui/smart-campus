import {
    doc, setDoc, addDoc, collection, serverTimestamp,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';

/**
 * Seeds demo data into Firestore.
 * Run this once via the Seed button in the Login page.
 */
export async function seedDemoData() {
    try {
        /* ── STUDENT ─────────────────────────────────────────── */
        let studentUid;
        try {
            const sc = await createUserWithEmailAndPassword(auth, 'student@campus.edu', 'Student123!');
            studentUid = sc.user.uid;
        } catch {
            const { signInWithEmailAndPassword } = await import('firebase/auth');
            const sc = await signInWithEmailAndPassword(auth, 'student@campus.edu', 'Student123!');
            studentUid = sc.user.uid;
        }

        const studentData = {
            uid: studentUid,
            name: 'Arjun Sharma',
            email: 'student@campus.edu',
            role: 'student',
            branch: 'CSE',
            section: 'A',
            registerNumber: 'CS2021001',
            className: 'CSE-A',
            attendancePercent: 84,
            attendanceData: [72, 85, 90, 78, 88, 95, 82],
            classSchedule: [
                { subject: 'Data Structures', time: '09:00 AM', room: 'LH-101', day: 'Mon' },
                { subject: 'Operating Systems', time: '11:00 AM', room: 'LH-203', day: 'Mon' },
                { subject: 'Machine Learning', time: '02:00 PM', room: 'Lab-3', day: 'Tue' },
                { subject: 'Web Development', time: '10:00 AM', room: 'LH-105', day: 'Wed' },
                { subject: 'DBMS', time: '03:00 PM', room: 'LH-201', day: 'Thu' },
            ],
        };
        await setDoc(doc(db, 'students', studentUid), studentData);
        await setDoc(doc(db, 'users', studentUid), studentData);

        /* ── CLASS TEACHER ───────────────────────────────────── */
        let teacherUid;
        try {
            const tc = await createUserWithEmailAndPassword(auth, 'teacher@campus.edu', 'Teacher123!');
            teacherUid = tc.user.uid;
        } catch {
            const { signInWithEmailAndPassword } = await import('firebase/auth');
            const tc = await signInWithEmailAndPassword(auth, 'teacher@campus.edu', 'Teacher123!');
            teacherUid = tc.user.uid;
        }

        const teacherData = {
            uid: teacherUid,
            name: 'Prof. Kavita Reddy',
            email: 'teacher@campus.edu',
            role: 'classTeacher',
            department: 'CSE',
            className: 'CSE-A',
            createdAt: serverTimestamp(),
        };
        await setDoc(doc(db, 'classTeachers', teacherUid), teacherData);
        await setDoc(doc(db, 'users', teacherUid), teacherData);

        /* ── ADMIN ───────────────────────────────────────────── */
        let adminUid;
        try {
            const ac = await createUserWithEmailAndPassword(auth, 'admin@campus.edu', 'Admin123!');
            adminUid = ac.user.uid;
        } catch {
            const { signInWithEmailAndPassword } = await import('firebase/auth');
            const ac = await signInWithEmailAndPassword(auth, 'admin@campus.edu', 'Admin123!');
            adminUid = ac.user.uid;
        }

        const adminData = {
            uid: adminUid,
            name: 'Dr. Priya Nair',
            email: 'admin@campus.edu',
            role: 'admin',
            department: 'infrastructure',
            collegeId: 'AD2021001',
            createdAt: serverTimestamp(),
        };
        await setDoc(doc(db, 'admins', adminUid), adminData);
        await setDoc(doc(db, 'users', adminUid), adminData);

        /* ── CLASSES ─────────────────────────────────────────── */
        const classes = [
            { className: 'CSE-A', branch: 'CSE', section: 'A', teacherName: 'Prof. Kavita Reddy', teacherId: teacherUid },
            { className: 'CSE-B', branch: 'CSE', section: 'B', teacherName: 'Prof. Rajan Kumar', teacherId: '' },
            { className: 'ECE-A', branch: 'ECE', section: 'A', teacherName: 'Prof. Meena Iyer', teacherId: '' },
        ];
        for (const cls of classes) {
            await setDoc(doc(db, 'classes', cls.className), cls);
        }

        /* ── COMPLAINTS ──────────────────────────────────────── */
        const complaints = [
            {
                title: 'Water Leakage in Hostel Block B',
                description: 'Severe water leakage in Block B, Room 204 — causing inconvenience for 3 days.',
                category: 'hostel',
                status: 'submitted',
                studentId: studentUid,
                studentName: 'Arjun Sharma',
                studentClass: 'CSE-A',
                classTeacherId: teacherUid,
                adminDepartment: 'hostel',
                createdAt: serverTimestamp(),
            },
            {
                title: 'Projector Not Working in LH-101',
                description: 'Projector in Lecture Hall 101 has been broken for a week, affecting lectures.',
                category: 'infrastructure',
                status: 'resolved',
                studentId: studentUid,
                studentName: 'Arjun Sharma',
                studentClass: 'CSE-A',
                classTeacherId: teacherUid,
                adminDepartment: 'infrastructure',
                createdAt: serverTimestamp(),
            },
            {
                title: 'Bus Route Change Not Communicated',
                description: 'Route 5B changed without notice, students missed pickup point.',
                category: 'transport',
                status: 'under_review',
                studentId: studentUid,
                studentName: 'Arjun Sharma',
                studentClass: 'CSE-A',
                classTeacherId: teacherUid,
                adminDepartment: 'transport',
                createdAt: serverTimestamp(),
            },
            {
                title: 'Internal exam schedule conflict',
                description: 'Two internal exams scheduled on same day for CSE 3rd year students.',
                category: 'academic',
                status: 'forwarded',
                studentId: studentUid,
                studentName: 'Arjun Sharma',
                studentClass: 'CSE-A',
                classTeacherId: teacherUid,
                adminDepartment: 'academic',
                createdAt: serverTimestamp(),
            },
        ];
        for (const complaint of complaints) {
            await addDoc(collection(db, 'complaints'), complaint);
        }

        /* ── ANNOUNCEMENTS ───────────────────────────────────── */
        const announcements = [
            {
                title: '🎉 Annual Tech Fest 2025 – SmartHack!',
                body: 'Annual College Tech Fest running March 10–12. Register for hackathons, coding contests, and robotics. Prizes worth ₹50,000!',
                createdBy: 'Dr. Priya Nair', createdAt: serverTimestamp(),
            },
            {
                title: '📚 Mid-Semester Examination Schedule Released',
                body: 'Exams will be conducted March 18–25. Collect hall tickets from the examination cell.',
                createdBy: 'Dr. Priya Nair', createdAt: serverTimestamp(),
            },
            {
                title: '🏖️ Holiday Notice – Holi',
                body: 'College closed March 13 for Holi. Classes resume March 14 per regular schedule.',
                createdBy: 'Dr. Priya Nair', createdAt: serverTimestamp(),
            },
            {
                title: '💼 Campus Placement Drive – TCS & Infosys',
                body: 'Placement drive on March 20. All eligible final year students pre-register by March 15.',
                createdBy: 'Dr. Priya Nair', createdAt: serverTimestamp(),
            },
        ];
        for (const ann of announcements) {
            await addDoc(collection(db, 'announcements'), ann);
        }

        /* ── NOTES ───────────────────────────────────────────── */
        const notes = [
            { subject: 'Data Structures & Algorithms', noteLink: 'https://www.geeksforgeeks.org/data-structures/', uploadedBy: 'Prof. Rajesh Kumar', description: 'Complete DSA notes covering arrays, trees, graphs.', createdAt: serverTimestamp() },
            { subject: 'Operating Systems', noteLink: 'https://www.os-book.com/', uploadedBy: 'Prof. Meera Singh', description: 'Silberschatz OS textbook and lecture slides.', createdAt: serverTimestamp() },
            { subject: 'Machine Learning', noteLink: 'https://www.coursera.org/learn/machine-learning', uploadedBy: 'Dr. Anil Gupta', description: "Andrew Ng's ML course materials.", createdAt: serverTimestamp() },
            { subject: 'Database Management Systems', noteLink: 'https://www.tutorialspoint.com/dbms/', uploadedBy: 'Prof. Sunita Verma', description: 'ER diagrams, normalization, SQL, transactions.', createdAt: serverTimestamp() },
            { subject: 'Web Development', noteLink: 'https://developer.mozilla.org/', uploadedBy: 'Dr. Priya Nair', description: 'MDN docs for HTML, CSS, JavaScript.', createdAt: serverTimestamp() },
        ];
        for (const note of notes) {
            await addDoc(collection(db, 'notes'), note);
        }

        return { success: true };
    } catch (error) {
        console.error('Seed error:', error);
        throw error;
    }
}

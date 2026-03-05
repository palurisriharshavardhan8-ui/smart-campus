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
        // Create student account
        let studentUid;
        try {
            const studentCred = await createUserWithEmailAndPassword(
                auth, 'student@campus.edu', 'Student123!'
            );
            studentUid = studentCred.user.uid;
        } catch (e) {
            // User may already exist — get uid by signing in
            const { signInWithEmailAndPassword } = await import('firebase/auth');
            const sc = await signInWithEmailAndPassword(auth, 'student@campus.edu', 'Student123!');
            studentUid = sc.user.uid;
        }

        await setDoc(doc(db, 'students', studentUid), {
            uid: studentUid,
            name: 'Arjun Sharma',
            email: 'student@campus.edu',
            role: 'student',
            rollNumber: 'CS2021001',
            department: 'Computer Science',
            year: '3rd Year',
            phone: '+91 98765 43210',
            attendanceData: [72, 85, 90, 78, 88, 95, 82],
            attendancePercent: 84,
            classSchedule: [
                { subject: 'Data Structures', time: '09:00 AM', room: 'LH-101', day: 'Mon' },
                { subject: 'Operating Systems', time: '11:00 AM', room: 'LH-203', day: 'Mon' },
                { subject: 'Machine Learning', time: '02:00 PM', room: 'Lab-3', day: 'Tue' },
                { subject: 'Web Development', time: '10:00 AM', room: 'LH-105', day: 'Wed' },
                { subject: 'DBMS', time: '03:00 PM', room: 'LH-201', day: 'Thu' },
            ],
        });

        // Create admin account
        let adminUid;
        try {
            const adminCred = await createUserWithEmailAndPassword(
                auth, 'admin@campus.edu', 'Admin123!'
            );
            adminUid = adminCred.user.uid;
        } catch (e) {
            const { signInWithEmailAndPassword } = await import('firebase/auth');
            const ac = await signInWithEmailAndPassword(auth, 'admin@campus.edu', 'Admin123!');
            adminUid = ac.user.uid;
        }

        await setDoc(doc(db, 'admins', adminUid), {
            uid: adminUid,
            name: 'Dr. Priya Nair',
            email: 'admin@campus.edu',
            role: 'admin',
            designation: 'Campus Administrator',
        });

        // Seed complaints
        const complaints = [
            {
                title: 'Water Leakage in Hostel Block B',
                description: 'There is a severe water leakage in Block B, Room 204. It has been causing inconvenience for 3 days.',
                category: 'Hostel',
                status: 'pending',
                studentId: studentUid,
                studentName: 'Arjun Sharma',
                createdAt: serverTimestamp(),
            },
            {
                title: 'Projector Not Working in LH-101',
                description: 'The projector in Lecture Hall 101 has not been working for the past week, affecting lectures.',
                category: 'Infrastructure',
                status: 'resolved',
                studentId: studentUid,
                studentName: 'Arjun Sharma',
                createdAt: serverTimestamp(),
            },
            {
                title: 'Faculty Not Available During Office Hours',
                description: 'Professor for Data Structures is not available during designated office hours consistently.',
                category: 'Faculty',
                status: 'in-progress',
                studentId: studentUid,
                studentName: 'Arjun Sharma',
                createdAt: serverTimestamp(),
            },
        ];

        for (const complaint of complaints) {
            await addDoc(collection(db, 'complaints'), complaint);
        }

        // Seed announcements
        const announcements = [
            {
                title: '🎉 Annual Tech Fest 2025 – SmartHack!',
                body: 'We are thrilled to announce the Annual College Tech Fest running from March 10–12. Register your teams for hackathons, coding contests, and robotics challenges. Exciting prizes worth ₹50,000 await!',
                createdBy: 'Dr. Priya Nair',
                createdAt: serverTimestamp(),
            },
            {
                title: '📚 Mid-Semester Examination Schedule Released',
                body: 'The Mid-Semester Examination Schedule for Semester 6 has been released. Exams will be conducted from March 18–25. Students are advised to collect their hall tickets from the examination cell.',
                createdBy: 'Dr. Priya Nair',
                createdAt: serverTimestamp(),
            },
            {
                title: '🏖️ Holiday Notice – Holi Celebration',
                body: 'The college will remain closed on March 13 (Thursday) on account of Holi celebrations. Classes will resume on March 14 (Friday) as per regular schedule.',
                createdBy: 'Dr. Priya Nair',
                createdAt: serverTimestamp(),
            },
            {
                title: '💼 Campus Placement Drive – TCS & Infosys',
                body: 'TCS and Infosys will be conducting an on-campus placement drive on March 20. All eligible final year students must pre-register at the Training & Placement Cell by March 15.',
                createdBy: 'Dr. Priya Nair',
                createdAt: serverTimestamp(),
            },
        ];

        for (const ann of announcements) {
            await addDoc(collection(db, 'announcements'), ann);
        }

        // Seed notes
        const notes = [
            {
                subject: 'Data Structures & Algorithms',
                noteLink: 'https://www.geeksforgeeks.org/data-structures/',
                uploadedBy: 'Prof. Rajesh Kumar',
                description: 'Complete DSA notes covering arrays, linked lists, trees, graphs, and more.',
                createdAt: serverTimestamp(),
            },
            {
                subject: 'Operating Systems',
                noteLink: 'https://www.os-book.com/',
                uploadedBy: 'Prof. Meera Singh',
                description: 'Silberschatz OS textbook reference and lecture slides.',
                createdAt: serverTimestamp(),
            },
            {
                subject: 'Machine Learning',
                noteLink: 'https://www.coursera.org/learn/machine-learning',
                uploadedBy: 'Dr. Anil Gupta',
                description: 'Andrew Ng\'s ML course materials and supplementary notes.',
                createdAt: serverTimestamp(),
            },
            {
                subject: 'Database Management Systems',
                noteLink: 'https://www.tutorialspoint.com/dbms/',
                uploadedBy: 'Prof. Sunita Verma',
                description: 'DBMS notes covering ER diagrams, normalization, SQL, and transactions.',
                createdAt: serverTimestamp(),
            },
            {
                subject: 'Web Development',
                noteLink: 'https://developer.mozilla.org/en-US/docs/Web',
                uploadedBy: 'Dr. Priya Nair',
                description: 'MDN web docs for HTML, CSS, JavaScript and modern frameworks.',
                createdAt: serverTimestamp(),
            },
            {
                subject: 'Computer Networks',
                noteLink: 'https://www.computernetworkingnotes.com/',
                uploadedBy: 'Prof. Vikram Rao',
                description: 'Lecture notes on OSI model, TCP/IP, routing protocols and network security.',
                createdAt: serverTimestamp(),
            },
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

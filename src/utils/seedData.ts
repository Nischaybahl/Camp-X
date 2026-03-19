/**
 * Seeds localStorage with realistic sample data for demo purposes.
 * Only seeds if the data doesn't already exist (won't overwrite user data).
 */

export function seedDemoData() {
    // ─── Sample Users ───
    if (!localStorage.getItem('campx_users') || JSON.parse(localStorage.getItem('campx_users')!).length === 0) {
        const users = [
            { name: 'Aarav Sharma', email: 'en23cs301001@medicaps.ac.in', password: 'Student01', verified: true, createdAt: '2026-02-15T10:00:00Z' },
            { name: 'Priya Patel', email: 'en23cs301045@medicaps.ac.in', password: 'Student02', verified: true, createdAt: '2026-02-16T11:30:00Z' },
            { name: 'Rohan Gupta', email: 'en23cs301098@medicaps.ac.in', password: 'Student03', verified: true, createdAt: '2026-02-18T09:15:00Z' },
            { name: 'Ananya Singh', email: 'en23cs301120@medicaps.ac.in', password: 'Student04', verified: true, createdAt: '2026-03-01T14:00:00Z' },
            { name: 'Vikram Joshi', email: 'en23cs301200@medicaps.ac.in', password: 'Student05', verified: true, createdAt: '2026-03-05T08:45:00Z' },
            { name: 'Sneha Reddy', email: 'en23cs301250@medicaps.ac.in', password: 'Student06', verified: true, createdAt: '2026-03-08T16:20:00Z' },
        ];
        localStorage.setItem('campx_users', JSON.stringify(users));
    }

    // ─── Sample Complaints ───
    if (!localStorage.getItem('campusComplaints') || JSON.parse(localStorage.getItem('campusComplaints')!).length === 0) {
        const complaints = [
            {
                id: 'c1', name: 'Water leakage in B-Block washroom', category: 'infra',
                description: 'There has been continuous water leakage in the 2nd floor washroom of B-Block for the past week. The floor is always wet and slippery, posing a safety hazard for students.',
                completed: false, createdAt: '18 Mar 2026', authorEmail: 'en23cs301001@medicaps.ac.in'
            },
            {
                id: 'c2', name: 'WiFi not working in Library', category: 'infra',
                description: 'The WiFi network in the central library has been down since Monday. Students are unable to access online resources for assignments and research work.',
                completed: false, createdAt: '17 Mar 2026', authorEmail: 'en23cs301045@medicaps.ac.in'
            },
            {
                id: 'c3', name: 'Lab equipment malfunction', category: 'academic',
                description: 'Three computers in Lab 204 are showing BSOD errors and cannot boot up. This is affecting the DBMS practical sessions.',
                completed: true, createdAt: '15 Mar 2026', authorEmail: 'en23cs301098@medicaps.ac.in'
            },
            {
                id: 'c4', name: 'Hostel mess food quality', category: 'hostel',
                description: 'The quality of food in the hostel mess has deteriorated significantly. Multiple students have complained about stale chapatis and undercooked dal. Request immediate inspection.',
                completed: false, createdAt: '16 Mar 2026', authorEmail: 'en23cs301120@medicaps.ac.in'
            },
            {
                id: 'c5', name: 'Broken AC in Lecture Hall 5', category: 'infra',
                description: 'The air conditioning unit in Lecture Hall 5 has been non-functional for 10 days. During afternoon lectures, the heat makes it very difficult to concentrate.',
                completed: false, createdAt: '19 Mar 2026', authorEmail: 'en23cs301200@medicaps.ac.in'
            },
            {
                id: 'c6', name: 'Projector issue in Room 302', category: 'academic',
                description: 'The projector in Room 302 displays a yellowish tint and the HDMI port is loose. Faculty members are unable to present slides clearly during lectures.',
                completed: true, createdAt: '12 Mar 2026', authorEmail: 'en23cs301250@medicaps.ac.in'
            },
        ];
        localStorage.setItem('campusComplaints', JSON.stringify(complaints));
    }

    // ─── Sample Attendance ───
    if (!localStorage.getItem('campusAttendance') || JSON.parse(localStorage.getItem('campusAttendance')!).length === 0) {
        const today = new Date();
        const generateRecords = (daysBack: number, attendRate: number) => {
            const records = [];
            for (let i = daysBack; i >= 1; i--) {
                const d = new Date(today);
                d.setDate(d.getDate() - i);
                // Skip weekends
                if (d.getDay() === 0 || d.getDay() === 6) continue;
                records.push({
                    date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                    attended: Math.random() < attendRate,
                });
            }
            return records;
        };

        const attendance = [
            { id: 'a1', name: 'Data Structures & Algorithms', records: generateRecords(30, 0.85), authorEmail: 'en23cs301001@medicaps.ac.in' },
            { id: 'a2', name: 'Database Management Systems', records: generateRecords(30, 0.75), authorEmail: 'en23cs301001@medicaps.ac.in' },
            { id: 'a3', name: 'Operating Systems', records: generateRecords(25, 0.90), authorEmail: 'en23cs301045@medicaps.ac.in' },
            { id: 'a4', name: 'Computer Networks', records: generateRecords(28, 0.70), authorEmail: 'en23cs301045@medicaps.ac.in' },
            { id: 'a5', name: 'Software Engineering', records: generateRecords(20, 0.95), authorEmail: 'en23cs301098@medicaps.ac.in' },
            { id: 'a6', name: 'Discrete Mathematics', records: generateRecords(22, 0.60), authorEmail: 'en23cs301120@medicaps.ac.in' },
            { id: 'a7', name: 'Machine Learning', records: generateRecords(18, 0.80), authorEmail: 'en23cs301200@medicaps.ac.in' },
            { id: 'a8', name: 'Web Development', records: generateRecords(15, 0.92), authorEmail: 'en23cs301250@medicaps.ac.in' },
        ];
        localStorage.setItem('campusAttendance', JSON.stringify(attendance));
    }

    // ─── Sample Notes ───
    if (!localStorage.getItem('campusNotes') || JSON.parse(localStorage.getItem('campusNotes')!).length === 0) {
        const notes = [
            {
                id: 'n1', title: 'Binary Search Tree Operations',
                subject: 'Data Structures & Algorithms',
                content: 'BST Operations:\n\n1. Insertion: O(log n) average\n2. Deletion: O(log n) average\n3. Search: O(log n) average\n4. Traversal: Inorder gives sorted output\n\nKey Points:\n- Left subtree nodes < root\n- Right subtree nodes > root\n- AVL trees maintain balance factor ≤ 1',
                createdAt: '18 Mar 2026', authorEmail: 'en23cs301001@medicaps.ac.in'
            },
            {
                id: 'n2', title: 'Normalization Forms Summary',
                subject: 'Database Management Systems',
                content: '1NF: Atomic values, no repeating groups\n2NF: 1NF + no partial dependencies\n3NF: 2NF + no transitive dependencies\nBCNF: Every determinant is a candidate key\n\nExample: Student(RollNo, Name, CourseID, CourseName)\n- CourseName depends on CourseID (transitive)\n- Decompose to achieve 3NF',
                createdAt: '17 Mar 2026', authorEmail: 'en23cs301045@medicaps.ac.in'
            },
            {
                id: 'n3', title: 'OSI Model - 7 Layers',
                subject: 'Computer Networks',
                content: '7. Application (HTTP, FTP, SMTP)\n6. Presentation (SSL, Encryption)\n5. Session (NetBIOS, RPC)\n4. Transport (TCP, UDP)\n3. Network (IP, ICMP, Routers)\n2. Data Link (MAC, Switches)\n1. Physical (Cables, Hubs)\n\nMnemonic: All People Seem To Need Data Processing',
                createdAt: '16 Mar 2026', authorEmail: 'en23cs301098@medicaps.ac.in'
            },
            {
                id: 'n4', title: 'Process Scheduling Algorithms',
                subject: 'Operating Systems',
                content: 'FCFS: First Come First Served - Simple but convoy effect\nSJF: Shortest Job First - Optimal avg wait time\nRound Robin: Time quantum based - Good for time-sharing\nPriority: Based on priority number - Can cause starvation\n\nSolution: Aging - Gradually increase priority of waiting processes',
                createdAt: '15 Mar 2026', authorEmail: 'en23cs301120@medicaps.ac.in'
            },
            {
                id: 'n5', title: 'SDLC Models Comparison',
                subject: 'Software Engineering',
                content: 'Waterfall: Sequential, good for small projects\nV-Model: Verification & Validation at each stage\nAgile: Iterative, customer collaboration\nSpiral: Risk-driven, prototyping\nDevOps: Continuous Integration/Deployment\n\nMost used in industry: Agile (Scrum/Kanban)',
                createdAt: '14 Mar 2026', authorEmail: 'en23cs301200@medicaps.ac.in'
            },
        ];
        localStorage.setItem('campusNotes', JSON.stringify(notes));
    }

    // ─── Sample Support Queries ───
    if (!localStorage.getItem('campx_support_messages') || JSON.parse(localStorage.getItem('campx_support_messages')!).length === 0) {
        const queries = [
            {
                name: 'Aarav Sharma', email: 'en23cs301001@medicaps.ac.in',
                message: 'I am unable to download the PYQ papers for the DBMS subject. The page shows an error every time I try. Can you please look into this?',
                timestamp: '2026-03-18T10:30:00Z'
            },
            {
                name: 'Priya Patel', email: 'en23cs301045@medicaps.ac.in',
                message: 'Can we have a dark mode toggle that stays persistent across sessions? Currently it resets every time I reload the page.',
                timestamp: '2026-03-17T14:15:00Z'
            },
            {
                name: 'Rohan Gupta', email: 'en23cs301098@medicaps.ac.in',
                message: 'The attendance percentage is showing incorrectly for my Operating Systems subject. I have attended 18 out of 20 classes but it shows 75%.',
                timestamp: '2026-03-16T09:45:00Z'
            },
            {
                name: 'Ananya Singh', email: 'en23cs301120@medicaps.ac.in',
                message: 'Great platform! Could you add a feature to export notes as PDF? It would be really helpful for offline study.',
                timestamp: '2026-03-15T16:00:00Z'
            },
            {
                name: 'Vikram Joshi', email: 'en23cs301200@medicaps.ac.in',
                message: 'I accidentally deleted my campus complaint about the parking issue. Is there a way to recover deleted complaints?',
                timestamp: '2026-03-14T11:20:00Z'
            },
        ];
        localStorage.setItem('campx_support_messages', JSON.stringify(queries));
    }

    console.log('✅ CampX demo data seeded successfully.');
}

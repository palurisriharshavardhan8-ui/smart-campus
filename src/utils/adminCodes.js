/**
 * Admin code → department/role mapping.
 * Provided by super-admin during onboarding.
 */
export const ADMIN_CODES = {
    INFRA_ADMIN_2026: 'infrastructure',
    HOSTEL_ADMIN_2026: 'hostel',
    TRANSPORT_ADMIN_2026: 'transport',
    ACADEMIC_ADMIN_2026: 'academic',
    // Head/Super Admin — no department; full access
    HEAD_ADMIN_2026: 'superAdmin',
};

/**
 * Teacher code → class + branch + section mapping.
 */
export const TEACHER_CODES = {
    CSE_A_TEACHER_2026: { className: 'CSE-A', branch: 'CSE', section: 'A' },
    CSE_B_TEACHER_2026: { className: 'CSE-B', branch: 'CSE', section: 'B' },
    ECE_A_TEACHER_2026: { className: 'ECE-A', branch: 'ECE', section: 'A' },
    ECE_B_TEACHER_2026: { className: 'ECE-B', branch: 'ECE', section: 'B' },
    MECH_A_TEACHER_2026: { className: 'MECH-A', branch: 'MECH', section: 'A' },
    IT_A_TEACHER_2026: { className: 'IT-A', branch: 'IT', section: 'A' },
    AIDS_A_TEACHER_2026: { className: 'AIDS-A', branch: 'AIDS', section: 'A' },
    AIML_A_TEACHER_2026: { className: 'AIML-A', branch: 'AIML', section: 'A' },
};

export const DEPARTMENT_LABELS = {
    infrastructure: 'Infrastructure',
    hostel: 'Hostel',
    transport: 'Transport',
    academic: 'Academic',
    superAdmin: 'Head Admin (All Access)',
};

/** Returns dept string or 'superAdmin' for head admin code, null if invalid. */
export function validateAdminCode(code) {
    return ADMIN_CODES[code?.trim().toUpperCase()] || null;
}

/** Returns { className, branch, section } or null. */
export function validateTeacherCode(code) {
    return TEACHER_CODES[code?.trim().toUpperCase()] || null;
}

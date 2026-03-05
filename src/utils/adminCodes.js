/**
 * Admin code → department mapping.
 * These codes are provided by the super-admin during onboarding.
 */
export const ADMIN_CODES = {
    INFRA_ADMIN_2026: 'infrastructure',
    HOSTEL_ADMIN_2026: 'hostel',
    TRANSPORT_ADMIN_2026: 'transport',
    ACADEMIC_ADMIN_2026: 'academic',
};

/**
 * Teacher code → class + branch mapping.
 * Each code grants access to one specific class.
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
};

/**
 * Returns the department for a given admin code, or null if invalid.
 */
export function validateAdminCode(code) {
    return ADMIN_CODES[code?.trim().toUpperCase()] || null;
}

/**
 * Returns { className, branch, section } for a given teacher code, or null if invalid.
 */
export function validateTeacherCode(code) {
    return TEACHER_CODES[code?.trim().toUpperCase()] || null;
}

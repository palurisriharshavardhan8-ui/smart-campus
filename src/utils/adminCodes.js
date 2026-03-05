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

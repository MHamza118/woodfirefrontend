const API_BASE_URL = 'https://woodfire.food/api/v1';

export const fetchCSRFCookie = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/sanctum/csrf-cookie`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch CSRF cookie: ${response.status}`);
        }

        return { success: true };
    } catch (error) {
        console.error('CSRF cookie fetch failed:', error);
        return { success: false, error: error.message };
    }
};

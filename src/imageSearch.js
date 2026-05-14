export const searchPerfectImage = async (query, adminToken) => {
    if (!query || !query.trim()) {
        throw new Error("Please enter an item name to search for images.");
    }
    
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    
    try {
        const response = await fetch(`${API_URL}/images/search?query=${encodeURIComponent(query.trim())}`, {
            headers: {
                'x-admin-token': adminToken
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch images');
        }
        
        return data.images || [];
    } catch (error) {
        console.error("Image search error:", error);
        throw error;
    }
};

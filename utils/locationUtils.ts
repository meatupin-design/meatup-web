export const STORE_LOCATION = {
    latitude: 8.5459,
    longitude: 76.9063, // Engineering College, Sreekaryam
};

// Haversine formula to calculate distance between two points
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
};

const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
};

export const calculateDeliveryTime = (distanceKm: number, isAlreadyRoadDistance: boolean = false): number => {
    // If it's already road distance (e.g. from Google Maps), don't multiply by 1.4
    const roadDistance = isAlreadyRoadDistance ? distanceKm : distanceKm * 1.4;

    const baseTime = 30; // 30 mins for first 7 km
    const baseDistance = 7;

    if (roadDistance <= baseDistance) {
        return baseTime;
    }

    const extraDistance = roadDistance - baseDistance;
    const extraTime = Math.ceil(extraDistance) * 3; // 3 mins per extra km

    return baseTime + extraTime;
};

export interface GoogleDistanceResponse {
    distanceKm: number;
    durationMins: number;
}

/**
 * Fetches real road distance and duration from Google Routes API (v2).
 * Note: Requires Routes API to be enabled in Google Cloud Console.
 */
export const getGoogleMapsDistance = async (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
    apiKey: string
): Promise<GoogleDistanceResponse | null> => {
    try {
        const url = 'https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix';
        const requestBody = {
            origins: [{ waypoint: { location: { latLng: { latitude: lat1, longitude: lon1 } } } }],
            destinations: [{ waypoint: { location: { latLng: { latitude: lat2, longitude: lon2 } } } }],
            travelMode: 'DRIVE',
            routingPreference: 'TRAFFIC_AWARE'
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
                'X-Goog-FieldMask': 'originIndex,destinationIndex,status,distanceMeters,duration'
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        // The response is an array of elements
        if (Array.isArray(data) && data.length > 0) {
            const result = data[0];
            
            if (result.condition === 'ROUTE_NOT_FOUND') {
                console.warn("Google Routes API: Route not found.");
                return null;
            }

            if (result.distanceMeters !== undefined && result.duration !== undefined) {
                // Duration is returned as a string like "123s"
                const durationSeconds = parseInt(result.duration.replace('s', ''));
                return {
                    distanceKm: result.distanceMeters / 1000,
                    durationMins: Math.ceil(durationSeconds / 60)
                };
            }
        }
        
        if (data.error || (Array.isArray(data) && data[0]?.error)) {
            console.warn("Google Routes API Error:", data.error || data[0].error);
        } else {
            console.warn("Google Routes API returned unexpected data format:", data);
        }
        return null;
    } catch (error) {
        console.error("Error fetching Google Routes distance:", error);
        return null;
    }
};

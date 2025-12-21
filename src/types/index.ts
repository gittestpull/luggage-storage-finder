export interface StorageLocation {
    _id: string;
    name: string;
    address: string;
    location: { coordinates: [number, number] };
    is24Hours?: boolean;
    isPremium?: boolean;
    smallPrice?: number;
    largePrice?: number;
    phoneNumber?: string;
    openTime?: string;
    closeTime?: string;
}

export interface User {
    _id: string;
    username: string;
    email?: string;
    points: number;
    isAdmin?: boolean;
}

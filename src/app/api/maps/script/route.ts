import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const callback = searchParams.get('callback') || 'initMap';
        const libraries = searchParams.get('libraries');

        let scriptUrl = `https://maps.googleapis.com/maps/api/js?key=${process.env.GOOGLE_MAPS_API_KEY}&callback=${callback}`;
        if (libraries) {
            scriptUrl += `&libraries=${libraries}`;
        }

        const response = await axios.get(scriptUrl);

        return new NextResponse(response.data, {
            headers: {
                'Content-Type': 'application/javascript',
            },
        });
    } catch (error) {
        console.error('Error fetching Google Maps script:', error);
        return NextResponse.json({ message: 'Error fetching Google Maps script' }, { status: 500 });
    }
}

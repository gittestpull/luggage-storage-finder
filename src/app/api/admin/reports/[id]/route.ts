import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/auth';
import Report from '@/models/Report';
import Storage from '@/models/Storage';
import User from '@/models/User';
import connectDB from '@/lib/db';
import axios from 'axios';

async function getGeocode(address: string) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    try {
        const response = await axios.get(url);
        if (response.data.status === 'OK') {
            const location = response.data.results[0].geometry.location;
            return { lat: location.lat, lng: location.lng };
        }
        return null;
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const admin = await verifyAdmin(req);
    if (!admin) {
        return NextResponse.json({ message: '권한이 없습니다.' }, { status: 403 });
    }

    try {
        await connectDB();
        const { id } = await params;
        const { status } = await req.json();

        const report = await Report.findByIdAndUpdate(
            id,
            { reportStatus: status },
            { new: true }
        ).populate('reportedBy');

        if (!report) {
            return NextResponse.json(
                { message: '제보를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        if (status === 'approved') {
            const { storageId, name, address, openTime, closeTime, is24Hours, smallPrice, largePrice, phoneNumber } = report;

            if (storageId) {
                // 기존 저장소 수정 요청인 경우
                const updateData: any = {
                    name,
                    address,
                    openTime,
                    closeTime,
                    is24Hours,
                    smallPrice,
                    largePrice,
                };

                if (phoneNumber) {
                    updateData.phoneNumber = phoneNumber;
                }

                // 주소가 변경된 경우에만 좌표 재계산
                const existingStorage = await Storage.findById(storageId);
                if (existingStorage && existingStorage.address !== address) {
                    const geocodeResult = await getGeocode(address);
                    if (geocodeResult) {
                        updateData.location = {
                            type: 'Point',
                            coordinates: [geocodeResult.lng, geocodeResult.lat],
                        };
                    }
                }

                await Storage.findByIdAndUpdate(storageId, updateData);
            } else {
                // 신규 저장소 등록인 경우
                const geocodeResult = await getGeocode(address);

                if (!geocodeResult) {
                    return NextResponse.json(
                        { message: '주소의 좌표를 찾을 수 없습니다.' },
                        { status: 400 }
                    );
                }

                const location = {
                    type: 'Point',
                    coordinates: [geocodeResult.lng, geocodeResult.lat],
                };

                await new Storage({
                    name,
                    address,
                    location,
                    openTime,
                    closeTime,
                    is24Hours,
                    smallPrice,
                    largePrice,
                    phoneNumber,
                }).save();
            }

            // 포인트 지급
            if (report.reportedBy) {
                const APPROVED_REPORT_POINTS = 100;
                report.reportedBy.approvedReportPoints += APPROVED_REPORT_POINTS;
                report.reportedBy.points =
                    report.reportedBy.submittedReportPoints +
                    report.reportedBy.approvedReportPoints;
                await report.reportedBy.save();
            }
        }

        return NextResponse.json(report);
    } catch (error) {
        console.error('Update report error:', error);
        return NextResponse.json({ message: '서버 오류' }, { status: 500 });
    }
}

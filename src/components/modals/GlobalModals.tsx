'use client';

import { useRouter } from 'next/navigation';
import { StorageLocation } from '@/types';
import AuthModal from './AuthModal';
import ReportModal from './ReportModal';
import PhotoScanModal from './PhotoScanModal';
import AiModal from './AiModal';

export default function GlobalModals() {
    const router = useRouter();

    const handleGoToLocation = (storage: StorageLocation) => {
        router.push(`/?storageId=${storage._id}`);
    };

    return (
        <>
            <AuthModal />
            <ReportModal />
            <PhotoScanModal />
            <AiModal goToMapLocation={handleGoToLocation} />
        </>
    );
}

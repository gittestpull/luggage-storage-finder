'use client';

import AuthModal from './AuthModal';
import ReportModal from './ReportModal';
import PhotoScanModal from './PhotoScanModal';

export default function GlobalModals() {
    return (
        <>
            <AuthModal />
            <ReportModal />
            <PhotoScanModal />
        </>
    );
}

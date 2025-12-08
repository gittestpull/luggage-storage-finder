'use client';

import AuthModal from './AuthModal';
import ReportModal from './ReportModal';
import PhotoScanModal from './PhotoScanModal';
import FeedbackModal from './FeedbackModal';

export default function GlobalModals() {
    return (
        <>
            <AuthModal />
            <ReportModal />
            <PhotoScanModal />
            <FeedbackModal />
        </>
    );
}

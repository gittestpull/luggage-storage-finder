'use client';

import axios from 'axios';

interface Report {
    _id: string;
    name: string;
    address: string;
    reportStatus: 'pending' | 'approved' | 'rejected';
    reportedBy?: { username: string };
    createdAt: string;
    description?: string;
    phoneNumber?: string;
}

interface ReportListProps {
    reports: Report[];
    onRefresh: () => void;
}

export default function ReportList({ reports, onRefresh }: ReportListProps) {
    const handleStatusChange = async (id: string, status: 'approved' | 'rejected') => {
        if (!confirm(`${status === 'approved' ? '승인' : '반려'} 하시겠습니까?`)) return;
        try {
            const token = localStorage.getItem('adminToken');
            await axios.patch(
                `/api/admin/reports/${id}`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            onRefresh();
        } catch (error) {
            alert('상태 변경 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">제보 관리</h2>
                    <p className="text-sm text-slate-500 mt-1">사용자들이 제보한 짐보관소를 검토하고 처리합니다.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">제보 정보 (이름/주소)</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">제보자</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">연락처 / 비고</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">상태</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">처리</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {reports.map((report) => (
                                <tr key={report._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900">{report.name}</span>
                                            <span className="text-sm text-gray-500 mt-0.5">{report.address}</span>
                                            <span className="text-xs text-gray-400 mt-1">{new Date(report.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs mr-3">
                                                {report.reportedBy?.username?.slice(0, 1) || '?'}
                                            </div>
                                            <div className="text-sm font-medium text-gray-900">
                                                {report.reportedBy?.username || '알 수 없음'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-600">{report.phoneNumber || '-'}</div>
                                        {report.description && (
                                            <div className="text-xs text-gray-400 mt-1 truncate max-w-xs" title={report.description}>
                                                {report.description}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span
                                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${report.reportStatus === 'approved'
                                                ? 'bg-green-50 text-green-700 border-green-200'
                                                : report.reportStatus === 'rejected'
                                                    ? 'bg-red-50 text-red-700 border-red-200'
                                                    : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                }`}
                                        >
                                            {report.reportStatus === 'approved'
                                                ? '승인됨'
                                                : report.reportStatus === 'rejected'
                                                    ? '반려됨'
                                                    : '대기중'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {report.reportStatus === 'pending' && (
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => handleStatusChange(report._id, 'approved')}
                                                    className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-green-700 transition-colors shadow-sm"
                                                >
                                                    승인
                                                </button>
                                                <button
                                                    onClick={() => handleStatusChange(report._id, 'rejected')}
                                                    className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-red-700 transition-colors shadow-sm"
                                                >
                                                    반려
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {reports.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                                        제보 목록이 비어있습니다.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

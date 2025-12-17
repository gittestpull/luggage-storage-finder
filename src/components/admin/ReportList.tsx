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
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow overflow-hidden">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            제보자
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            짐보관소 이름
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            주소
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            상태
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            관리
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {reports.map((report) => (
                        <tr key={report._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                    {report.reportedBy?.username || '알 수 없음'}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                    {report.name}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{report.address}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${report.reportStatus === 'approved'
                                            ? 'bg-green-100 text-green-800'
                                            : report.reportStatus === 'rejected'
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                        }`}
                                >
                                    {report.reportStatus === 'approved'
                                        ? '승인됨'
                                        : report.reportStatus === 'rejected'
                                            ? '반려됨'
                                            : '대기중'}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                {report.reportStatus === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => handleStatusChange(report._id, 'approved')}
                                            className="text-green-600 hover:text-green-900 mr-4"
                                        >
                                            승인
                                        </button>
                                        <button
                                            onClick={() => handleStatusChange(report._id, 'rejected')}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            반려
                                        </button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

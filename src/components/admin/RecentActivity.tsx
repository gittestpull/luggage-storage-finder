'use client';

interface Activity {
    _id: string;
    type: 'user' | 'report';
    username?: string; // For user join
    reportedBy?: { username: string }; // For report
    createdAt: string;
}

interface RecentActivityProps {
    activities: Activity[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">최근 활동</h2>
            <ul className="divide-y divide-gray-200">
                {activities.map((activity, index) => {
                    let message = '';
                    const date = new Date(activity.createdAt).toLocaleDateString();

                    if (activity.username) {
                        message = `${activity.username} 님이 가입했습니다.`;
                    } else if (activity.reportedBy) {
                        message = `${activity.reportedBy.username} 님이 새로운 제보를 등록했습니다.`;
                    } else {
                        message = '알 수 없는 활동입니다.';
                    }

                    return (
                        <li key={index} className="py-3 flex justify-between items-center">
                            <span className="text-gray-700">{message}</span>
                            <span className="text-sm text-gray-500">{date}</span>
                        </li>
                    );
                })}
                {activities.length === 0 && (
                    <li className="py-3 text-gray-500 text-center">
                        최근 활동이 없습니다.
                    </li>
                )}
            </ul>
        </div>
    );
}

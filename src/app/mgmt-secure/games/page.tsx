'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

interface Game {
    _id: string;
    gameId: string;
    name: string;
    description: string;
    isPaid: boolean;
    cost: number;
}

export default function GameManagement() {
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGames();
    }, []);

    const fetchGames = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.get('/api/admin/games', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGames(res.data);
        } catch (error) {
            console.error(error);
            alert('게임 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const updateGame = async (gameId: string, updates: Partial<Game>) => {
        try {
            const token = localStorage.getItem('adminToken');

            // Optimistic update
            setGames(prev => prev.map(g => g.gameId === gameId ? { ...g, ...updates } : g));

            await axios.post('/api/admin/games', {
                gameId,
                ...updates
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

        } catch (error) {
            console.error(error);
            alert('설정 저장 실패');
            fetchGames(); // Revert
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">게임 관리</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {games.map(game => (
                    <div key={game._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{game.name}</h3>
                                <p className="text-sm text-gray-500 mt-1">{game.description}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${game.isPaid ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                }`}>
                                {game.isPaid ? '유료' : '무료'}
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700">유료 게임 설정</label>
                                <button
                                    onClick={() => updateGame(game.gameId, { isPaid: !game.isPaid })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${game.isPaid ? 'bg-blue-600' : 'bg-gray-200'
                                        }`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${game.isPaid ? 'translate-x-6' : 'translate-x-1'
                                        }`} />
                                </button>
                            </div>

                            {game.isPaid && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        게임 비용 (포인트)
                                    </label>
                                    <input
                                        type="number"
                                        value={game.cost}
                                        onChange={(e) => updateGame(game.gameId, { cost: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        min="0"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

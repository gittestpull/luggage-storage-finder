import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold text-white">짐보관소</span>
                        </div>
                        <p className="text-gray-400 max-w-md">전국 짐보관소를 쉽고 빠르게 찾아보세요. AI 기반 추천 시스템으로 최적의 보관 장소를 안내해드립니다.</p>
                    </div>
                    <div>
                        <h4 className="text-white font-semibold mb-4">서비스</h4>
                        <ul className="space-y-2">
                            <li><Link href="/" className="hover:text-white transition-colors">짐보관소 찾기</Link></li>
                            <li><Link href="/news" className="hover:text-white transition-colors">여행 뉴스</Link></li>
                            <li><Link href="#faq" className="hover:text-white transition-colors">자주 묻는 질문</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-semibold mb-4">고객지원</h4>
                        <ul className="space-y-2">
                            <li><Link href="/privacy" className="hover:text-white transition-colors">개인정보처리방침</Link></li>
                            <li><Link href="/terms" className="hover:text-white transition-colors">이용약관</Link></li>
                            <li><Link href="/contact" className="hover:text-white transition-colors">문의하기</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
                    <p>© 2024 짐보관소. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}

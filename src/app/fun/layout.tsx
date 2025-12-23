import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '미니게임 천국',
    description: '심심할 때 즐기는 짐가방 미니게임! 스카이 패커, 슈팅 게임, 농사짓기 등 다양한 포인트를 모아보세요!',
    openGraph: {
        title: '미니게임 천국 - 무료로 즐기는 킬링타임!',
        description: '심심할 때 즐기는 짐가방 미니게임! 스카이 패커, 슈팅 게임 등 다양한 게임을 무료로 즐겨보세요.',
        url: '/fun',
        images: [
            {
                url: '/images/logo.png', // Fallback to logo, or better if we had a game screenshot
                width: 800,
                height: 800,
                alt: '짐가방 미니게임',
            },
        ],
    },
};

export default function FunLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}

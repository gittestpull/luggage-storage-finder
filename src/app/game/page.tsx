'use client';

import NightmareGame from './NightmareGame';

/**
 * Standard Next.js Page wrapper.
 * This ensures strict type compatibility with Next.js router,
 * while delgating the logic to the component that can accept custom props.
 */
export default function GamePage() {
  return <NightmareGame />;
}

'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// 动态导入游戏组件，避免SSR问题
const GameCanvas = dynamic(() => import('@/components/game/GameCanvas'), { ssr: false });
const HUD = dynamic(() => import('@/components/game/HUD'), { ssr: false });

export default function Home() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-black relative">
      <GameCanvas />
      <HUD />
    </div>
  );
}

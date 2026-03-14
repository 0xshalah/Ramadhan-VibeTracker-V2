"use client";
import React, { useMemo } from 'react';
import { ReactFlow, Background, Controls, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Custom Node untuk Hari Ramadhan (Mirip CustomNode.tsx di SkillBridge)
const DayNode = ({ data }) => (
  <div className={`p-4 rounded-2xl border-2 shadow-lg backdrop-blur-md ${data.completed ? 'bg-emerald-500/20 border-emerald-500' : 'bg-slate-800/50 border-slate-700'}`}>
    <h3 className="font-bold text-white">Hari {data.day}</h3>
    <p className="text-xs text-slate-300">{data.completed ? '✅ Selesai' : '🔒 Terkunci'}</p>
  </div>
);

const nodeTypes = { dayNode: DayNode };

export default function JourneyCanvas({ currentDay, totalDays = 30 }) {
  // Otomatis membuat titik perjalanan
  const nodes = useMemo(() => Array.from({ length: totalDays }).map((_, i) => ({
    id: `day-${i + 1}`,
    type: 'dayNode',
    position: { x: (i % 5) * 200, y: Math.floor(i / 5) * 150 }, // Pola Zig-zag
    data: { day: i + 1, completed: i + 1 < currentDay }
  })), [currentDay]);

  // Menghubungkan antar hari dengan garis panah
  const edges = useMemo(() => Array.from({ length: totalDays - 1 }).map((_, i) => ({
    id: `e-${i + 1}-${i + 2}`,
    source: `day-${i + 1}`,
    target: `day-${i + 2}`,
    animated: i + 1 === currentDay - 1, // Animasi mengalir di hari ini
    style: { stroke: '#10b981', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
  })), [currentDay]);

  return (
    <div className="h-[500px] w-full rounded-3xl overflow-hidden border border-slate-800">
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView theme="dark">
        <Background color="#334155" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
}

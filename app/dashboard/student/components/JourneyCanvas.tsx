"use client";
import React, { useMemo, useState } from 'react';
import { ReactFlow, Background, Controls, MarkerType, NodeProps, Node, Edge, MiniMap } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

type DayNodeData = {
  day: number;
  completed: boolean;
  prayers: number;
  tilawah: number;
  sunnah: number;
  streak: number;
};

// Custom Node untuk Hari Ramadhan (Mirip CustomNode.tsx di SkillBridge)
const DayNode = ({ data }: NodeProps<Node<DayNodeData>>) => {
  const [isHovered, setIsHovered] = useState(false);

  // Determine visual indicators based on performance
  const prayerPercentage = data.prayers / 5;
  const tilawahPercentage = data.tilawah / 20;
  const sunnahPercentage = data.sunnah / 3;

  let nodeColor = 'bg-slate-800/50 border-slate-700';
  if (data.completed) {
    if (prayerPercentage >= 0.8 && tilawahPercentage >= 0.8 && sunnahPercentage >= 0.8) {
      nodeColor = 'bg-gradient-to-br from-emerald-600/30 to-teal-500/30 border-emerald-500';
    } else if (prayerPercentage >= 0.5 && tilawahPercentage >= 0.5) {
      nodeColor = 'bg-gradient-to-br from-amber-600/20 to-yellow-500/20 border-amber-500';
    } else {
      nodeColor = 'bg-gradient-to-br from-slate-700/50 to-slate-600/50 border-slate-600';
    }
  }

  // Determine emoji based on performance
  let dayEmoji = '🔒';
  if (data.completed) {
    if (prayerPercentage >= 0.8 && tilawahPercentage >= 0.8 && sunnahPercentage >= 0.8) {
      dayEmoji = '🌟'; // Excellent
    } else if (prayerPercentage >= 0.5 && tilawahPercentage >= 0.5) {
      dayEmoji = '👍'; // Good
    } else {
      dayEmoji = '💪'; // Needs improvement
    }
  }

  return (
    <div
      className={`p-4 rounded-2xl border-2 shadow-lg backdrop-blur-md transition-all duration-300 ${nodeColor} ${isHovered ? 'ring-2 ring-white/50 scale-110 z-10' : ''
        }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-white">Day {data.day}</h3>
          <p className="text-xs text-slate-300">{data.completed ? '✅ Completed' : '🔒 Locked'}</p>
        </div>
        <span className="text-lg">{dayEmoji}</span>
      </div>

      {data.completed && (
        <div className="mt-3 grid grid-cols-3 gap-1">
          <div className="text-center">
            <div className="text-xs text-slate-400">Prayers</div>
            <div className="text-xs font-bold text-blue-400">{data.prayers}/5</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400">Tilawah</div>
            <div className="text-xs font-bold text-green-400">{data.tilawah}/20</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-slate-400">Sunnah</div>
            <div className="text-xs font-bold text-purple-400">{data.sunnah}/3</div>
          </div>
        </div>
      )}

      {isHovered && data.completed && (
        <div className="absolute -top-24 left-0 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-xl p-3 w-48 z-20 shadow-xl">
          <div className="text-xs font-bold text-white mb-2">Day {data.day} Performance</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Prayers:</span>
              <span className="text-blue-400">{data.prayers}/5 ({Math.round(prayerPercentage * 100)}%)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tilawah:</span>
              <span className="text-green-400">{data.tilawah}/20 ({Math.round(tilawahPercentage * 100)}%)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Sunnah:</span>
              <span className="text-purple-400">{data.sunnah}/3 ({Math.round(sunnahPercentage * 100)}%)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Streak Bonus:</span>
              <span className="text-orange-400">+{data.streak * 10} XP</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const nodeTypes = { dayNode: DayNode };

interface JourneyCanvasProps {
  currentDay: number;
  totalDays?: number;
}

export default function JourneyCanvas({ currentDay, totalDays = 30 }: JourneyCanvasProps) {
  // Generate mock data for daily achievements
  const nodes: Node<DayNodeData>[] = useMemo(() => {
    return Array.from({ length: totalDays }).map((_, i) => {
      const day = i + 1;
      const completed = day < currentDay;

      // Generate mock data based on day status
      let prayers = 0, tilawah = 0, sunnah = 0, streak = 0;

      if (completed) {
        // Past days: simulate achievement completion
        prayers = Math.min(5, Math.floor(Math.random() * 6));
        tilawah = Math.min(20, Math.floor(Math.random() * 21));
        sunnah = Math.min(3, Math.floor(Math.random() * 4));
        streak = day <= 7 ? 0 : day <= 14 ? 1 : day <= 21 ? 2 : 3;
      } else if (day === currentDay) {
        // Current day: partial progress
        prayers = Math.min(5, Math.floor(Math.random() * 3) + 1);
        tilawah = Math.min(20, Math.floor(Math.random() * 10) + 1);
        sunnah = Math.floor(Math.random() * 2);
        streak = day <= 7 ? 0 : day <= 14 ? 1 : day <= 21 ? 2 : 3;
      }

      return {
        id: `day-${day}`,
        type: 'dayNode',
        position: { x: (i % 5) * 220, y: Math.floor(i / 5) * 180 }, // Pola Zig-zag
        data: { day, completed, prayers, tilawah, sunnah, streak }
      };
    });
  }, [currentDay, totalDays]);

  // Menghubungkan antar hari dengan garis panah
  const edges: Edge[] = useMemo(() => {
    return Array.from({ length: totalDays - 1 }).map((_, i) => ({
      id: `e-${i + 1}-${i + 2}`,
      source: `day-${i + 1}`,
      target: `day-${i + 2}`,
      animated: i + 1 === currentDay - 1, // Animasi mengalir di hari ini
      style: {
        stroke: i + 1 < currentDay - 1 ? '#10b981' : '#f59e0b', // Green for completed, amber for current
        strokeWidth: i + 1 === currentDay - 1 ? 3 : 2
      },
      markerEnd: { type: MarkerType.ArrowClosed, color: i + 1 === currentDay - 1 ? '#f59e0b' : '#10b981' },
    }));
  }, [currentDay, totalDays]);

  return (
    <div className="w-full rounded-3xl overflow-hidden border border-slate-800 bg-slate-900/50 p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-white text-lg">Ramadan Journey Canvas</h3>
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-300">
            Day <span className="font-bold text-amber-400">{currentDay}</span> of <span className="font-bold text-white">{totalDays}</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-slate-400">Completed</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span className="text-slate-400">Current</span>
          </div>
        </div>
      </div>

      <div className="h-[500px] w-full rounded-2xl overflow-hidden border border-slate-700">
        <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView colorMode="dark">
          <Background color="#334155" gap={16} />
          <Controls />
          <MiniMap
            nodeColor={(n) => {
              if (n.data?.completed) {
                const data = n.data as any;
                const prayerPercentage = (data.prayers || 0) / 5;
                const tilawahPercentage = (data.tilawah || 0) / 20;
                if (prayerPercentage >= 0.8 && tilawahPercentage >= 0.8) {
                  return '#10b981'; // emerald
                } else if (prayerPercentage >= 0.5 && tilawahPercentage >= 0.5) {
                  return '#f59e0b'; // amber
                } else {
                  return '#64748b'; // slate
                }
              }
              return '#334155'; // default slate
            }}
          />
        </ReactFlow>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-800/50 p-3 rounded-xl">
          <div className="text-xs text-slate-400 mb-1">Overall Progress</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-amber-500"
                style={{ width: `${Math.round((currentDay / totalDays) * 100)}%` }}
              ></div>
            </div>
            <span className="text-sm font-bold text-white">{Math.round((currentDay / totalDays) * 100)}%</span>
          </div>
        </div>
        <div className="bg-slate-800/50 p-3 rounded-xl">
          <div className="text-xs text-slate-400 mb-1">Best Performance</div>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-emerald-400 text-sm">star</span>
            <span className="text-sm font-bold text-white">Day {Math.min(currentDay, 15)}</span>
          </div>
        </div>
        <div className="bg-slate-800/50 p-3 rounded-xl">
          <div className="text-xs text-slate-400 mb-1">Current Streak</div>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-orange-400 text-sm">local_fire_department</span>
            <span className="text-sm font-bold text-white">{currentDay >= 21 ? '🔥 Epic!' :
              currentDay >= 14 ? '🔥 Great!' :
                currentDay >= 7 ? '🔥 Good' :
                  'Starting...'}</span>
          </div>
        </div>
        <div className="bg-slate-800/50 p-3 rounded-xl">
          <div className="text-xs text-slate-400 mb-1">Avg. Daily XP</div>
          <div className="flex items-center gap-1">
            <span className="material-symbols-outlined text-amber-400 text-sm">diamond</span>
            <span className="text-sm font-bold text-white">{Math.floor(currentDay * 25)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

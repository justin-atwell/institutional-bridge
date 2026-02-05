'use client';
import { useEffect, useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';

export default function TechnicalTerminal({ programId }: { programId: string }) {
  const { connection } = useConnection();
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // This is the "Magic" — it listens to your program in real-time
    const subId = connection.onLogs(new PublicKey(programId), (logs) => {
      setLogs((prev) => [...logs.logs, ...prev].slice(0, 50));
    });
    return () => connection.removeOnLogsListener(subId);
  }, [connection, programId]);

  return (
    <div className="bg-slate-900 border border-emerald-500/30 rounded-lg p-4 font-mono text-xs overflow-hidden h-[400px]">
      <div className="text-emerald-500 mb-2 border-b border-emerald-500/20 pb-1">
        &gt; SVM_LIVE_LOG_STREAM_V1.0
      </div>
      <div className="overflow-y-auto h-full space-y-1 scrollbar-hide">
        {logs.map((log, i) => (
          <div key={i} className="opacity-80 hover:opacity-100 transition-opacity">
            <span className="text-emerald-700 mr-2">[{new Date().toLocaleTimeString()}]</span>
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}
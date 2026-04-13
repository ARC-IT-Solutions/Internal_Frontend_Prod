'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { AuditLog, Paginated } from '@/types';
import { Select } from '@/components/ui';
import { fullDate, relTime } from '@/lib/utils';
import { Shield, RefreshCw } from 'lucide-react';

const ACTIONS = [
  'CREATE','UPDATE','DELETE','STATUS_CHANGE','PRIORITY_CHANGE',
  'ASSIGN','LOGIN','LOGOUT','LOGIN_FAILED','FILE_UPLOAD','FILE_DOWNLOAD','PASSWORD_CHANGE',
];

const ENTITIES = ['user','project','project_request','inquiry','ticket','invoice','auth'];

const ACTION_STYLE: Record<string, { bg: string; text: string }> = {
  CREATE:          { bg: 'rgba(63,185,80,.1)',   text: '#5cb85c' },
  DELETE:          { bg: 'rgba(248,81,73,.1)',   text: '#f85149' },
  LOGIN_FAILED:    { bg: 'rgba(248,81,73,.1)',   text: '#f85149' },
  UPDATE:          { bg: 'rgba(56,139,253,.1)',  text: '#388bfd' },
  STATUS_CHANGE:   { bg: 'rgba(56,139,253,.1)',  text: '#388bfd' },
  PRIORITY_CHANGE: { bg: 'rgba(56,139,253,.1)',  text: '#388bfd' },
  ASSIGN:          { bg: 'rgba(56,139,253,.1)',  text: '#388bfd' },
  LOGIN:           { bg: 'rgba(240,136,62,.1)',  text: '#f0883e' },
  LOGOUT:          { bg: 'rgba(255,255,255,.05)', text: '#484f58' },
  FILE_UPLOAD:     { bg: 'rgba(163,113,247,.1)', text: '#a371f7' },
  FILE_DOWNLOAD:   { bg: 'rgba(163,113,247,.1)', text: '#a371f7' },
  PASSWORD_CHANGE: { bg: 'rgba(240,136,62,.1)',  text: '#f0883e' },
};

export function AuditClient({ logs }: { logs: Paginated<AuditLog> }) {
  const router = useRouter();
  const [action,     setAction]     = useState('');
  const [entityType, setEntityType] = useState('');

  function applyFilters() {
    const p = new URLSearchParams();
    if (action)     p.set('action', action);
    if (entityType) p.set('entity_type', entityType);
    router.push(`/audit?${p.toString()}`);
  }

  const s = (a: string) => ACTION_STYLE[a] ?? { bg: 'rgba(255,255,255,.04)', text: '#484f58' };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-white/[0.08] flex items-center gap-4 bg-[#161b22]">
        <Shield size={15} className="text-[#f0883e]" />
        <div>
          <h1 className="text-sm font-semibold text-[#e6edf3]">Audit Logs</h1>
          <p className="text-[11px] text-[#484f58] mt-0.5">{logs.total.toLocaleString()} total records</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Select value={action} onChange={e => setAction(e.target.value)} className="text-[11px] h-8">
            <option value="">All Actions</option>
            {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
          </Select>
          <Select value={entityType} onChange={e => setEntityType(e.target.value)} className="text-[11px] h-8">
            <option value="">All Entities</option>
            {ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
          </Select>
          <button onClick={applyFilters}
            className="h-8 w-8 flex items-center justify-center rounded-md border border-white/[0.08] text-[#8b949e] hover:text-[#e6edf3] hover:bg-white/[0.04] transition-colors">
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Log list */}
      <div className="flex-1 overflow-y-auto">
        {logs.items.length === 0 && (
          <div className="flex items-center justify-center py-24 text-[#484f58] text-sm">No audit logs found.</div>
        )}
        {logs.items.map(log => (
          <div key={log.id} className="flex items-start gap-4 px-6 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
            {/* Action badge */}
            <div className="flex-shrink-0 w-28 mt-0.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold"
                style={{ background: s(log.action).bg, color: s(log.action).text }}>
                {log.action}
              </span>
            </div>

            {/* Body */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-[#e6edf3] truncate">{log.description ?? '—'}</p>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-[11px] font-mono text-[#484f58]">{log.entity_type}</span>
                {log.entity_id && (
                  <span className="text-[11px] font-mono text-[#484f58]">{log.entity_id.slice(0, 12)}…</span>
                )}
                {log.ip_address && (
                  <span className="text-[11px] font-mono text-[#484f58]">{log.ip_address}</span>
                )}
              </div>
            </div>

            {/* Time */}
            <div className="flex-shrink-0 text-right">
              <p className="text-[11px] font-mono text-[#484f58]">{relTime(log.timestamp)}</p>
              <p className="text-[10px] text-[#3d3d3d] mt-0.5">{fullDate(log.timestamp).split(' · ')[1]}</p>
            </div>
          </div>
        ))}

        {/* Pagination */}
        {logs.total_pages > 1 && (
          <div className="flex items-center justify-center gap-3 py-6">
            {logs.page > 1 && (
              <button onClick={() => router.push(`/audit?page=${logs.page - 1}`)}
                className="px-4 py-2 rounded-md border border-white/[0.08] text-[12px] text-[#8b949e] hover:text-[#e6edf3] hover:bg-white/[0.04] transition-colors">
                ← Previous
              </button>
            )}
            <span className="text-[12px] text-[#484f58] font-mono">
              Page {logs.page} / {logs.total_pages}
            </span>
            {logs.page < logs.total_pages && (
              <button onClick={() => router.push(`/audit?page=${logs.page + 1}`)}
                className="px-4 py-2 rounded-md border border-white/[0.08] text-[12px] text-[#8b949e] hover:text-[#e6edf3] hover:bg-white/[0.04] transition-colors">
                Next →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

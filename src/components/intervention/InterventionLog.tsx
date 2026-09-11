import React from 'react';
import { InterventionRecord } from '../../types/dataTypes';
import { History, CheckCircle2, XCircle, Trash2, Download } from 'lucide-react';

interface InterventionLogProps {
  records: InterventionRecord[];
  onClearLog: () => void;
}

export const InterventionLog: React.FC<InterventionLogProps> = ({
  records,
  onClearLog
}) => {
  const exportLog = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `intervention_audit_log_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <History className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Auditable Intervention Decision Log
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Section 8
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Session audit trail recording all faculty approvals and overrides ({records.length} logged actions)
            </p>
          </div>
        </div>

        {records.length > 0 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={exportLog}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Audit JSON</span>
            </button>

            <button
              onClick={onClearLog}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Log</span>
            </button>
          </div>
        )}
      </div>

      {/* Log Body */}
      {records.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 space-y-1">
          <p className="text-xs font-bold text-slate-700">No Interventions Logged In This Session</p>
          <p className="text-[11px] text-slate-400">
            Select a student case above, review the recommended remediation, and click Approve or Reject to record an audit entry.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-2.5">Timestamp</th>
                <th className="px-4 py-2.5">Student</th>
                <th className="px-4 py-2.5">Course / CO</th>
                <th className="px-4 py-2.5">Remediation Strategy</th>
                <th className="px-4 py-2.5">Priority</th>
                <th className="px-4 py-2.5">Decision</th>
                <th className="px-4 py-2.5">Faculty Clinical Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {records.slice().reverse().map((rec) => {
                const isApproved = rec.status === 'Approved';

                return (
                  <tr key={rec.interventionId} className="hover:bg-slate-50">
                    {/* Timestamp */}
                    <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(rec.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>

                    {/* Student */}
                    <td className="px-4 py-2.5 font-bold font-mono text-slate-900">
                      {rec.studentId}
                    </td>

                    {/* Course / CO */}
                    <td className="px-4 py-2.5 font-medium text-slate-700">
                      <span>{rec.courseId}</span>
                      <span className="text-slate-400 block text-[10px]">{rec.coId}</span>
                    </td>

                    {/* Strategy & Topic */}
                    <td className="px-4 py-2.5">
                      <div className="font-bold text-slate-800">{rec.interventionType}</div>
                      <div className="text-[11px] text-slate-500">{rec.topic}</div>
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-2.5 font-mono text-[11px] font-semibold">
                      {rec.priority}
                    </td>

                    {/* Decision */}
                    <td className="px-4 py-2.5">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                          isApproved
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {isApproved ? (
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <XCircle className="h-3 w-3 text-rose-600" />
                        )}
                        {rec.status}
                      </span>
                    </td>

                    {/* Notes */}
                    <td className="px-4 py-2.5 text-[11px] text-slate-600 max-w-xs truncate" title={rec.facultyNotes}>
                      {rec.facultyNotes || <span className="italic text-slate-400">None provided</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};


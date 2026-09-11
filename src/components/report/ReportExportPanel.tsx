import React from 'react';
import { FullCOIntelligenceReport } from '../../types/dataTypes';
import { Download, Printer, FileSpreadsheet, FileJson, CheckCircle2 } from 'lucide-react';

interface ReportExportPanelProps {
  report: FullCOIntelligenceReport;
}

export const ReportExportPanel: React.FC<ReportExportPanelProps> = ({ report }) => {
  // Export complete JSON payload
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const anchor = document.createElement('a');
    anchor.setAttribute('href', dataStr);
    anchor.setAttribute('download', `${report.reportId}_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  // Export CO Executive Summary CSV
  const handleExportCOCSV = () => {
    const headers = [
      'CO_ID',
      'Course_ID',
      'Attainment_Pct',
      'Target_Threshold_Pct',
      'Gap_Percentage_Points',
      'Compliance_Status',
      'Unique_Students',
      'Unique_Topics',
      'Unique_Assessments',
      'Total_Observations'
    ];

    const rows = report.coExecutiveSummary.map(item => [
      item.coId,
      item.courseId,
      item.attainmentPct !== null ? item.attainmentPct.toFixed(1) : '',
      item.targetThreshold !== null ? item.targetThreshold.toString() : '',
      item.gapPct !== null ? item.gapPct.toFixed(1) : '',
      item.status,
      item.totalStudents,
      item.uniqueTopicsCount,
      item.uniqueAssessmentsCount,
      item.totalObservations
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.setAttribute('href', url);
    anchor.setAttribute('download', `co_executive_summary_${report.courseMeta.courseId}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  // Export Intervention & Reassessment CSV
  const handleExportInterventionCSV = () => {
    const headers = [
      'Intervention_ID',
      'Student_ID',
      'Course_ID',
      'CO_ID',
      'Topic',
      'Priority',
      'Intervention_Type',
      'Pre_Attainment_Pct',
      'Post_Attainment_Pct',
      'Absolute_Gain_pp',
      'Target_Achieved',
      'Effectiveness_Status',
      'Reassessment_Cycle'
    ];

    const rows = report.interventionOutcomes.records.map(r => [
      r.interventionId,
      r.studentId,
      r.courseId,
      r.coId,
      r.topic,
      r.priority,
      r.interventionType,
      r.preAttainmentPct !== null ? r.preAttainmentPct.toFixed(1) : '',
      r.postAttainmentPct !== null ? r.postAttainmentPct.toFixed(1) : '',
      r.absoluteGainPp !== null ? r.absoluteGainPp.toFixed(1) : '',
      r.targetAchieved ? 'TRUE' : 'FALSE',
      r.effectivenessStatus,
      r.reassessmentAssessmentId || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.setAttribute('href', url);
    anchor.setAttribute('download', `intervention_reassessment_outcomes_${report.courseMeta.courseId}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  // Print view
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-slate-900 text-white rounded-xl shadow-sm border border-slate-800 p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Download className="h-4 w-4 text-indigo-400" />
            Accreditation Export & Institutional Artifact Generation
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              Section 12
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Export validated intelligence summaries for faculty boards, accreditation bodies, and continuous improvement dossiers.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          <span>Audit Provenance Ready</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        {/* Full JSON Export */}
        <button
          onClick={handleExportJSON}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition cursor-pointer"
        >
          <FileJson className="h-4 w-4" />
          <span>Export Full Report (JSON)</span>
        </button>

        {/* CO Summary CSV */}
        <button
          onClick={handleExportCOCSV}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
        >
          <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
          <span>Export CO Summary (CSV)</span>
        </button>

        {/* Intervention CSV */}
        <button
          onClick={handleExportInterventionCSV}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
        >
          <FileSpreadsheet className="h-4 w-4 text-indigo-400" />
          <span>Export Intervention Outcomes (CSV)</span>
        </button>

        {/* Print / PDF view */}
        <button
          onClick={handlePrint}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
        >
          <Printer className="h-4 w-4 text-slate-300" />
          <span>Print / Save as PDF</span>
        </button>
      </div>
    </div>
  );
};


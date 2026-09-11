import React from 'react';
import {
  BarChart3,
  Users,
  FileCheck2,
  HelpCircle,
  FolderTree,
  Target,
  Percent,
  CalendarDays,
  Filter,
  Layers
} from 'lucide-react';
import { DatasetStats } from '../types/dataTypes';

interface DatasetStatisticsProps {
  stats: DatasetStats;
  overallStats: DatasetStats;
  selectedCourse: string;
  onSelectCourse: (course: string) => void;
}

export const DatasetStatistics: React.FC<DatasetStatisticsProps> = ({
  stats,
  overallStats,
  selectedCourse,
  onSelectCourse
}) => {
  const isFiltered = selectedCourse !== 'ALL';

  const statCards = [
    {
      label: isFiltered ? 'Selected Records' : 'Total Records',
      value: stats.totalRecords.toLocaleString(),
      subtext: isFiltered
        ? `of ${overallStats.totalRecords.toLocaleString()} uploaded`
        : 'Across all courses',
      icon: FileCheck2,
      color: 'bg-blue-50 text-blue-600 border-blue-200'
    },
    {
      label: isFiltered ? 'Course Students' : 'Total Students',
      value: stats.uniqueStudents.toString(),
      subtext: isFiltered
        ? `of ${overallStats.uniqueStudents} enrolled`
        : 'Anonymized IDs',
      icon: Users,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200'
    },
    {
      label: 'Assessments',
      value: stats.uniqueAssessments.length.toString(),
      subtext: stats.uniqueAssessments.join(', ') || 'None',
      icon: CalendarDays,
      color: 'bg-purple-50 text-purple-600 border-purple-200'
    },
    {
      label: 'Questions',
      value: stats.uniqueQuestions.toString(),
      subtext: isFiltered
        ? `of ${overallStats.uniqueQuestions} in taxonomy`
        : 'Curricular questions',
      icon: HelpCircle,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200'
    },
    {
      label: 'Topics',
      value: stats.uniqueTopics.toString(),
      subtext: isFiltered
        ? `of ${overallStats.uniqueTopics} in syllabus`
        : 'Granular concepts',
      icon: FolderTree,
      color: 'bg-teal-50 text-teal-600 border-teal-200'
    },
    {
      label: 'Course Outcomes',
      value: stats.uniqueCOs.length.toString(),
      subtext: stats.uniqueCOs.join(', ') || 'None',
      icon: Target,
      color: 'bg-amber-50 text-amber-600 border-amber-200'
    },
    {
      label: 'Marks Baseline',
      value: stats.totalRecords > 0 ? `${stats.averageMarksRatio}%` : '—',
      subtext: 'Mean score ratio',
      icon: Percent,
      color: 'bg-rose-50 text-rose-600 border-rose-200'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all">
      {/* Header with Scope Label and Course Filter Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                {isFiltered
                  ? `SECTION 5 — SELECTED COURSE STATISTICS: ${selectedCourse}`
                  : 'SECTION 5 — UPLOADED DATASET STATISTICS (COMPLETE DATASET)'}
              </h2>
              {isFiltered ? (
                <span className="bg-blue-100 text-blue-800 text-[10px] font-semibold px-2 py-0.5 rounded border border-blue-200 uppercase">
                  Filtered View
                </span>
              ) : (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-200 uppercase">
                  Complete Scope
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Dynamically derived dimensional metrics from validated academic data
            </p>
          </div>
        </div>

        {/* Course Scope Switcher */}
        {overallStats.uniqueCourses.length > 0 && (
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg text-xs self-start lg:self-center">
            <span className="text-slate-500 text-[11px] font-medium px-1.5 flex items-center">
              <Filter className="h-3 w-3 mr-1" />
              Scope:
            </span>
            <button
              type="button"
              onClick={() => onSelectCourse('ALL')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                selectedCourse === 'ALL'
                  ? 'bg-white text-indigo-700 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Courses ({overallStats.totalRecords.toLocaleString()})
            </button>
            {overallStats.uniqueCourses.map(course => (
              <button
                key={course}
                type="button"
                onClick={() => onSelectCourse(course)}
                className={`px-2.5 py-1 rounded-md font-medium transition font-mono ${
                  selectedCourse === course
                    ? 'bg-white text-indigo-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {course}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Explanatory Scope Banner */}
      {isFiltered ? (
        <div className="mb-4 p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <span>
              <strong>Course Filter Active:</strong> Showing statistics for <strong>{selectedCourse}</strong> ({stats.totalRecords.toLocaleString()} records). 
              The remaining {overallStats.totalRecords - stats.totalRecords} records are preserved in memory.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onSelectCourse('ALL')}
            className="text-blue-700 font-bold underline hover:text-blue-900 whitespace-nowrap ml-3"
          >
            Show All {overallStats.totalRecords.toLocaleString()} Records
          </button>
        </div>
      ) : (
        <div className="mb-4 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-center space-x-2">
          <FileCheck2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>
            <strong>Complete Uploaded Scope:</strong> Displaying all {overallStats.totalRecords.toLocaleString()} records across {overallStats.uniqueCourses.length} courses ({overallStats.uniqueCourses.join(', ')}).
          </span>
        </div>
      )}

      {/* Dimensional Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {statCards.map(item => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {item.label}
                </span>
                <div className={`p-1.5 rounded-lg ${item.color} border`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
              </div>
              <div>
                <span className="text-xl font-extrabold text-slate-900 tracking-tight font-mono">
                  {item.value}
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate font-medium">{item.subtext}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React from 'react';
import { BookOpen, Layers, Calendar, Users } from 'lucide-react';
import { CourseMetadata } from '../types/dataTypes';

interface CourseInfoSectionProps {
  courseMeta: CourseMetadata;
  onChange: (meta: CourseMetadata) => void;
  detectedCourses: string[];
}

export const CourseInfoSection: React.FC<CourseInfoSectionProps> = ({
  courseMeta,
  onChange,
  detectedCourses
}) => {
  const handleFieldChange = (field: keyof CourseMetadata, value: string) => {
    onChange({
      ...courseMeta,
      [field]: value
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">SECTION 1 — COURSE INFORMATION</h2>
            <p className="text-xs text-slate-500">Configure academic course context and analytical scope</p>
          </div>
        </div>

        {detectedCourses.length > 0 && (
          <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center space-x-2">
            <span className="text-slate-400">Courses in Dataset:</span>
            {detectedCourses.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => handleFieldChange('courseId', c)}
                className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] transition ${
                  courseMeta.courseId === c
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                {c}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleFieldChange('courseId', 'ALL')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                courseMeta.courseId === 'ALL'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
              }`}
            >
              All Courses
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
            Course Scope / ID *
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Layers className="h-4 w-4" />
            </div>
            {detectedCourses.length > 1 ? (
              <select
                value={courseMeta.courseId}
                onChange={e => handleFieldChange('courseId', e.target.value)}
                className="block w-full pl-9 pr-8 py-2 text-sm border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 font-medium"
              >
                <option value="ALL">All Courses ({detectedCourses.join(', ')})</option>
                {detectedCourses.map(c => (
                  <option key={c} value={c}>
                    {c} {c === 'CS301' ? '(Operating Systems)' : c === 'CS302' ? '(Database Systems)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={courseMeta.courseId}
                onChange={e => handleFieldChange('courseId', e.target.value.toUpperCase())}
                placeholder="e.g. CS301"
                className="block w-full pl-9 pr-3 py-2 text-sm border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 font-mono"
              />
            )}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {courseMeta.courseId === 'ALL' ? 'Analyzing entire uploaded dataset' : `Filtered to ${courseMeta.courseId}`}
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
            Course Title
          </label>
          <input
            type="text"
            value={courseMeta.courseName}
            onChange={e => handleFieldChange('courseName', e.target.value)}
            placeholder="e.g. Operating Systems"
            className="block w-full px-3 py-2 text-sm border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="mt-1 text-[11px] text-slate-400">Curriculum subject name</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
            Semester
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Calendar className="h-4 w-4" />
            </div>
            <select
              value={courseMeta.semester}
              onChange={e => handleFieldChange('semester', e.target.value)}
              className="block w-full pl-9 pr-3 py-2 text-sm border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                <option key={s} value={s.toString()}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Academic semester</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
            Section / Cohort
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Users className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={courseMeta.section}
              onChange={e => handleFieldChange('section', e.target.value)}
              placeholder="e.g. Section A"
              className="block w-full pl-9 pr-3 py-2 text-sm border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Student cohort group</p>
        </div>
      </div>
    </div>
  );
};

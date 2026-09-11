const fs = require('fs');

function parseCSV(file) {
  const lines = fs.readFileSync(file, 'utf8').trim().split(/\r?\n/);
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const parts = lines[i].split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((h, idx) => obj[h] = parts[idx]);
    rows.push(obj);
  }
  return { headers, rows };
}

const assess = parseCSV('data/sample_co_assessment_v2.csv');
const targets = parseCSV('data/co_target_mapping.csv');

const targetMap = {};
targets.rows.forEach(r => {
  targetMap[r.course_id + '|' + r.co_id] = parseFloat(r.target_attainment_percentage);
});

const coStats = {};
assess.rows.forEach(r => {
  const key = r.course_id + '|' + r.co_id;
  if (!coStats[key]) {
    coStats[key] = {
      course_id: r.course_id,
      co_id: r.co_id,
      totalObtained: 0,
      totalMax: 0,
      obsCount: 0,
      questions: new Set(),
      topics: new Set(),
      assessments: new Set(),
      students: new Set(),
      studentScores: {}
    };
  }
  const s = coStats[key];
  const obt = parseFloat(r.marks_obtained);
  const max = parseFloat(r.max_marks);
  s.totalObtained += obt;
  s.totalMax += max;
  s.obsCount++;
  s.questions.add(r.question_id);
  s.topics.add(r.topic);
  s.assessments.add(r.assessment_id);
  s.students.add(r.student_id);

  if (!s.studentScores[r.student_id]) s.studentScores[r.student_id] = { obt: 0, max: 0 };
  s.studentScores[r.student_id].obt += obt;
  s.studentScores[r.student_id].max += max;
});

console.log('--- DETERMINISTIC CO ATTAINMENT METRICS ---');
Object.keys(coStats).sort().forEach(k => {
  const s = coStats[k];
  const meanPct = (s.totalObtained / s.totalMax) * 100;
  const target = targetMap[k] !== undefined ? targetMap[k] : null;
  const gap = target !== null ? (meanPct - target) : null;

  let studentsMeetingTarget = 0;
  const totalStudents = Object.keys(s.studentScores).length;
  Object.values(s.studentScores).forEach(sc => {
    const p = (sc.obt / sc.max) * 100;
    if (target !== null && p >= target) studentsMeetingTarget++;
  });
  const thresholdPctTarget = (studentsMeetingTarget / totalStudents) * 100;

  console.log(k + ':');
  console.log('  Observations: ' + s.obsCount + ', Questions: ' + s.questions.size + ', Topics: ' + s.topics.size + ', Assessments: ' + [...s.assessments].join(', '));
  console.log('  Mean Score %: ' + meanPct.toFixed(2) + '% | Target: ' + target + '% | Gap: ' + (gap !== null ? (gap >= 0 ? '+' : '') + gap.toFixed(2) + '%' : 'N/A'));
  console.log('  Students Meeting Target: ' + studentsMeetingTarget + '/' + totalStudents + ' (' + thresholdPctTarget.toFixed(2) + '%)');
});

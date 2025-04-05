"use client";

import { useEffect, useState } from 'react';
import { ResultBlock } from '../utils/resultBlockchain';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ResultAnalyticsProps {
  results: ResultBlock[];
}

export default function ResultAnalytics({ results }: ResultAnalyticsProps) {
  const [gradeDistribution, setGradeDistribution] = useState<{ [key: string]: number }>({});
  const [subjectPerformance, setSubjectPerformance] = useState<{ [key: string]: { avg: number, pass: number, total: number } }>({});
  const [topPerformers, setTopPerformers] = useState<ResultBlock[]>([]);
  const [performanceTrends, setPerformanceTrends] = useState<{ labels: string[], datasets: any[] }>({
    labels: [],
    datasets: []
  });

  useEffect(() => {
    calculateAnalytics();
  }, [results]);

  const calculateAnalytics = () => {
    // Calculate grade distribution
    const grades: { [key: string]: number } = {};
    results.forEach(result => {
      grades[result.data.finalGrade] = (grades[result.data.finalGrade] || 0) + 1;
    });
    setGradeDistribution(grades);

    // Calculate subject-wise performance
    const subjects: { [key: string]: { marks: number[], pass: number, total: number } } = {};
    results.forEach(result => {
      result.data.subjectResults.forEach(subject => {
        if (!subjects[subject.subjectCode]) {
          subjects[subject.subjectCode] = { marks: [], pass: 0, total: 0 };
        }
        subjects[subject.subjectCode].marks.push(subject.marks);
        subjects[subject.subjectCode].total++;
        if (subject.marks >= 40) { // Pass mark threshold
          subjects[subject.subjectCode].pass++;
        }
      });
    });

    // Calculate averages
    const subjectStats: { [key: string]: { avg: number, pass: number, total: number } } = {};
    Object.entries(subjects).forEach(([code, data]) => {
      subjectStats[code] = {
        avg: data.marks.reduce((a, b) => a + b, 0) / data.marks.length,
        pass: data.pass,
        total: data.total
      };
    });
    setSubjectPerformance(subjectStats);

    // Get top performers
    const sortedResults = [...results].sort((a, b) => b.data.percentage - a.data.percentage);
    setTopPerformers(sortedResults.slice(0, 5));

    // Calculate performance trends
    const subjectLabels = Object.keys(subjectStats);
    const avgData = subjectLabels.map(subject => subjectStats[subject].avg);
    const passRateData = subjectLabels.map(subject => 
      (subjectStats[subject].pass / subjectStats[subject].total) * 100
    );

    setPerformanceTrends({
      labels: subjectLabels,
      datasets: [
        {
          label: 'Average Score',
          data: avgData,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
        },
        {
          label: 'Pass Rate %',
          data: passRateData,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
        }
      ]
    });
  };

  const gradeChartData = {
    labels: ['A+', 'A', 'B', 'C', 'D', 'E', 'F'],
    datasets: [
      {
        label: 'Number of Students',
        data: ['A+', 'A', 'B', 'C', 'D', 'E', 'F'].map(grade => gradeDistribution[grade] || 0),
        backgroundColor: [
          'rgba(52, 211, 153, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(99, 102, 241, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(239, 68, 68, 0.5)'
        ],
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Grade Distribution */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Grade Distribution</h3>
        <div className="h-64">
          <Bar
            data={gradeChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false
                },
                title: {
                  display: true,
                  text: 'Grade Distribution'
                }
              }
            }}
          />
        </div>
      </div>

      {/* Performance Trends */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Trends</h3>
        <div className="h-64">
          <Line
            data={performanceTrends}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100
                }
              }
            }}
          />
        </div>
      </div>

      {/* Subject Performance */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Subject-wise Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pass Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance Bar</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(subjectPerformance).map(([subject, data]) => (
                <tr key={subject}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{subject}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{data.avg.toFixed(1)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {((data.pass / data.total) * 100).toFixed(1)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${(data.avg)}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performers</h3>
        <div className="space-y-4">
          {topPerformers.map((result, index) => (
            <div key={result.hash} className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                {index + 1}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">{result.studentName || result.data.studentId}</h4>
                <p className="text-sm text-gray-500">Grade: {result.data.finalGrade}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{result.data.percentage.toFixed(1)}%</p>
                <p className="text-sm text-gray-500">Total: {result.data.totalMarks}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-green-800 mb-2">Strengths</h4>
            <ul className="list-disc list-inside text-sm text-green-600 space-y-1">
              {Object.entries(subjectPerformance)
                .filter(([_, data]) => data.avg >= 70)
                .map(([subject, _]) => (
                  <li key={subject}>High performance in {subject}</li>
                ))}
            </ul>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-red-800 mb-2">Areas for Improvement</h4>
            <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
              {Object.entries(subjectPerformance)
                .filter(([_, data]) => data.avg < 60)
                .map(([subject, _]) => (
                  <li key={subject}>Need attention in {subject}</li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 
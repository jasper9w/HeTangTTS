import type { AnalysisResult } from '../types';

interface ResultTableProps {
  results: AnalysisResult[];
}

export function ResultTable({ results }: ResultTableProps) {
  if (results.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">3. 结果</h2>
        <p className="text-gray-500 text-center py-8">
          暂无结果。请选择目录并开始分析。
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">
        3. 结果 ({results.length} 项)
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 font-medium text-gray-600">名称</th>
              <th className="text-left py-3 px-2 font-medium text-gray-600">路径</th>
              <th className="text-left py-3 px-2 font-medium text-gray-600">年龄</th>
              <th className="text-left py-3 px-2 font-medium text-gray-600">性别</th>
              <th className="text-left py-3 px-2 font-medium text-gray-600">类型</th>
              <th className="text-left py-3 px-2 font-medium text-gray-600">标签</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, index) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-2 font-medium text-gray-800">{result.name}</td>
                <td className="py-3 px-2 text-gray-600 max-w-[200px] truncate" title={result.path}>
                  {result.path}
                </td>
                <td className="py-3 px-2 text-gray-600">{result.age}</td>
                <td className="py-3 px-2 text-gray-600">{result.gender}</td>
                <td className="py-3 px-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    result.type === '配音' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {result.type}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <div className="flex flex-wrap gap-1">
                    {result.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                    {result.tags.length > 3 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                        +{result.tags.length - 3}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

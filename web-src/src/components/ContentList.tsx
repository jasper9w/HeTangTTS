import type { ParsedLine } from '../types';

interface ContentListProps {
  lines: ParsedLine[];
}

export function ContentList({ lines }: ContentListProps) {
  if (lines.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">
        已解析内容 ({lines.length} 项)
      </h2>
      <div className="max-h-64 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-2 font-medium text-gray-600 w-12">#</th>
              <th className="text-left py-2 px-2 font-medium text-gray-600 w-32">角色</th>
              <th className="text-left py-2 px-2 font-medium text-gray-600">内容</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 px-2 text-gray-400">{idx + 1}</td>
                <td className="py-2 px-2">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                    {line.role || '-'}
                  </span>
                </td>
                <td className="py-2 px-2 text-gray-700">{line.content}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

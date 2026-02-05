import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProcessingModal from './ProcessingModal';

interface PreviewRow {
  rowNumber: number;
  badgeTemplateId: string;
  recipientEmail: string;
  evidenceUrl?: string;
  isValid: boolean;
  error?: string;
}

interface SessionError {
  rowNumber: number;
  badgeTemplateId: string;
  recipientEmail: string;
  message: string;
}

interface PreviewData {
  sessionId: string;
  validRows: number;
  errorRows: number;
  totalRows: number;
  errors: SessionError[];
  status: string;
  createdAt: string;
  expiresAt: string;
  rows: PreviewRow[];
}

/**
 * Bulk Preview Page Component (UX-P0-3)
 * 
 * Displays validation results after CSV upload and provides:
 * - Summary statistics
 * - Error details with download option
 * - Re-upload workflow for corrections
 * - Confirmation for valid rows
 */
export default function BulkPreviewPage() {
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [processingResults, setProcessingResults] = useState<{ success: number; failed: number } | null>(null);

  useEffect(() => {
    if (sessionId) {
      fetchPreviewData();
    }
  }, [sessionId]);

  const fetchPreviewData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/bulk-issuance/preview/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('您没有权限访问此会话');
        }
        if (response.status === 404) {
          throw new Error('会话不存在或已过期');
        }
        throw new Error('加载预览数据失败');
      }
      
      const data = await response.json();
      setPreviewData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadErrorReport = async () => {
    try {
      const response = await fetch(`/api/bulk-issuance/error-report/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('下载错误报告失败');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `errors-${sessionId?.substring(0, 8)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err instanceof Error ? err.message : '下载失败');
    }
  };

  const handleConfirm = async () => {
    if (!previewData || previewData.validRows === 0) {
      alert('没有可发放的有效记录');
      return;
    }
    
    const confirmed = window.confirm(
      `确定要发放 ${previewData.validRows} 个徽章吗？此操作无法撤销。`
    );
    
    if (!confirmed) return;
    
    setIsProcessing(true);
  };

  const handleProcessingComplete = (results: { success: number; failed: number }) => {
    setIsProcessing(false);
    setProcessingComplete(true);
    setProcessingResults(results);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">加载预览数据...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 font-medium mb-4">{error}</p>
          <button
            onClick={() => navigate('/admin/bulk-issuance')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            返回上传页面
          </button>
        </div>
      </div>
    );
  }

  if (processingComplete && processingResults) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">
            {processingResults.failed === 0 ? '✅' : '⚠️'}
          </div>
          <h2 className="text-2xl font-bold mb-4">
            {processingResults.failed === 0 ? '发放完成' : '发放完成（部分失败）'}
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-600 font-bold text-3xl">{processingResults.success}</p>
              <p className="text-green-700">成功发放</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-red-600 font-bold text-3xl">{processingResults.failed}</p>
              <p className="text-red-700">发放失败</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/badges')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            查看已发放徽章
          </button>
        </div>
      </div>
    );
  }

  if (!previewData) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">批量发放预览</h1>
      
      {/* Summary Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-3xl font-bold text-gray-800">{previewData.totalRows}</p>
          <p className="text-gray-600">总记录数</p>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{previewData.validRows}</p>
          <p className="text-green-700">有效记录</p>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-4 text-center">
          <p className="text-3xl font-bold text-red-600">{previewData.errorRows}</p>
          <p className="text-red-700">错误记录</p>
        </div>
      </div>

      {/* Error Correction Panel (UX-P0-3) */}
      {previewData.errorRows > 0 && (
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-red-700 mb-4">
            ⚠️ {previewData.errorRows} 个错误需要修正
          </h3>
          
          <div className="mb-4 text-gray-700">
            <p className="font-medium mb-2">修正错误步骤：</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>点击下方"下载错误报告"按钮</li>
              <li>在原始CSV文件中修正错误行</li>
              <li>点击"重新上传修正后的CSV"</li>
            </ol>
          </div>
          
          <div className="flex gap-3 flex-wrap">
            <button 
              onClick={handleDownloadErrorReport} 
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              📥 下载错误报告
            </button>
            <button 
              onClick={() => navigate('/admin/bulk-issuance/upload')} 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              🔄 重新上传修正后的CSV
            </button>
          </div>
        </div>
      )}

      {/* Error Details Table */}
      {previewData.errors.length > 0 && (
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">错误详情</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">行号</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">模板ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">邮箱</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">错误</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {previewData.errors.slice(0, 10).map((error, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800">{error.rowNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono truncate max-w-[200px]">
                      {error.badgeTemplateId}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{error.recipientEmail}</td>
                    <td className="px-4 py-3 text-sm text-red-600">{error.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {previewData.errors.length > 10 && (
              <div className="p-4 text-center text-gray-500 text-sm">
                还有 {previewData.errors.length - 10} 个错误，请下载完整报告查看
              </div>
            )}
          </div>
        </div>
      )}

      {/* Valid Rows Preview */}
      {previewData.validRows > 0 && (
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">
              将发放的徽章 ({previewData.validRows} 个)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">行号</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">模板ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">收件人</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {previewData.rows.filter(r => r.isValid).slice(0, 5).map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800">{row.rowNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono truncate max-w-[200px]">
                      {row.badgeTemplateId}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{row.recipientEmail}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ 有效
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {previewData.validRows > 5 && (
              <div className="p-4 text-center text-gray-500 text-sm">
                还有 {previewData.validRows - 5} 个有效记录
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate('/admin/bulk-issuance/upload')}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
        >
          ← 返回上传
        </button>
        
        <button
          onClick={handleConfirm}
          disabled={previewData.validRows === 0}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            previewData.validRows > 0
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          确认发放 ({previewData.validRows} 个徽章) →
        </button>
      </div>

      {/* Session Expiry Warning */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          ⏱️ 会话将于 {new Date(previewData.expiresAt).toLocaleString('zh-CN')} 过期
        </p>
      </div>

      {/* Processing Modal */}
      <ProcessingModal
        totalBadges={previewData.validRows}
        isProcessing={isProcessing}
        onComplete={handleProcessingComplete}
      />
    </div>
  );
}

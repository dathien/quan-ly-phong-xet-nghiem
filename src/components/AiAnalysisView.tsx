import React, { useState } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
  Eye,
  Info,
  Layers,
  FileCheck,
  RefreshCw
} from 'lucide-react';
import { Cabinet, UserRole } from '../types';

interface AiAnalysisViewProps {
  cabinets: Cabinet[];
  userRole: UserRole;
  userName: string;
}

interface AnalysisResult {
  connected: boolean;
  cabinetLayout: string;
  visibleShelvesCount: number;
  densityAssessment: string;
  recognizedLabels: Array<{
    shelf: string;
    label: string;
    confidence: string;
    note: string;
  }>;
  confusionRisks: string[];
  inventoryFeasibility: string;
  recommendations: string[];
  verificationNeeded: string[];
  confidenceLevel: 'Thấp' | 'Trung bình' | 'Cao';
  disclaimer: string;
}

export const AiAnalysisView: React.FC<AiAnalysisViewProps> = ({
  cabinets,
  userRole,
  userName
}) => {
  const [selectedCabinetId, setSelectedCabinetId] = useState<string>(cabinets[0]?.id || '');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [userNotes, setUserNotes] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResponse, setAiResponse] = useState<AnalysisResult | null>(null);
  const [unconnectedMessage, setUnconnectedMessage] = useState<string | null>(null);

  // Manual observation mode (if AI unconfigured or manual notes desired)
  const [manualObservation, setManualObservation] = useState('');
  const [manualSavedList, setManualSavedList] = useState<Array<{ date: string; user: string; text: string }>>([]);

  const selectedCabinet = cabinets.find(c => c.id === selectedCabinetId);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageMimeType(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
      setAiResponse(null);
      setUnconnectedMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const runAnalysis = async () => {
    if (!imagePreview) return;

    setIsAnalyzing(true);
    setUnconnectedMessage(null);
    setAiResponse(null);

    try {
      const response = await fetch('/api/ai/analyze-cabinet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePreview,
          mimeType: imageMimeType,
          cabinetInfo: selectedCabinet
            ? {
                name: selectedCabinet.name,
                code: selectedCabinet.code,
                type: selectedCabinet.type,
                tempRange: `${selectedCabinet.minTemp}°C - ${selectedCabinet.maxTemp}°C`
              }
            : null,
          userNotes
        })
      });

      const data = await response.json();
      if (data.connected && data.analysis) {
        setAiResponse(data.analysis);
      } else {
        // Show exact standard required message
        setUnconnectedMessage(
          data.message || 'Chức năng phân tích AI chưa được kết nối. Bạn vẫn có thể quản lý kho và kiểm kê bình thường.'
        );
      }
    } catch (err: any) {
      setUnconnectedMessage(
        'Chức năng phân tích AI chưa được kết nối. Bạn vẫn có thể quản lý kho và kiểm kê bình thường.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <span>PHÂN TÍCH HÌNH ẢNH TỦ HÓA CHẤT (AI VISION ASSISTANT)</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
              Module AI Chuyên Dụng
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Hỗ trợ rà soát trực quan bố cục tủ, nhận diện nhãn rõ nét, phát hiện nguy cơ nhầm lẫn và đề xuất cải thiện 5S.
          </p>
        </div>
      </div>

      {/* Safety Principle Banner (Section 15 Rule) */}
      <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-950 leading-relaxed flex items-center gap-2.5">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
        <span>
          <strong>NGUYÊN TẮC AN TOÀN PHÂN TÍCH ẢNH:</strong> "Không tự đoán tên hóa chất, hạn dùng hay thể tích khi chữ không rõ. Không tự kết luận hóa chất tương thích. Mọi kết quả phân tích chỉ là ước tính sơ bộ hỗ trợ quan sát, không thay thế việc kiểm tra nhãn gốc và không tự động ghi vào tồn kho chính thức."
        </span>
      </div>

      {/* Unconnected Status Notice if AI service is absent */}
      {unconnectedMessage && (
        <div className="p-4 bg-slate-100 border border-slate-300 rounded-2xl text-xs text-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Info className="w-5 h-5 text-blue-600 shrink-0" />
            <span className="font-semibold">{unconnectedMessage}</span>
          </div>
          <button onClick={() => setUnconnectedMessage(null)} className="text-slate-400 font-bold ml-4">✕</button>
        </div>
      )}

      {/* Upload and Configuration Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Camera className="w-4 h-4 text-teal-600" />
            <span>Tải Ảnh Tủ / Kệ Thuốc Thử Để Rà Soát</span>
          </h2>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Chọn tủ đang kiểm tra (*)</label>
            <select
              value={selectedCabinetId}
              onChange={(e) => setSelectedCabinetId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500 bg-white"
            >
              {cabinets.map(c => (
                <option key={c.id} value={c.id}>{c.code} - {c.name} ({c.type})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Ghi chú của kiểm nghiệm viên</label>
            <input
              type="text"
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="Ví dụ: Ảnh chụp góc trên bên trái tủ mát sau khi tiếp nhận hàng mới..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl p-6 text-center transition-all bg-slate-50/50">
            {imagePreview ? (
              <div className="space-y-3">
                <img
                  src={imagePreview}
                  alt="Ảnh tủ thuốc thử"
                  className="max-h-64 mx-auto rounded-xl shadow-md border object-contain"
                />
                <div className="flex justify-center gap-2">
                  <label className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-semibold cursor-pointer">
                    Chọn ảnh khác
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                  <button
                    onClick={() => { setImagePreview(null); setAiResponse(null); }}
                    className="px-3 py-1.5 bg-red-50 text-red-600 rounded-xl font-semibold cursor-pointer"
                  >
                    Xóa ảnh
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center cursor-pointer space-y-2">
                <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-bold text-slate-800 text-sm block">Nhấp để tải ảnh lên hoặc chụp từ camera</span>
                  <span className="text-[11px] text-slate-400">Hỗ trợ định dạng JPG, PNG, WEBP</span>
                </div>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </div>

          <button
            onClick={runAnalysis}
            disabled={!imagePreview || isAnalyzing}
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white rounded-xl font-bold transition-all shadow-sm shadow-teal-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang phân tích hình ảnh qua AI Server Proxy...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Bắt đầu Phân Tích Hình Ảnh AI</span>
              </>
            )}
          </button>
        </div>

        {/* Manual Observation / Inspection fallback */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-blue-600" />
            <span>Ghi Chú Đánh Giá Trực Tiếp Của Cán Bộ Kiểm Kê</span>
          </h2>
          <p className="text-slate-500 leading-relaxed">
            Dù có AI hay ở chế độ ngoại tuyến, kiểm nghiệm viên luôn có thể ghi nhận cảm quan trực tiếp về mật độ chai lọ, vị trí chai dung tích lớn và dán nhãn vị trí.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!manualObservation.trim()) return;
              setManualSavedList([
                {
                  date: new Date().toLocaleString('vi-VN'),
                  user: userName,
                  text: manualObservation.trim()
                },
                ...manualSavedList
              ]);
              setManualObservation('');
            }}
            className="space-y-3"
          >
            <textarea
              rows={4}
              required
              value={manualObservation}
              onChange={(e) => setManualObservation(e.target.value)}
              placeholder="Nhập ghi chú quan sát thực địa (ví dụ: chai dung tích 20L đã xếp đúng tầng trệt, các chai hóa chất đông máu đã được tách riêng...)"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl cursor-pointer"
            >
              Lưu nhận xét thực địa
            </button>
          </form>

          {manualSavedList.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100 max-h-48 overflow-y-auto">
              <span className="font-bold text-slate-700 block">Các nhận xét đã ghi:</span>
              {manualSavedList.map((m, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{m.user}</span>
                    <span>{m.date}</span>
                  </div>
                  <p className="text-slate-700 text-xs">{m.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI ANALYSIS RESULTS DISPLAY (Section 15 Guidelines) */}
      {aiResponse && (
        <div className="bg-white p-6 rounded-2xl border border-teal-200 shadow-sm space-y-6 animate-in fade-in text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-teal-500 animate-pulse"></span>
                <h3 className="text-base font-extrabold text-slate-900">
                  KẾT QUẢ RÀ SOÁT BỐ CỤC TỦ TỪ HÌNH ẢNH
                </h3>
              </div>
              <p className="text-slate-500 mt-0.5">
                Được xử lý bởi mô hình thị giác máy học server-side với tham số kiểm định y khoa.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600">Độ tin cậy của ảnh:</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                aiResponse.confidenceLevel === 'Cao' ? 'bg-emerald-100 text-emerald-800' :
                aiResponse.confidenceLevel === 'Trung bình' ? 'bg-amber-100 text-amber-800' :
                'bg-red-100 text-red-800'
              }`}>
                {aiResponse.confidenceLevel}
              </span>
            </div>
          </div>

          {/* Mandatory Disclaimer Box */}
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-950 font-semibold leading-relaxed">
            {aiResponse.disclaimer}
          </div>

          {/* Grid Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">1. Bố cục & Số tầng nhìn thấy</span>
              <div className="text-sm font-bold text-slate-900">{aiResponse.visibleShelvesCount} tầng/khay nhận diện</div>
              <p className="text-slate-600 mt-1 leading-relaxed">{aiResponse.cabinetLayout}</p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">2. Mật độ sắp xếp</span>
              <div className="text-sm font-bold text-slate-900">Đánh giá mật độ</div>
              <p className="text-slate-600 mt-1 leading-relaxed">{aiResponse.densityAssessment}</p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">3. Khả năng kiểm kê trực tiếp</span>
              <div className="text-sm font-bold text-slate-900">Đánh giá góc chụp</div>
              <p className="text-slate-600 mt-1 leading-relaxed">{aiResponse.inventoryFeasibility}</p>
            </div>
          </div>

          {/* Recognized Labels */}
          {aiResponse.recognizedLabels && aiResponse.recognizedLabels.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-800 mb-2">Nhãn đọc được từ ảnh (Chỉ khi chữ đủ rõ):</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {aiResponse.recognizedLabels.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl border border-slate-200 bg-white">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                      <span>{item.shelf}</span>
                      <span className="font-semibold text-teal-600">{item.confidence}</span>
                    </div>
                    <div className="font-bold text-slate-800 text-xs">{item.label}</div>
                    {item.note && <div className="text-[10px] text-slate-500 mt-1 italic">{item.note}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risks & Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-orange-900">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <span>Vị trí có nguy cơ nhầm lẫn:</span>
              </div>
              <ul className="space-y-1 text-orange-800 text-[11px] list-disc list-inside">
                {aiResponse.confusionRisks.map((risk, i) => (
                  <li key={i}>{risk}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-blue-900">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Đề xuất cải thiện 5S & Bố cục:</span>
              </div>
              <ul className="space-y-1 text-blue-800 text-[11px] list-disc list-inside">
                {aiResponse.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Items requiring physical verification */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="font-bold text-slate-800 block text-xs">Các mục bắt buộc kiểm tra tận nơi:</span>
            <ul className="text-slate-600 space-y-1 text-[11px] list-disc list-inside">
              {aiResponse.verificationNeeded.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

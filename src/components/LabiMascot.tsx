import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  BookOpen,
  ChevronRight,
  Minimize2,
  X,
  MessageSquare,
  Clock,
  Layers,
  ArrowRightLeft,
  Boxes,
  ClipboardCheck,
  ShieldAlert,
  Search
} from 'lucide-react';
import {
  Reagent,
  Batch,
  InventorySession,
  TemperatureLog,
  AppSettings,
  UserProfile
} from '../types';
import { calculateReagentStock, isExpired, getDaysUntilExpiry } from '../services/calculationService';
import { TabKey } from './Sidebar';

interface LabiMascotProps {
  user: UserProfile;
  reagents: Reagent[];
  batches: Batch[];
  inventorySessions: InventorySession[];
  temperatureLogs: TemperatureLog[];
  settings: AppSettings;
  onNavigateTab: (tab: TabKey) => void;
}

export const LabiMascot: React.FC<LabiMascotProps> = ({
  user,
  reagents,
  batches,
  inventorySessions,
  temperatureLogs,
  settings,
  onNavigateTab
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'STATUS' | 'QA' | 'GUIDES'>('STATUS');
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);
  const [selectedGuideId, setSelectedGuideId] = useState<string>('g1');
  const [searchTerm, setSearchTerm] = useState('');

  // Personalized Greeting calculation
  const getGreeting = () => {
    const hour = new Date().getHours();
    let timeGreeting = 'Chào buổi sáng';
    if (hour >= 11 && hour < 14) timeGreeting = 'Chào buổi trưa';
    else if (hour >= 14 && hour < 18) timeGreeting = 'Chào buổi chiều';
    else if (hour >= 18 || hour < 5) timeGreeting = 'Chào buổi tối';

    // Extract preferred call name
    let callName = 'chị Ánh';
    if (user.name.includes('Ánh')) {
      callName = 'chị Ánh';
    } else if (user.name.includes('Minh')) {
      callName = 'anh Minh';
    } else {
      const parts = user.name.trim().split(' ');
      const lastName = parts[parts.length - 1];
      callName = `${lastName}`;
    }

    return `${timeGreeting}, ${callName}! LABI sẵn sàng hỗ trợ ${callName} quản lý kho hóa chất hôm nay.`;
  };

  // Real data calculations (No fake data)
  const activeReagents = reagents.filter(r => r.isActive);
  const stockSummaries = activeReagents.map(r => ({
    reagent: r,
    stock: calculateReagentStock(r, batches, settings)
  }));

  const redAlertReagents = stockSummaries.filter(s => s.stock.alertLevel === 'RED');
  const orangeAlertReagents = stockSummaries.filter(s => s.stock.alertLevel === 'ORANGE');
  const insufficientDataReagents = stockSummaries.filter(s => s.stock.alertLevel === 'INSUFFICIENT_DATA');

  const nearExpiryBatches = batches.filter(
    b => b.status === 'KHA_DUNG' &&
      b.remainingQuantity > 0 &&
      getDaysUntilExpiry(b.expiryDate) <= settings.nearExpiryAlertDays &&
      !isExpired(b.expiryDate)
  );

  const expiredBatches = batches.filter(
    b => b.status === 'HET_HAN' || (b.remainingQuantity > 0 && isExpired(b.expiryDate))
  );

  const pendingInventoryCount = inventorySessions.filter(s => s.status === 'DANG_TIEN_HANH').length;

  const totalIssuesCount =
    redAlertReagents.length +
    expiredBatches.length +
    nearExpiryBatches.length +
    insufficientDataReagents.length;

  // Mascot expression based on warehouse condition
  const hasCriticalWarning = redAlertReagents.length > 0 || expiredBatches.length > 0;

  // Structured QA Questions
  const qaDatabase = [
    {
      q: 'Làm sao để xuất kho đúng quy tắc FEFO?',
      a: 'FEFO (First Expired, First Out) ưu tiên xuất lô có hạn dùng gần nhất trong số các lô khả dụng. Khi vào phân hệ "Nhập – xuất kho" và chọn tab "Phiếu Xuất kho", hệ thống sẽ tự động chỉ định lô tối ưu FEFO có gắn dấu sao [FEFO KHUYÊN DÙNG]. Nếu người dùng cố ý chọn lô khác, hệ thống sẽ cảnh báo màu hổ phách và bắt buộc ghi rõ lý do ngoại lệ trước khi cho phép xuất.',
      relatedTab: 'TRANSACTIONS' as TabKey
    },
    {
      q: 'Hệ thống tính cảnh báo tồn kho Đỏ, Cam, Vàng như thế nào?',
      a: 'Hệ thống tính số ngày còn lại theo công thức: N = V / D, trong đó V = Q × U (Tổng thể tích khả dụng) và D = T × R (Mức tiêu hao hàng ngày). Mặc định: ĐỎ khi N < 7 ngày hoặc chạm ngưỡng tồn tối thiểu; CAM khi 7 đến < 15 ngày; VÀNG khi 15 đến 30 ngày; XANH khi trên 30 ngày an toàn.',
      relatedTab: 'ALERTS' as TabKey
    },
    {
      q: 'Cách xử lý an toàn khi một lô hóa chất bị quá hạn?',
      a: 'Theo quy chuẩn an toàn xét nghiệm, hệ thống tự động khóa lô quá hạn sang trạng thái "HET_HAN" và cấm xuất sử dụng. Nhân viên kho cần dán nhãn đỏ "HÓA CHẤT HẾT HẠN - CHỜ HỦY", chuyển vào khu vực cách ly và lập biên bản đề nghị tiêu hủy theo SOP-KHO-08.',
      relatedTab: 'ALERTS' as TabKey
    },
    {
      q: 'Làm sao tạo đợt kiểm kê và cân đối kho?',
      a: 'Vào phân hệ "Kiểm kê kho" -> bấm "Tạo đợt kiểm kê mới". Cán bộ đi đếm thực tế từng ô tủ và nhập số thực tế vào cột "Thực đếm". Hệ thống tự tính chênh lệch. Sau khi ghi rõ nguyên nhân, chỉ Quản lý kho hoặc Admin mới có quyền bấm "Xác nhận & Cân đối kho" để cập nhật số tồn mới.',
      relatedTab: 'INVENTORY' as TabKey
    },
    {
      q: 'Mã vị trí C-S-A trên tủ hóa chất có ý nghĩa gì?',
      a: 'Mã vị trí chuẩn hóa gồm 3 thành phần: C = Cabinet (Mã tủ, ví dụ C1 là Tủ mát 2-8°C, C2 là Kệ phòng lab, C3 là Tủ âm sâu), S = Shelf (Số tầng, ví dụ S1, S2, S3), A = Cell (Ô/ngăn, ví dụ A, B, C). Ví dụ: C1-S1-A là Ngăn A, Tầng 1 của Tủ mát 1.',
      relatedTab: 'CABINETS' as TabKey
    },
    {
      q: 'Khi nhiệt độ tủ bảo quản vượt ngưỡng cho phép thì làm gì?',
      a: 'Khi nhiệt độ đo được vượt ngoài giới hạn (ví dụ tủ mát vượt quá 8°C hoặc xuống dưới 2°C), hệ thống sẽ hiển thị cảnh báo đỏ và ghi nhận sự cố. Cần kiểm tra nguồn điện và gioăng tủ ngay. Nếu sự cố kéo dài quá 30 phút, phải chuyển hóa chất sang tủ dự phòng theo SOP-KHO-07.',
      relatedTab: 'CABINETS' as TabKey
    },
    {
      q: 'Làm thế nào để nhập hoặc xuất dữ liệu Excel (.xlsx)?',
      a: 'Trong phân hệ "Danh mục hóa chất", có 2 nút "Xuất Excel" và "Nhập Excel". Bạn có thể tải toàn bộ danh mục thuốc thử về máy tính hoặc nạp file Excel danh mục có sẵn. Bảng kiểm kê và sổ giao dịch cũng hỗ trợ xuất file Excel trực tiếp.',
      relatedTab: 'CATALOG' as TabKey
    },
    {
      q: 'Tại sao hóa chất lại báo "Chưa đủ dữ liệu"?',
      a: 'Hệ thống tuân thủ nguyên tắc an toàn: Không tự bịa định mức tiêu hao hay thể tích sử dụng. Nếu hóa chất thiếu "Dung tích đơn vị (U)", "Định mức tiêu hao/test (R)" hoặc "Số test TB/ngày (T)", hệ thống sẽ đánh dấu "CHƯA ĐỦ DỮ LIỆU – CẦN XÁC MINH" và yêu cầu cập nhật thông số trong Danh mục.',
      relatedTab: 'CATALOG' as TabKey
    },
    {
      q: 'Làm sao sao lưu toàn bộ cơ sở dữ liệu kho?',
      a: 'Vào phân hệ "Cài đặt hệ thống" -> mục "Sao Lưu & Khôi Phục Dữ Liệu (JSON)" -> bấm "Tải tệp Sao lưu (.json)". Tệp này chứa đầy đủ toàn bộ hóa chất, các lô, giao dịch, nhật ký nhiệt độ và SOP để khôi phục khi cần.',
      relatedTab: 'SETTINGS' as TabKey
    },
    {
      q: 'Quy tắc sắp xếp chai hóa chất lớn và hóa chất nguy hại?',
      a: 'Các thùng can dung tích lớn (như Thùng pha loãng Cellpack 20L) hoặc hóa chất ăn mòn bắt buộc xếp ở tầng trệt (tầng dưới cùng của kệ) để tránh nguy cơ đổ vỡ hoặc rơi từ trên cao. Không xếp hóa chất acid mạnh cạnh dung dịch kiềm hoặc chất tẩy rửa gốc clo.',
      relatedTab: 'CABINETS' as TabKey
    }
  ];

  // 8 Specific Standard Guides
  const guidesList = [
    {
      id: 'g1',
      title: '1. Hướng dẫn sử dụng tổng quan',
      category: 'Tổng quan',
      content: 'LAB CHEM SMART MANAGER AI là hệ thống quản lý chuyên sâu cho phòng xét nghiệm y khoa theo tiêu chuẩn ISO 15189. Hệ thống chạy ở chế độ cá nhân bền vững với LocalStorage/IndexedDB, hỗ trợ nhập xuất, kiểm soát FEFO, theo dõi nhiệt độ tủ và phân tích hình ảnh AI.'
    },
    {
      id: 'g2',
      title: '2. Quản lý danh mục hóa chất & 12 nhóm',
      category: 'Danh mục',
      content: 'Danh mục quản lý 12 nhóm chuyên môn (Sinh hóa, Huyết học, Miễn dịch, Đông máu, Điện giải, Nước tiểu, Nội tiết, Vi sinh, QC/Control, Cleaner, Vật tư tiêu hao, Chưa xác định). Mỗi hóa chất cần có thông số tiêu hao để hệ thống tính toán ngày sử dụng còn lại. Có thể nhập/xuất tệp Excel nhanh chóng.'
    },
    {
      id: 'g3',
      title: '3. Quy trình tiếp nhận & Nhập kho',
      category: 'Nhập kho',
      content: 'Khi hàng về, kiểm tra bao bì và nhiệt độ giao nhận (với hàng lạnh 2-8°C hoặc âm sâu). Điền số Lot/Batch và Hạn dùng nhà sản xuất. Không được phép nhập số lượng âm hoặc nhập hóa chất đã hết hạn tại thời điểm giao hàng.'
    },
    {
      id: 'g4',
      title: '4. Quy trình cấp phát xuất kho theo FEFO',
      category: 'Xuất kho',
      content: 'Hệ thống tự động đề xuất lô có hạn dùng gần nhất (FEFO) trong các lô khả dụng. Nghiêm cấm xuất lô đã hết hạn hoặc lô đang cách ly. Nếu người dùng chọn xuất lô khác FEFO vì lý do chuyên môn đặc biệt, hệ thống bắt buộc nhập lý do ngoại lệ.'
    },
    {
      id: 'g5',
      title: '5. Quy trình kiểm kê định kỳ',
      category: 'Kiểm kê',
      content: 'Tạo phiếu kiểm kê theo toàn kho, theo tủ hoặc theo nhóm xét nghiệm. Nhập số lượng thực đếm tại các ô vị trí. Hệ thống tự động tính Chênh lệch = Thực tế - Sổ sách. Tổ kiểm kê giải trình nguyên nhân trước khi Quản lý duyệt cân đối kho.'
    },
    {
      id: 'g6',
      title: '6. Hệ thống phân cấp cảnh báo tồn kho',
      category: 'Cảnh báo',
      content: 'Cảnh báo Đỏ (< 7 ngày hoặc dưới mức tối thiểu), Cam (7-15 ngày), Vàng (15-30 ngày), Xanh (> 30 ngày an toàn). Không coi dữ liệu thiếu là an toàn; khi thiếu thông số tiêu hao, hệ thống luôn cảnh báo "CHƯA ĐỦ DỮ LIỆU – CẦN XÁC MINH".'
    },
    {
      id: 'g7',
      title: '7. Quản lý sơ đồ tủ & Nhiệt độ bảo quản',
      category: 'Tủ & Nhiệt độ',
      content: 'Bố trí sơ đồ trực quan với mã tọa độ C-S-A (Cabinet - Shelf - Cell). Thao tác di chuyển trên sơ đồ chỉ là bản đề xuất, không làm thay đổi tồn thực tế cho đến khi cán bộ xác nhận thực tế. Nhật ký nhiệt độ đo thủ công 2 lần/ngày, cảnh báo ngay khi vượt ngưỡng.'
    },
    {
      id: 'g8',
      title: '8. Quy tắc FEFO so với FIFO',
      category: 'FEFO / FIFO',
      content: 'FEFO (First Expired, First Out) ưu tiên lô hết hạn sớm nhất, áp dụng bắt buộc cho thuốc thử có hạn dùng. FIFO (First In, First Out) ưu tiên lô nhập trước, thường áp dụng cho vật tư tiêu hao không có hạn sử dụng ngắn hạn (như đầu tip, găng tay).'
    }
  ];

  const filteredQA = qaDatabase.filter(
    item =>
      item.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.a.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* ROBOT MASCOT FLOATING TRIGGER (Góc dưới bên phải) */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end">
        {/* Interactive Speech Bubble Prompt (Hiển thị khi đóng) */}
        {!isOpen && (
          <div
            onClick={() => setIsOpen(true)}
            className="mb-2 max-w-[240px] bg-white p-2.5 rounded-2xl shadow-lg border border-blue-200 text-xs text-slate-800 cursor-pointer animate-bounce hover:animate-none transition-all hover:scale-105"
          >
            <div className="flex items-center gap-1.5 font-bold text-blue-700 text-[11px] mb-0.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-500" />
              <span>LABI chào chị Ánh!</span>
            </div>
            <p className="text-[11px] text-slate-600 line-clamp-2">
              {hasCriticalWarning
                ? `Cảnh báo: Có ${redAlertReagents.length + expiredBatches.length} mặt hàng cần chị xử lý ngay!`
                : 'Nhấn vào LABI để mở hướng dẫn và tra cứu tồn kho nhé!'}
            </p>
          </div>
        )}

        {/* Mascot Avatar Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative group p-1.5 rounded-3xl bg-gradient-to-b from-blue-500 via-blue-600 to-teal-500 shadow-xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-white"
          title="Nhấn để trò chuyện và tra cứu cùng LABI"
        >
          {/* Custom Modern SVG Robot LABI */}
          <div className="w-13 h-13 md:w-14 md:h-14 flex items-center justify-center animate-[robotFloat_3s_ease-in-out_infinite]">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
              <defs>
                <linearGradient id="robotBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#E2E8F0" />
                </linearGradient>
                <linearGradient id="robotVisorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1E293B" />
                  <stop offset="100%" stopColor="#0F172A" />
                </linearGradient>
                <linearGradient id="robotBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#1D4ED8" />
                </linearGradient>
                <linearGradient id="robotTealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#14B8A6" />
                  <stop offset="100%" stopColor="#0D9488" />
                </linearGradient>
              </defs>

              {/* Antenna */}
              <line x1="50" y1="18" x2="50" y2="8" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" />
              <circle cx="50" cy="7" r="5" fill="#14B8A6" className="animate-pulse" />

              {/* Ears / Side Sensors */}
              <rect x="18" y="32" width="6" height="14" rx="3" fill="#2563EB" />
              <rect x="76" y="32" width="6" height="14" rx="3" fill="#2563EB" />

              {/* Head */}
              <rect x="22" y="18" width="56" height="42" rx="16" fill="url(#robotBodyGrad)" stroke="#2563EB" strokeWidth="3" />

              {/* Visor Screen */}
              <rect x="28" y="25" width="44" height="26" rx="10" fill="url(#robotVisorGrad)" />

              {/* Cute Glowing Eyes with Blink Animation */}
              {hasCriticalWarning ? (
                // Alert Eyes (Focused Alert Expression)
                <g>
                  <circle cx="40" cy="38" r="4.5" fill="#F59E0B" />
                  <circle cx="60" cy="38" r="4.5" fill="#F59E0B" />
                  <path d="M35 32 L45 35" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
                  <path d="M65 32 L55 35" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
                </g>
              ) : (
                // Happy / Normal Eyes with Blinking
                <g className="animate-[robotBlink_4s_infinite] origin-[50px_38px]">
                  <ellipse cx="40" cy="38" rx="4.5" ry="5.5" fill="#38BDF8" />
                  <ellipse cx="60" cy="38" rx="4.5" ry="5.5" fill="#38BDF8" />
                  <circle cx="42" cy="36" r="1.5" fill="#FFFFFF" />
                  <circle cx="62" cy="36" r="1.5" fill="#FFFFFF" />
                </g>
              )}

              {/* Cute Smile / Wave on Visor */}
              <path d="M44 45 Q50 48 56 45" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" fill="none" />

              {/* Robot Body */}
              <rect x="30" y="62" width="40" height="28" rx="12" fill="url(#robotBodyGrad)" stroke="#2563EB" strokeWidth="3" />

              {/* Chest Screen: Lab Flask Badge */}
              <rect x="38" y="67" width="24" height="16" rx="5" fill="#EFF6FF" stroke="#93C5FD" strokeWidth="1.5" />
              <path d="M48 71 L52 71 L55 78 L45 78 Z" fill="#0D9488" />
              <circle cx="50" cy="74" r="1" fill="#FFFFFF" />

              {/* Left Arm (Resting) */}
              <path d="M28 66 Q20 72 23 80" stroke="#2563EB" strokeWidth="5" strokeLinecap="round" fill="none" />

              {/* Right Arm (Waving Hand!) */}
              <g className="animate-[wiggle_1.4s_ease-in-out_infinite] origin-[72px_66px]">
                <path
                  d="M72 66 Q82 60 84 50"
                  stroke="#2563EB"
                  strokeWidth="5"
                  strokeLinecap="round"
                  fill="none"
                />
                <circle cx="84" cy="50" r="4" fill="#0D9488" />
              </g>
            </svg>
          </div>

          {/* Alert Notification Badge */}
          {totalIssuesCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 text-[10px] font-black text-white bg-red-600 rounded-full flex items-center justify-center border-2 border-white shadow-md animate-pulse">
              {totalIssuesCount}
            </span>
          )}
        </button>
      </div>

      {/* EXPANDABLE LABI ASSISTANT MODAL (Window) */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-[94vw] sm:w-[480px] max-h-[82vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 text-xs">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-teal-600 p-4 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center border border-white/30 text-white font-black text-sm">
                LABI
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm tracking-tight">LABI Robot Trợ Lý</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-400 text-teal-950">
                    Smart Helper
                  </span>
                </div>
                <p className="text-[11px] text-blue-100 font-medium">
                  Trợ lý thông minh kho xét nghiệm y khoa
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-white/80">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer text-white"
                title="Thu nhỏ trợ lý"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer text-white"
                title="Đóng cửa sổ"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Personalized Greeting Card */}
          <div className="bg-blue-50/80 p-3.5 border-b border-blue-100 flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-blue-950 text-xs leading-snug">
                {getGreeting()}
              </p>
              <p className="text-[11px] text-blue-800 mt-0.5">
                Em đã quét toàn bộ kho thời gian thực. Chị có thể xem cảnh báo thực tế hoặc hỏi em cách thao tác nhé!
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50/80 p-1 gap-1 shrink-0">
            <button
              onClick={() => setActiveTab('STATUS')}
              className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'STATUS'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span>Cảnh báo thực tế</span>
              {totalIssuesCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-100 text-red-700 font-mono">
                  {totalIssuesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('QA')}
              className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'QA'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
              <span>Hỏi LABI</span>
            </button>

            <button
              onClick={() => setActiveTab('GUIDES')}
              className={`flex-1 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'GUIDES'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>8 Hướng dẫn</span>
            </button>
          </div>

          {/* TAB 1: REAL-TIME WAREHOUSE STATUS & ALERTS (Section 6 Requirement) */}
          {activeTab === 'STATUS' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs">Tình hình kho thuốc thử hôm nay:</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {new Date().toLocaleDateString('vi-VN')}
                </span>
              </div>

              {/* Status 1: Hóa chất sắp hết (Cảnh báo đỏ/cam) */}
              <div className="p-3 rounded-2xl bg-red-50/70 border border-red-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                    <span className="font-bold text-red-950 text-xs">
                      1. Hóa chất sắp hết / Chạm đáy ({redAlertReagents.length} mục)
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      onNavigateTab('ALERTS');
                      setIsOpen(false);
                    }}
                    className="text-[10px] text-red-700 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Xem</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                {redAlertReagents.length === 0 ? (
                  <p className="text-[11px] text-emerald-700 font-medium italic">
                    Tất cả thuốc thử đều ở mức tồn an toàn.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {redAlertReagents.slice(0, 3).map(({ reagent, stock }) => (
                      <div key={reagent.id} className="flex justify-between items-center text-[11px] text-red-900 bg-white/70 p-1.5 rounded-lg border border-red-100">
                        <span className="font-semibold truncate max-w-[220px]">{reagent.name}</span>
                        <span className="font-mono font-bold">{stock.totalAvailableUnits} {reagent.unit} ({stock.daysRemaining !== null ? `${stock.daysRemaining} ngày` : 'Hết'})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status 2: Lô gần hết hạn (<= 30 ngày) */}
              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span className="font-bold text-amber-950 text-xs">
                      2. Hóa chất cận hạn dùng ({nearExpiryBatches.length} lô)
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      onNavigateTab('TRANSACTIONS');
                      setIsOpen(false);
                    }}
                    className="text-[10px] text-amber-800 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Xuất FEFO</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                {nearExpiryBatches.length === 0 ? (
                  <p className="text-[11px] text-emerald-700 font-medium italic">
                    Không có lô nào cận hạn trong 30 ngày tới.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {nearExpiryBatches.slice(0, 3).map(b => (
                      <div key={b.id} className="flex justify-between items-center text-[11px] text-amber-900 bg-white/70 p-1.5 rounded-lg border border-amber-100">
                        <span className="font-mono font-bold">{b.batchNumber}</span>
                        <span>Hạn: {b.expiryDate} (còn {getDaysUntilExpiry(b.expiryDate)} ngày)</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status 3: Hóa chất quá hạn (Khóa) */}
              <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    <span className="font-bold text-rose-950 text-xs">
                      3. Lô đã quá hạn (Khóa an toàn: {expiredBatches.length} lô)
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      onNavigateTab('ALERTS');
                      setIsOpen(false);
                    }}
                    className="text-[10px] text-rose-700 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Chi tiết</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                {expiredBatches.length === 0 ? (
                  <p className="text-[11px] text-emerald-700 font-medium italic">
                    Không có lô quá hạn nào tồn trong kho.
                  </p>
                ) : (
                  <p className="text-[11px] text-rose-800 font-medium">
                    Có {expiredBatches.length} lô thuốc thử đã hết hạn sử dụng. Quy chế cấm xuất sử dụng tuyệt đối!
                  </p>
                )}
              </div>

              {/* Status 4: Thiếu thông tin tiêu hao */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-bold text-slate-800 text-xs">
                      4. Hóa chất thiếu dữ liệu tiêu hao ({insufficientDataReagents.length})
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      onNavigateTab('CATALOG');
                      setIsOpen(false);
                    }}
                    className="text-[10px] text-blue-700 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Bổ sung</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                {insufficientDataReagents.length === 0 ? (
                  <p className="text-[11px] text-emerald-700 font-medium italic">
                    Đầy đủ thông số dung tích và mức tiêu hao.
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-600">
                    Cần nhập mức tiêu hao/test để hệ thống tính số ngày tồn kho chính xác.
                  </p>
                )}
              </div>

              {/* Status 5: Nhiệm vụ kiểm kê */}
              <div className="p-3 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="w-3.5 h-3.5 text-teal-600" />
                    <span className="font-bold text-teal-950 text-xs">
                      5. Đợt kiểm kê cần hoàn tất ({pendingInventoryCount})
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      onNavigateTab('INVENTORY');
                      setIsOpen(false);
                    }}
                    className="text-[10px] text-teal-800 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Mở đợt</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-[11px] text-teal-900">
                  {pendingInventoryCount > 0
                    ? `Có ${pendingInventoryCount} đợt kiểm kê đang dở dang cần đối chiếu và cân đối kho.`
                    : 'Các đợt kiểm kê trước đều đã hoàn tất và cân đối kho.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: HỎI LABI (Interactive FAQ & Explanations) */}
          {activeTab === 'QA' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Search bar for questions */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm câu hỏi nghiệp vụ (FEFO, nhiệt độ, kiểm kê...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-2">
                {filteredQA.map((item, idx) => {
                  const isExpanded = selectedQuestionIndex === idx;

                  return (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all shadow-2xs"
                    >
                      <button
                        onClick={() => setSelectedQuestionIndex(isExpanded ? null : idx)}
                        className="w-full p-3 text-left font-bold text-slate-800 flex items-center justify-between gap-2 hover:bg-slate-50 cursor-pointer"
                      >
                        <span className="flex-1 leading-snug">{item.q}</span>
                        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90 text-blue-600' : ''}`} />
                      </button>

                      {isExpanded && (
                        <div className="p-3 bg-blue-50/50 border-t border-slate-100 text-[11px] text-slate-700 space-y-2 leading-relaxed">
                          <p>{item.a}</p>
                          {item.relatedTab && (
                            <button
                              onClick={() => {
                                onNavigateTab(item.relatedTab);
                                setIsOpen(false);
                              }}
                              className="inline-flex items-center gap-1 font-bold text-blue-700 hover:underline cursor-pointer"
                            >
                              <span>Đi đến phân hệ tương ứng</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: 8 HƯỚNG DẪN TIÊU CHUẨN */}
          {activeTab === 'GUIDES' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 mb-2">
                {guidesList.map(g => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGuideId(g.id)}
                    className={`p-2 rounded-xl border text-left font-semibold text-[11px] transition-all cursor-pointer ${
                      selectedGuideId === g.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate block">{g.title}</span>
                  </button>
                ))}
              </div>

              {/* Selected Guide Details */}
              {(() => {
                const guide = guidesList.find(g => g.id === selectedGuideId) || guidesList[0];
                return (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">
                      Chuyên đề: {guide.category}
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-900">{guide.title}</h4>
                    <p className="text-slate-700 text-xs leading-relaxed">{guide.content}</p>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Footer Actions */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
            <span className="text-[10px] text-slate-400 font-medium">
              LABI v2.5 • Phản hồi theo dữ liệu thực
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-semibold cursor-pointer text-xs"
              >
                Thu nhỏ
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold cursor-pointer text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

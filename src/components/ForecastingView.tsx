import React, { useState } from 'react';
import {
  TrendingUp,
  Calculator,
  Download,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  FileText,
  PackageCheck,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Reagent, Batch, AppSettings } from '../types';
import { calculateReagentStock } from '../services/calculationService';

interface ForecastingViewProps {
  reagents: Reagent[];
  batches: Batch[];
  settings: AppSettings;
  userName: string;
}

interface ForecastProposal {
  reagent: Reagent;
  dailyBurnVolume: number; // mL/day
  dailyBurnUnits: number; // units/day
  coverageDays: number;
  expectedDemandUnits: number;
  safetyBufferUnits: number;
  currentAvailableUnits: number;
  calculatedOrderUnits: number;
  roundedPackageUnits: number;
  overstockRisk: boolean;
  overstockWarning?: string;
  isMissingData: boolean;
  missingNote?: string;
}

export const ForecastingView: React.FC<ForecastingViewProps> = ({
  reagents,
  batches,
  settings,
  userName
}) => {
  // Global planning parameters
  const [leadTimeDays, setLeadTimeDays] = useState<number>(7); // Thời gian nhà cung cấp giao hàng
  const [orderCycleDays, setOrderCycleDays] = useState<number>(30); // Chu kỳ đặt hàng (thường 30 ngày)
  const [safetyBufferDays, setSafetyBufferDays] = useState<number>(10); // Dự phòng đứt hàng
  const [filterNeedsOrderOnly, setFilterNeedsOrderOnly] = useState<boolean>(true);

  // Compute forecasts for all active reagents
  const proposals: ForecastProposal[] = reagents
    .filter(r => r.isActive)
    .map(r => {
      const stock = calculateReagentStock(r, batches, settings);
      const isMissing = !r.unitVolume || !r.consumptionPerTest || !r.averageTestsPerDay;

      if (isMissing) {
        return {
          reagent: r,
          dailyBurnVolume: 0,
          dailyBurnUnits: 0,
          coverageDays: leadTimeDays + orderCycleDays,
          expectedDemandUnits: 0,
          safetyBufferUnits: 0,
          currentAvailableUnits: stock.totalAvailableUnits,
          calculatedOrderUnits: 0,
          roundedPackageUnits: 0,
          overstockRisk: false,
          isMissingData: true,
          missingNote: 'Chưa đủ dữ liệu để tính lượng nhập đề xuất.'
        };
      }

      // Daily burn in units
      // Volume/day = T * R
      const dailyVol = (r.averageTestsPerDay || 0) * (r.consumptionPerTest || 0);
      const unitVol = r.unitVolume || 1;
      const dailyUnits = dailyVol / unitVol;

      // Days to cover
      const coverageDays = leadTimeDays + orderCycleDays;
      const expectedDemandUnits = dailyUnits * coverageDays;
      const safetyBufferUnits = dailyUnits * safetyBufferDays;

      // Net need = Demand + Safety - Current available
      const rawOrderUnits = expectedDemandUnits + safetyBufferUnits - stock.totalAvailableUnits;
      const calculatedOrderUnits = rawOrderUnits > 0 ? rawOrderUnits : 0;
      const roundedPackageUnits = Math.ceil(calculatedOrderUnits);

      // Check risk of overstocking vs expiry
      let overstockRisk = false;
      let overstockWarning = '';
      if (roundedPackageUnits > 0 && r.usageFrequency === 'Thấp') {
        overstockRisk = true;
        overstockWarning = 'Tần suất dùng thấp: Cần lưu ý hạn dùng của nhà cung cấp khi nhận hàng để tránh quá hạn.';
      }

      return {
        reagent: r,
        dailyBurnVolume: dailyVol,
        dailyBurnUnits: dailyUnits,
        coverageDays,
        expectedDemandUnits: Math.round(expectedDemandUnits * 10) / 10,
        safetyBufferUnits: Math.round(safetyBufferUnits * 10) / 10,
        currentAvailableUnits: stock.totalAvailableUnits,
        calculatedOrderUnits: Math.round(calculatedOrderUnits * 10) / 10,
        roundedPackageUnits,
        overstockRisk,
        overstockWarning,
        isMissingData: false
      };
    });

  const displayedProposals = filterNeedsOrderOnly
    ? proposals.filter(p => p.roundedPackageUnits > 0 || p.isMissingData)
    : proposals;

  const totalItemsToOrder = proposals.filter(p => p.roundedPackageUnits > 0).length;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <span>DỰ BÁO NHU CẦU & ĐỀ XUẤT ĐẶT HÀNG HÓA CHẤT</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tính toán lượng đặt hàng kinh tế dựa trên lead time giao hàng, mức test/ngày và mức tồn an toàn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-200">
            {totalItemsToOrder} mặt hàng cần nhập bổ sung
          </span>
        </div>
      </div>

      {/* Safety Principle (Section 14 Rule) */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs text-blue-900 leading-relaxed flex items-center gap-2.5">
        <ShieldAlert className="w-5 h-5 text-blue-600 shrink-0" />
        <span>
          <strong>NGUYÊN TẮC PHÊ DUYỆT ĐẶT HÀNG:</strong> "Hệ thống chỉ tạo <em>Bản đề xuất dự trù mua sắm</em> để Cán bộ phụ trách và Lãnh đạo thẩm định. Không tự động phát hành đơn hàng thực tế."
        </span>
      </div>

      {/* Planning Parameters Control */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Calculator className="w-4 h-4 text-blue-600" />
          <span>Thông Số Chu Kỳ Cung Ứng Tham Chiếu</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Thời gian giao hàng (Lead time)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={leadTimeDays}
                onChange={(e) => setLeadTimeDays(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold font-mono focus:outline-none focus:border-blue-500"
              />
              <span className="text-slate-500 shrink-0">ngày</span>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Chu kỳ đặt hàng định kỳ</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="7"
                value={orderCycleDays}
                onChange={(e) => setOrderCycleDays(parseInt(e.target.value) || 7)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold font-mono focus:outline-none focus:border-blue-500"
              />
              <span className="text-slate-500 shrink-0">ngày</span>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Số ngày dự phòng đứt hàng</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={safetyBufferDays}
                onChange={(e) => setSafetyBufferDays(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 font-bold font-mono focus:outline-none focus:border-blue-500"
              />
              <span className="text-slate-500 shrink-0">ngày</span>
            </div>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer p-2 rounded-xl hover:bg-slate-50 border border-slate-200 w-full">
              <input
                type="checkbox"
                checked={filterNeedsOrderOnly}
                onChange={(e) => setFilterNeedsOrderOnly(e.target.checked)}
                className="rounded text-blue-600 focus:ring-0"
              />
              <span>Chỉ hiện mục cần đặt (&gt; 0)</span>
            </label>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
          Công thức tính: <strong>Nhu cầu dự kiến = Dùng/ngày × ({leadTimeDays} + {orderCycleDays} ngày)</strong>. Lượng cần nhập = Nhu cầu + Dự phòng ({safetyBufferDays} ngày) - Tồn khả dụng hiện tại.
        </div>
      </div>

      {/* Proposals Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Mã HC</th>
                <th className="py-3 px-4">Tên hóa chất</th>
                <th className="py-3 px-4">Quy cách & Đơn vị</th>
                <th className="py-3 px-4 text-center">Tồn khả dụng</th>
                <th className="py-3 px-4 text-center">Nhu cầu chu kỳ</th>
                <th className="py-3 px-4 text-center">Tồn dự phòng</th>
                <th className="py-3 px-4 text-center">Đề xuất nhập</th>
                <th className="py-3 px-4">Lưu ý rủi ro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedProposals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                    Không có mặt hàng nào cần đặt hàng theo chu kỳ hiện tại.
                  </td>
                </tr>
              ) : (
                displayedProposals.map(p => (
                  <tr key={p.reagent.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{p.reagent.code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{p.reagent.name}</td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{p.reagent.packaging}</div>
                      <div className="text-[10px] text-slate-400">{p.reagent.unit} ({p.reagent.unitVolume} {p.reagent.volumeUnit})</div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                      {p.currentAvailableUnits} {p.reagent.unit}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-600">
                      {p.isMissingData ? 'N/A' : `${p.expectedDemandUnits} ${p.reagent.unit}`}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-600">
                      {p.isMissingData ? 'N/A' : `${p.safetyBufferUnits} ${p.reagent.unit}`}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.isMissingData ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          Chưa đủ dữ liệu
                        </span>
                      ) : p.roundedPackageUnits > 0 ? (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-600 text-white shadow-xs">
                          +{p.roundedPackageUnits} {p.reagent.unit}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-semibold font-mono">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {p.isMissingData ? (
                        <span className="text-amber-700 font-semibold text-[11px]">{p.missingNote}</span>
                      ) : p.overstockRisk ? (
                        <span className="text-orange-700 text-[11px] font-semibold">{p.overstockWarning}</span>
                      ) : (
                        <span className="text-emerald-700 text-[11px]">Đạt chuẩn cân đối</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

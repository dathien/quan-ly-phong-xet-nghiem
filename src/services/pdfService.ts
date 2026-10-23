import { jsPDF } from 'jspdf';
import { InventorySession, SOPDocument, AppSettings } from '../types';

export class PdfService {
  /**
   * Export Inventory Audit Session to PDF
   */
  public static exportInventoryPDF(session: InventorySession, settings: AppSettings): void {
    const doc = new jsPDF();
    let y = 15;

    // Header
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(settings.labName.toUpperCase(), 14, y);
    y += 5;
    doc.text(settings.labSubName, 14, y);
    y += 10;

    doc.setFontSize(14);
    doc.setTextColor(20, 50, 100);
    doc.text('BIEN BAN KIEM KE KHO HOA CHAT XET NGHIEM', 14, y);
    y += 8;

    doc.setFontSize(9);
    doc.setTextColor(50);
    doc.text(`Ma dot kiem ke: ${session.sessionCode}   |   Ngay: ${session.date}`, 14, y);
    y += 5;
    doc.text(`Pham vi: ${session.scope}   |   Nguoi kiem ke: ${session.auditor}`, 14, y);
    y += 5;
    doc.text(`Trang thai: ${session.status}   |   Nguoi xac nhan: ${session.confirmer || 'Chua xac nhan'}`, 14, y);
    y += 10;

    // Table Header
    doc.setFontSize(8);
    doc.setTextColor(0);
    doc.setFillColor(230, 240, 255);
    doc.rect(14, y - 4, 182, 8, 'F');
    doc.text('STT', 16, y);
    doc.text('Ma HC', 26, y);
    doc.text('Ten Hoa Chat', 48, y);
    doc.text('Lot/Batch', 105, y);
    doc.text('Vi Tri', 132, y);
    doc.text('He thong', 150, y);
    doc.text('Thuc te', 165, y);
    doc.text('Lech', 180, y);
    y += 6;

    // Table Rows
    session.items.forEach((item, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(String(index + 1), 16, y);
      doc.text(item.reagentCode.slice(0, 10), 26, y);
      doc.text(item.reagentName.slice(0, 28), 48, y);
      doc.text(item.batchNumber.slice(0, 12), 105, y);
      doc.text(item.locationId || 'N/A', 132, y);
      doc.text(String(item.systemQuantity), 153, y);
      doc.text(String(item.physicalQuantity), 168, y);

      if (item.discrepancy !== 0) {
        doc.setTextColor(200, 0, 0);
      } else {
        doc.setTextColor(0, 120, 0);
      }
      doc.text(String(item.discrepancy), 182, y);
      doc.setTextColor(0);

      y += 6;
    });

    // Signature section
    y += 12;
    if (y > 250) {
      doc.addPage();
      y = 30;
    }
    doc.setFontSize(9);
    doc.text('NGUOI KIEM KE', 30, y);
    doc.text('QUAN LY KHO', 95, y);
    doc.text('LANH DAO PHE DUYET', 150, y);
    y += 5;
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('(Ky va ghi ro ho ten)', 30, y);
    doc.text('(Ky va ghi ro ho ten)', 95, y);
    doc.text('(Ky va ghi ro ho ten)', 150, y);

    doc.save(`BienBan_KiemKe_${session.sessionCode}.pdf`);
  }

  /**
   * Export SOP document to PDF
   */
  public static exportSopPDF(sop: SOPDocument, settings: AppSettings): void {
    const doc = new jsPDF();
    let y = 18;

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(settings.labName.toUpperCase(), 14, y);
    y += 5;
    doc.text(`HE THONG QUAN LY CHAT LUONG ISO 15189`, 14, y);
    y += 12;

    doc.setFontSize(13);
    doc.setTextColor(20, 50, 100);
    doc.text(`QUY TRINH THAO TAC CHUAN (SOP)`, 14, y);
    y += 7;
    doc.setFontSize(11);
    doc.text(`${sop.code}: ${sop.title.toUpperCase()}`, 14, y);
    y += 6;

    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text(`Phien ban: ${sop.version} | Ngay hieu luc: ${sop.effectiveDate} | Tinh trang: ${sop.isDraft ? 'BAN DU THAO' : 'DA PHE DUYET'}`, 14, y);
    y += 10;

    // Disclaimer
    doc.setFillColor(254, 242, 242);
    doc.rect(14, y - 4, 182, 10, 'F');
    doc.setTextColor(180, 40, 40);
    doc.setFontSize(8);
    doc.text('Luu y: SOP duoc tao trong he thong chi la ban du thao cho den khi duoc phe duyet chinh thuc.', 18, y + 2);
    y += 14;

    doc.setTextColor(0);
    doc.setFontSize(9);
    doc.text('1. MUC DICH:', 14, y);
    y += 5;
    doc.setTextColor(60);
    const splitPurpose = doc.splitTextToSize(sop.purpose, 180);
    doc.text(splitPurpose, 14, y);
    y += splitPurpose.length * 5 + 4;

    doc.setTextColor(0);
    doc.text('2. PHAM VI AP DUNG:', 14, y);
    y += 5;
    doc.setTextColor(60);
    const splitScope = doc.splitTextToSize(sop.scope, 180);
    doc.text(splitScope, 14, y);
    y += splitScope.length * 5 + 4;

    doc.setTextColor(0);
    doc.text('3. TRACH NHIEM:', 14, y);
    y += 5;
    doc.setTextColor(60);
    const splitResp = doc.splitTextToSize(sop.responsibility, 180);
    doc.text(splitResp, 14, y);
    y += splitResp.length * 5 + 4;

    doc.setTextColor(0);
    doc.text('4. NOI DUNG TIEN HANH:', 14, y);
    y += 5;
    doc.setTextColor(60);
    sop.content.forEach((step) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      const splitStep = doc.splitTextToSize(step, 180);
      doc.text(splitStep, 14, y);
      y += splitStep.length * 5 + 2;
    });

    y += 8;
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setTextColor(0);
    doc.text('5. BIEU MAU AP DUNG:', 14, y);
    y += 5;
    doc.setTextColor(60);
    sop.forms.forEach((f) => {
      doc.text(`- ${f}`, 18, y);
      y += 5;
    });

    y += 12;
    doc.setFontSize(8);
    doc.setTextColor(50);
    doc.text(`Nguoi soan: ${sop.author}`, 14, y);
    doc.text(`Nguoi kiem tra: ${sop.reviewer}`, 80, y);
    doc.text(`Nguoi phe duyet: ${sop.approver}`, 140, y);

    doc.save(`${sop.code}_${sop.version}.pdf`);
  }
}

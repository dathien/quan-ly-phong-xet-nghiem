import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    appName: 'LAB CHEM SMART MANAGER AI',
    timestamp: new Date().toISOString(),
    aiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY')
  });
});

// AI Cabinet & Reagent Analysis Endpoint
app.post('/api/ai/analyze-cabinet', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return res.status(200).json({
      connected: false,
      message: 'Chức năng phân tích AI chưa được kết nối. Bạn vẫn có thể quản lý kho và kiểm kê bình thường.',
      analysis: null
    });
  }

  try {
    const { imageBase64, mimeType, cabinetInfo, userNotes } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Vui lòng cung cấp dữ liệu hình ảnh tủ hoặc kệ hóa chất.' });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Clean base64 data if data URL prefix exists
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const actualMimeType = mimeType || 'image/jpeg';

    const systemPrompt = `Bạn là trợ lý AI chuyên môn hỗ trợ rà soát trực quan tủ/kệ hóa chất phòng xét nghiệm y khoa (LAB CHEM SMART MANAGER AI).
Tuân thủ tuyệt đối các nguyên tắc an toàn xét nghiệm y khoa:
1. Nhận diện bố cục tủ và đếm số tầng/khay nhìn thấy.
2. Nhận xét mật độ sắp xếp (thoáng, vừa phải, quá dày, che khuất tầm nhìn nhãn).
3. Đọc nhãn các chai/hộp nếu chữ ĐỦ RÕ RÀNG. Nếu chữ mờ hoặc bị che, ghi rõ: "Không đọc được nhãn từ ảnh". TUYỆT ĐỐI KHÔNG TỰ ĐOÁN tên hóa chất.
4. TUYỆT ĐỐI KHÔNG TỰ ĐOÁN hạn dùng hoặc thể tích còn lại trong bình.
5. Xác định các vị trí có nguy cơ nhầm lẫn (ví dụ: các chai cùng hình dáng kích thước đặt sát nhau, chai hóa chất lỏng đặt trên đồ khô hoặc không đúng quy cách).
6. TUYỆT ĐỐI KHÔNG TỰ KẾT LUẬN các hóa chất tương thích an toàn với nhau chỉ dựa trên hình ảnh.
7. Đưa ra nhận xét về khả năng kiểm kê thực tế và các đề xuất cải thiện bố cục (5S, dán nhãn vị trí, phân tầng an toàn).
8. Liệt kê các mục cần cán bộ kiểm kê trực tiếp xác minh.
9. Mọi ước tính PHẢI kèm thông điệp: "Ước tính sơ bộ từ ảnh, cần đối chiếu kiểm kê thực tế."
10. Đánh giá mức độ tin cậy của ảnh này: "Thấp", "Trung bình", hoặc "Cao" kèm lý do.`;

    const userPrompt = `Hãy phân tích bức ảnh tủ/kệ hóa chất sau.
Thông tin tham khảo từ hệ thống:
- Tủ được chọn: ${cabinetInfo?.name || 'Không rõ'} (${cabinetInfo?.code || 'Chưa có mã'})
- Loại tủ: ${cabinetInfo?.type || 'Chung'}
- Giới hạn nhiệt độ quy định: ${cabinetInfo?.tempRange || 'Chưa cài đặt'}
- Ghi chú người gửi: ${userNotes || 'Không có ghi chú'}

Hãy trả về kết quả định dạng JSON thuần túy (không bọc trong \`\`\`json markdown blocks, chỉ raw JSON) theo cấu trúc:
{
  "connected": true,
  "cabinetLayout": "Mô tả bố cục tổng thể",
  "visibleShelvesCount": 3,
  "densityAssessment": "Mật độ bố trí...",
  "recognizedLabels": [
    {
      "shelf": "Tầng 1",
      "label": "Tên đọc được (hoặc 'Không đọc được nhãn từ ảnh')",
      "confidence": "Cao/Trung bình/Thấp",
      "note": "Ghi chú vị trí"
    }
  ],
  "confusionRisks": [
    "Nguy cơ 1...",
    "Nguy cơ 2..."
  ],
  "inventoryFeasibility": "Nhận xét khả năng kiểm kê trực tiếp từ góc chụp hiện tại...",
  "recommendations": [
    "Khuyến nghị cải thiện 1...",
    "Khuyến nghị 2..."
  ],
  "verificationNeeded": [
    "Mục 1 cần cán bộ xác minh tận nơi...",
    "Mục 2..."
  ],
  "confidenceLevel": "Trung bình",
  "disclaimer": "Ước tính sơ bộ từ ảnh, cần đối chiếu kiểm kê thực tế. Không tự ý dùng kết quả này để thay đổi dữ liệu tồn kho chính thức."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: systemPrompt + '\n\n' + userPrompt },
            {
              inlineData: {
                data: cleanBase64,
                mimeType: actualMimeType
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    });

    const responseText = response.text || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      parsedData = {
        connected: true,
        cabinetLayout: responseText,
        visibleShelvesCount: 0,
        densityAssessment: 'Đã nhận dạng văn bản',
        recognizedLabels: [],
        confusionRisks: [],
        inventoryFeasibility: 'Cần kiểm tra nhãn trực tiếp',
        recommendations: ['Rà soát thủ công'],
        verificationNeeded: ['Kiểm tra toàn bộ nhãn chai'],
        confidenceLevel: 'Thấp',
        disclaimer: 'Ước tính sơ bộ từ ảnh, cần đối chiếu kiểm kê thực tế.'
      };
    }

    return res.json({
      connected: true,
      analysis: parsedData
    });
  } catch (error: any) {
    console.error('AI Analysis Error:', error);
    return res.status(200).json({
      connected: false,
      message: `Không thể hoàn tất phân tích hình ảnh qua AI (${error?.message || 'Lỗi kết nối'}). Bạn vẫn có thể quản lý kho và kiểm kê thủ công bình thường.`,
      analysis: null
    });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[LAB CHEM SMART MANAGER AI] Server running on http://0.0.0.0:${port}`);
  });
}

startServer();

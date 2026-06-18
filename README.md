# TÀI LIỆU YÊU CẦU PHẦN MỀM (SRS) - CÔNG THỨC & DỮ LIỆU KIỂM THỬ SẢN XUẤT
## HỆ THỐNG PHẦN MỀM BÓC TÁCH KHỐI LƯỢNG ỐNG GIÓ 2026 (SHEET 1)

---

### QUY ĐỊNH CHUNG TOÀN HỆ THỐNG
* **Quy chuẩn đơn vị đo lường:**
  * Kích thước hình học cấu kiện (Rộng `W`, Cao `H`, Dài `L`, Bán kính `R`/`r`, Đường kính `Ø`): **mm**
  * Diện tích thành phần và Tổng diện tích sản xuất phôi tôn (`∑Ssx`): **m²**
* **Nguyên tắc xử lý của lõi phần mềm (Core Engine):** * Toàn bộ dữ liệu kích thước nhập vào từ người dùng là `mm`. Hệ thống bắt buộc phải thực hiện phép chia cho `1000` để chuyển đổi sang đơn vị `mét` trước khi thực hiện các thuật toán nhân diện tích nhằm đảm bảo tính chính xác dòng dữ liệu đầu ra là `m²`.
  * Các trường Diện tích và Chiều dài triển khai trung gian là cấu phần **Tự động tính toán (System Calculated)**, tuyệt đối khóa không cho người dùng sửa đổi trực tiếp trên UI.

---

### CHI TIẾT ĐẶC TẢ TỪNG SẢN PHẨM & DỮ LIỆU KIỂM THỬ (TEST CASES)

#### I. CO (CO 90 ĐỘ / CO 45 ĐỘ)
*Mẫu tính toán Co tiêu chuẩn trong hệ thống bao gồm cả phần bù mí gia công cơ khí (mí uốn) và diện tích lá hướng dòng.*

1. **Phân loại trường dữ liệu:**
   * **Trường phải nhập (Inputs):** * `W`: Chiều rộng (mm)
     * `H`: Chiều cao (mm)
     * `r`: Bán kính nhỏ bên trong (mm)
     * `R`: Bán kính lớn bên ngoài (mm)
     * *Các tham số hao hụt cấu hình cố định trong mã nguồn:* `mí 8` = 8mm, `TDC` = 50mm, `mí Z` = 30mm.
   * **Trường tự động tính (Outputs):**
     * `Smặtcongsx`: Diện tích mặt uốn cong sản xuất (m²)
     * `Sthànhnhỏsx`: Diện tích vách thành nhỏ trong (m²)
     * `Sthànhlớnsx`: Diện tích vách thành lớn ngoài (m²)
     * `Diện tích lá hướng dòng`: Diện tích tôn bổ sung làm lá hướng dòng (m²)
     * `∑Ssx`: Tổng diện tích sản xuất (m²)

2. **Ví dụ kiểm thử phần mềm (Test Case 1):**
   * **Dữ liệu đầu vào (Inputs):** `W` = 300, `H` = 300, `r` = 150, `R` = 450
   * **Kết quả đầu ra chính xác (Expected Outputs):**
     * `Smặtcongsx` = **0.516128** m²
     * `Sthànhnhỏsx` = **0.120780** m²
     * `Sthànhlớnsx` = **0.290340** m²
     * `Lá hướng dòng` = **0.120105** m² (Số lượng cấu hình: 1)
     * `∑Ssx` (Tổng phôi sản xuất) = **0.927248** m²

---

#### II. GIẢM (CÔN THU)
*Áp dụng tính toán phôi cho các cấu kiện thu hẹp hoặc mở rộng tiết diện đường ống dẫn gió.*

1. **Phân loại trường dữ liệu:**
   * **Trường phải nhập (Inputs):**
     * `Wmax`: Chiều rộng lớn nhất đầu vào (mm)
     * `Hmax`: Chiều cao lớn nhất đầu vào (mm)
     * `L`: Chiều dài cấu kiện giảm (mm)
   * **Trường tự động tính (Outputs):**
     * `Ssx1`: Diện tích thành vách phần 1 (m²)
     * `Ssx2`: Diện tích thành vách phần 2 (m²)
     * `∑Ssx`: Tổng diện tích phôi sản xuất hoàn thiện (m²)

2. **Ví dụ kiểm thử phần mềm (Test Case 2):**
   * **Dữ liệu đầu vào (Inputs):** `Wmax` = 900, `L` = 500, `Hmax` = 500
   * **Kết quả đầu ra chính xác (Expected Outputs):**
     * `Ssx1` = **1.099200** m²
     * `Ssx2` = **0.672000** m²
     * `∑Ssx` (Tổng diện tích giảm) = **1.771200** m² *(hoặc cấu hình bù mí tối đa đạt 1.948320 m² tùy cài đặt liên kết góc)*

---

#### III. ỐNG GIÓ THẲNG & BIẾN THỂ BỊT ĐẦU (III, IV, V)
*Thuật toán đa năng kết hợp: Ống thẳng tiêu chuẩn (III), Ống gió bịt 1 đầu (IV), và Ống gió bịt 2 đầu (V). Bỏ qua thông số nẹp C khi tính diện tích tôn.*

1. **Phân loại trường dữ liệu:**
   * **Trường phải nhập (Inputs):**
     * `Cấu hình phân mảnh`: Cho phép chọn thông qua Dropdown gồm: `1 MẢNH`, `2 MẢNH`, hoặc `4 MẢNH`.
     * `W`: Chiều rộng tiết diện (mm)
     * `H`: Chiều cao tiết diện (mm)
     * `L`: Chiều dài phân đoạn ống (mm)
   * **Trường tự động tính (Outputs):**
     * `∑Ssx (III/ ỐNG)`: Diện tích sản xuất ống thẳng tiêu chuẩn (m²)
     * `∑Ssx (IV/ BỊT 01 ĐẦU)`: Diện tích ống thẳng + 1 mặt phẳng bít đáy (m²)
     * `∑Ssx (V/ BỊT 02 ĐẦU)`: Diện tích ống thẳng + 2 mặt phẳng bít hai đầu (m²)

2. **Ví dụ kiểm thử phần mềm (Test Case 3):**

   * **Kịch bản 3a (Cấu hình phôi 1 MẢNH):**
     * **Inputs:** Loại phôi = `1 MẢNH`, `W` = 670, `H` = 670, `L` = 1120
     * **Expected Outputs:** * `∑Ssx` (Ống thẳng III) = **3.319620** m² *(Hệ số bù mí thực tế phôi cắt đạt 3.485601 m²)*
       * `∑Ssx` (Bịt 1 đầu IV) = **3.790216** m²
       * `∑Ssx` (Bịt 2 đầu V) = **4.260812** m²

   * **Kịch bản 3b (Cấu hình phôi 2 MẢNH):**
     * **Inputs:** Loại phôi = `2 MẢNH`, `W` = 300, `H` = 500, `L` = 1000
     * **Expected Outputs:**
       * `∑Ssx` (Ống thẳng III) = **1.850200** m² *(Hệ số bù mí thực tế phôi cắt đạt 2.035220 m²)*
       * `∑Ssx` (Bịt 1 đầu IV) = **2.013256** m²
       * `∑Ssx` (Bịt 2 đầu V) = **2.176312** m²

   * **Kịch bản 3c (Cấu hình phôi 4 MẢNH):**
     * **Inputs:** Loại phôi = `4 MẢNH`, `W` = 1800, `H` = 300, `L` = 400
     * **Expected Outputs:**
       * `∑Ssx` (Ống thẳng III) = **2.252000** m² *(Hệ số bù mí thực tế phôi cắt đạt 2.477200 m²)*
       * `∑Ssx` (Bịt 1 đầu IV) = **2.825856** m²
       * `∑Ssx` (Bịt 2 đầu V) = **3.399712** m²

---

#### IV. BZ (ỐNG LỆCH TÂM / CỔ NGỖNG)
*Sử dụng khi tuyến ống chuyển hướng cao độ hoặc lệch tâm trục.*

1. **Phân loại trường dữ liệu:**
   * **Trường phải nhập (Inputs):**
     * `W`: Chiều rộng mặt cắt (mm)
     * `H`: Chiều cao mặt cắt (mm)
     * `L`: Chiều dài trục cấu kiện (mm)
     * `ĐỘ LỆCH`: Khoảng cách lệch tâm giữa hai đầu ống (mm)
   * **Trường tự động tính (Outputs):**
     * `MẶT Z`: Diện tích các vách biên dạng chữ Z (m²)
     * `MẶT LƯỢN`: Diện tích các vách uốn cong lượn định hình (m²)
     * `∑Ssx`: Tổng diện tích phôi uốn BZ (m²)

2. **Ví dụ kiểm thử phần mềm (Test Case 4):**
   * **Dữ liệu đầu vào (Inputs):** `W` = 250, `H` = 500, `L` = 800, `ĐỘ LỆCH` = 200
   * **Kết quả đầu ra chính xác (Expected Outputs):**
     * `MẶT Z` = **0.928800** m²
     * `MẶT LƯỢN` = **1.232000** m²
     * `∑Ssx` (Tổng diện tích BZ) = **2.160800** m²

---

#### V. TÊ CỤT (ĐỀU & KHÔNG ĐỀU)
*Hệ thống chuẩn hóa tích hợp Tê cụt đều và Tê cụt không đều vào chung một thực thể xử lý. Đối với Tê cụt đều, phần mềm tự động đặt ràng buộc `W1 = W2 = Wmax`.*

1. **Phân loại trường dữ liệu:**
   * **Trường phải nhập (Inputs):**
     * `Wmax`: Chiều rộng tối đa của đầu Tê (mm)
     * `W`: Chiều rộng đường nhánh trích phẳng (mm)
     * `H`: Chiều cao thành ống (mm)
     * `r` hoặc `r(max)`: Bán kính cung tròn góc lượn cổ Tê (mm)
   * **Trường tự động tính (Outputs):**
     * `C1+C2`, `C3`: Chiều dài khai triển trung gian (mm)
     * `Rộng T`, `Cao T (L)`: Kích thước bao hình bao phôi phẳng (mm)
     * `S Mặt T`: Diện tích tấm phẳng cắt hình chữ T (m²)
     * `S Mặt Cong trên`: Diện tích phần tôn uốn lượn phía trên (m²)
     * `S Mặt cong bên`: Diện tích vách uốn cong bên hông (m²)
     * `∑Ssx`: Tổng diện tích sản xuất Tê Cụt (m²)

2. **Ví dụ kiểm thử phần mềm (Test Case 5):**

   * **Kịch bản 5a (Kiểm thử Tê Cụt Đều):**
     * **Inputs:** `W` = 300, `H` = 300, `r` = 150 *(Hệ thống tự gán Wmax = 300)*
     * **Expected Outputs:**
       * `C1+C2` = **770.820393** mm | `C3` = **335.500000** mm
       * `Rộng T` = **700** mm | `Cao T (L)` = **608** mm
       * `S Mặt T` = **0.932400** m²
       * `S Mặt Cong trên` = **0.313495** m²
       * `S Mặt cong bên` = **0.241560** m²
       * `∑Ssx` (Tổng Tê cụt đều) = **1.487455** m²

   * **Kịch bản 5b (Kiểm thử Tê Cụt Không Đều):**
     * **Inputs:** `Wmax` = 250, `W` = 200, `H` = 200, `r(max)` = 150
     * **Expected Outputs:**
       * `C1+C2` = **638.516481** mm | `C3` = **335.500000** mm
       * `Rộng T` = **600** mm | `Cao T (L)` = **400** mm
       * `S Mặt T` = **0.549600** m²
       * `S Mặt Cong trên` = **0.192014** m²
       * `S Mặt cong bên` = **0.174460** m²
       * `∑Ssx` (Tổng Tê cụt không đều) = **0.916074** m²

---

#### VI. TÊ RẼ (ĐỀU & KHÔNG ĐỀU)
*Thuật toán gộp xử lý toàn bộ các biên dạng Tê rẽ nhánh hướng xiên dòng.*

1. **Phân loại trường dữ liệu:**
   * **Trường phải nhập (Inputs):**
     * `W'`: Chiều rộng cổ rẽ nhánh phụ (mm)
     * `W`: Chiều rộng trục chính tuyến ống (mm)
     * `H`: Chiều cao thành ống (mm)
     * `r`: Bán kính cong góc rẽ nhánh (mm)
   * **Trường tự động tính (Outputs):**
     * `C1`, `C2`: Thông số chiều dài cung khai triển (mm)
     * `Rộng T`, `Cao T (L)`: Khổ bao phôi phẳng (mm)
     * `S mặt r`: Diện tích phần tôn uốn theo bán kính r (m²)
     * `S Mặt Cong trên`: Diện tích bề mặt cong phía trên (m²)
     * `S Mặt cong bên`: Diện tích vách lượn bên cạnh (m²)
     * `S mặt thẳng`: Diện tích vách phẳng nối tiếp thành (m²)
     * `∑Ssx`: Tổng diện tích sản xuất Tê Rẽ (m²)

2. **Ví dụ kiểm thử phần mềm (Test Case 6):**

   * **Kịch bản 6a (Kiểm thử Tê Rẽ Đều):**
     * **Inputs:** `W` = 250, `H` = 200, `r` = 200 *(Hệ thống tự gán W' = W = 250)*
     * **Expected Outputs:**
       * `S mặt r` = **1.137000** m²
       * `S Mặt Cong trên` = **0.248690** m²
       * `S Mặt cong bên` = **0.133640** m²
       * `S mặt thẳng` = **0.195000** m²
       * `∑Ssx` (Tổng Tê rẽ đều) = **1.714330** m²

   * **Kịch bản 6b (Kiểm thử Tê Rẽ Không Đều):**
     * **Inputs:** `W'` = 300, `W` = 300, `H` = 200, `r` = 150
     * **Expected Outputs:**
       * `S mặt r` = **0.840320** m²
       * `S Mặt Cong trên` = **0.248690** m²
       * `S Mặt cong bên` = **0.113230** m²
       * `S mặt thẳng` = **0.135200** m²
       * `∑Ssx` (Tổng Tê rẽ không đều) = **1.337440** m²

---

#### VII. HỘP CHỤP MIỆNG GIÓ THẲNG (HỘP PLENUM)
*Hộp kết nối miệng thổi/hút. Phiên bản hộp nhiều cổ trích uốn ZIGZAC được xử lý bằng cách lấy thuật toán hộp 1 cổ trích và lũy kế số lượng theo trường `Số lỗ`.*

1. **Phân loại trường dữ liệu:**
   * **Trường phải nhập (Inputs):**
     * `Số lỗ` (Số lượng cổ trích/curon): Số đầu ra kết nối ống mềm (Cái)
     * `W`: Chiều rộng đáy hộp chụp (mm)
     * `H`: Chiều cao thành hộp chụp (mm)
     * `L`: Chiều dài/Chiều sâu hộp chụp (mm)
     * `Ø`: Đường kính cổ trích tròn (mm)
   * **Trường tự động tính (Outputs):**
     * `S xung quanh`: Diện tích tôn tạo bốn vách xung quanh hộp (m²)
     * `S trên`: Diện tích mặt đỉnh hộp chụp (m²)
     * `S curon`: Diện tích tôn cuốn thành ống tròn cổ trích (m²)
     * `∑Ssx`: Tổng diện tích sản xuất hộp chụp miệng gió (m²)

2. **Ví dụ kiểm thử phần mềm (Test Case 7):**
   * **Dữ liệu đầu vào (Inputs):** `Số lỗ` = 1, `W` = 400, `H` = 400, `L` = 300, `Ø` = 200
   * **Kết quả đầu ra chính xác (Expected Outputs):**
     * `S xung quanh` = **0.539460** m²
     * `S trên` = **0.173056** m²
     * `S curon` = **0.034540** m²
     * `∑Ssx` (Tổng diện tích hộp chụp) = **0.747056** m²

---

#### VIII. CHÂN RẼ (GIÀY KHỞI HÀNH - COLLAR)
*Cấu kiện dùng để trích nhánh vuông góc từ đường ống chính, có biên dạng hình chiếc giày.*

1. **Phân loại trường dữ liệu:**
   * **Trường phải nhập (Inputs):**
     * `W`: Chiều rộng chân rẽ (mm)
     * `H`: Chiều cao chân rẽ (mm)
     * `L`: Chiều dài cổ trích (Chiều cao biên dạng chiếc giày) (mm)
   * **Trường tự động tính (Outputs):**
     * `S mặt hình giày`: Diện tích hai thành phẳng biên dạng giày hai bên (m²)
     * `S mũi`: Diện tích tấm phẳng vuốt phần mũi giày (m²)
     * `S lưng`: Diện tích tấm vách phẳng phần lưng giày (m²)
     * `∑Ssx`: Tổng diện tích tôn cắt phôi sản xuất chân rẽ (m²)

2. **Ví dụ kiểm thử phần mềm (Test Case 8):**
   * **Dữ liệu đầu vào (Inputs):** `W` = 670, `H` = 670, `L` = 200
   * **Kết quả đầu ra chính xác (Expected Outputs):**
     * `S mặt hình giày` = **0.427900** m²
     * `S mũi` = **0.230988** m²
     * `S lưng` = **0.200750** m²
     * `∑Ssx` (Tổng diện tích chân rẽ) = **0.859638** m²

---

#### IX. CHẠC (CHẠC CHỮ Y / BA NGÃ)
*Cấu kiện ngã ba phân tách dòng không khí đối xứng.*

1. **Phân loại trường dữ liệu:**
   * **Trường phải nhập (Inputs):**
     * `Wmax`: Chiều rộng cơ sở phần thân chung (mm)
     * `R`: Bán kính góc rẽ phân nhánh (mm)
     * `w1`: Chiều rộng nhánh chia thứ nhất (mm)
     * `W3`: Chiều rộng nhánh chia thứ hai (mm)
     * `L`: Chiều dài tổng thể chạc (mm)
     * `H`: Chiều cao cấu kiện (mm)
   * **Trường tự động tính (Outputs):**
     * `S 02 mặt chạc`: Tổng diện tích hai mặt đáy và đỉnh chạc (m²)
     * `S 02 mặt cạnh Wmax`: Diện tích hai thành vách bên phần gốc thân chung (m²)
     * `S 02 mặt cạnh W2`: Diện tích các vách bên phần nhánh chia (m²)
     * `∑Ssx`: Tổng diện tích sản xuất cấu kiện Chạc (m²)

2. **Ví dụ kiểm thử phần mềm (Test Case 9):**
   * **Dữ liệu đầu vào (Inputs):** `Wmax` = 300, `R` = 200, `w1` = 200, `W3` = 200, `L` = 500, `H` = 200
   * **Kết quả đầu ra chính xác (Expected Outputs):**
     * `S 02 mặt chạc` = **0.960000** m²
     * `S 02 mặt cạnh Wmax` = **0.215280** m²
     * `S 02 mặt cạnh W2` = **0.271392** m²
     * `∑Ssx` (Tổng diện tích chạc Y) = **1.446672** m²

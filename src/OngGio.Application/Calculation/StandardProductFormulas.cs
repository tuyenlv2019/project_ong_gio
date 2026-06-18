namespace OngGio.Application.Calculation;

/// <summary>
/// Công thức ∑Ssx chuẩn theo Sheet1 Excel — dùng cho seed DB và kiểm thử.
/// </summary>
public static class StandardProductFormulas
{
    public const string Co =
        """
        R = r + W
        S_matcong = (R + 58) * (R + 58) * 2 / 1000000
        S_thanh_nho = ((3.14 * r / 2) + 100) * (H + 60) / 1000000
        S_thanh_lon = ((3.14 * R / 2) + 100) * (H + 60) / 1000000
        Ssx = S_matcong + S_thanh_nho + S_thanh_lon
        """;

    public const string Giam =
        """
        Ssx1 = (W + 16) * (L + 100) * 2 / 1000000
        Ssx2 = (H + 60) * (L + 100) * 2 / 1000000
        Ssx = Ssx1 + Ssx2
        """;

    public const string OngThang =
        """
        seam = if(phan_manh >= 4, 152, if(phan_manh >= 2, 82, 41))
        Ssx = if(phan_manh >= 4, 2 * (W + H + 152) * (L + 100) / 1000000, (2 * (W + H) + seam) * (L + 100) / 1000000)
        """;

    public const string OngBitMotDau =
        """
        seam = if(phan_manh >= 4, 152, if(phan_manh >= 2, 82, 41))
        ong = if(phan_manh >= 4, 2 * (W + H + 152) * (L + 100) / 1000000, (2 * (W + H) + seam) * (L + 100) / 1000000)
        Ssx = ong + (W + 16) * (H + 16) / 1000000
        """;

    public const string OngBitHaiDau =
        """
        seam = if(phan_manh >= 4, 152, if(phan_manh >= 2, 82, 41))
        ong = if(phan_manh >= 4, 2 * (W + H + 152) * (L + 100) / 1000000, (2 * (W + H) + seam) * (L + 100) / 1000000)
        Ssx = ong + 2 * (W + 16) * (H + 16) / 1000000
        """;

    public const string Bz =
        """
        S_mat_z = (2 * W + 16) * (L + 100) * 2 / 1000000
        S_mat_luon = (L + 100 + DO_LECH) * (H + 60) * 2 / 1000000
        Ssx = S_mat_z + S_mat_luon
        """;

    public const string TeCut =
        """
        C1C2 = sqrt(2 * W * W + 4 * r * W + 4 * r * r) + 100
        C3 = 100 + 3.14 * r / 2
        RongT = 100 + W + 2 * r
        CaoT = if(Wmax > W, r + Wmax, 158 + r + W)
        S_mat_T = RongT * (CaoT + 58) * 2 / 1000000
        S_mat_cong_tren = (C1C2 + 100) * (H + 60) / 1000000
        S_mat_cong_ben = C3 * (H + 60) * 2 / 1000000
        Ssx = S_mat_T + S_mat_cong_tren + S_mat_cong_ben
        """;

    public const string TeRe =
        """
        r_branch = Wp / 2
        C1 = 250 + 3.14 * (r_branch + Wp) / 2
        C2 = 3.14 * r_branch / 2 + 200
        RongT = W + r_branch + Wp + 58
        CaoT = if(L > 0, L, 520)
        S_mat_r = RongT * CaoT * 2 / 1000000
        S_mat_cong_tren = C1 * (H + 60) / 1000000
        S_mat_cong_ben = C2 * (H + 60) / 1000000
        S_mat_thang = CaoT * (H + 60) / 1000000
        Ssx = S_mat_r + S_mat_cong_tren + S_mat_cong_ben + S_mat_thang
        """;

    public const string HopPlenum =
        """
        S_xq = (W * 2 + H * 2 + 20) * (L + 33) / 1000000
        S_tren = (W + 16) * (H + 16) / 1000000
        S_curon = D * 3.14 * 55 / 1000000 * SO_LO
        Ssx = S_xq + S_tren + S_curon
        """;

    public const string ChanRe =
        """
        S_giay = (W + 108) * (L + 75) * 2 / 1000000
        S_mui = (100 * 1.4142 + L - 25) * (H + 60) / 1000000
        S_lung = (L + 75) * (H + 60) / 1000000
        Ssx = S_giay + S_mui + S_lung
        """;

    public const string Chac =
        """
        S_2mat_chac = (Wmax + 2 * R + 100) * (L + 100) * 2 / 1000000
        S_2mat_wmax = ((3.14 * R / 2) + 100) * (H + 60) * 2 / 1000000
        S_2mat_w2 = (1.57 * R + 100 + W3 / 2) * (H + 64) * 2 / 1000000
        Ssx = S_2mat_chac + S_2mat_w2 + S_2mat_wmax
        """;
}

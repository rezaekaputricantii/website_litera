(function () {
    const THEME_KEY = 'litera_theme';

    // 1. Injeksi CSS Premium (Light Mode Editorial Luxury + Dark Mode Contrast + Smooth Interactions)
    const style = document.createElement('style');
    style.id = 'litera-global-experience';
    style.textContent = `
        /* =========================================================
           A. LIGHT MODE EDITORIAL LUXURY (DEFAULT TAMPILAN UTAMA)
           ========================================================= */
        html:not(.dark-mode) body,
        body:not(.dark-mode) {
            background:
                radial-gradient(circle at 12% 0%, rgba(112, 29, 40, 0.045), transparent 38%),
                radial-gradient(circle at 88% 8%, rgba(217, 119, 6, 0.04), transparent 35%),
                #f7f5f0 !important;
            color: #1e293b !important;
        }

        /* Header & Sub-Nav Glassmorphism Terang */
        body:not(.dark-mode) header,
        body:not(.dark-mode) .site-header {
            background-color: rgba(255, 255, 255, 0.88) !important;
            border-bottom: 1px solid rgba(112, 29, 40, 0.09) !important;
        }
        body:not(.dark-mode) .sub-nav {
            background-color: rgba(252, 250, 247, 0.92) !important;
            border-bottom: 1px solid rgba(112, 29, 40, 0.08) !important;
        }

        /* Pill Kategori Mode Terang */
        body:not(.dark-mode) .cat-filter-btn,
        body:not(.dark-mode) .sub-nav button,
        body:not(.dark-mode) .sub-nav a {
            border-radius: 9px !important;
            padding: 0.45rem 0.95rem !important;
            transition: all 0.25s ease !important;
        }
        body:not(.dark-mode) .cat-filter-btn:hover,
        body:not(.dark-mode) .sub-nav button:hover,
        body:not(.dark-mode) .sub-nav a:hover {
            background-color: rgba(112, 29, 40, 0.07) !important;
            color: #701D28 !important;
        }
        body:not(.dark-mode) .cat-filter-btn.active,
        body:not(.dark-mode) .sub-nav button.active,
        body:not(.dark-mode) .sub-nav a.active {
            background: linear-gradient(135deg, #701D28 0%, #8f2432 100%) !important;
            color: #ffffff !important;
            box-shadow: 0 6px 16px rgba(112, 29, 40, 0.24) !important;
        }

        /* Hero Slider Mode Terang (Editorial Mesh + Glass Frame) */
        body:not(.dark-mode) .hero-slider-wrapper {
            position: relative !important;
            border-radius: 24px !important;
            overflow: hidden !important;
            background:
                radial-gradient(circle at 86% 18%, rgba(112, 29, 40, 0.09), transparent 46%),
                radial-gradient(circle at 12% 88%, rgba(217, 119, 6, 0.08), transparent 42%),
                linear-gradient(135deg, #ffffff 0%, #fdfbf7 100%) !important;
            border: 1px solid rgba(112, 29, 40, 0.14) !important;
            box-shadow:
                0 22px 48px -16px rgba(112, 29, 40, 0.11),
                0 4px 14px rgba(15, 23, 42, 0.03) !important;
        }
        body:not(.dark-mode) .hero-slider-wrapper::before {
            content: "";
            position: absolute;
            inset: 0;
            background-image: radial-gradient(rgba(112, 29, 40, 0.14) 1px, transparent 1px);
            background-size: 22px 22px;
            opacity: 0.42;
            pointer-events: none;
            z-index: 0;
        }

        /* Kartu Buku, Paket Bundling, Artikel & Tentang Kami Mode Terang */
        body:not(.dark-mode) .product-card,
        body:not(.dark-mode) .article-card,
        body:not(.dark-mode) .about-card,
        body:not(.dark-mode) .about-hero-card,
        body:not(.dark-mode) .about-stats-bar,
        body:not(.dark-mode) .pdp-card,
        body:not(.dark-mode) .form-card,
        body:not(.dark-mode) .summary-card,
        body:not(.dark-mode) .stat-card,
        body:not(.dark-mode) .content-card {
            background-color: #ffffff !important;
            border: 1px solid rgba(112, 29, 40, 0.09) !important;
            box-shadow: 0 10px 26px -8px rgba(15, 23, 42, 0.06) !important;
        }

        /* Paket Bundling Hemat Mode Terang (Aksen Hangat Berkelas) */
        body:not(.dark-mode) .bundle-card {
            background:
                radial-gradient(circle at 92% 50%, rgba(112, 29, 40, 0.07), transparent 45%),
                linear-gradient(135deg, #ffffff 0%, #fcf8f3 100%) !important;
            border: 1px solid rgba(112, 29, 40, 0.16) !important;
            box-shadow: 0 14px 32px -10px rgba(112, 29, 40, 0.1) !important;
        }

        /* Seksi Artikel & Tentang Kami Mode Terang */
        body:not(.dark-mode) .articles-section,
        body:not(.dark-mode) .about-section {
            background: linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(244,240,234,0.85) 100%) !important;
            border-top: 1px solid rgba(112, 29, 40, 0.07) !important;
            border-bottom: 1px solid rgba(112, 29, 40, 0.07) !important;
        }

        /* Search Input Mode Terang */
        body:not(.dark-mode) .search-input {
            background-color: #f8f6f2 !important;
            border: 1px solid rgba(112, 29, 40, 0.14) !important;
            transition: all 0.25s ease !important;
        }
        body:not(.dark-mode) .search-input:focus {
            background-color: #ffffff !important;
            border-color: #701D28 !important;
            box-shadow: 0 0 0 4px rgba(112, 29, 40, 0.08) !important;
        }

        /* =========================================================
           B. HERO SLIDER SHARED STYLING
           ========================================================= */
        .hero-slider .slide {
            position: relative;
            z-index: 1;
            background: transparent !important;
            padding: 3rem 3.5rem !important;
        }

        .hero-content::before {
            content: "✦ EKOSISTEM BUKU AKADEMIK & LITERASI";
            display: inline-block;
            font-size: 0.72rem;
            font-weight: 700;
            letter-spacing: 0.08em;
            color: #701D28;
            background: rgba(112, 29, 40, 0.08);
            border: 1px solid rgba(112, 29, 40, 0.18);
            padding: 0.35rem 0.85rem;
            border-radius: 999px;
            margin-bottom: 1rem;
        }

        .hero-content h2 {
            font-size: clamp(1.85rem, 3.2vw, 2.65rem) !important;
            line-height: 1.2 !important;
            letter-spacing: -0.02em !important;
            margin-bottom: 1rem !important;
        }

        .hero-content p {
            font-size: 1.02rem !important;
            line-height: 1.65 !important;
            max-width: 540px !important;
        }

        .hero-image {
            position: relative !important;
            z-index: 1;
        }
        .hero-image::after {
            content: "✓ QC Fisik Terverifikasi • Makassar, Gowa & Maros";
            position: absolute;
            bottom: 14px;
            left: 14px;
            background: rgba(255, 255, 255, 0.94);
            backdrop-filter: blur(10px);
            color: #1e293b;
            font-size: 0.76rem;
            font-weight: 600;
            padding: 0.45rem 0.9rem;
            border-radius: 12px;
            border: 1px solid rgba(112, 29, 40, 0.14);
            box-shadow: 0 10px 25px rgba(15, 23, 42, 0.14);
            z-index: 3;
            pointer-events: none;
        }
        .hero-image img {
            border-radius: 18px !important;
            box-shadow: 0 18px 38px rgba(15, 23, 42, 0.16) !important;
            border: 4px solid rgba(255, 255, 255, 0.9) !important;
            animation: literaHeroFloat 6s ease-in-out infinite;
            will-change: transform;
        }

        .litera-hero-arrow {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(112, 29, 40, 0.2);
            color: #701D28;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 5;
            opacity: 0;
            transition: all 0.3s ease;
            box-shadow: 0 6px 16px rgba(15, 23, 42, 0.1);
        }
        .hero-slider-wrapper:hover .litera-hero-arrow {
            opacity: 1;
        }
        .litera-hero-arrow:hover {
            background: #701D28;
            color: #ffffff;
            border-color: #701D28;
            transform: translateY(-50%) scale(1.08);
        }
        .litera-hero-prev { left: 14px; }
        .litera-hero-next { right: 14px; }

        /* =========================================================
           C. DARK MODE PALETTE & CONTRAST SYSTEM
           ========================================================= */
        html.dark-mode body,
        body.dark-mode {
            background-color: #0b1120 !important;
            color: #f1f5f9 !important;
        }

        body.dark-mode header,
        body.dark-mode .site-header,
        body.dark-mode .sub-nav,
        body.dark-mode .sidebar,
        /* Perbaikan Kotak Menu Sidebar Dashboard (Admin & Pengguna) */
        body.dark-mode .sidebar-menu,
        body.dark-mode .sidebar nav,
        body.dark-mode .sidebar-nav {
            background-color: #131c31 !important;
            border: 1px solid #26334d !important;
            box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35) !important;
        }
        body.dark-mode .sidebar-menu .menu-item {
            background-color: transparent !important;
            color: #cbd5e1 !important;
        }
        body.dark-mode .sidebar-menu .menu-item:hover {
            background-color: rgba(255, 255, 255, 0.06) !important;
            color: #ffffff !important;
        }
        body.dark-mode .sidebar-menu .menu-item.active {
            background-color: #b91c1c !important;
            color: #ffffff !important;
        }

        /* Perbaikan Ikon Dark & Badge di Dashboard */
        body.dark-mode .stat-icon.dark {
            background-color: rgba(148, 163, 184, 0.16) !important;
            color: #e2e8f0 !important;
        }
        body.dark-mode .badge-tag,
        body.dark-mode .badge-status {
            background-color: rgba(251, 113, 133, 0.16) !important;
            border: 1px solid rgba(251, 113, 133, 0.3) !important;
        }

        /* Pastikan Konten Dashboard Tidak Terpotong Header */
        .dashboard-container {
            padding-top: 1.5rem !important;
            align-items: flex-start !important;
        }
        body.dark-mode .litera-main-footer {
            background-color: rgba(15, 23, 42, 0.88) !important;
            border-color: #1e293b !important;
            color: #f1f5f9 !important;
        }

        body.dark-mode .hero-slider-wrapper {
            position: relative !important;
            border-radius: 24px !important;
            overflow: hidden !important;
            background:
                radial-gradient(circle at 85% 20%, rgba(251, 113, 133, 0.14), transparent 45%),
                radial-gradient(circle at 12% 85%, rgba(56, 189, 248, 0.08), transparent 45%),
                linear-gradient(135deg, #162033 0%, #0f172a 100%) !important;
            border: 1px solid #293548 !important;
            box-shadow: 0 22px 48px rgba(0, 0, 0, 0.5) !important;
        }
        body.dark-mode .hero-slider-wrapper::before {
            content: "";
            position: absolute;
            inset: 0;
            background-image: radial-gradient(rgba(251, 113, 133, 0.16) 1px, transparent 1px);
            background-size: 22px 22px;
            opacity: 0.4;
            pointer-events: none;
            z-index: 0;
        }
        body.dark-mode .hero-content::before {
            color: #fda4af;
            background: rgba(251, 113, 133, 0.12);
            border-color: rgba(251, 113, 133, 0.28);
        }
        body.dark-mode .hero-image::after {
            background: rgba(15, 23, 42, 0.85);
            color: #f8fafc;
            border-color: rgba(251, 113, 133, 0.35);
        }
        body.dark-mode .hero-image img {
            border-color: rgba(51, 65, 85, 0.85) !important;
            box-shadow: 0 20px 44px rgba(0, 0, 0, 0.55) !important;
        }
        body.dark-mode .litera-hero-arrow {
            background: rgba(15, 23, 42, 0.85);
            border-color: #334155;
            color: #f8fafc;
        }
        body.dark-mode .litera-hero-arrow:hover {
            background: #b91c1c;
            border-color: #ef4444;
        }

        body.dark-mode .product-card,
        body.dark-mode .bundle-card,
        body.dark-mode .pdp-card,
        body.dark-mode .form-card,
        body.dark-mode .summary-card,
        body.dark-mode .tracking-card,
        body.dark-mode .article-card,
        body.dark-mode .about-hero-card,
        body.dark-mode .about-card,
        body.dark-mode .about-stats-bar,
        body.dark-mode .modal-card,
        body.dark-mode .stat-card,
        body.dark-mode .content-card,
        body.dark-mode .user-card-summary,
        body.dark-mode .photo-upload-box,
        body.dark-mode .photo-preview-wrapper,
        body.dark-mode .radio-option,
        body.dark-mode .cart-item-card,
        body.dark-mode .checkout-box {
            background-color: #131c31 !important;
            border-color: #26334d !important;
            color: #f1f5f9 !important;
        }

        body.dark-mode .pdp-img-box,
        body.dark-mode .pdp-price-box,
        body.dark-mode .articles-section,
        body.dark-mode .about-section,
        body.dark-mode .avatar-edit-box,
        body.dark-mode .article-modal-content {
            background-color: #0b1120 !important;
            border-color: #26334d !important;
        }

        body.dark-mode h1,
        body.dark-mode h2,
        body.dark-mode h3,
        body.dark-mode h4,
        body.dark-mode h5,
        body.dark-mode .product-title,
        body.dark-mode .pdp-title,
        body.dark-mode .brand-tagline-title,
        body.dark-mode .username,
        body.dark-mode .user-name,
        body.dark-mode .stat-value,
        body.dark-mode .text-bold,
        body.dark-mode .article-title {
            color: #f8fafc !important;
        }

        body.dark-mode p,
        body.dark-mode .product-author,
        body.dark-mode .pdp-author,
        body.dark-mode .pdp-desc,
        body.dark-mode .brand-tagline-sub,
        body.dark-mode .user-role,
        body.dark-mode .user-email,
        body.dark-mode .stat-label,
        body.dark-mode .text-sub,
        body.dark-mode .nav-links a,
        body.dark-mode .menu-item,
        body.dark-mode .article-excerpt {
            color: #cbd5e1 !important;
        }

        body.dark-mode .hero-content h2 span,
        body.dark-mode .slide h2 span,
        body.dark-mode .article-link,
        body.dark-mode .article-card a,
        body.dark-mode .article-card a i,
        body.dark-mode .read-more,
        body.dark-mode .read-more-link,
        body.dark-mode .about-hero-card strong,
        body.dark-mode .about-hero-card span,
        body.dark-mode .about-stats-bar h3,
        body.dark-mode .about-stats-bar .stat-number,
        body.dark-mode .section-header i,
        body.dark-mode .card-title-bar i,
        body.dark-mode .input-group label i,
        body.dark-mode .stat-icon.red,
        body.dark-mode .stat-icon.red i,
        body.dark-mode .about-icon,
        body.dark-mode .about-icon i,
        body.dark-mode .article-category,
        body.dark-mode .badge-tag,
        body.dark-mode .text-red,
        body.dark-mode .text-maroon,
        body.dark-mode .text-danger {
            color: #fb7185 !important;
        }

        body.dark-mode .stat-icon.red,
        body.dark-mode .about-icon {
            background-color: rgba(251, 113, 133, 0.16) !important;
        }

        body.dark-mode .logout-btn,
        body.dark-mode .logout-btn i,
        body.dark-mode .logout-btn span {
            color: #fda4af !important;
        }
        body.dark-mode .logout-btn:hover {
            background-color: rgba(251, 113, 133, 0.15) !important;
        }

        body.dark-mode .price,
        body.dark-mode .product-price,
        body.dark-mode .bundle-price,
        body.dark-mode .bundle-price-new,
        body.dark-mode .pdp-price,
        body.dark-mode .card-price,
        body.dark-mode .book-price,
        body.dark-mode [class*="price"]:not(del):not(s) {
            color: #ffffff !important;
        }

        body.dark-mode del,
        body.dark-mode s,
        body.dark-mode .old-price,
        body.dark-mode .bundle-price-old {
            color: #94a3b8 !important;
        }

        body.dark-mode .icon-btn,
        body.dark-mode .icon-btn i,
        body.dark-mode .notification-badge i {
            color: #f1f5f9 !important;
        }

        body.dark-mode .btn-bundle,
        body.dark-mode .bundle-card button {
            background-color: #b91c1c !important;
            color: #ffffff !important;
            border: 1px solid #ef4444 !important;
        }
        body.dark-mode .btn-bundle:hover,
        body.dark-mode .bundle-card button:hover {
            background-color: #dc2626 !important;
        }

        body.dark-mode .cat-filter-btn,
        body.dark-mode .sub-nav button,
        body.dark-mode .sub-nav a {
            background-color: transparent !important;
            border: none !important;
            border-radius: 8px !important;
            padding: 0.45rem 0.9rem !important;
            color: #cbd5e1 !important;
            font-weight: 500 !important;
            transition: all 0.25s ease !important;
        }
        body.dark-mode .cat-filter-btn:hover,
        body.dark-mode .sub-nav button:hover,
        body.dark-mode .sub-nav a:hover {
            background-color: rgba(255, 255, 255, 0.08) !important;
            color: #ffffff !important;
        }
        body.dark-mode .cat-filter-btn.active,
        body.dark-mode .sub-nav button.active,
        body.dark-mode .sub-nav a.active {
            background-color: #b91c1c !important;
            color: #ffffff !important;
            font-weight: 600 !important;
            box-shadow: 0 4px 14px rgba(239, 68, 68, 0.35) !important;
        }

        body.dark-mode .nav-item,
        body.dark-mode .btn-guest-login {
            background-color: #131c31 !important;
            color: #e2e8f0 !important;
            border-color: #334155 !important;
        }
        body.dark-mode .nav-item.active,
        body.dark-mode .sidebar-menu .menu-item.active {
            background-color: #b91c1c !important;
            color: #ffffff !important;
            border-color: #ef4444 !important;
        }

        body.dark-mode input,
        body.dark-mode select,
        body.dark-mode textarea,
        body.dark-mode .search-input,
        body.dark-mode .form-input,
        body.dark-mode .form-select,
        body.dark-mode .form-textarea {
            background-color: #0b1120 !important;
            color: #f8fafc !important;
            border-color: #334155 !important;
        }

        body.dark-mode .data-table th {
            background-color: #0b1120 !important;
            color: #e2e8f0 !important;
            border-color: #26334d !important;
        }
        body.dark-mode .data-table td {
            border-color: #26334d !important;
            color: #f1f5f9 !important;
        }

        /* Tombol Toggle Gelap/Terang */
        .litera-theme-toggle {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border-radius: 9px;
            border: 1px solid rgba(112, 29, 40, 0.2);
            background: #fdfbf7;
            color: #701D28;
            cursor: pointer;
            font-size: 0.95rem;
            transition: transform 0.25s ease, background-color 0.25s ease, border-color 0.25s ease;
        }
        .litera-theme-toggle:hover {
            transform: rotate(15deg) scale(1.06);
            background: #701D28;
            color: #ffffff;
        }
        body.dark-mode .litera-theme-toggle {
            background: #0b1120;
            border-color: #334155;
            color: #fbbf24;
        }
        body.dark-mode .litera-theme-toggle:hover {
            background: #1e293b;
            color: #fde047;
        }

        /* =========================================================
           D. MICRO-INTERACTIONS, SPOTLIGHT & SMOOTH FLOATING
           ========================================================= */
        header, .site-header {
            backdrop-filter: blur(12px) saturate(160%);
            -webkit-backdrop-filter: blur(12px) saturate(160%);
            transition: box-shadow 0.35s ease, background-color 0.35s ease;
        }
        header.litera-scrolled, .site-header.litera-scrolled {
            box-shadow: 0 10px 30px rgba(112, 29, 40, 0.08) !important;
        }
        body.dark-mode header.litera-scrolled,
        body.dark-mode .site-header.litera-scrolled {
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45) !important;
        }

        #litera-scroll-progress {
            position: fixed;
            top: 0;
            left: 0;
            height: 3px;
            width: 0%;
            background: linear-gradient(90deg, #701D28, #e11d48, #fb7185);
            z-index: 99999;
            pointer-events: none;
            transition: width 0.08s linear;
        }

        .product-card,
        .article-card,
        .about-card,
        .bundle-card,
        .hero-slider-wrapper,
        .hero-banner,
        .about-hero-card,
        .about-stats-bar {
            position: relative;
            will-change: transform;
            transition: box-shadow 0.45s cubic-bezier(0.22, 1, 0.36, 1),
                        border-color 0.35s ease;
        }

        .product-card:hover,
        .article-card:hover,
        .about-card:hover {
            box-shadow: 0 20px 40px -10px rgba(112, 29, 40, 0.16) !important;
            border-color: rgba(112, 29, 40, 0.32) !important;
        }
        body.dark-mode .product-card:hover,
        body.dark-mode .article-card:hover,
        body.dark-mode .about-card:hover {
            box-shadow: 0 18px 36px rgba(251, 113, 133, 0.14) !important;
            border-color: rgba(251, 113, 133, 0.45) !important;
        }

        /* Spotlight Glow Mengikuti Kursor (Hangat di Terang, Coral di Gelap) */
        .product-card::after,
        .article-card::after,
        .about-card::after {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: inherit;
            background: radial-gradient(
                280px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
                rgba(112, 29, 40, 0.07),
                transparent 75%
            );
            opacity: 0;
            transition: opacity 0.35s ease;
            pointer-events: none;
        }
        body.dark-mode .product-card::after,
        body.dark-mode .article-card::after,
        body.dark-mode .about-card::after {
            background: radial-gradient(
                280px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
                rgba(251, 113, 133, 0.12),
                transparent 75%
            );
        }
        .product-card:hover::after,
        .article-card:hover::after,
        .about-card:hover::after {
            opacity: 1;
        }

        .product-card img {
            transition: transform 0.65s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .product-card:hover img {
            transform: scale(1.045);
        }

        /* Shimmer Shine pada Tombol Utama */
        .btn-primary,
        .btn-bundle,
        .btn-guest-register {
            position: relative;
            overflow: hidden;
            transition: transform 0.25s ease, box-shadow 0.25s ease !important;
        }
        .btn-primary:hover,
        .btn-bundle:hover,
        .btn-guest-register:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(112, 29, 40, 0.28) !important;
        }
        .btn-primary::before,
        .btn-bundle::before,
        .btn-guest-register::before {
            content: "";
            position: absolute;
            top: 0;
            left: -100%;
            width: 60%;
            height: 100%;
            background: linear-gradient(
                120deg,
                transparent,
                rgba(255, 255, 255, 0.28),
                transparent
            );
            transition: left 0.65s ease;
            pointer-events: none;
        }
        .btn-primary:hover::before,
        .btn-bundle:hover::before,
        .btn-guest-register:hover::before {
            left: 130%;
        }

        @keyframes literaHeroFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
        }

        #litera-back-to-top {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: #701D28;
            color: #ffffff;
            border: none;
            box-shadow: 0 8px 20px rgba(112, 29, 40, 0.35);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
            opacity: 0;
            visibility: hidden;
            transform: translateY(14px);
            transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
            z-index: 999;
        }
        #litera-back-to-top.show {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }
        #litera-back-to-top:hover {
            transform: translateY(-4px) scale(1.06);
            background: #8b1e2b;
        }
        body.dark-mode #litera-back-to-top {
            background: #b91c1c;
            box-shadow: 0 8px 22px rgba(239, 68, 68, 0.35);
        }

        @media (max-width: 768px) {
            .hero-slider .slide {
                padding: 2rem 1.5rem !important;
            }
            .litera-hero-arrow {
                display: none;
            }
        }
    `;
    document.head.appendChild(style);

    // 2. Deteksi Otomatis Elemen Merah Gelap -> Merah Coral Terang (Hanya saat Dark Mode)
    function brightenAllRedElements(isDark) {
        if (!document.body) return;

        if (!isDark) {
            document.querySelectorAll('[data-litera-brightened="1"]').forEach(el => {
                if (el.dataset.origInlineColor) {
                    el.style.color = el.dataset.origInlineColor;
                } else {
                    el.style.removeProperty('color');
                }
                delete el.dataset.literaBrightened;
            });
            return;
        }

        const targets = document.querySelectorAll('span, a, strong, b, i, h1, h2, h3, h4, p, div, button');
        targets.forEach(el => {
            if (el.closest('button.btn-primary') || el.closest('.litera-theme-toggle')) return;
            const computed = window.getComputedStyle(el).color;
            const match = computed.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (match) {
                const r = parseInt(match[1], 10);
                const g = parseInt(match[2], 10);
                const b = parseInt(match[3], 10);

                if (r >= 90 && r <= 210 && g <= 75 && b <= 85 && r > g * 1.8 && r > b * 1.6) {
                    if (!el.dataset.literaBrightened) {
                        el.dataset.origInlineColor = el.style.color || '';
                        el.dataset.literaBrightened = '1';
                    }
                    el.style.setProperty('color', '#fb7185', 'important');
                }
            }
        });
    }

    // 3. Fungsi Terapkan Tema
    window.applyLiteraTheme = function (theme) {
        const isDark = theme === 'dark';
        document.documentElement.classList.toggle('dark-mode', isDark);
        if (document.body) {
            document.body.classList.toggle('dark-mode', isDark);
        }

        document.querySelectorAll('.litera-theme-toggle i').forEach(icon => {
            icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
        });

        brightenAllRedElements(isDark);
    };

    window.toggleLiteraTheme = function () {
        const current = localStorage.getItem(THEME_KEY) || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        localStorage.setItem(THEME_KEY, next);
        window.applyLiteraTheme(next);
    };

    const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
    window.applyLiteraTheme(savedTheme);

    window.addEventListener('storage', (e) => {
        if (e.key === THEME_KEY) {
            window.applyLiteraTheme(e.newValue || 'light');
        }
    });

    // 4. Mesin Interaksi, Panah Hero & Scroll-Linked Floating
    document.addEventListener('DOMContentLoaded', () => {
        window.applyLiteraTheme(localStorage.getItem(THEME_KEY) || 'light');
        setTimeout(() => window.applyLiteraTheme(localStorage.getItem(THEME_KEY) || 'light'), 400);

        // Hanya aktif pada Landing Page & Katalog (bukan Dashboard)
        if (document.querySelector('.dashboard-container')) return;

        // A. Tombol Panah Navigasi Kiri/Kanan pada Hero Slider
        const heroWrapper = document.querySelector('.hero-slider-wrapper');
        if (heroWrapper && !heroWrapper.querySelector('.litera-hero-prev')) {
            const prevBtn = document.createElement('button');
            prevBtn.type = 'button';
            prevBtn.className = 'litera-hero-arrow litera-hero-prev';
            prevBtn.title = 'Slide Sebelumnya';
            prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';

            const nextBtn = document.createElement('button');
            nextBtn.type = 'button';
            nextBtn.className = 'litera-hero-arrow litera-hero-next';
            nextBtn.title = 'Slide Berikutnya';
            nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';

            function stepHeroSlide(dir) {
                const dots = Array.from(heroWrapper.querySelectorAll('.dot, .slider-dot, .carousel-dot, [onclick*="goToSlide"]'));
                if (dots.length > 1) {
                    const activeIdx = dots.findIndex(d => d.classList.contains('active'));
                    const current = activeIdx >= 0 ? activeIdx : 0;
                    const nextIdx = (current + dir + dots.length) % dots.length;
                    dots[nextIdx].click();
                }
            }

            prevBtn.onclick = () => stepHeroSlide(-1);
            nextBtn.onclick = () => stepHeroSlide(1);
            heroWrapper.appendChild(prevBtn);
            heroWrapper.appendChild(nextBtn);
        }

        // B. Bar Progres Scroll di Bagian Atas
        const progressBar = document.createElement('div');
        progressBar.id = 'litera-scroll-progress';
        document.body.appendChild(progressBar);

        // C. Tombol Back-to-Top
        const btnTop = document.createElement('button');
        btnTop.id = 'litera-back-to-top';
        btnTop.title = 'Kembali ke Atas';
        btnTop.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
        btnTop.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
        document.body.appendChild(btnTop);

        // D. Efek Spotlight Glow Mengikuti Kursor di Kartu
        document.addEventListener('mousemove', (e) => {
            const card = e.target.closest('.product-card, .article-card, .about-card');
            if (!card) return;
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
            card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
        }, { passive: true });

        // E. Animasi Angka Statistik Berjalan saat Terlihat
        const statNumbers = document.querySelectorAll('.about-stats-bar h3, .about-stats-bar .stat-number');
        const countObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                const rawText = el.textContent.trim();
                const match = rawText.match(/^([^\d]*)(\d+(?:[.,]\d+)?)(.*)$/);
                if (match) {
                    const prefix = match[1];
                    const numStr = match[2].replace(/\./g, '').replace(',', '.');
                    const targetVal = parseFloat(numStr);
                    const suffix = match[3];
                    if (!isNaN(targetVal) && targetVal > 0) {
                        const duration = 1600;
                        const startTime = performance.now();
                        function updateCounter(now) {
                            const progress = Math.min((now - startTime) / duration, 1);
                            const eased = 1 - Math.pow(1 - progress, 3);
                            const current = Math.floor(eased * targetVal);
                            el.textContent = `${prefix}${current.toLocaleString('id-ID')}${suffix}`;
                            if (progress < 1) requestAnimationFrame(updateCounter);
                            else el.textContent = rawText;
                        }
                        requestAnimationFrame(updateCounter);
                    }
                }
                countObserver.unobserve(el);
            });
        }, { threshold: 0.35 });
        statNumbers.forEach(num => countObserver.observe(num));

        // F. Efek Typewriter Halus pada Kolom Pencarian
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            const phrases = [
                'Cari judul buku, penulis, jurusan...',
                'Coba ketik: Filosofi Teras...',
                'Coba ketik: Animal Farm...',
                'Cari buku kuliah bekas di Makassar...'
            ];
            let pIdx = 0, charIdx = 0, isDeleting = false;

            function typePlaceholder() {
                if (document.activeElement === searchInput || searchInput.value.length > 0) {
                    setTimeout(typePlaceholder, 1200);
                    return;
                }
                const currentPhrase = phrases[pIdx];
                searchInput.placeholder = currentPhrase.substring(0, charIdx);

                if (!isDeleting && charIdx < currentPhrase.length) {
                    charIdx++;
                    setTimeout(typePlaceholder, 75);
                } else if (!isDeleting && charIdx === currentPhrase.length) {
                    isDeleting = true;
                    setTimeout(typePlaceholder, 2400);
                } else if (isDeleting && charIdx > 0) {
                    charIdx--;
                    setTimeout(typePlaceholder, 40);
                } else {
                    isDeleting = false;
                    pIdx = (pIdx + 1) % phrases.length;
                    setTimeout(typePlaceholder, 600);
                }
            }
            setTimeout(typePlaceholder, 1500);
        }

        // G. Gerakan Mengambang Mulus Mengikuti Scroll (Tanpa Kedip)
        let smoothScroll = window.scrollY;
        const headerEl = document.querySelector('header, .site-header');

        function smoothScrollFloatLoop() {
            smoothScroll += (window.scrollY - smoothScroll) * 0.045;
            const scrollDelta = window.scrollY - smoothScroll;
            const viewportHeight = window.innerHeight;

            const docHeight = document.documentElement.scrollHeight - viewportHeight;
            if (docHeight > 0) {
                const pct = Math.min(100, Math.max(0, (window.scrollY / docHeight) * 100));
                progressBar.style.width = `${pct}%`;
            }
            if (headerEl) {
                headerEl.classList.toggle('litera-scrolled', window.scrollY > 20);
            }
            btnTop.classList.toggle('show', window.scrollY > 350);

            document.querySelectorAll('.hero-slider-wrapper, .hero-banner, .bundle-card, .about-hero-card, .about-stats-bar').forEach((el) => {
                const rect = el.getBoundingClientRect();
                if (rect.bottom > -120 && rect.top < viewportHeight + 120) {
                    const centerOffset = ((rect.top + rect.height / 2) - (viewportHeight / 2)) / viewportHeight;
                    const floatY = Math.max(-18, Math.min(18, (centerOffset * 20) + (scrollDelta * 0.12)));
                    el.style.transform = `translate3d(0, ${floatY.toFixed(2)}px, 0)`;
                }
            });

            document.querySelectorAll('.product-card, .article-card, .about-card').forEach((card, idx) => {
                const rect = card.getBoundingClientRect();
                if (rect.bottom > -100 && rect.top < viewportHeight + 100) {
                    const isHovered = card.matches(':hover');
                    const columnSpeed = 0.08 + ((idx % 4) * 0.035);
                    const centerOffset = ((rect.top + rect.height / 2) - (viewportHeight / 2)) / viewportHeight;
                    const parallaxY = centerOffset * (16 + (idx % 4) * 5);
                    const inertiaY = scrollDelta * columnSpeed;
                    const totalY = Math.max(-24, Math.min(24, parallaxY + inertiaY)) + (isHovered ? -8 : 0);

                    card.style.transform = `translate3d(0, ${totalY.toFixed(2)}px, 0)`;
                }
            });

            requestAnimationFrame(smoothScrollFloatLoop);
        }

        requestAnimationFrame(smoothScrollFloatLoop);
    });
})();
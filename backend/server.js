const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const midtransClient = require('midtrans-client');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware (Limit 25mb untuk foto Base64 buku & logo)
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// ==========================================
// KONFIGURASI MIDTRANS SANDBOX
// ==========================================
const snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-GIJP43zbjB80mcujA7FDk10E',
    clientKey: process.env.MIDTRANS_CLIENT_KEY || 'Mid-client-ynHTTuKeGHRedSFJ'
});

// ==========================================
// 1. KONFIGURASI KONEKSI DATABASE SUPABASE (POSTGRESQL POOL)
// ==========================================
const DATABASE_URL =
    process.env.DATABASE_URL ||
    'postgresql://postgres.ygtbxmhslohgofwwksjt:Literaadmin5_@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres';

const db = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
});

db.on('error', (err) => {
    console.error('PG Pool idle client error:', err.message);
});

let dbReadyPromise = null;

async function ensureDatabaseReady() {
    if (!dbReadyPromise) {
        dbReadyPromise = (async () => {
            const client = await db.connect();
            try {
                console.log('Berhasil terhubung ke Database Supabase PostgreSQL (Pool Mode)!');
            } finally {
                client.release();
            }
            await initWebSettingsTable();
            await initQcBooksTable();
            await seedInitialBooks();
        })().catch((err) => {
            dbReadyPromise = null;
            console.error('Gagal terhubung ke Supabase PostgreSQL:', err.message);
            throw err;
        });
    }
    return dbReadyPromise;
}

if (require.main === module) {
    ensureDatabaseReady().catch(() => {});
}

// Helper: Tandai buku dalam pesanan menjadi SOLD OUT (stock = 0)
async function markOrderBooksSoldOut(itemsRaw) {
    if (!itemsRaw) return;
    let parsedItems = null;
    try {
        if (typeof itemsRaw === 'string' && (itemsRaw.trim().startsWith('[') || itemsRaw.trim().startsWith('{'))) {
            parsedItems = JSON.parse(itemsRaw);
        } else if (Array.isArray(itemsRaw)) {
            parsedItems = itemsRaw;
        }
    } catch (e) {
        parsedItems = null;
    }

    if (Array.isArray(parsedItems)) {
        for (const item of parsedItems) {
            const qty = Number(item.qty || item.quantity || 1);
            if (item.id) {
                await db.query(
                    `UPDATE books 
                     SET stock = GREATEST(stock - $1, 0),
                         status = CASE WHEN GREATEST(stock - $1, 0) <= 0 THEN 'SOLD OUT' ELSE 'READY' END
                     WHERE id = $2`,
                    [qty, item.id]
                );
            } else if (item.title) {
                await db.query(
                    `UPDATE books 
                     SET stock = GREATEST(stock - $1, 0),
                         status = CASE WHEN GREATEST(stock - $1, 0) <= 0 THEN 'SOLD OUT' ELSE 'READY' END
                     WHERE LOWER(TRIM(title)) = LOWER(TRIM($2))`,
                    [qty, item.title]
                );
            }
        }
    } else {
        const allBooks = await db.query('SELECT id, title, stock FROM books');
        const itemsText = String(itemsRaw).toLowerCase();

        for (const book of allBooks.rows) {
            if (book.title && itemsText.includes(book.title.trim().toLowerCase())) {
                const newStock = Math.max((Number(book.stock) || 1) - 1, 0);
                await db.query(
                    `UPDATE books SET stock = $1, status = $2 WHERE id = $3`,
                    [newStock, newStock <= 0 ? 'SOLD OUT' : 'READY', book.id]
                );
            }
        }
    }
}

// Helper: Kembalikan stok buku menjadi READY jika pesanan dibatalkan
async function restoreOrderBooksStock(itemsRaw) {
    if (!itemsRaw) return;
    const allBooks = await db.query('SELECT id, title FROM books');
    const itemsText = typeof itemsRaw === 'string' ? itemsRaw.toLowerCase() : JSON.stringify(itemsRaw).toLowerCase();

    for (const book of allBooks.rows) {
        if (book.title && itemsText.includes(book.title.trim().toLowerCase())) {
            await db.query(
                `UPDATE books SET stock = 1, status = 'READY' WHERE id = $1`,
                [book.id]
            );
        }
    }
}

// Seeding Otomatis: Isi 9 buku bawaan ke tabel books jika tabel masih kosong
async function seedInitialBooks() {
    try {
        const resCount = await db.query('SELECT COUNT(*)::int AS count FROM books');
        if (resCount.rows[0].count === 0) {
            const initialBooks = [
                ["Risalah Kebangkitan - Penalaran terhadap Realitas Akhirat", "Badiuzzaman Said Nursi", "Agama", "Grade B+ (Layak Baca)", 50000, 4.8, "../foto/risalah kebangkitan.jpeg", "Judul: Risalah Kebangkitan – Penalaran terhadap Realitas Akhirat\nPenulis: Badiuzzaman Said Nursi (Risalah Nur Press)\nKondisi Fisik: Grade B+ (Layak Baca / Pre-loved Good Condition)\nDetail: Sudut cover kanan atas & bawah sedikit berlekuk/aus pemakaian wajar.", 1, "READY"],
                ["Namaku Alam", "Leila S. Chudori", "Fiksi", "Grade A (Mulus)", 65000, 4.9, "../foto/namaku alam.jpeg", "Judul: Namaku Alam\nPenulis: Leila S. Chudori (Penerbit KPG)\nKondisi Fisik: Grade A (Pre-loved Like New / Mulus Original)", 1, "READY"],
                ["Animal Farm (Republik Hewan)", "George Orwell", "Fiksi", "Grade A (Mulus)", 45000, 4.7, "../foto/animal farm.jpeg", "Judul: Animal Farm (Republik Hewan)\nPenulis: George Orwell (Gramedia Pustaka Utama)\nKondisi Fisik: Grade A (Mulus Original)", 1, "READY"],
                ["Angel & Demon", "Helena Abidin, Suhartono C., Timoteus T.", "Bisnis", "Grade A (Mulus)", 50000, 4.6, "../foto/angel & demon.jpeg", "Judul: Angel & Demon\nPenulis: Helena Abidin, Suhartono Chandra, Timoteus Talip (Grasindo)\nCatatan: National Bestseller.", 1, "READY"],
                ["Filsafat Sains - Dari Newton, Einstein hingga Sains-Data", "Dimitri Mahayana", "Filsafat", "Grade B (Layak)", 50000, 4.5, "../foto/filsafat sains.jpeg", "Judul: Filsafat Sains – Dari Newton, Einstein hingga Sains-Data\nPenulis: Dimitri Mahayana\nKondisi Fisik: Grade B", 1, "READY"],
                ["Filosofi Teras - Filsafat Yunani-Romawi Kuno", "Henry Manampiring", "Filsafat", "Grade A (Mulus)", 55000, 5.0, "../foto/filosofi teras.jpeg", "Judul: Filosofi Teras\nPenulis: Henry Manampiring\nCatatan: National Best Seller Stoisisme Modern.", 1, "READY"],
                ["Tentang Kamu", "Tere Liye", "Fiksi", "Grade B+ (Layak)", 50000, 4.8, "../foto/tentang kamu.jpeg", "Judul: Tentang Kamu\nPenulis: Tere Liye\nKondisi Fisik: Grade B+ (Preloved Bagus).", 1, "READY"],
                ["Pulang", "Leila S. Chudori", "Fiksi", "Grade A (Mulus)", 60000, 4.9, "../foto/pulang.jpeg", "Judul: Pulang\nPenulis: Leila S. Chudori (Penerbit KPG)\nKondisi Fisik: Grade A (Mulus Original).", 1, "READY"],
                ["Hujan", "Tere Liye", "Fiksi", "Grade A (Mulus)", 50000, 4.9, "../foto/hujan.jpeg", "Judul: Hujan\nPenulis: Tere Liye (Gramedia Pustaka Utama)\nKondisi Fisik: Grade A (Mulus Original).", 1, "READY"]
            ];

            const sql = `
                INSERT INTO books (title, author, category, grade, price, rating, img, description, stock, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `;

            for (const book of initialBooks) {
                await db.query(sql, book);
            }
            console.log('9 Buku katalog awal berhasil disinkronkan ke Supabase PostgreSQL!');
        }
    } catch (err) {
        console.error('Gagal seeding buku awal:', err.message);
    }
}

// Inisialisasi Otomatis Tabel web_settings
async function initWebSettingsTable() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS web_settings (
                id INT PRIMARY KEY DEFAULT 1,
                nama_organisasi VARCHAR(255) DEFAULT 'LITERA',
                tagline VARCHAR(255) DEFAULT 'Digital Library & Hub',
                copyright_text VARCHAR(255) DEFAULT '© 2026 LITERA. All Rights Reserved.',
                no_telp VARCHAR(50),
                email VARCHAR(100),
                alamat TEXT,
                logo TEXT,
                favicon TEXT,
                link_facebook VARCHAR(255) DEFAULT 'https://facebook.com',
                link_instagram VARCHAR(255) DEFAULT 'https://instagram.com',
                link_tiktok VARCHAR(255) DEFAULT 'https://tiktok.com',
                link_youtube VARCHAR(255) DEFAULT 'https://youtube.com',
                link_linkedin VARCHAR(255),
                link_maps VARCHAR(255),
                smtp_host VARCHAR(100),
                smtp_port INT,
                smtp_user VARCHAR(100),
                smtp_password VARCHAR(255),
                smtp_from_email VARCHAR(150)
            )
        `);

        await db.query(`
            INSERT INTO web_settings (id, nama_organisasi, tagline, copyright_text)
            VALUES (1, 'LITERA', 'Digital Library & Hub', '© 2026 LITERA. All Rights Reserved.')
            ON CONFLICT (id) DO NOTHING
        `);
    } catch (err) {
        console.error('Gagal inisialisasi web_settings:', err.message);
    }
}

// Inisialisasi Otomatis Tabel qc_books
async function initQcBooksTable() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS qc_books (
                id SERIAL PRIMARY KEY,
                submitter_name VARCHAR(255),
                book_title VARCHAR(255),
                condition_note TEXT,
                recommended_price NUMERIC DEFAULT 0,
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
    } catch (err) {
        console.error('Gagal inisialisasi qc_books:', err.message);
    }
}

// ==========================================
// 2. ROUTE / ENDPOINT API UNTUK BUKU (CRUD)
// ==========================================
app.get('/api/books', async (req, res) => {
    try {
        await ensureDatabaseReady();
        const result = await db.query('SELECT * FROM books ORDER BY id DESC');
        res.json({ success: true, books: result.rows, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/books', async (req, res) => {
    const { title, author, category, grade, price, rating, img, desc, description } = req.body;
    const bookDesc = description || desc || '';

    const query = `
        INSERT INTO books (title, author, category, grade, price, rating, img, description, stock, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, 'READY')
        RETURNING id
    `;

    const values = [
        title,
        author,
        category,
        grade,
        Number(price) || 0,
        parseFloat(rating) || 4.8,
        img,
        bookDesc
    ];

    try {
        await ensureDatabaseReady();
        const result = await db.query(query, values);
        res.json({ success: true, message: 'Buku berhasil ditambahkan!', id: result.rows[0].id });
    } catch (err) {
        console.error('Error PostgreSQL Query:', err.message);
        res.status(500).json({ success: false, message: 'Gagal menambah buku: ' + err.message });
    }
});

app.put('/api/books/:id', async (req, res) => {
    const bookId = req.params.id;
    const { title, author, category, grade, price, rating, img, desc, description, stock, status } = req.body;
    const bookDesc = description || desc || '';

    const query = `
        UPDATE books
        SET title = $1,
            author = $2,
            category = $3,
            grade = $4,
            price = $5,
            rating = $6,
            img = $7,
            description = $8,
            stock = COALESCE($9, stock),
            status = COALESCE($10, status)
        WHERE id = $11
    `;

    const values = [
        title,
        author,
        category,
        grade,
        Number(price) || 0,
        parseFloat(rating) || 4.8,
        img,
        bookDesc,
        stock !== undefined ? Number(stock) : null,
        status || null,
        bookId
    ];

    try {
        await ensureDatabaseReady();
        const result = await db.query(query, values);
        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Buku tidak ditemukan di database' });
        }
        res.json({ success: true, message: 'Buku berhasil diperbarui di database Supabase!' });
    } catch (err) {
        console.error('Error saat mengupdate buku:', err.message);
        res.status(500).json({ success: false, message: 'Gagal memperbarui buku: ' + err.message });
    }
});

app.delete('/api/books/:id', async (req, res) => {
    const bookId = req.params.id;

    try {
        await ensureDatabaseReady();
        await db.query('DELETE FROM books WHERE id = $1', [bookId]);
        res.json({ success: true, message: 'Buku berhasil dihapus dari database Supabase!' });
    } catch (err) {
        console.error('Error saat menghapus buku:', err.message);
        res.status(500).json({ success: false, message: 'Gagal menghapus buku dari database' });
    }
});

// ==========================================
// 2B. ROUTE / ENDPOINT API DASHBOARD ADMIN (USERS, QC, ORDERS)
// ==========================================
app.get('/api/users', async (req, res) => {
    try {
        await ensureDatabaseReady();
        const result = await db.query('SELECT id, nama, email, role FROM users ORDER BY id DESC');
        res.json({ success: true, users: result.rows, data: result.rows });
    } catch (err) {
        console.error('Error GET /api/users:', err.message);
        res.status(500).json({ success: false, message: err.message, users: [] });
    }
});

app.get('/api/qc', async (req, res) => {
    try {
        await ensureDatabaseReady();
        const result = await db.query('SELECT * FROM qc_books ORDER BY id DESC');
        res.json({ success: true, items: result.rows, qc: result.rows, data: result.rows });
    } catch (err) {
        console.error('Error GET /api/qc:', err.message);
        res.status(500).json({ success: false, message: err.message, items: [] });
    }
});

app.put('/api/qc/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await ensureDatabaseReady();
        const result = await db.query(
            'UPDATE qc_books SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Data QC tidak ditemukan' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('Error PUT /api/qc/:id:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/orders', async (req, res) => {
    try {
        await ensureDatabaseReady();
        const result = await db.query('SELECT * FROM orders ORDER BY id DESC');
        res.json({ success: true, orders: result.rows, data: result.rows });
    } catch (err) {
        console.error('Error GET /api/orders:', err.message);
        res.status(500).json({ success: false, message: err.message, orders: [] });
    }
});

app.put('/api/orders/:id', async (req, res) => {
    const { id } = req.params;
    const { tracking_number, status } = req.body;

    try {
        await ensureDatabaseReady();

        const oldOrderRes = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
        if (oldOrderRes.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
        }
        const oldOrder = oldOrderRes.rows[0];
        const newStatus = (status || oldOrder.status || '').trim();

        const result = await db.query(
            `UPDATE orders
             SET tracking_number = COALESCE($1, tracking_number),
                 status = COALESCE($2, status)
             WHERE id = $3
             RETURNING *`,
            [tracking_number, status, id]
        );

        // Jika pesanan dibatalkan admin -> kembalikan stok ke READY
        if (newStatus.toLowerCase().includes('batal')) {
            await restoreOrderBooksStock(oldOrder.items);
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error('Error PUT /api/orders/:id:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==========================================
// 3. ROUTE / ENDPOINT API UNTUK CHECKOUT, PEMBAYARAN & MIDTRANS
// ==========================================
app.post('/api/midtrans-token', async (req, res) => {
    try {
        const orderId = req.body.orderId || req.body.order_id || `LITERA-${Date.now()}`;
        const rawAmount = req.body.totalAmount || req.body.gross_amount || req.body.total_price;
        const grossAmount = Math.round(Number(rawAmount));
        const customerName = req.body.customerName || req.body.customer_name || 'Pembeli Litera';
        const customerPhone = req.body.customerPhone || req.body.customer_phone || '08123456789';
        const customerEmail = req.body.customerEmail || req.body.customer_email || 'pembeli@litera.com';

        if (!grossAmount || isNaN(grossAmount) || grossAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Nominal tagihan tidak valid.'
            });
        }

        const parameter = {
            transaction_details: {
                order_id: orderId,
                gross_amount: grossAmount
            },
            customer_details: {
                first_name: customerName,
                phone: customerPhone,
                email: customerEmail
            }
        };

        const transaction = await snap.createTransaction(parameter);
        res.json({
            success: true,
            token: transaction.token,
            redirect_url: transaction.redirect_url
        });
    } catch (error) {
        console.error('Midtrans Error Detail:', error.ApiResponse || error.message);
        res.status(500).json({
            success: false,
            message: 'Gagal membuat transaksi Midtrans: ' + error.message
        });
    }
});

app.post('/api/checkout', async (req, res) => {
    const { customer_name, customer_phone, region, address, courier, payment_method, total_price, items } = req.body;

    const initialStatus = payment_method === 'COD' ? 'COD - Diproses' : 'Menunggu Pembayaran';

    const query = `
        INSERT INTO orders (customer_name, customer_phone, region, address, courier, payment_method, total_price, items, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
    `;

    try {
        await ensureDatabaseReady();
        const result = await db.query(query, [
            customer_name,
            customer_phone,
            region,
            address,
            courier,
            payment_method,
            total_price,
            items || '',
            initialStatus
        ]);

        // Jika COD langsung dianggap terjual -> buku otomatis SOLD OUT
        if (payment_method === 'COD') {
            await markOrderBooksSoldOut(items);
        }

        res.json({
            success: true,
            message: 'Pesanan berhasil disimpan ke database Supabase!',
            order_id: result.rows[0].id
        });
    } catch (err) {
        console.error('Gagal menyimpan pesanan:', err.message);
        res.status(500).json({ success: false, message: 'Gagal menyimpan transaksi ke database' });
    }
});

// Endpoint Baru: Dipanggil otomatis ketika payment Midtrans berhasil (onSuccess)
app.post('/api/orders/:id/paid', async (req, res) => {
    const { id } = req.params;
    try {
        await ensureDatabaseReady();
        const orderRes = await db.query(
            `UPDATE orders SET status = 'Pembayaran Terverifikasi' WHERE id = $1 RETURNING *`,
            [id]
        );

        if (orderRes.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
        }

        await markOrderBooksSoldOut(orderRes.rows[0].items);

        res.json({
            success: true,
            message: 'Pembayaran terverifikasi & stok buku otomatis diperbarui menjadi SOLD OUT!'
        });
    } catch (err) {
        console.error('Error POST /api/orders/:id/paid:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==========================================
// 4. ROUTE / ENDPOINT API UNTUK PENGGUNA (AUTH BCRYPT)
// ==========================================
app.post('/api/register', async (req, res) => {
    const { nama, email, password } = req.body;

    try {
        await ensureDatabaseReady();
        const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Email sudah terdaftar!' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query(
            `INSERT INTO users (nama, email, password, role) VALUES ($1, $2, $3, 'user')`,
            [nama, email, hashedPassword]
        );
        res.json({ success: true, message: 'Registrasi berhasil!' });
    } catch (err) {
        console.error('Register error:', err.message);
        res.status(500).json({ success: false, message: 'Gagal mendaftar', error: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email dan password wajib diisi!' });
    }

    try {
        await ensureDatabaseReady();
        const result = await db.query(
            'SELECT id, nama, email, password, role FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Email atau password salah!' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            return res.json({
                success: true,
                message: 'Login berhasil!',
                user: {
                    id: user.id,
                    nama: user.nama,
                    email: user.email,
                    role: user.role || 'user'
                }
            });
        } else {
            return res.status(401).json({ success: false, message: 'Email atau password salah!' });
        }
    } catch (err) {
        console.error('Database Error:', err.message);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

// ==========================================
// 5. ROUTE / ENDPOINT API PENGATURAN WEBSITE & FOOTER
// ==========================================
app.get('/api/settings', async (req, res) => {
    try {
        await ensureDatabaseReady();
        const result = await db.query('SELECT * FROM web_settings WHERE id = 1');
        res.json({ success: true, settings: result.rows[0] || {} });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.post('/api/settings', async (req, res) => {
    const {
        nama_organisasi, tagline, copyright_text, no_telp, email, alamat,
        logo, favicon, link_facebook, link_instagram, link_tiktok, link_youtube,
        link_linkedin, link_maps, smtp_host, smtp_port, smtp_user, smtp_password, smtp_from_email
    } = req.body;

    const sql = `
        UPDATE web_settings SET 
            nama_organisasi = $1, tagline = $2, copyright_text = $3, no_telp = $4, email = $5, alamat = $6,
            logo = COALESCE(NULLIF($7, ''), logo),
            favicon = COALESCE(NULLIF($8, ''), favicon),
            link_facebook = $9, link_instagram = $10, link_tiktok = $11, link_youtube = $12,
            link_linkedin = $13, link_maps = $14, smtp_host = $15, smtp_port = $16, smtp_user = $17,
            smtp_password = COALESCE(NULLIF($18, ''), smtp_password),
            smtp_from_email = $19
        WHERE id = 1
    `;

    const values = [
        nama_organisasi, tagline || 'Digital Library & Hub', copyright_text || '© 2026 LITERA. All Rights Reserved.',
        no_telp, email, alamat, logo || '', favicon || '',
        link_facebook, link_instagram, link_tiktok, link_youtube,
        link_linkedin, link_maps, smtp_host, smtp_port || 587, smtp_user,
        smtp_password || '', smtp_from_email
    ];

    try {
        await ensureDatabaseReady();
        await db.query(sql, values);
        res.json({ success: true, message: 'Pengaturan Footer & Website berhasil disimpan ke Supabase!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==========================================
// 6. MENJALANKAN SERVER (IPv4 & IPv6 READY)
// ==========================================
if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log("==================================================");
        console.log(`LITERA Backend API Server Running on port ${PORT}`);
        console.log(`Endpoint Books    : http://127.0.0.1:${PORT}/api/books`);
        console.log(`Endpoint Users    : http://127.0.0.1:${PORT}/api/users`);
        console.log(`Endpoint QC       : http://127.0.0.1:${PORT}/api/qc`);
        console.log(`Endpoint Orders   : http://127.0.0.1:${PORT}/api/orders`);
        console.log(`Endpoint Settings : http://127.0.0.1:${PORT}/api/settings`);
        console.log(`Endpoint Checkout : http://127.0.0.1:${PORT}/api/checkout`);
        console.log(`Endpoint Midtrans : http://127.0.0.1:${PORT}/api/midtrans-token`);
        console.log(`Endpoint Auth     : http://127.0.0.1:${PORT}/api/login & /api/register`);
        console.log("==================================================");
    });
}

module.exports = app;
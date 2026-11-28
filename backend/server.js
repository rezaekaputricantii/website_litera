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

// Helper: Cek apakah kolom ada pada tabel public
async function tableHasColumn(tableName, columnName) {
    try {
        const res = await db.query(
            `SELECT 1
             FROM information_schema.columns
             WHERE table_schema = 'public'
               AND table_name = $1
               AND column_name = $2
             LIMIT 1`,
            [tableName, columnName]
        );
        return res.rowCount > 0;
    } catch (_) {
        return false;
    }
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
    } catch (_) {
        parsedItems = null;
    }

    if (Array.isArray(parsedItems)) {
        for (const item of parsedItems) {
            const qty = Number(item.qty || item.quantity || 1);
            if (item.id !== undefined && item.id !== null) {
                await db.query(
                    `UPDATE books
                     SET stock = GREATEST(stock - $1, 0),
                         status = CASE WHEN GREATEST(stock - $1, 0) <= 0 THEN 'SOLD OUT' ELSE 'READY' END
                     WHERE id::text = $2`,
                    [qty, String(item.id)]
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
                    `UPDATE books SET stock = $1, status = $2 WHERE id::text = $3`,
                    [newStock, newStock <= 0 ? 'SOLD OUT' : 'READY', String(book.id)]
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
                `UPDATE books SET stock = 1, status = 'READY' WHERE id::text = $1`,
                [String(book.id)]
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

            const idTypeRes = await db.query(
                `SELECT data_type
                 FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = 'books' AND column_name = 'id'
                 LIMIT 1`
            );
            const isTextId = idTypeRes.rows[0] && /char|text/i.test(idTypeRes.rows[0].data_type);

            if (isTextId) {
                const sqlWithId = `
                    INSERT INTO books (id, title, author, category, grade, price, rating, img, description, stock, status)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    ON CONFLICT (id) DO NOTHING
                `;
                for (let i = 0; i < initialBooks.length; i++) {
                    await db.query(sqlWithId, [String(i + 1), ...initialBooks[i]]);
                }
            } else {
                const sql = `
                    INSERT INTO books (title, author, category, grade, price, rating, img, description, stock, status)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                `;
                for (const book of initialBooks) {
                    await db.query(sql, book);
                }
            }
            console.log('Buku katalog awal berhasil disinkronkan ke Supabase PostgreSQL!');
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
        const result = await db.query('SELECT * FROM books');
        res.json({ success: true, books: result.rows, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/books', async (req, res) => {
    const { title, author, category, grade, price, rating, img, desc, description, stock, Stok, stok, status, Status } = req.body;
    const bookDesc = description || desc || '';
    const rawStock = stock ?? Stok ?? stok ?? 1;
    const cleanStock = Math.max(0, Math.floor(Number(rawStock) || 0));
    const rawStatus = String(status ?? Status ?? (cleanStock > 0 ? 'READY' : 'SOLD OUT')).trim();

    try {
        await ensureDatabaseReady();
        const idTypeRes = await db.query(
            `SELECT data_type
             FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'books' AND column_name = 'id'
             LIMIT 1`
        );
        const isTextId = idTypeRes.rows[0] && /char|text/i.test(idTypeRes.rows[0].data_type);

        const hasCapitalStock = await tableHasColumn('books', 'Stok');
        const hasCapitalStatus = await tableHasColumn('books', 'Status');

        let result;
        if (isTextId) {
            const generatedId = String(Date.now());
            if (hasCapitalStock && hasCapitalStatus) {
                result = await db.query(
                    `INSERT INTO books (id, title, author, category, grade, price, rating, img, description, stock, status, "Stok", "Status")
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                     RETURNING *`,
                    [generatedId, title, author, category, grade, Number(price) || 0, parseFloat(rating) || 4.8, img || '', bookDesc, cleanStock, rawStatus, cleanStock, rawStatus]
                );
            } else {
                result = await db.query(
                    `INSERT INTO books (id, title, author, category, grade, price, rating, img, description, stock, status)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                     RETURNING *`,
                    [generatedId, title, author, category, grade, Number(price) || 0, parseFloat(rating) || 4.8, img || '', bookDesc, cleanStock, rawStatus]
                );
            }
        } else {
            result = await db.query(
                `INSERT INTO books (title, author, category, grade, price, rating, img, description, stock, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 RETURNING *`,
                [title, author, category, grade, Number(price) || 0, parseFloat(rating) || 4.8, img || '', bookDesc, cleanStock, rawStatus]
            );
        }

        res.json({ success: true, message: 'Buku berhasil ditambahkan!', id: result.rows[0].id, data: result.rows });
    } catch (err) {
        console.error('Error PostgreSQL Query:', err.message);
        res.status(500).json({ success: false, message: 'Gagal menambah buku: ' + err.message });
    }
});

async function updateBookHandler(req, res) {
    const bookId = req.params.id;
    const { title, author, category, grade, price, rating, img, desc, description, stock, Stok, stok, status, Status } = req.body;
    const bookDesc = description !== undefined ? description : desc;
    const nextStockRaw = stock ?? Stok ?? stok;
    const nextStatusRaw = status ?? Status;

    try {
        await ensureDatabaseReady();
        const existingRes = await db.query('SELECT * FROM books WHERE id::text = $1', [String(bookId)]);
        if (existingRes.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Buku tidak ditemukan di database' });
        }
        const current = existingRes.rows[0];
        const hasCapitalStock = await tableHasColumn('books', 'Stok');
        const hasCapitalStatus = await tableHasColumn('books', 'Status');

        const finalTitle = title !== undefined ? title : current.title;
        const finalAuthor = author !== undefined ? author : current.author;
        const finalCategory = category !== undefined ? category : current.category;
        const finalGrade = grade !== undefined ? grade : current.grade;
        const finalPrice = price !== undefined ? (Number(price) || 0) : current.price;
        const finalRating = rating !== undefined ? (parseFloat(rating) || 4.8) : current.rating;
        const finalImg = img !== undefined ? img : current.img;
        const finalDesc = bookDesc !== undefined ? bookDesc : current.description;
        const finalStock = nextStockRaw !== undefined ? Math.max(0, Math.floor(Number(nextStockRaw) || 0)) : current.stock;
        const finalStatus = nextStatusRaw !== undefined ? nextStatusRaw : current.status;

        let result;
        if (hasCapitalStock && hasCapitalStatus) {
            result = await db.query(
                `UPDATE books
                 SET title = $1,
                     author = $2,
                     category = $3,
                     grade = $4,
                     price = $5,
                     rating = $6,
                     img = $7,
                     description = $8,
                     stock = $9,
                     status = $10,
                     "Stok" = $9,
                     "Status" = $10
                 WHERE id::text = $11
                 RETURNING *`,
                [finalTitle, finalAuthor, finalCategory, finalGrade, finalPrice, finalRating, finalImg, finalDesc, finalStock, finalStatus, String(bookId)]
            );
        } else {
            result = await db.query(
                `UPDATE books
                 SET title = $1,
                     author = $2,
                     category = $3,
                     grade = $4,
                     price = $5,
                     rating = $6,
                     img = $7,
                     description = $8,
                     stock = $9,
                     status = $10
                 WHERE id::text = $11
                 RETURNING *`,
                [finalTitle, finalAuthor, finalCategory, finalGrade, finalPrice, finalRating, finalImg, finalDesc, finalStock, finalStatus, String(bookId)]
            );
        }

        res.json({ success: true, message: 'Buku berhasil diperbarui di database Supabase!', data: result.rows });
    } catch (err) {
        console.error('Error saat mengupdate buku:', err.message);
        res.status(500).json({ success: false, message: 'Gagal memperbarui buku: ' + err.message });
    }
}

app.put('/api/books/:id', updateBookHandler);
app.patch('/api/books/:id', updateBookHandler);

app.delete('/api/books/:id', async (req, res) => {
    const bookId = req.params.id;

    try {
        await ensureDatabaseReady();
        await db.query('DELETE FROM books WHERE id::text = $1', [String(bookId)]);
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
        const result = await db.query('SELECT id, nama, email, role FROM users');
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

app.post('/api/qc', async (req, res) => {
    const { submitter_name, book_title, condition_note, recommended_price, status } = req.body;
    try {
        await ensureDatabaseReady();
        const result = await db.query(
            `INSERT INTO qc_books (submitter_name, book_title, condition_note, recommended_price, status)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                submitter_name || 'Pengguna Litera',
                book_title || 'Buku Titipan',
                condition_note || '-',
                Number(recommended_price) || 0,
                status || 'pending'
            ]
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Error POST /api/qc:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

async function updateQcHandler(req, res) {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await ensureDatabaseReady();
        const result = await db.query(
            'UPDATE qc_books SET status = $1 WHERE id::text = $2 RETURNING *',
            [status, String(id)]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Data QC tidak ditemukan' });
        }
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Error UPDATE /api/qc/:id:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
}

app.put('/api/qc/:id', updateQcHandler);
app.patch('/api/qc/:id', updateQcHandler);

app.get('/api/orders', async (req, res) => {
    try {
        await ensureDatabaseReady();
        const result = await db.query('SELECT * FROM orders');
        res.json({ success: true, orders: result.rows, data: result.rows });
    } catch (err) {
        console.error('Error GET /api/orders:', err.message);
        res.status(500).json({ success: false, message: err.message, orders: [] });
    }
});

async function updateOrderHandler(req, res) {
    const { id } = req.params;
    const { tracking_number, no_resi, no_pesanan, status } = req.body;
    const finalResi = tracking_number !== undefined ? tracking_number : no_resi;

    try {
        await ensureDatabaseReady();

        const oldOrderRes = await db.query('SELECT * FROM orders WHERE id::text = $1', [String(id)]);
        if (oldOrderRes.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Pesanan tidak ditemukan' });
        }
        const oldOrder = oldOrderRes.rows[0];
        const newStatus = (status || oldOrder.status || '').trim();

        const hasNoPesanan = await tableHasColumn('orders', 'no_pesanan');
        const hasNoResi = await tableHasColumn('orders', 'no_resi');
        const hasTrackingNumber = await tableHasColumn('orders', 'tracking_number');

        const setClauses = ['status = COALESCE($1, status)'];
        const params = [status !== undefined ? status : null];

        if (hasTrackingNumber && finalResi !== undefined) {
            params.push(finalResi);
            setClauses.push(`tracking_number = COALESCE($${params.length}, tracking_number)`);
        }
        if (hasNoResi && finalResi !== undefined) {
            params.push(finalResi);
            setClauses.push(`no_resi = COALESCE($${params.length}, no_resi)`);
        }
        if (hasNoPesanan && no_pesanan !== undefined) {
            params.push(no_pesanan);
            setClauses.push(`no_pesanan = COALESCE($${params.length}, no_pesanan)`);
        }

        params.push(String(id));
        const result = await db.query(
            `UPDATE orders
             SET ${setClauses.join(', ')}
             WHERE id::text = $${params.length}
             RETURNING *`,
            params
        );

        // Jika pesanan dibatalkan admin -> kembalikan stok ke READY
        if (newStatus.toLowerCase().includes('batal')) {
            await restoreOrderBooksStock(oldOrder.items);
        }

        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error('Error UPDATE /api/orders/:id:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
}

app.put('/api/orders/:id', updateOrderHandler);
app.patch('/api/orders/:id', updateOrderHandler);

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
            `UPDATE orders SET status = 'Pembayaran Terverifikasi' WHERE id::text = $1 RETURNING *`,
            [String(id)]
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
        res.json({ success: true, settings: result.rows[0] || {}, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

async function updateSettingsHandler(req, res) {
    const {
        nama_organisasi, tagline, copyright_text, no_telp, email, alamat,
        logo, favicon, link_facebook, link_instagram, link_tiktok, link_youtube,
        link_linkedin, link_maps, smtp_host, smtp_port, smtp_user, smtp_password, smtp_from_email
    } = req.body;

    try {
        await ensureDatabaseReady();
        const currentRes = await db.query('SELECT * FROM web_settings WHERE id = 1');
        const cur = currentRes.rows[0] || {};

        const sql = `
            UPDATE web_settings SET
                nama_organisasi = $1,
                tagline = $2,
                copyright_text = $3,
                no_telp = $4,
                email = $5,
                alamat = $6,
                logo = COALESCE(NULLIF($7, ''), logo),
                favicon = COALESCE(NULLIF($8, ''), favicon),
                link_facebook = $9,
                link_instagram = $10,
                link_tiktok = $11,
                link_youtube = $12,
                link_linkedin = $13,
                link_maps = $14,
                smtp_host = $15,
                smtp_port = $16,
                smtp_user = $17,
                smtp_password = COALESCE(NULLIF($18, ''), smtp_password),
                smtp_from_email = $19
            WHERE id = 1
            RETURNING *
        `;

        const values = [
            nama_organisasi !== undefined ? nama_organisasi : (cur.nama_organisasi || 'LITERA'),
            tagline !== undefined ? (tagline || 'Digital Library & Hub') : (cur.tagline || 'Digital Library & Hub'),
            copyright_text !== undefined ? (copyright_text || '© 2026 LITERA. All Rights Reserved.') : (cur.copyright_text || '© 2026 LITERA. All Rights Reserved.'),
            no_telp !== undefined ? no_telp : (cur.no_telp || ''),
            email !== undefined ? email : (cur.email || ''),
            alamat !== undefined ? alamat : (cur.alamat || ''),
            logo || '',
            favicon || '',
            link_facebook !== undefined ? link_facebook : (cur.link_facebook || 'https://facebook.com'),
            link_instagram !== undefined ? link_instagram : (cur.link_instagram || 'https://instagram.com'),
            link_tiktok !== undefined ? link_tiktok : (cur.link_tiktok || 'https://tiktok.com'),
            link_youtube !== undefined ? link_youtube : (cur.link_youtube || 'https://youtube.com'),
            link_linkedin !== undefined ? link_linkedin : (cur.link_linkedin || ''),
            link_maps !== undefined ? link_maps : (cur.link_maps || ''),
            smtp_host !== undefined ? smtp_host : (cur.smtp_host || 'smtp.gmail.com'),
            smtp_port !== undefined ? (Number(smtp_port) || 587) : (cur.smtp_port || 587),
            smtp_user !== undefined ? smtp_user : (cur.smtp_user || ''),
            smtp_password || '',
            smtp_from_email !== undefined ? smtp_from_email : (cur.smtp_from_email || '')
        ];

        const updated = await db.query(sql, values);
        res.json({ success: true, message: 'Pengaturan Footer & Website berhasil disimpan ke Supabase!', data: updated.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
}

app.post('/api/settings', updateSettingsHandler);
app.patch('/api/settings', updateSettingsHandler);
app.patch('/api/settings/:id', updateSettingsHandler);

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

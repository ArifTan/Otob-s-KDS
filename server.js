const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
const PORT = 3000;


const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'otobus'
});

db.connect((err) => {
    if (err) {
        console.error('Veritabanına bağlanırken hata oluştu:', err);
        return;
    }
    console.log('Veritabanına başarılı bir şekilde bağlanıldı.');
});


app.use(cors()); 
app.use(bodyParser.json());
app.use(express.static('public'));


app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const query = 'SELECT * FROM login WHERE username = ? AND password = ?';
    db.query(query, [username, password], (err, results) => {
        if (err) {
            console.error('Veritabanı hatası:', err);
            res.status(500).json({ success: false, message: 'Bir hata oluştu.' });
            return;
        }

        if (results.length > 0) {
            res.json({ success: true });
        } else {
            res.json({ success: false, message: 'Kullanıcı adı veya şifre hatalı.' });
        }
    });
});


// API: Dashboard verileri
app.get("/api/dashboard", async (req, res) => {
    try {
        const queries = {
            otobusler: "SELECT COUNT(*) AS toplam_otobus FROM otobusler",
            seferler: "SELECT COUNT(*) AS toplam_sefer FROM seferler",
            soforler: "SELECT COUNT(*) AS toplam_sofor FROM soforler",
            guzergahlar: "SELECT * FROM guzergahlar"
        };

        const results = await Promise.all(
            Object.keys(queries).map(key =>
                new Promise((resolve, reject) => {
                    db.query(queries[key], (err, data) => {
                        if (err) reject(err);
                        else resolve({ key, data });
                    });
                })
            )
        );

        const response = results.reduce((acc, item) => {
            acc[item.key] = item.data;
            return acc;
        }, {});

        res.json(response);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching data");
    }
});

// API: Güzergahlar
app.get("/api/guzergahlar", (req, res) => {
    const query = "SELECT * FROM guzergahlar";

    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send("Veri çekilirken hata oluştu.");
            return;
        }
        res.json(results);
    });
});

// API: Günlük doluluk oranları
app.get("/api/doluluk-oranlari/:guzergah_id", (req, res) => {
    const guzergahId = req.params.guzergah_id;
    const query = `
        SELECT sefer_tarihi, 
               SUM(dolu_koltuk) AS dolu_koltuk, 
               SUM(koltuk_sayisi - dolu_koltuk) AS bos_koltuk, 
               (SUM(dolu_koltuk) / SUM(koltuk_sayisi)) * 100 AS ortalama_doluluk
        FROM seferler
        WHERE guzergah_id = ?
        GROUP BY sefer_tarihi
        ORDER BY sefer_tarihi;
    `;

    db.query(query, [guzergahId], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send("Veri çekilirken hata oluştu.");
            return;
        }
        res.json(results);
    });
});

// API: Aylık doluluk oranları (yıllara göre)
app.get("/api/aylik-doluluk-oranlari/:guzergah_id", (req, res) => {
    const guzergahId = req.params.guzergah_id;
    const query = `
        SELECT YEAR(sefer_tarihi) AS yil, 
               MONTH(sefer_tarihi) AS ay, 
               SUM(dolu_koltuk) AS toplam_dolu, 
               SUM(koltuk_sayisi - dolu_koltuk) AS toplam_bos
        FROM seferler
        WHERE guzergah_id = ?
        GROUP BY YEAR(sefer_tarihi), MONTH(sefer_tarihi)
        ORDER BY yil, ay;
    `;

    db.query(query, [guzergahId], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send("Veri çekilirken hata oluştu.");
            return;
        }

        const monthlyData = results.map(item => ({
            yil: item.yil,
            ay: item.ay,
            dolulukOrani: ((item.toplam_dolu / (item.toplam_dolu + item.toplam_bos)) * 100).toFixed(2)
        }));

        res.json(monthlyData);
    });
});

// Otobüs verilerini çekmek için API endpointi
app.get('/api/buses', (req, res) => {
    const query = 'SELECT * FROM otobusler';  // otobusler tablosu adını veritabanınızdaki tabloya göre değiştirin
    db.query(query, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// Yeni API: Seferler verilerini alma
app.get('/api/seferler', (req, res) => {
    const query = 'SELECT * FROM seferler';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).send('Veri çekme hatası');
        }
        res.json(results);
    });
});

// Yeni API: Şoförler verilerini alma
app.get('/api/soforler', (req, res) => {
    const query = 'SELECT id, adi_soyadi, telefon, ehliyet_no, sefer_sayisi, gecikme FROM soforler';
    db.query(query, (err, results) => {
        if (err) {
            console.error("Şoförler verileri çekilirken hata oluştu:", err);
            return res.status(500).send('Şoför verilerini çekme hatası');
        }
        res.json(results);
    });
});

// Yeni API: Otobüsler verilerini alma
app.get('/api/otobusler', (req, res) => {
    const query = 'SELECT id, otobus_plaka FROM otobusler'; // 'otobusler' tablosundan veriler çekiliyor
    db.query(query, (err, results) => {
        if (err) {
            console.error("Otobüsler verileri çekilirken hata oluştu:", err);
            return res.status(500).send('Otobüs verilerini çekme hatası');
        }
        res.json(results);
    });
});



// API: Doluluk oranları (Güzergah id'sine, yıl ve ay'a göre hesaplanan doluluk oranı)
app.get("/api/doluluk-oranlari/:guzergah_id/:year/:month?", (req, res) => {
    const guzergahId = req.params.guzergah_id;
    const year = req.params.year;
    const month = req.params.month; // Ay opsiyonel
  
    let query = `
      SELECT sefer_tarihi, 
             SUM(dolu_koltuk) AS dolu_koltuk, 
             SUM(koltuk_sayisi) AS toplam_koltuk,
             (SUM(dolu_koltuk) / SUM(koltuk_sayisi)) * 100 AS doluluk_orani
      FROM seferler
      WHERE guzergah_id = ? AND YEAR(sefer_tarihi) = ?
    `;
  
    const queryParams = [guzergahId, year];
  
    if (month) {
      query += ` AND MONTH(sefer_tarihi) = ?`;
      queryParams.push(month);
    }
  
    query += ` GROUP BY sefer_tarihi ORDER BY sefer_tarihi;`;
  
    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).send("Veri çekilirken hata oluştu.");
        return;
      }
      res.json(results);
    });
  });

// Gecikme nedenleri verisini dönen API (Yıl ve ay filtreleme destekli)
// Gecikme nedenleri verisini dönen API (Yıl, ay ve güzergah filtreleme destekli)
app.get("/api/gecikme-nedenleri", (req, res) => {
    const { year, month, route } = req.query;

    let query = `
        SELECT gecikme_nedeni, COUNT(*) AS count 
        FROM seferler 
        WHERE gecikme_nedeni IS NOT NULL
    `;
    const params = [];

    // Yıl filtresi
    if (year) {
        query += " AND YEAR(sefer_tarihi) = ?";
        params.push(year);
    }

    // Ay filtresi
    if (month) {
        query += " AND MONTH(sefer_tarihi) = ?";
        params.push(month);
    }

    // Güzergah filtresi
    if (route) {
        query += " AND guzergah_id IN (SELECT id FROM guzergahlar WHERE guzergah_adi = ?)";
        params.push(route);
    }

    query += " GROUP BY gecikme_nedeni";

    db.query(query, params, (err, results) => {
        if (err) {
            console.error("Gecikme nedenleri API hatası:", err);
            res.status(500).send("Veri çekme hatası");
            return;
        }
        res.json(results);
    });
});

// Statik dosyaları sun
app.use(express.static("public"));
  

// Sunucu başlatma
app.listen(3000, () => {
    console.log("Server 3000 portunda çalışıyor");
});


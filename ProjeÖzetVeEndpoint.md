Bu çalışmada, Pamukkale Seyahat firması için geçmiş yıl verilerinin analizine dayalı bir karar destek sistemi geliştirilmiştir. Sistem, talep dalgalanmalarını grafikler halinde görerek gelecekteki sefer planlamalarını optimize etmeyi ve ekonomik kayıpları minimize etmeyi amaçlamaktadır. Grafiksel analizler ve veri odaklı öngörüler sunan bu sistem, stratejik ve taktik düzeydeki yöneticilere karar alma süreçlerinde rehberlik etmektedir.

ENDPOİNTLER
get/dashboard-Dashboard ekranı için otobüs, sefer, şoför ve güzergah bilgilerini toplamak. Birden fazla SQL sorgusu çalıştırılır ve her bir sorgunun sonucu, toplu bir JSON nesnesi olarak döndürülür.
get/guzergahlar-Güzergah bilgilerini çekmek. Guzergahlar tablosundaki tüm kayıtları JSON formatında döndürür.
get/doluluk-oranlari/:guzergah_id-Belirli bir güzergahın günlük doluluk oranlarını hesaplamak. seferler tablosunda guzergah_id'ye göre gruplandırılmış doluluk oranlarını hesaplar ve tarih bazında sıralar.
get/aylik-doluluk-oranlari/:guzergah_id- Aylık doluluk oranlarını yıllara göre hesaplamak. Belirtilen guzergah_id için aylık toplam dolu ve boş koltuk sayıları bulunur, oran hesaplanır ve JSON olarak döner.
get/buses- Tüm otobüs kayıtlarını almak. Otobusler tablosundaki tüm kayıtları JSON formatında döner.
get/seferler-Tüm sefer bilgilerini çekmek.Seferler tablosundaki tüm verileri JSON olarak döndürür.
get/soforler-Şoförlerin temel bilgilerini almak. Soforler tablosundaki belirli sütunları (id, adi_soyadi, telefon, ehliyet_no, sefer_sayisi, gecikme) döndürür.
get/otobusler-Otobüslerin plaka ve ID bilgilerini çekmek. Otobusler tablosundaki otobüs plakalarını ve ID'lerini JSON olarak döner.
get/doluluk-oranlari/:guzergah_id/:year/:month?-Belirli bir güzergah, yıl ve isteğe bağlı olarak ay için doluluk oranını hesaplamak. Seferler tablosunda belirtilen kriterlere göre doluluk oranını hesaplar.
get/gecikme-nedenleri-Sefer gecikme nedenlerini gruplandırarak döndürmek.Yıl, ay ve güzergah adı gibi isteğe bağlı filtrelere göre gecikme nedenlerini ve sayısını döner.
POST/login-Kullanıcı girişini doğrulamak. Kullanıcıdan gelen username ve password bilgileri, login tablosundaki kayıtlarla karşılaştırılır. Eğer eşleşme varsa kullanıcı doğrulanır ve { success: true } yanıtı döner, aksi halde { success: false, message: 'Kullanıcı adı veya şifre hatalı.' } yanıtı döner.

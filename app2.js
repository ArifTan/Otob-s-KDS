document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const guzergahId = urlParams.get("guzergahId"); 
    const ay = urlParams.get("ay"); 
    const soforId = urlParams.get("soforId"); 
    const filterDelay = urlParams.get("filterDelay") === "true"; 

    
    const yearFilter = document.getElementById("yearFilter");
    const ayFilter = document.getElementById("ayFilter");
    const dayFilter = document.getElementById("dayFilter");
    const gecikmeFilter = document.getElementById("gecikmeFilter"); 

   
    yearFilter.addEventListener("change", loadSeferData);
    ayFilter.addEventListener("change", loadSeferData);
    dayFilter.addEventListener("change", loadSeferData);
    gecikmeFilter.addEventListener("change", loadSeferData);

    
    loadSeferData();

    
    function loadSoforler() {
        return fetch("http://localhost:3000/api/soforler")
            .then(response => {
                if (!response.ok) throw new Error("Şoför API isteği başarısız!");
                return response.json();
            })
            .then(soforlerData => {
                const soforlerMap = {};
                soforlerData.forEach(sofor => {
                    soforlerMap[sofor.id] = sofor.adi_soyadi; 
                });
                return soforlerMap;
            })
            .catch(error => console.error("Şoför verileri çekilirken hata oluştu:", error));
    }

    
    function loadOtobusler() {
        return fetch("http://localhost:3000/api/buses")
            .then(response => {
                if (!response.ok) throw new Error("Otobüs API isteği başarısız!");
                return response.json();
            })
            .then(otobuslerData => {
                const otobuslerMap = {};
                otobuslerData.forEach(otobus => {
                    otobuslerMap[otobus.id] = otobus.otobus_plaka; 
                });
                return otobuslerMap;
            })
            .catch(error => console.error("Otobüs verileri çekilirken hata oluştu:", error));
    }

    
    function loadGuzergahNames() {
        return fetch("http://localhost:3000/api/guzergahlar")
            .then(response => response.json())
            .then(guzergahData => {
                const guzergahNames = {};
                guzergahData.forEach(guzergah => {
                    guzergahNames[guzergah.id] = guzergah.guzergah_adi;
                });
                return guzergahNames;
            })
            .catch(error => console.error("Güzergah verileri çekilirken hata oluştu:", error));
    }

    
    function loadSeferData() {
        const selectedYear = yearFilter.value;
        const selectedMonth = ayFilter.value;
        const selectedDay = dayFilter.value;
        const selectedGecikme = gecikmeFilter.value; 

        
        Promise.all([loadSoforler(), loadOtobusler(), loadGuzergahNames()])
            .then(([soforlerMap, otobuslerMap, guzergahNames]) => {
                fetch(`http://localhost:3000/api/seferler`)
                    .then(response => response.json())
                    .then(seferData => {
                        
                        const seferlerListesi = document.getElementById("seferlerListesi");
                        seferlerListesi.innerHTML = "";

                        
                        const availableDays = new Set();
                        const gecikmeNedenleri = new Set();
                        seferData.forEach(sefer => {
                            const seferDate = new Date(sefer.sefer_tarihi);
                            const day = seferDate.getDate(); 
                            availableDays.add(day); 

                            if (sefer.gecikme_nedeni) {
                                gecikmeNedenleri.add(sefer.gecikme_nedeni); 
                            }
                        });

                        
                        dayFilter.innerHTML = '<option value="">Tüm Günler</option>';
                        availableDays.forEach(day => {
                            const option = document.createElement("option");
                            option.value = day;
                            option.textContent = `Gün ${day}`;
                            dayFilter.appendChild(option);
                        });

                        
                        gecikmeFilter.innerHTML = '<option value="">Tümü</option>';
                        gecikmeNedenleri.forEach(neden => {
                            const option = document.createElement("option");
                            option.value = neden;
                            option.textContent = neden;
                            gecikmeFilter.appendChild(option);
                        });

                        
                        seferData.forEach(sefer => {
                            const seferDate = new Date(sefer.sefer_tarihi);
                            const year = seferDate.getFullYear();
                            const month = seferDate.getMonth() + 1; 
                            const day = seferDate.getDate();

                            
                            if (
                                (!guzergahId || sefer.guzergah_id == guzergahId) &&
                                (!ay || month == ay) &&
                                (!soforId || sefer.sofor_id == soforId) && 
                                (!selectedYear || selectedYear == year) &&
                                (!selectedMonth || selectedMonth == month) &&
                                (!selectedDay || selectedDay == day) &&
                                (!selectedGecikme || sefer.gecikme_nedeni === selectedGecikme) &&
                                (!filterDelay || sefer.gecikme_nedeni !== "Zamanında Vardı") 
                            ) {
                                
                                const dolulukOrani = (sefer.dolu_koltuk / sefer.koltuk_sayisi) * 100;
                                const dolulukOraniFormatted = dolulukOrani ? `${dolulukOrani.toFixed(2)}%` : "0%";

                                const listItem = document.createElement("tr");
                                listItem.innerHTML = `
                                    <td>${sefer.id}</td>
                                    <td>${guzergahNames[sefer.guzergah_id] || "Bilinmiyor"}</td> <!-- Güzergah adı -->
                                    <td>${soforlerMap[sefer.sofor_id] || "Bilinmiyor"}</td> <!-- Şoför adı -->
                                    <td>${formatTarih(sefer.sefer_tarihi)}</td>
                                    <td>${sefer.dolu_koltuk}</td>
                                    <td>${sefer.koltuk_sayisi}</td>
                                    <td>${dolulukOraniFormatted}</td>
                                    <td>${sefer.sefer_saati}</td>
                                    <td>${sefer.gecikme_nedeni || "Belirtilmedi"}</td>
                                `;
                                seferlerListesi.appendChild(listItem);
                            }
                        });
                    })
                    .catch(error => console.error("Sefer verileri çekilirken hata oluştu:", error));
            });
    }

    
    function formatTarih(tarih) {
        const date = new Date(tarih);
        const options = { year: "numeric", month: "long", day: "numeric" };
        return date.toLocaleString("tr-TR", options);
    }
});

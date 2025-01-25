document.addEventListener("DOMContentLoaded", () => {
    const tbody = document.querySelector("tbody");
    const errorMessage = document.querySelector("#error-message");

    
    fetch("http://localhost:3000/api/soforler")
        .then(response => {
            if (!response.ok) {
                throw new Error("Veriler alınırken hata oluştu.");
            }
            return response.json();
        })
        .then(data => {
            if (data.length === 0) {
                errorMessage.textContent = "Tablo verisi bulunamadı.";
                return;
            }

            
            data.forEach(sofor => {
                const row = document.createElement("tr");

                row.innerHTML = `
                    <td>${sofor.adi_soyadi}</td>
                    <td>${sofor.telefon}</td>
                    <td>${sofor.ehliyet_no}</td>
                    <td>${sofor.sefer_sayisi}</td>
                    <td>${sofor.gecikme}</td>
                    <td><button class="details-button" data-id="${sofor.id}">Detaylı Göster</button></td>
                `;

                tbody.appendChild(row);
            });

            
            const detailButtons = document.querySelectorAll(".details-button");
            detailButtons.forEach(button => {
                button.addEventListener("click", () => {
                    const soforId = button.getAttribute("data-id");
                    window.location.href = `seferler.html?soforId=${soforId}&filterDelay=true`;
                });
            });
        })
        .catch(error => {
            console.error("Veri yükleme hatası:", error);
            errorMessage.textContent = "Veriler alınırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.";
        });
});


2222
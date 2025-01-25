document.addEventListener("DOMContentLoaded", function() {
    // Verileri çekme işlemi
    fetch('http://localhost:3000/api/buses')
        .then(response => response.json())
        .then(data => {
            const busTableBody = document.getElementById('bus-table-body');
            let busCount = 0;
            let tripCount = 0; 
            let driverCount = 0; 

            data.forEach(bus => {
                busCount++;
                

                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${bus.plaka}</td>
                    <td>${bus.marka}</td>
                    <td>${bus.model}</td>
                    <td>${bus.koltuk_sayisi}</td>
                `;
                busTableBody.appendChild(row);
            });

            
            document.getElementById('bus-count').textContent = busCount;
            document.getElementById('trip-count').textContent = tripCount;
            document.getElementById('driver-count').textContent = driverCount;
        })
        .catch(error => console.error('Veri çekme hatası:', error));
});

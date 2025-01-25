document.addEventListener("DOMContentLoaded", () => {
    const yearSelect = document.getElementById("year");
    const monthSelect = document.getElementById("month");
    const routeSelect = document.getElementById("route");
    const addGraphButton = document.getElementById("addGraphButton");
    const compareButton = document.getElementById("compareButton");
    const graphContainer = document.querySelector(".graph-container");
    const filterContainer = document.querySelector(".filter-container");

    let graphData = []; 
    let chartInstances = []; 

    
    for (let i = 2020; i <= 2025; i++) {
        const yearOption = document.createElement("option");
        yearOption.value = i;
        yearOption.textContent = i;
        yearSelect.appendChild(yearOption);
    }

    monthSelect.innerHTML += '<option value="">Tümü</option>';
    for (let i = 1; i <= 12; i++) {
        const monthOption = document.createElement("option");
        monthOption.value = i;
        monthOption.textContent = i;
        monthSelect.appendChild(monthOption);
    }

    
    fetch("http://localhost:3000/api/guzergahlar")
        .then((response) => response.json())
        .then((data) => {
            routeSelect.innerHTML = '<option value="">Tümü</option>';
            data.forEach((route) => {
                const option = document.createElement("option");
                option.value = route.guzergah_adi;
                option.textContent = route.guzergah_adi;
                routeSelect.appendChild(option);
            });
        })
        .catch((err) => console.error("Güzergah verisi yüklenirken hata oluştu:", err));

    
    const initialForm = document.getElementById("filterForm");
    initialForm.addEventListener("submit", (e) => {
        e.preventDefault();
        renderGraph(initialForm, "initialGraph", 0); 
    });

    
    addGraphButton.addEventListener("click", () => {
        const formIndex = document.querySelectorAll(".filter-container form").length;

        const newForm = document.createElement("form");
        newForm.classList.add("dynamic-filter-form");
        newForm.style.marginLeft = "20px"; 
        newForm.innerHTML = `
            <div class="form-row">
                <label for="year${formIndex}">Yıl:</label>
                <select id="year${formIndex}" name="year">
                    ${yearSelect.innerHTML}
                </select>
                <label for="month${formIndex}">Ay:</label>
                <select id="month${formIndex}" name="month">
                    ${monthSelect.innerHTML}
                </select>
                <label for="route${formIndex}">Güzergah:</label>
                <select id="route${formIndex}" name="route">
                    ${routeSelect.innerHTML}
                </select>
            </div>
            <button type="submit" class="filter-button">Filtrele</button>
        `;

        filterContainer.appendChild(newForm);

        const newCanvas = document.createElement("canvas");
        newCanvas.id = `gecikmeGrafik${formIndex}`;
        graphContainer.appendChild(newCanvas);

        newForm.addEventListener("submit", (e) => {
            e.preventDefault();
            renderGraph(newForm, newCanvas.id, formIndex);

            
            if (document.querySelectorAll(".graph-container canvas").length >= 2) {
                compareButton.style.display = "block"; 
            }
        });
    });

    
    function renderGraph(form, canvasId, graphIndex) {
        const year = form.querySelector('select[name="year"]').value;
        const month = form.querySelector('select[name="month"]').value;
        const route = form.querySelector('select[name="route"]').value;

        let apiUrl = `http://localhost:3000/api/gecikme-nedenleri?year=${year}`;
        if (month) apiUrl += `&month=${month}`;
        if (route) apiUrl += `&route=${encodeURIComponent(route)}`;

        fetch(apiUrl)
            .then((response) => response.json())
            .then((data) => {
                const labels = data.map((item) => item.gecikme_nedeni);
                const values = data.map((item) => item.count);

                
                graphData[graphIndex] = { labels, values };

                const ctx = document.getElementById(canvasId).getContext("2d");

                
                if (chartInstances[graphIndex]) {
                    chartInstances[graphIndex].data.labels = labels;
                    chartInstances[graphIndex].data.datasets[0].data = values;
                    chartInstances[graphIndex].update(); 
                } else {
                    
                    chartInstances[graphIndex] = new Chart(ctx, {
                        type: "pie",
                        data: {
                            labels: labels,
                            datasets: [
                                {
                                    data: values,
                                    backgroundColor: [
                                        'rgba(255, 99, 132, 0.2)',
                                        'rgba(54, 162, 235, 0.2)',
                                        'rgba(255, 206, 86, 0.2)',
                                        'rgba(75, 192, 192, 0.2)',
                                        'rgba(153, 102, 255, 0.2)',
                                        'rgba(255, 159, 64, 0.2)'
                                    ],
                                    borderColor: [
                                        'rgba(255, 99, 132, 1)',
                                        'rgba(54, 162, 235, 1)',
                                        'rgba(255, 206, 86, 1)',
                                        'rgba(75, 192, 192, 1)',
                                        'rgba(153, 102, 255, 1)',
                                        'rgba(255, 159, 64, 1)'
                                    ],
                                },
                            ],
                        },
                        options: {
                            responsive: true,
                            plugins: {
                                legend: { position: "top" },
                                title: { display: true, text: "Gecikme Nedenleri Dağılımı" },
                            },
                        },
                    });
                }
            })
            .catch((error) => console.error("Error fetching data:", error));
    }

    
    compareButton.addEventListener("click", () => {
        if (graphData.length < 2) {
            alert("Kıyaslama için en az iki grafik seçmelisiniz.");
            return;
        }

        const labels1 = graphData[0].labels;
        const values1 = graphData[0].values;
        const labels2 = graphData[1].labels;
        const values2 = graphData[1].values;

        const comparisonResults = document.getElementById("comparisonResults");

        
        let comparisonTable = `
            <h3>Kıyaslama Sonuçları</h3>
            <table>
                <thead>
                    <tr>
                        <th>Gecikme Nedeni</th>
                        <th>Grafik 1</th>
                        <th>Grafik 2</th>
                        <th>Durum</th>
                    </tr>
                </thead>
                <tbody>
        `;

        let countIncrease = 0;
        let countDecrease = 0;
        let countSame = 0;

        labels1.forEach((label, index) => {
            const value1 = values1[index];
            const value2 = labels2.includes(label) ? values2[labels2.indexOf(label)] : 0;

            let status = "Aynı Kaldı";
            if (value1 < value2) {
                status = `Arttı (${value2 - value1})`; 
                countIncrease++;
            } else if (value1 > value2) {
                status = `Azaldı (${value1 - value2})`; 
                countDecrease++;
            } else {
                countSame++;
            }

            comparisonTable += `
                <tr>
                    <td>${label}</td>
                    <td>${value1}</td>
                    <td>${value2}</td>
                    <td>${status}</td>
                </tr>
            `;
        });

        

        comparisonResults.innerHTML = comparisonTable;
    });
});

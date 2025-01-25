document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch("http://localhost:3000/api/dashboard");
        const data = await response.json();

        
        document.getElementById("bus-count").textContent = data.otobusler[0].toplam_otobus;
        document.getElementById("trip-count").textContent = data.seferler[0].toplam_sefer;
        document.getElementById("driver-count").textContent = data.soforler[0].toplam_sofor;

        
        const routeResponse = await fetch("http://localhost:3000/api/guzergahlar");
        const routeData = await routeResponse.json();

        const routeSelect = document.getElementById("route-select");
        routeData.forEach(route => {
            const option = document.createElement("option");
            option.value = route.id;
            option.textContent = route.guzergah_adi;
            routeSelect.appendChild(option);
        });

        
        const dailyCtx = document.getElementById("occupancy-chart").getContext("2d");
        const monthlyCtx = document.getElementById("monthly-occupancy-chart").getContext("2d");

        
        const yearColors = {
            2023: 'rgba(255, 99, 132, 1)', 
            2024: 'rgba(54, 162, 235, 1)', 
            2025: 'rgba(75, 192, 192, 1)'  
        };
        const yearBackgroundColors = {
            2023: 'rgba(255, 99, 132, 0.2)',
            2024: 'rgba(54, 162, 235, 0.2)',
            2025: 'rgba(75, 192, 192, 0.2)'
        };

        
        let dailyChart = new Chart(dailyCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: []
            },
            options: {
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day',
                            tooltipFormat: 'll',
                        },
                        title: {
                            display: true,
                            text: 'Tarih'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Doluluk Oranı (%)'
                        }
                    }
                }
            }
        });

        
        let monthlyChart = new Chart(monthlyCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: []
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Ay'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Doluluk Oranı (%)'
                        }
                    }
                }
            }
        });

        
        routeSelect.addEventListener("change", async (event) => {
            const guzergahId = event.target.value;

            
            const existingMonthSelect = document.getElementById("month-select");
            if (existingMonthSelect) {
                existingMonthSelect.remove();
            }

            if (guzergahId) {
                
                const monthlyResponse = await fetch(`http://localhost:3000/api/aylik-doluluk-oranlari/${guzergahId}`);
                const monthlyData = await monthlyResponse.json();

                if (monthlyData.length === 0) {
                    console.error("Aylık veri bulunamadı.");
                    return;
                }

                
                const years = [...new Set(monthlyData.map(item => item.yil))];
                const datasets = years.map(year => ({
                    label: `${year}`,
                    data: monthlyData.filter(item => item.yil === year).map(item => ({
                        x: `Ay ${item.ay}`,
                        y: item.dolulukOrani
                    })),
                    backgroundColor: yearBackgroundColors[year],
                    borderColor: yearColors[year],
                    borderWidth: 1
                }));

                monthlyChart.data.labels = [...new Set(monthlyData.map(item => `Ay ${item.ay}`))];
                monthlyChart.data.datasets = datasets;
                monthlyChart.update();

                
                const monthSelect = document.createElement("select");
                monthSelect.id = "month-select";
                monthSelect.innerHTML = `
                    <option value="">Bir Ay Seçin</option>
                    ${Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}">${i + 1}. Ay</option>`).join('')}
                `;
                document.querySelector('.route-selection').appendChild(monthSelect);

                
                monthSelect.addEventListener("change", async (e) => {
                    const selectedMonth = e.target.value;
                    if (selectedMonth) {
                        const dailyResponse = await fetch(`http://localhost:3000/api/doluluk-oranlari/${guzergahId}`);
                        const dailyData = await dailyResponse.json();

                        if (dailyData.length === 0) {
                            console.error("Günlük veri bulunamadı.");
                            dailyChart.data.labels = [];
                            dailyChart.data.datasets = [];
                            dailyChart.update();
                            return;
                        }

                        
                        const filteredDailyData = dailyData.filter(item => {
                            const date = new Date(item.sefer_tarihi);
                            return date.getMonth() + 1 == selectedMonth;
                        });

                        
                        const yearDatasets = [...new Set(filteredDailyData.map(item => new Date(item.sefer_tarihi).getFullYear()))]
                            .map(year => {
                                const yearData = filteredDailyData.filter(item => new Date(item.sefer_tarihi).getFullYear() === year);
                                const dailyLabels = [];
                                const dailyValues = [];
                                let currentDate = new Date(`${year}-${selectedMonth}-01`);

                                
                                while (currentDate.getMonth() + 1 == selectedMonth) {
                                    const currentDateString = currentDate.toISOString().split('T')[0];
                                    dailyLabels.push(currentDateString);
                                    const dataForDate = yearData.find(item => {
                                        const itemDate = new Date(item.sefer_tarihi).toISOString().split('T')[0];
                                        return itemDate === currentDateString;
                                    });
                                    dailyValues.push(dataForDate ? dataForDate.ortalama_doluluk : 0);
                                    currentDate.setDate(currentDate.getDate() + 1);
                                }

                                return {
                                    label: `${year} Yılı`,
                                    data: dailyValues,
                                    borderColor: yearColors[year],
                                    borderWidth: 2,
                                    fill: false,
                                    pointRadius: 3
                                };
                            });

                        
                        dailyChart.data.labels = yearDatasets[0]?.data.map((_, i) => {
                            const currentDate = new Date(`${filteredDailyData[0]?.sefer_tarihi.split('-')[0]}-${selectedMonth}-${i + 1}`);
                            return currentDate.toISOString().split('T')[0];
                        });
                        dailyChart.data.datasets = yearDatasets;
                        dailyChart.update();
                        
                    }
                });
            }
        });

    } catch (err) {
        console.error("Veri çekilirken hata oluştu:", err);
    }
});

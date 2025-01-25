document.addEventListener('DOMContentLoaded', () => {
  const yearSelect = document.getElementById('year');
  const monthSelect = document.getElementById('month');
  const addGraphButton = document.getElementById('addGraphButton');
  const compareButton = document.getElementById('compareButton');
  const comparisonResults = document.getElementById('comparisonResults');
  const graphContainer = document.querySelector('.graph-container');
  const filterContainer = document.querySelector('.filter-container'); 

  
  compareButton.style.display = 'none';

  
  for (let i = 2020; i <= 2025; i++) {
    const yearOption = document.createElement('option');
    yearOption.value = i;
    yearOption.textContent = i;
    yearSelect.appendChild(yearOption);
  }

  for (let i = 1; i <= 12; i++) {
    const monthOption = document.createElement('option');
    monthOption.value = i;
    monthOption.textContent = i;
    monthSelect.appendChild(monthOption);
  }

  
  fetch('http://localhost:3000/api/guzergahlar')
    .then(response => response.json())
    .then(guzergahlar => {
      if (guzergahlar.length === 0) {
        console.log('Veri bulunamadı!');
        return;
      }

      
      const filterForm = document.getElementById('filterForm');
      filterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        renderGraph(filterForm, 'guzergahGrafik', guzergahlar, 'myChart');
      });

      
      addGraphButton.addEventListener('click', () => {
        const newCanvas = document.createElement('canvas');
        const newForm = document.createElement('form');
        const formIndex = document.querySelectorAll('.graph-container canvas').length + 1;

        newCanvas.id = `guzergahGrafik${formIndex}`;
        newCanvas.style.display = 'block';
        graphContainer.appendChild(newCanvas);

        newForm.id = `filterForm${formIndex}`;
        newForm.classList.add('form-container'); 
        newForm.innerHTML = `
          <div class="form-row">
            <label for="year${formIndex}">Yıl:</label>
            <select id="year${formIndex}" name="year">
              ${yearSelect.innerHTML}
            </select>
            <label for="month${formIndex}">Ay:</label>
            <select id="month${formIndex}" name="month">
              <option value="">Tümü</option>
              ${monthSelect.innerHTML}
            </select>
          </div>
          <button type="submit">Filtrele</button>
        `;

        
        filterContainer.appendChild(newForm);

        
        newForm.addEventListener('submit', (e) => {
          e.preventDefault();
          renderGraph(newForm, newCanvas.id, guzergahlar, `myChart${formIndex}`);

          
          const totalCharts = document.querySelectorAll('.graph-container canvas').length;
          if (totalCharts > 1) {
            compareButton.style.display = 'block';
          }
        });
      });

      
      compareButton.addEventListener('click', () => {
        compareAllGraphs(guzergahlar);
      });
    })
    .catch(error => {
      console.error('Güzergah verisi çekme hatası:', error);
    });
});


function renderGraph(form, canvasId, guzergahlar, chartVarName) {
  const year = form.querySelector('select[name="year"]').value;
  const month = form.querySelector('select[name="month"]').value;

  const guzergahAdlari = [];
  const dolulukOranlari = [];

  guzergahlar.forEach(guzergah => {
    let apiUrl = `http://localhost:3000/api/doluluk-oranlari/${guzergah.id}/${year}`;
    if (month) {
      apiUrl += `/${month}`;
    }

    fetch(apiUrl)
      .then(response => response.json())
      .then(data => {
        if (data.length === 0) return;

        const dolulukOrani = data.reduce((acc, item) => acc + item.doluluk_orani, 0) / data.length;
        guzergahAdlari.push(guzergah.guzergah_adi);
        dolulukOranlari.push(dolulukOrani);

        const ctx = document.getElementById(canvasId).getContext('2d');
        if (window[chartVarName]) {
          window[chartVarName].destroy();
        }

        window[chartVarName] = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: guzergahAdlari,
            datasets: [{
              data: dolulukOranlari,
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
              borderWidth: 1
            }]
          },
          options: {
            responsive: false,
            plugins: {
              legend: {
                position: 'top',
              },
              tooltip: {
                callbacks: {
                  label: function(tooltipItem) {
                    return tooltipItem.label + ': ' + tooltipItem.raw.toFixed(2) + '%';
                  }
                }
              }
            }
          }
        });
      })
      .catch(error => {
        console.error('Doluluk oranı verisi çekme hatası:', error);
      });
  });
}


function compareAllGraphs(guzergahlar) {
  const allCharts = Object.keys(window)
    .filter(key => key.startsWith('myChart'))
    .map(key => window[key]);

  const guzergahAdlari = guzergahlar.map(g => g.guzergah_adi);
  const comparisonResultsArray = guzergahAdlari.map((guzergahAdi, index) => {
    const values = allCharts.map(chart => chart.data.datasets[0].data[index] || 0);

    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const averageValue = (values.reduce((acc, val) => acc + val, 0) / values.length).toFixed(2);
    const difference = (maxValue - minValue).toFixed(2);

    const valuesList = values
      .map((value, idx) => `Grafik ${idx + 1}: ${value}%`)
      .join('<br>');

    return `
      <tr>
        <td>${guzergahAdi}</td>
        <td>${valuesList}</td>
        <td>${minValue}%</td>
        <td>${maxValue}%</td>
        <td>${averageValue}%</td>
        <td>${difference}%</td>
      </tr>
    `;
  });

  comparisonResults.style.display = 'block';
  comparisonResults.style.marginTop = '10px';
  comparisonResults.style.textAlign = 'left';

  
  comparisonResults.innerHTML = `
    <table border="1" cellpadding="5" cellspacing="0" style="width: 100%; margin-top: 20px; border-collapse: collapse;">
      <thead>
        <tr>
          <th>Güzergah</th>
          <th>Tüm Doluluk Oranları</th>
          <th>Min Doluluk Oranı</th>
          <th>Max Doluluk Oranı</th>
          <th>Ortalama Doluluk Oranı</th>
          <th>Fark (Max - Min)</th>
        </tr>
      </thead>
      <tbody>
        ${comparisonResultsArray.join('')}
      </tbody>
    </table>
  `;
}

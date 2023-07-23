// Membuat variabel untuk menyimpan referensi ke peta
var map = L.map('map');

// Menambahkan tile layer OpenStreetMap ke peta
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://carto.com/attributions">CartoDB</a>'
}).addTo(map);
// Menambahkan layer untuk data cafe.geojson
var cafeLayer = L.geoJSON();

// Memuat data cafe.geojson menggunakan AJAX
fetch('data/cafe.geojson')
  .then(response => response.json())
  .then(data => {
    // Menambahkan data cafe.geojson ke layer cafeLayer
    cafeLayer.addData(data);

    // Mengatur clustering pada layer cafeLayer menggunakan Leaflet.markercluster
    var markers = L.markerClusterGroup({
      zIndexOffset: 100 // Sesuaikan nilai ini sesuai dengan kebutuhan
    });

    markers.addLayers(cafeLayer.getLayers());

    // Menambahkan layer cafeLayer dengan clustering ke peta
    map.addLayer(markers);

    // Mengatur pop-up informasi untuk setiap titik geojson
    cafeLayer.eachLayer(function (layer) {
      var popupContent = '<b>Nama Cafe:</b> ' + layer.feature.properties.title + '<br>' +
        '<b>Skor:</b> ' + layer.feature.properties.totalScore + '<br>' +
        '<b>Jumlah Review:</b> ' + layer.feature.properties.reviewsCou + '<br>';

      if (layer.feature.properties.website) {
        popupContent += '<b>Website:</b> <a href="' + layer.feature.properties.website + '" target="_blank">Visit Website</a><br>';
      }

      if (layer.feature.properties.url) {
        popupContent += '<b>Maps:</b> <a href="' + layer.feature.properties.url + '" target="_blank">Go to maps</a><br>';
      }

      layer.bindPopup(popupContent);
    });

    // Mengatur peta agar langsung difokuskan ke layer cafeLayer
    map.fitBounds(cafeLayer.getBounds()); // SetView otomatis disetel berdasarkan cafeLayer

  })
  .catch(error => {
    console.error('Error loading cafe.geojson:', error);
  });

fetch('data/uni_buffer_2km_gcs.geojson')
  .then(response => response.json())
  .then(data => {
    // Fungsi untuk mengubah warna saat kursor bergerak melewati fitur
    function highlightFeature(e) {
      var layer = e.target;
      layer.setStyle({
        fillOpacity: 0.3, // Warna berubah saat kursor bergerak melewati
      });
    }

    // Fungsi untuk mengembalikan warna semula saat kursor keluar dari fitur
    function resetHighlight(e) {
      var layer = e.target;
      layer.setStyle({
        fillOpacity: 0, // Mengembalikan ke hollow saat kursor keluar
      });
    }

    // Fungsi untuk mengatur interaksi hover pada setiap fitur (layer) individu
    function onEachFeature(feature, layer) {
      layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight
      });
    }

    // Buat layer dari data polygon dengan simbologi yang diinginkan dan atur interaksi hover
    var bufferLayer = L.geoJSON(data, {
      style: function (feature) {
        return {
          fillColor: 'blue', // Warna biru muda
          fillOpacity: 0.1, // Set fillOpacity 0 untuk membuat berlubang (hollow)
          color: 'blue', // Warna garis
          weight: 2 // Ketebalan garis
        };
      },
      onEachFeature: onEachFeature // Atur interaksi hover pada setiap fitur
    }).addTo(map);

    // Perbarui batas peta berdasarkan data polygon
    map.fitBounds(bufferLayer.getBounds());
  })
  .catch(error => {
    console.error('Error loading uni_buffer_2km_gcs.geojson:', error);
  });

// Muat data uni_point.geojson menggunakan AJAX
fetch('data/uni_point.geojson')
  .then(response => response.json())
  .then(data => {
    // Buat layer untuk data titik menggunakan simbol marker merah
    var pointLayer = L.geoJSON(data, {
      pointToLayer: function (feature, latlng) {
        // Membuat marker pada setiap titik dengan ikon bawaan Leaflet berwarna merah
        return L.marker(latlng, {
          icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          })
        });
      },
      onEachFeature: function (feature, layer) {
        // Mengatur popup untuk setiap titik dengan informasi dari atributnya
        var popupContent = '<b>Nama:</b> ' + feature.properties.Nama + '<br>';

        layer.bindPopup(popupContent);
      }
    }).addTo(map);

    // Perbarui batas peta berdasarkan data titik
    map.fitBounds(pointLayer.getBounds());
  })
  .catch(error => {
    console.error('Error loading uni_point.geojson:', error);
  });

// Muat data cafe.geojson menggunakan AJAX
fetch('data/cafe.geojson')
  .then(response => response.json())
  .then(data => {
    // Urutkan data berdasarkan jumlah review (reviewsCou) secara descending
    data.features.sort((a, b) => b.properties.reviewsCou - a.properties.reviewsCou);

    // Membuat tabel berisi informasi dari cafe.geojson
    var cafeTableBody = document.querySelector('#cafeTable tbody');

    data.features.forEach(function (feature) {
      var cafeInfo = feature.properties;
      var row = document.createElement('tr');
      row.innerHTML = `
        <td>${cafeInfo.title}</td>
        <td>${cafeInfo.totalScore}</td>
        <td>${cafeInfo.reviewsCou}</td>
        <td>${cafeInfo.website ? `<a href="${cafeInfo.website}" target="_blank">Visit Website</a>` : '-'}</td>
        <td>${cafeInfo.url ? `<a href="${cafeInfo.url}" target="_blank">Go to maps</a>` : '-'}</td>
      `;
      cafeTableBody.appendChild(row);
    });
  })
  .catch(error => {
    console.error('Error loading cafe.geojson:', error);
  });


var tableContainer = document.querySelector('.table-container');
var toggleTableBtn = document.getElementById('toggleTableBtn');
var isTableExpanded = false;

toggleTableBtn.addEventListener('click', function () {
  if (!isTableExpanded) {
    tableContainer.style.display = 'block';
    tableContainer.classList.add('expanded');
    toggleTableBtn.textContent = 'Collapse Table';
    isTableExpanded = true;
  } else {
    tableContainer.style.display = 'none';
    tableContainer.classList.remove('expanded');
    toggleTableBtn.textContent = 'Expand Table';
    isTableExpanded = false;
  }
});

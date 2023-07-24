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

    // Tambahkan event listener setelah data cafe.geojson selesai dimuat
    var cafeRows = document.querySelectorAll('#cafeTable tbody tr');
    cafeRows.forEach(function (row, index) {
      row.addEventListener('click', function () {
        zoomToFeatureOnMap(index);
      });
    });
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

// ... Kode sebelumnya ...

// Deklarasi variabel untuk menyimpan status visibility tabel
var isTableVisible = false;

// Fungsi untuk menyaring data berdasarkan nama cafe
var searchInput = document.getElementById('searchCafeInput');
searchInput.addEventListener('input', function () {
  filterCafeTable(this.value.trim());
});

function filterCafeTable(keyword) {
  var cafeRows = document.querySelectorAll('#cafeTable tbody tr');
  keyword = keyword.toLowerCase();

  cafeRows.forEach(function (row) {
    var cafeName = row.querySelector('td:first-child').textContent.toLowerCase();
    if (cafeName.includes(keyword)) {
      row.style.display = 'table-row';
    } else {
      row.style.display = 'none';
    }
  });
}

// Fungsi untuk menyaring fitur berdasarkan extent peta
function filterFeaturesByExtent() {
  var visibleFeatures = [];

  // Dapatkan extent peta saat ini
  var mapBounds = map.getBounds();

  // Saring fitur dari layer cafeLayer yang berada dalam extent peta saat ini
  cafeLayer.eachLayer(function (layer) {
    var latLng = layer.getLatLng();
    if (mapBounds.contains(latLng)) {
      visibleFeatures.push(layer);
    }
  });

  return visibleFeatures;
}

// Tampilkan fitur berdasarkan extent peta saat ini
function updateTable() {
  var cafeTableBody = document.querySelector('#cafeTable tbody');
  cafeTableBody.innerHTML = ''; // Bersihkan tabel sebelum mengisi kembali

  var visibleFeatures = filterFeaturesByExtent();

  // Urutkan data berdasarkan jumlah review (reviewsCou) secara descending
  visibleFeatures.sort((a, b) => b.feature.properties.reviewsCou - a.feature.properties.reviewsCou);

  visibleFeatures.forEach(function (layer) {
    var cafeInfo = layer.feature.properties;
    var row = document.createElement('tr');
    row.innerHTML = `
      <td>${cafeInfo.title}</td>
      <td>${cafeInfo.totalScore}</td>
      <td>${cafeInfo.reviewsCou}</td>
      <td>${cafeInfo.website ? `<a href="${cafeInfo.website}" target="_blank">Visit Website</a>` : '-'}</td>
      <td>${cafeInfo.url ? `<a href="${cafeInfo.url}" target="_blank">Go to maps</a>` : '-'}</td>
    `;
    cafeTableBody.appendChild(row);

    row.addEventListener('click', function () {
      zoomToFeatureOnMap(cafeInfo.title);
    });

    // Menambahkan event listener untuk efek hover pada baris tabel
    row.addEventListener('mouseenter', function () {
      layer.setStyle({
        fillOpacity: 0.3, // Warna berubah saat kursor berada di atas baris tabel
      });
    });

    row.addEventListener('mouseleave', function () {
      layer.setStyle({
        fillOpacity: 0, // Mengembalikan ke hollow saat kursor keluar dari baris tabel
      });
    });
  });
}

// Panggil fungsi updateTable saat peta bergerak atau memuat ulang
map.on('moveend', function () {
  updateTable();
});

// Fungsi untuk menampilkan fitur pada peta berdasarkan nama cafe
function zoomToFeatureOnMap(cafeName) {
  var targetLayer = null;

  // Cari fitur (titik cafe) dengan nama yang sesuai di layer cafeLayer
  cafeLayer.eachLayer(function (layer) {
    if (layer.feature.properties.title === cafeName) {
      targetLayer = layer;
      return;
    }
  });

  // Jika fitur ditemukan, arahkan peta ke fitur tersebut
  if (targetLayer) {
    map.setView(targetLayer.getLatLng(), 18); // 18 adalah level zoom yang sesuai, sesuaikan sesuai kebutuhan
    targetLayer.openPopup(); // Buka popup informasi pada fitur yang dipilih
  }
}

// Tambahkan event listener pada tombol "X" untuk keluar dari tabel
var closeTableBtn = document.getElementById('closeTableBtn');
closeTableBtn.addEventListener('click', function () {
  var tableContainer = document.querySelector('.table-container');
  tableContainer.style.display = 'none';
  tableContainer.classList.remove('expanded');
  toggleTableVisibilityBtn.textContent = 'Show Table';
  isTableVisible = false;
});

// Tambahkan event listener untuk toggle visibility tabel
var toggleTableVisibilityBtn = document.getElementById('toggleTableVisibilityBtn');
toggleTableVisibilityBtn.addEventListener('click', function () {
  var tableContainer = document.querySelector('.table-container');
  if (!isTableVisible) {
    tableContainer.style.display = 'block';
    tableContainer.classList.add('expanded');
    toggleTableVisibilityBtn.textContent = 'Hide Table';
    isTableVisible = true;
  } else {
    tableContainer.style.display = 'none';
    tableContainer.classList.remove('expanded');
    toggleTableVisibilityBtn.textContent = 'Show Table';
    isTableVisible = false;
  }
});

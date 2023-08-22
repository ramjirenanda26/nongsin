// Membuat variabel untuk menyimpan referensi ke peta
var map = L.map('map');

// Menambahkan tile layer OpenStreetMap ke peta
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://carto.com/attributions">CartoDB</a>',
}).addTo(map);

// Menambahkan layer untuk data clean_cafe.geojson
var cafeLayer = L.geoJSON();

// Memuat data clean_cafe.geojson menggunakan AJAX
// Memuat data clean_cafe.geojson menggunakan AJAX
fetch('data/clean_cafe.geojson')
  .then((response) => response.json())
  .then((data) => {
    // Menambahkan data clean_cafe.geojson ke layer cafeLayer
    cafeLayer.addData(data);

    // Mengatur clustering pada layer cafeLayer menggunakan Leaflet.markercluster
    var markers = L.markerClusterGroup({
      zIndexOffset: 100,
    });

    cafeLayer.eachLayer(function (layer) {
      var redMarker = L.AwesomeMarkers.icon({
        icon: 'mug-hot',
        markerColor: 'cadetblue',
        stylePrefix: 'fa',
        prefix: 'fa',
      });

      layer.setIcon(redMarker);
      markers.addLayer(layer);
    });

    markers.addLayers(cafeLayer.getLayers());

    // Menambahkan layer cafeLayer dengan clustering ke peta
    map.addLayer(markers);

    // Mengatur pop-up informasi untuk setiap titik geojson
    cafeLayer.eachLayer(function (layer) {
      // Mendapatkan nilai skor dan menghitung nilai yang dibagi 10
      var originalScore = layer.feature.properties.totalScore;
      var dividedScore = originalScore > 5 ? originalScore / 10 : originalScore;

      function generateStarRating(score, starColor) {
        var fullStars = Math.floor(score);
        var halfStar = score - fullStars >= 0.5 ? 1 : 0;
        var emptyStars = 5 - fullStars - halfStar;

        var starHtml = '';
        for (var i = 0; i < fullStars; i++) {
          starHtml += `<i class="fas fa-star" style="color: ${starColor};"></i>`;
        }
        if (halfStar) {
          starHtml += `<i class="fas fa-star-half-alt" style="color: ${starColor};"></i>`;
        }
        for (var j = 0; j < emptyStars; j++) {
          starHtml += `<i class="far fa-star" style="color: ${starColor};"></i>`;
        }

        return starHtml;
      }

      function openGoogleMaps(url) {
        window.open(url, '_blank');
      }

      // Membuat konten popup dengan kustomisasi, termasuk nilai yang telah dihitung
      var starRating = generateStarRating(dividedScore, 'orange');

      var popupContent = `
      <div class="custom-popup" style="font-family: 'Poppins'">
        <h1 class="popup-title"><b>${layer.feature.properties.title}</b></h1>
        <hr>
        <div class="button-container">
        <a href="${layer.feature.properties.url}" target="_blank" class="popup-button">
          <img src="dist/images/gmaps.png" alt="Google Maps" class="button-icon">
          <b>Google Maps</b>
        </a>
      </div>
        <p class="popup-text"><b>Rating:</b> ${starRating}</p>
        <p class="popup-text"><b>Jumlah Review:</b> ${layer.feature.properties.reviewsCount}</p>
        <p class="popup-text"><b>Website:</b> ${layer.feature.properties.website !== null ? `<a href="${layer.feature.properties.website}" target="_blank">Visit Website</a>` : '-'}</p>
      </div>
    `;

      // Menambahkan konten popup ke layer
      layer.bindPopup(popupContent, {
        closeButton: true, // Menampilkan tombol close
      });

      // Mengatur gaya popup dengan CSS (seperti sebelumnya)
      var customPopupStyle = `
      .custom-popup {
        max-width: 200px;
        padding: 10px;
        text-align: center;
      }
      .popup-title {
        font-size: 18px;
        margin: 0;
      }
      .popup-text {
        font-size: 14px;
        margin: 5px 0;
      }
      .button-container {
        margin-top: 10px;
      }
      .popup-button {
        display: inline-block;
        padding: 5px 10px;
        background-color: #ffffff;
        color: #fff;
        border: none;
        cursor: pointer;
        text-decoration: none; /* Tambahkan ini agar tautan terlihat seperti tombol */
        border-radius: 10px;
      }
      .popup-button:hover {
        background-color: #91C8E4;
      }
      .button-icon {
        vertical-align: middle;
        height: 20px;
        margin-right: 5px;
      }
      `;

      // Menerapkan gaya popup pada peta
      var customPopupStyleElement = document.createElement('style');
      customPopupStyleElement.appendChild(document.createTextNode(customPopupStyle));
      document.head.appendChild(customPopupStyleElement);
    });

    // Mengatur peta agar langsung difokuskan ke layer cafeLayer
    map.fitBounds(cafeLayer.getBounds());

    // Tambahkan event listener setelah data clean_cafe.geojson selesai dimuat
    var cafeRows = document.querySelectorAll('#cafeTable tbody tr');
    cafeRows.forEach(function (row, index) {
      row.addEventListener('click', function () {
        zoomToFeatureOnMap(index);
      });
    });

    // Panggil fungsi updateTable();
    updateTable();
  })
  .catch((error) => {
    console.error('Error loading clean_cafe.geojson:', error);
  });


fetch('data/uni_buffer_2km_gcs.geojson')
  .then((response) => response.json())
  .then((data) => {
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
        mouseout: resetHighlight,
      });
    }

    // Buat layer dari data polygon dengan simbologi yang diinginkan dan atur interaksi hover
    var bufferLayer = L.geoJSON(data, {
      style: function (feature) {
        return {
          fillColor: 'blue', // Warna biru muda
          fillOpacity: 0.1, // Set fillOpacity 0 untuk membuat berlubang (hollow)
          color: 'blue', // Warna garis
          weight: 2, // Ketebalan garis
        };
      },
      onEachFeature: onEachFeature, // Atur interaksi hover pada setiap fitur
    }).addTo(map);

    // Perbarui batas peta berdasarkan data polygon
    map.fitBounds(bufferLayer.getBounds());

    var uniRows = document.querySelectorAll('#cafeTable tbody tr');
    uniRows.forEach(function (row, index) {
      row.addEventListener('click', function () {
        zoomToFeatureOnMap(index);
      });
    });
  })
  .catch((error) => {
    console.error('Error loading uni_buffer_2km_gcs.geojson:', error);
  });

// Setelah Anda memuat data GeoJSON universitas
fetch('data/uni_point.geojson')
  .then((response) => response.json())
  .then((data) => {
    var pointLayer = L.geoJSON(data, {
      pointToLayer: function (feature, latlng) {
        // Membuat marker pada setiap titik dengan ikon bawaan Leaflet berwarna merah
        return L.marker(latlng, {
          icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          }),
        });
      },
      onEachFeature: function (feature, layer) {
        // Mengatur popup untuk setiap titik dengan informasi dari atributnya
        var popupContent = '<b>Nama:</b> ' + feature.properties.Nama + '<br>';

        layer.bindPopup(popupContent);
      },
    }).addTo(map);
    var universityListSidebar = document.getElementById("universityListSidebar");

    // Loop melalui fitur universitas dan tambahkan opsi ke dalam dropdown
    data.features.forEach(function (feature) {
      var universityName = feature.properties.Nama; // Sesuaikan dengan atribut yang sesuai
      var listItem = document.createElement("li");
      var link = document.createElement("a");
      link.href = "#";
      link.textContent = universityName;

      link.addEventListener("click", function () {
        // Fungsi untuk melakukan zoom pada peta ke lokasi universitas
        zoomToUniversity(feature.geometry.coordinates);
      });

      listItem.appendChild(link);
      universityListSidebar.appendChild(listItem);
    });
  })
  .catch((error) => {
    console.error('Error loading uni_point.geojson:', error);
  });

function zoomToUniversity(coordinates) {
  map.setView([coordinates[1], coordinates[0]], 18); // 18 adalah level zoom yang sesuai, sesuaikan sesuai kebutuhan
}
// Fungsi untuk menyaring data berdasarkan nama cafe
var searchInput = document.getElementById('searchCafeInput');
searchInput.addEventListener('input', function () {
  filterCafeTable(this.value.trim());
});

function filterCafeTable(keyword) {
  var uniRows = document.querySelectorAll('#cafeTable tbody tr');
  keyword = keyword.toLowerCase();

  uniRows.forEach(function (row) {
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

// Dapatkan elemen tombol dan sidebar
var toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
var sidebar = document.getElementById('sidebar');

// Fungsi untuk menyesuaikan posisi tombol
function adjustToggleBtnPosition() {
  var sidebarWidth = sidebar.offsetWidth;
  var toggleBtnWidth = toggleSidebarBtn.offsetWidth;
  var expandedPosition = sidebarWidth + 10; // Sesuaikan nilai ini jika diperlukan
  var collapsedPosition = 10; // Sesuaikan nilai ini jika diperlukan

  if (sidebar.classList.contains('visible')) {
    toggleSidebarBtn.style.left = expandedPosition + 'px';
  } else {
    toggleSidebarBtn.style.left = collapsedPosition + 'px';
  }
}

// Panggil fungsi untuk pertama kali dan saat jendela diubah ukurannya
adjustToggleBtnPosition();
window.addEventListener('resize', adjustToggleBtnPosition);

// Fungsi untuk menangani klik pada tombol toggle
toggleSidebarBtn.addEventListener('click', function () {
  if (sidebar.classList.contains('visible')) {
    sidebar.classList.remove('visible');
  } else {
    sidebar.classList.add('visible');
  }

  // Panggil kembali fungsi untuk menyesuaikan posisi tombol
  adjustToggleBtnPosition();
});

function updateTable() {
  var cafeTableBody = document.querySelector('#cafeTable tbody');
  cafeTableBody.innerHTML = ''; // Bersihkan tabel sebelum mengisi kembali

  var visibleFeatures = filterFeaturesByExtent();

  // Urutkan data berdasarkan jumlah review (reviewsCount) secara descending
  visibleFeatures.sort((a, b) => b.feature.properties.reviewsCount - a.feature.properties.reviewsCount);

  visibleFeatures.forEach(function (layer) {
    var cafeInfo = layer.feature.properties;
    var row = document.createElement('tr');
    row.innerHTML = `
      <td>${cafeInfo.title}</td>
    `;

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

    row.addEventListener('click', function () {
      zoomToFeatureOnMap(cafeInfo.title);
    });

    cafeTableBody.appendChild(row);
  });
}

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

// Panggil fungsi updateTable saat peta bergerak atau memuat ulang
map.on('moveend', function () {
  updateTable();
});



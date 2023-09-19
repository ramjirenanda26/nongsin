// Membuat variabel untuk menyimpan referensi ke peta
var map = L.map('map');

// Menambahkan tile layer OpenStreetMap ke peta
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://carto.com/attributions">CartoDB</a>',
}).addTo(map);

// Menambahkan layer untuk data clean_cafe3.geojson
var cafeLayer = L.geoJSON();

// Geoloc
var locateControl = L.control
  .locate({
    position: 'bottomright',
    drawCircle: true,
    follow: true,
    setView: true,
    keepCurrentZoomLevel: false,
    markerStyle: {
      weight: 1,
      opacity: 0.8,
      fillOpacity: 0.8,
    },
    circleStyle: {
      weight: 1,
      clickable: false,
    },
    icon: 'fas fa-crosshairs',
    metric: true,
    strings: {
      title: 'Click for Your Location',
      popup: "You're here. Accuracy {distance} {unit}",
      outsideMapBoundsMsg: 'Not available',
    },
    locateOptions: {
      maxZoom: 16,
      watch: true,
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 10000,
    },
  })
  .addTo(map);

// Pagination
var itemsPerPage = 10;
var heatmapLayer, markers;

// Inisialisasi markers di luar .then()
var markers = L.markerClusterGroup({
  zIndexOffset: 250,
  disableClusteringAtZoom: 17,
});

// Inisialisasi heatmapLayer di luar .then()
var heatmapLayer = L.heatLayer([], {
  radius: 25, // Ukuran radius
  blur: 15, // Tingkat blur
  maxZoom: 15, // Aktifkan heatmap saat zoom < 16
});

// Memuat data clean_cafe3.geojson menggunakan AJAX
fetch('data/clean_cafe3.geojson')
  .then((response) => response.json())
  .then((data) => {
    // Menambahkan data cafe_v2.geojson ke layer cafeLayer
    cafeLayer.addData(data);

    // Tambahkan data ke heatmapLayer
    data.features.forEach(function (feature) {
      var coordinates = feature.geometry.coordinates;
      heatmapLayer.addLatLng([coordinates[1], coordinates[0]]);
    });

    var sidebar = document.getElementById('sidebar');
    // Fungsi untuk menambahkan marker layer
    function addMarkerLayer() {
      // Dapatkan tingkat zoom saat ini
      var currentZoom = map.getZoom();

      // Periksa apakah tingkat zoom memenuhi syarat
      if (currentZoom >= 16) {
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
        sidebar.classList.remove('visible');
        adjustToggleBtnPosition();
      }
    }

    // Fungsi untuk menambahkan heatmap layer
    function addHeatmapLayer() {
      map.addLayer(heatmapLayer);
    }

    // Mengatur pop-up informasi untuk setiap titik geojson
    cafeLayer.eachLayer(function (layer) {
      // Mendapatkan nilai skor dan menghitung nilai yang dibagi 10
      var originalScore = layer.feature.properties.totalScore;

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
      var starRating = generateStarRating(originalScore, 'orange');
      var starRating = generateStarRating(originalScore, 'orange');

      var popupContent = `
        <div class="custom-popup">
          <h1 class="popup-title">Nama Cafe:</h1>
          <h2 class="popup-text">${layer.feature.properties.title}</h2>
          <hr>
          <div class="button-container">
            <a href="${layer.feature.properties.url}" target="_blank" class="popup-button">
              <img src="dist/images/gmaps.png" alt="Google Maps" class="button-icon">
              Google Maps
            </a>
          </div>
          <p class="popup-text"><b>Rating:</b> ${starRating}</p>
          <p class="popup-text"><b>Jumlah Review:</b> ${layer.feature.properties.reviewsCount}</p>
          <p class="popup-text"><b>Website:</b> 
          ${layer.feature.properties.website !== null ? `<a href="${layer.feature.properties.website}" target="_blank">Visit Website</a>` : '-'}
          </p>
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

    // Tambahkan event listener setelah data clean_cafe3.geojson selesai dimuat
    var cafeRows = document.querySelectorAll('#cafeTable tbody tr');
    cafeRows.forEach(function (row, index) {
      row.addEventListener('click', function () {
        zoomToFeatureOnMap(index);
      });
    });

    // Panggil fungsi addHeatmapLayer saat pertama kali data dimuat
    addHeatmapLayer();

    // Panggil fungsi addMarkerLayer saat pertama kali data dimuat
    addMarkerLayer();

    // Panggil fungsi updateTable();
    updateTable();

    // Panggil fungsi addMarkerLayer atau addHeatmapLayer saat peta bergerak
    map.on('moveend', function () {
      var currentZoom = map.getZoom();
      if (currentZoom < 16) {
        addHeatmapLayer();
        map.removeLayer(markers); // Hapus layer marker jika zoom kurang dari 16
      } else {
        map.removeLayer(heatmapLayer);
        addMarkerLayer(); // Tambahkan layer marker jika zoom mencapai 16 atau lebih
      }
    });
  })
  .catch((error) => {
    console.error('Error loading clean_cafe3.geojson:', error);
  });

// Setelah Anda memuat data GeoJSON universitas
fetch('data/kampus_jogja.geojson')
  .then((response) => response.json())
  .then((data) => {
    var pointLayer = L.geoJSON(data, {
      pointToLayer: function (feature, latlng) {
        return L.marker(latlng, {
          icon: L.AwesomeMarkers.icon({
            icon: 'school', // Icon name from Font Awesome (e.g., "coffee" for coffee cup)
            markerColor: 'red',
            prefix: 'fa',
          }),
        });
      },
      onEachFeature: function (feature, layer) {
        // Mengatur popup untuk setiap titik dengan informasi dari atributnya
        var popupContent = '<b>Nama:</b> ' + feature.properties.name + '<br>';

        layer.bindPopup(popupContent);
      },
    }).addTo(map);
    var universityListSidebar = document.getElementById('universityListSidebar');

    data.features.forEach(function (feature) {
      var universityName = feature.properties.name; // Update with the appropriate attribute
      var listItem = document.createElement('li');
      var link = document.createElement('a');
      link.href = '#';
      link.textContent = universityName;

      link.addEventListener('click', function () {
        // Zoom to the university location
        zoomToUniversity(feature.geometry.coordinates);

        // Highlight the selected university in the list
        var allLinks = universityListSidebar.querySelectorAll('a');
        allLinks.forEach(function (item) {
          item.classList.remove('selected');
        });
        link.classList.add('selected');

        // Close the sidebar
        sidebar.classList.remove('visible');
        adjustToggleBtnPosition();

        pointLayer.eachLayer(function (layer) {
          if (layer.feature.properties.name === link.textContent) {
            layer.openPopup();
          }
        });
      });

      listItem.appendChild(link);
      universityListSidebar.appendChild(listItem);
    });

    // Add a class to the dropdown list container
    universityListSidebar.classList.add('dropdown-list');
  })
  .catch((error) => {
    console.error('Error loading kampus_jogja.geojson:', error);
  });

function zoomToUniversity(coordinates) {
  map.setView([coordinates[1], coordinates[0]], 16); // 18 adalah level zoom yang sesuai, sesuaikan sesuai kebutuhan
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

function adjustToggleBtnPosition() {
  var sidebarWidth = sidebar.offsetWidth;
  var toggleBtnWidth = toggleSidebarBtn.offsetWidth;
  var expandedPosition = sidebarWidth + 10; // Adjust as needed
  var collapsedPosition = 10; // Adjust as needed

  if (sidebar.classList.contains('visible')) {
    toggleSidebarBtn.style.left = expandedPosition + 'px';
  } else {
    toggleSidebarBtn.style.left = collapsedPosition + 'px';
  }
}

function adjustToggleBtnPosition() {
  var sidebarWidth = sidebar.offsetWidth;
  var toggleBtnWidth = toggleSidebarBtn.offsetWidth;
  var expandedPosition = sidebarWidth + 10; // Adjust as needed
  var collapsedPosition = 10; // Adjust as needed

  if (sidebar.classList.contains('visible')) {
    toggleSidebarBtn.style.left = expandedPosition + 'px';
  } else {
    toggleSidebarBtn.style.left = collapsedPosition + 'px';
  }
}

// Fungsi untuk menyesuaikan posisi tombol
document.addEventListener('DOMContentLoaded', function () {
  var toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
  var toggleIcon = document.getElementById('toggleIcon');

  toggleSidebarBtn.addEventListener('click', function () {
    // Toggle the icon class between 'fa-chevron-right' and 'fa-chevron-left'
    toggleIcon.classList.toggle('fa-chevron-right');
    toggleIcon.classList.toggle('fa-chevron-left');

    // Toggle the 'visible' class on the sidebar
    sidebar.classList.toggle('visible');

    // Call the adjustToggleBtnPosition function to adjust the button position
    adjustToggleBtnPosition();
  });

  // Call adjustToggleBtnPosition initially and on window resize
  adjustToggleBtnPosition();
  window.addEventListener('resize', adjustToggleBtnPosition);
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
    var starIcon = '<i class="fas fa-star yellow-star"></i>'; // Ikon bintang Font Awesome

    var score = cafeInfo.totalScore; // Menghitung skor yang dibagi dengan 10
    var score = cafeInfo.totalScore; // Menghitung skor yang dibagi dengan 10

    row.innerHTML = `
      <td>${cafeInfo.title}</td>
      <td>${score.toFixed(1)} ${starIcon}</td>
      <td>${
        cafeInfo.url
          ? `<a class="text" href="${layer.feature.properties.url}" target="_blank" class="popup-button">
      <img src="dist/images/gmaps.png" alt="Google Maps" class="button-icon">
      Google Maps
    </a>`
          : '-'
      }</td>`;

    // Menambahkan event listener untuk efek hover pada baris tabel
    row.addEventListener('mouseenter', function () {
      layer.setStyle({
        fillOpacity: 0.3,
      });
    });

    row.addEventListener('mouseleave', function () {
      layer.setStyle({
        fillOpacity: 0,
      });
    });

    row.addEventListener('click', function () {
      zoomToFeatureOnMap(cafeInfo.title);
    });

    cafeTableBody.appendChild(row);
  });
}

var cafes = [
  { name: 'Renan', cafe: 'Lavana Coffee', ig: 'ramjirenanda.s', location: 'https://goo.gl/maps/ZDavCvUQ4LnBAQ748' },
  { name: 'Michelle', cafe: 'Svarga Flora Coffee & Plants', ig: 'mchllhans', location: 'https://goo.gl/maps/M7Bed1BAoy38sU849' },
  { name: 'Zani', cafe: 'SiNERGI Co Working Space & Network Space', ig: 'raidanazn', location: 'https://goo.gl/maps/jDonfpVbrrVuMhRq8' },
  { name: 'Raga', cafe: 'Shelterby.canopeecoffee', ig: 'ragaharits', location: 'https://goo.gl/maps/Me6Vqm8zgVsYqEiW8' },
  { name: 'Wisnu', cafe: 'Kopi Lumus', ig: 'yowisnu_', location: 'https://goo.gl/maps/zufek1rc4bqVU1gC8' },
  { name: 'Zaidan', cafe: 'Angkringan Kebun', ig: 'zaidanalghifarif', location: 'https://goo.gl/maps/EhffGJvHzh1QbdWe9' },
  { name: 'Galuh', cafe: 'ARAH Coffee Pandawa', ig: 'galuhazzahrac', location: 'https://goo.gl/maps/PVKUauBAo5w4eQWV8' },
  { name: 'Palsum', cafe: 'Sebelas Coffee Sapen', ig: 'naufalkusumap', location: 'https://goo.gl/maps/MYVyhgQLoyYuwHGE6' },
  { name: 'Yellove', cafe: 'Silol Kopi & Eatery', ig: 'yellove_devitaraja', location: 'https://goo.gl/maps/9eqQtTTbX9D3kXVG7' },
  { name: 'Tolo', cafe: 'Opposite coffee', ig: 'son.tolo.yo', location: 'https://goo.gl/maps/imhmMZjfhABmU2w19' },
  { name: 'Raga', cafe: 'Shelterby.canopeecoffee', ig: 'ragaharits', location: 'https://goo.gl/maps/Me6Vqm8zgVsYqEiW8' },
  { name: 'Wisnu', cafe: 'Kopi Lumus', ig: 'yowisnu_', location: 'https://goo.gl/maps/zufek1rc4bqVU1gC8' },
  { name: 'Zaidan', cafe: 'Angkringan Kebun', ig: 'zaidanalghifarif', location: 'https://goo.gl/maps/EhffGJvHzh1QbdWe9' },
  { name: 'Galuh', cafe: 'ARAH Coffee Pandawa', ig: 'galuhazzahrac', location: 'https://goo.gl/maps/PVKUauBAo5w4eQWV8' },
  { name: 'Palsum', cafe: 'Sebelas Coffee Sapen', ig: 'naufalkusumap', location: 'https://goo.gl/maps/MYVyhgQLoyYuwHGE6' },
  { name: 'Yellove', cafe: 'Silol Kopi & Eatery', ig: 'yellove_devitaraja', location: 'https://goo.gl/maps/9eqQtTTbX9D3kXVG7' },
  { name: 'Tolo', cafe: 'Opposite coffee', ig: 'son.tolo.yo', location: 'https://goo.gl/maps/imhmMZjfhABmU2w19' },
];

function loadCards() {
  var cardModalBody = document.getElementById('cardModalBody');
  cardModalBody.innerHTML = ''; // Clear previous content

  cafes.forEach(function (cafe) {
    var card = document.createElement('div');
    card.className = 'card';
    card.style.width = '20rem'; // Set width as per your template

    var cardBody = document.createElement('div');
    cardBody.className = 'card-body';

    var cardTitle = document.createElement('h4');
    cardTitle.className = 'card-title';

    // Buat tautan Instagram dengan ikon Font Awesome
    var instagramLink = document.createElement('a');
    instagramLink.href = 'https://www.instagram.com/' + cafe.ig;
    instagramLink.target = '_blank';

    var instagramIcon = document.createElement('i');
    instagramIcon.className = 'fab fa-instagram'; // Gunakan ikon Instagram dari Font Awesome

    var instagramText = document.createTextNode(' ' + cafe.name); // Tambahkan spasi sebelum nama pengguna Instagram

    // Gabungkan elemen-elemen tautan Instagram
    instagramLink.appendChild(instagramIcon);
    instagramLink.appendChild(instagramText);

    // Tambahkan tautan Instagram ke elemen judul kartu
    cardTitle.appendChild(instagramLink);

    cardModalBody.appendChild(cardTitle);

    var cardText = document.createElement('p');
    cardText.className = 'card-text';
    cardText.textContent = 'Rekomendasi Café: ' + cafe.cafe; // Menampilkan nama kafe dari JSON

    var link = document.createElement('a');
    link.className = 'btn btn-primary';
    link.href = cafe.location; // Set the href as per your template
    link.textContent = 'Go to ' + cafe.cafe;

    cardBody.appendChild(cardTitle);
    cardBody.appendChild(cardText);
    cardBody.appendChild(link);

    card.appendChild(cardBody);
    cardModalBody.appendChild(card);
  });
}

// When the "Rekomendasi Cafe dari Kami" modal is shown, call the loadCards() function
$('#cardModal').on('show.bs.modal', function (event) {
  loadCards();
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

// Panggil fungsi updateTable saat peta bergerak atau memuat ulang
map.on('moveend', function () {
  updateTable();
});

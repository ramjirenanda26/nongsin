// Membuat variabel untuk menyimpan referensi ke peta
var map = L.map('map');

// Menambahkan tile layer OpenStreetMap ke peta
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://carto.com/attributions">CartoDB</a>',
}).addTo(map);

// var locateControl = L.control
//   .locate({
//     position: 'bottomright',
//     drawCircle: true,
//     follow: true,
//     setView: true,
//     keepCurrentZoomLevel: false,
//     markerStyle: {
//       weight: 1,
//       opacity: 0.8,
//       fillOpacity: 0.8,
//     },
//     circleStyle: {
//       weight: 1,
//       clickable: false,
//     },
//     icon: 'fas fa-crosshairs',
//     metric: true,
//     strings: {
//       title: 'Click for Your Location',
//       popup: "You're here. Accuracy {distance} {unit}",
//       outsideMapBoundsMsg: 'Not available',
//     },
//     locateOptions: {
//       maxZoom: 16,
//       watch: true,
//       enableHighAccuracy: true,
//       maximumAge: 10000,
//       timeout: 10000,
//     },
//   })
//   .addTo(map);

// Menambahkan layer untuk data clean_cafe.geojson
var cafeLayer = L.geoJSON();

// Pagination
var itemsPerPage = 10;

// Memuat data cafe_v2.geojson menggunakan AJAX
fetch('data/cafe_v2.geojson')
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
    // Buat layer dari data polygon dengan simbologi yang diinginkan dan atur interaksi hover
    var bufferLayer = L.geoJSON(data, {
      style: function (feature) {
        return {
          fillColor: 'blue', // Warna biru muda
          fillOpacity: 0, // Set fillOpacity 0 untuk membuat berlubang (hollow)
          color: 'blue', // Warna garis
          weight: 0, // Ketebalan garis
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
        var popupContent = '<b>Nama:</b> ' + feature.properties.Nama + '<br>';

        layer.bindPopup(popupContent);
      },
    }).addTo(map);
    var universityListSidebar = document.getElementById('universityListSidebar');

    data.features.forEach(function (feature) {
      var universityName = feature.properties.Nama; // Update with the appropriate attribute
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
      });

      listItem.appendChild(link);
      universityListSidebar.appendChild(listItem);
    });

    // Add a class to the dropdown list container
    universityListSidebar.classList.add('dropdown-list');
  })
  .catch((error) => {
    console.error('Error loading uni_point.geojson:', error);
  });

function zoomToUniversity(coordinates) {
  map.setView([coordinates[1], coordinates[0]], 15); // 18 adalah level zoom yang sesuai, sesuaikan sesuai kebutuhan
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

    var score = cafeInfo.totalScore / 10; // Menghitung skor yang dibagi dengan 10

    row.innerHTML = `
      <td>${cafeInfo.title}</td>
      <td>${score.toFixed(1)} ${starIcon}</td>
      <td>${cafeInfo.url
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
];
function loadCards() {
  var cardModalBody = document.getElementById('cardModalBody');
  cardModalBody.innerHTML = ''; // Clear previous content

  cafes.forEach(function (cafe) {
    var card = document.createElement('div');
    card.className = 'card';
    var cardBody = document.createElement('div');
    cardBody.className = 'card-body';
    var cardTitle = document.createElement('h5');
    cardTitle.className = 'card-title';

    var instagramLink = document.createElement('a');
    instagramLink.className = 'instagram-link';
    instagramLink.href = 'https://www.instagram.com/' + cafe.ig;
    instagramLink.textContent = cafe.name;

    var mapsLink = document.createElement('a');
    mapsLink.className = 'maps-link';
    mapsLink.href = cafe.location;
    mapsLink.textContent = cafe.cafe;

    var mapsIcon = document.createElement('img');
    mapsIcon.src = 'dist/images/gmaps.png'; // Change to the correct path
    mapsIcon.width = 20; // Set the width in pixels
    mapsIcon.height = 30; // Set the height in pixels

    cardTitle.appendChild(instagramLink);
    cardTitle.appendChild(document.createTextNode(' - '));
    cardTitle.appendChild(mapsIcon); // Add the Google Maps icon
    cardTitle.appendChild(document.createTextNode(' '));
    cardTitle.appendChild(mapsLink);

    cardBody.appendChild(cardTitle);
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

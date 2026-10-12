// ==========================================
// 1. 地図・目的地検索の制御
// ==========================================

const map = L.map('map', {
  tap: false,
  trackResize: true
}).setView([35.1709, 136.8815], 13);

// 📌 1. 最初に見えているイラスト地図 (OpenStreetMap)
const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  zIndex: 1 
}).addTo(map);

// 📌 2. 裏に仕込んでおく国土地理院の航空写真
const satelliteLayer = L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/ort/{z}/{x}/{y}.jpg', {
  attribution: '&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>',
  maxZoom: 18,
  opacity: 0,
  zIndex: 2 
}).addTo(map);

// 📌 3. Google航空写真レイヤー
const googleSatelliteLayer = L.tileLayer(
  'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
  {
    attribution: '&copy; Google Maps',
    maxZoom: 20,
    opacity: 0,
    zIndex: 3
  }
).addTo(map);

// 複数の目的地データベース
const destinations = [
  {
    id: 1,
    name: "若宮大通公園 ゲートボール場",
    coords: [35.1612, 136.9061],
    panorama: "https://pannellum.org/images/alma.jpg",
    // embedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3261.642192131341!2d136.90382897627443!3d35.161306958448375!2m3!1f349.52!2f88.3!2f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6003709067b96b5b%3A0xbbfdf3ff1da7caa7!2z6Iul5a6u5aSn6YCa5YWs5ZyS44CA44Ky44O844OI44Oc44O844Or5aC0!5e1!3m2!1sja!2sjp!4v1721280000000!5m2!1sja!2sjp"
    embedUrl: "https://www.google.com/maps/embed?pb=!4v1!6m8!1m7!1sQ7sKuH0cUn5kEMYFcKd1-Q!2m2!1d35.161725!2d136.9122149!3f59.376!4f0!5f0.7820865974627469"
 
  },
  {
    id: 2,
    name: "中村公園 競輪場西の公園",
    coords: [35.1712, 136.8511],
    panorama: "https://pannellum.org/images/cerro-toco-0.jpg",
    embedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3261.2!2d136.85!3d35.17!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzXCsDEwJzE2LjQiTiAxMTPCsDUxJzAzLjkiRQ!5e1!3m2!1sja!2sjp!4v1700000000000"
  }
];

let currentIndex = 0;
let activeDestination = destinations[currentIndex];

let destinationCoords = activeDestination.coords;
let destinationName = activeDestination.name;

function createPopupContent(dest) {
  return `
    <div style="text-align: center; font-family: sans-serif;">
      <strong style="font-size: 14px; display: block; margin-bottom: 5px;">${dest.name}</strong>
      <button onclick="selectButtonAction(event)" style="
        padding: 4px 10px; 
        font-size: 12px; 
        cursor: pointer; 
        border: 1px solid #999; 
        border-radius: 3px; 
        background: #f0f0f0;
      ">ここを選択</button>
    </div>
  `;
}

let marker = L.marker(destinationCoords).addTo(map)
  .bindPopup(createPopupContent(activeDestination))
  .openPopup();

function updatePlacesUI() {
  const placesDiv = document.getElementById('places');
  if (placesDiv) {
    let html = `<div style="padding: 8px 12px; background: #f8f9fa; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center;">`;
    html += `<span><strong>目的地:</strong> ${destinationName}</span>`;
    html += `<select id="dest-select" onchange="changeDestination(this.value)" style="padding: 4px 8px; border-radius: 4px; border: 1px solid #ccc;">`;
    destinations.forEach((d, idx) => {
      html += `<option value="${idx}" ${idx === currentIndex ? 'selected' : ''}>${d.name}</option>`;
    });
    html += `</select></div>`;
    placesDiv.innerHTML = html;
  }
}

updatePlacesUI();

let buttonSelected = false;

function changeDestination(index) {
  currentIndex = parseInt(index);
  activeDestination = destinations[currentIndex];
  destinationCoords = activeDestination.coords;
  destinationName = activeDestination.name;

  map.setView(destinationCoords, 15);
  marker.setLatLng(destinationCoords);
  marker.setPopupContent(createPopupContent(activeDestination));
  marker.openPopup();

  updatePlacesUI();
  buttonSelected = false;

  if (!map.hasLayer(osmLayer)) map.addLayer(osmLayer);
  satelliteLayer.setOpacity(0);
  googleSatelliteLayer.setOpacity(0);

  loadCustomStreetView();
}

function selectButtonAction(event) {
  event.stopPropagation();
  buttonSelected = true;

  const popupWrapper = document.querySelector('.leaflet-popup-content-wrapper');
  if (popupWrapper) {
    popupWrapper.classList.remove("earthquake");
    void popupWrapper.offsetWidth;
    popupWrapper.classList.add("earthquake");
  }

  selectDestination();
}

// 📌 選択時のアニメーションとレイヤーフェードイン制御
function selectDestination() {
  const popupWrapper = document.querySelector('.leaflet-popup-content-wrapper');
  if (popupWrapper) {
    popupWrapper.classList.add('active-rainbow');
  }

  map.flyTo(destinationCoords, 17, {
    animate: true,
    duration: 1.5 
  });

  setTimeout(() => {
    let opacity = 0;
    const fadeInterval = setInterval(() => {
      opacity += 0.05;
      satelliteLayer.setOpacity(opacity);
      
      if (opacity >= 1) {
        clearInterval(fadeInterval);
        
        let currentOpacity = 0;
        const googleFadeInterval = setInterval(() => {
          currentOpacity += 0.05;
          googleSatelliteLayer.setOpacity(currentOpacity); 
          
          if (currentOpacity >= 1) {
            clearInterval(googleFadeInterval);

            if (buttonSelected) {
              loadCustomStreetViewEmbed();
              return;
            }

            loadCustomStreetView();
          }
        }, 40);
      }
    }, 40);
  }, 1500); 
}

function loadCustomStreetView() {
  const streetEl = document.getElementById('street');
  if (!streetEl) return;

  streetEl.innerHTML = '';
  
  try {
    const viewer = pannellum.viewer('street', {
      "type": "equirectangular",
      "panorama": activeDestination.panorama,
      "autoLoad": true,
      "compass": false,
      "showControls": true,
      "hfov": 120
    });

    setTimeout(() => {
      const container = document.getElementById('street');
      if (container) {
        container.style.opacity = "1";
        viewer.setHfov(90, 3000);
      }
    }, 50);
  } catch (e) {
    streetEl.innerHTML = `<div style="text-align:center; padding:20px;">パノラマ読み込みエラー</div>`;
  }
}

function loadCustomStreetViewEmbed() {
  const streetEl = document.getElementById('street');
  if (!streetEl) return;

  // streetEl.innerHTML = `

  // <div id="street-img-container"
  // style="
  // width:100%;
  // height:100%;
  // opacity:0;
  // transition:opacity 1.5s ease;
  // ">

  // <iframe
  // width="100%"
  // height="100%"
  // style="border:0"
  // allowfullscreen
  // loading="lazy"
  // src="
  // https://www.google.com/maps/embed?pb=!4v1!6m8!1m7!1sQ7sKuH0cUn5kEMYFcKd1-Q!2m2!1d35.161725!2d136.9122149!3f59.376!4f0!5f0.7820865974627469
  // ">
  // </iframe>

  // </div>
  

  // `;

  streetEl.innerHTML = `
    <div id="street-img-container"
    style="
      width:100%;
      height:100%;
      opacity:0;
      transition:opacity 1.5s ease;
      position:relative;
    ">
      <iframe
      src="${activeDestination.embedUrl}"
      width="100%"
      height="100%"
      style="border:0;"
      allowfullscreen
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade">
      </iframe>
      <button class="control-btn" onclick="startRoute()" style="
        position: absolute; 
        bottom: 20px; 
        left: 50%; 
        transform: translateX(-50%); 
        z-index: 9999; 
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        white-space: nowrap;
      ">
        ここへ行く (Googleマップでルート案内)
      </button>
    </div>
  `;

  setTimeout(() => {
    const container = document.getElementById("street-img-container");
    if (container) {
      container.style.opacity = "1";
    }
  }, 50);
}

function setupHoverAction() {
  const popupWrapper = document.querySelector('.leaflet-popup-content-wrapper');
  if (popupWrapper) {
    popupWrapper.style.cursor = 'pointer';

    popupWrapper.addEventListener('mouseenter', function() {
      selectDestination();
    }, { once: true });

    popupWrapper.addEventListener('touchstart', function(e) {
      e.preventDefault();
      selectDestination();
    }, { passive: false });
  }
}

map.on('popupopen', function () {
  setTimeout(setupHoverAction, 100);
});

setTimeout(setupHoverAction, 500);

function startRoute() {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${destinationCoords[0]},${destinationCoords[1]}`;
  window.open(url, '_blank');
}
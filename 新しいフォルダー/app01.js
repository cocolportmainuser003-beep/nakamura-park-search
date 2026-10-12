// ==========================================
// 1. 地図・目的地検索の制御 (旧 app.js の中身)
// ==========================================

const map = L.map('map', {
  tap: false,
  trackResize: true
}).setView([35.1709, 136.8815], 13);

// 📌 1. 最初に見えているイラスト地図 (OpenStreetMap)
const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  zIndex: 1 // 手前に配置
}).addTo(map);

// 📌 2. 裏に仕込んでおく国土地理院の航空写真 (最初は見えない状態にする)
const satelliteLayer = L.tileLayer('https://cyberjapandata.gsi.go.jp/xyz/ort/{z}/{x}/{y}.jpg', {
  attribution: '&copy; <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>',
  maxZoom: 18,
  opacity: 0, // 最初は完全に透明（見えない状態）
  zIndex: 2 // イラスト地図より上に重ねる準備
}).addTo(map);

// 📌 3. Google航空写真レイヤー（ここを選択時に表示）
const googleSatelliteLayer = L.tileLayer(
  'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
  {
    attribution: '&copy; Google Maps',
    maxZoom: 20,
    opacity: 0,
    zIndex: 3
  }
).addTo(map);

// 目的地の位置情報（緯度・経度）
const destinationCoords = [35.1612, 136.9061]; // 若宮大通公園 ゲートボール場
const destinationName = "若宮大通公園 ゲートボール場";

// 吹き出し（Popup）の中身
const popupContent = `
  <div style="text-align: center; font-family: sans-serif;">
    <strong style="font-size: 14px; display: block; margin-bottom: 5px;">${destinationName}</strong>
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

// 地図にピンを立てて、吹き出しを最初から開いておく
const marker = L.marker(destinationCoords).addTo(map)
  .bindPopup(popupContent)
  .openPopup();

// 目的地のテキストを表示するエリア
const placesDiv = document.getElementById('places');
if (placesDiv) {
  placesDiv.innerHTML = `<strong>目的地:</strong> ${destinationName}`;
}

let buttonSelected = false;


function selectButtonAction(event){

  event.stopPropagation();

  console.log("ここを選択ボタン");


  // ボタン操作フラグON
  buttonSelected = true;


  // 吹き出し地震
  const popupWrapper =
  document.querySelector(
    '.leaflet-popup-content-wrapper'
  );


  if(popupWrapper){

    popupWrapper.classList.remove(
      "earthquake"
    );

    void popupWrapper.offsetWidth;

    popupWrapper.classList.add(
      "earthquake"
    );

  }

  // OSMを消す
map.removeLayer(osmLayer);


// Google航空写真を表示
googleSatelliteLayer.addTo(map);
 
// ゆっくりズーム
map.flyTo(
 destinationCoords,
17,
{
 animate:true,
 duration:2
 }
);


// 下のストリートビュー変更
loadCustomStreetView2();


}
// 📌 「ここを選択」または触れた時の処理
function selectDestination() {
  // 1. 吹き出しの枠を取得して、極太レインボー＆虹色シャドウをONにする（これは即座に発動）
  const popupWrapper = document.querySelector('.leaflet-popup-content-wrapper');
  if (popupWrapper) {
    popupWrapper.classList.add('active-rainbow');
  }

  // 2. 地図を目的地へふわっとズームインさせる（1.5秒かけて移動）
  map.flyTo(destinationCoords, 17, {
    animate: true,
    duration: 1.5 // 1.5秒かけて移動
  });

  // 3. ズーム完了（1.5秒）＋2秒待機（合計3.5秒後）に航空写真へフェードイン開始
  setTimeout(() => {
    let opacity = 0;
    const fadeInterval = setInterval(() => {
      opacity += 0.05;
      satelliteLayer.setOpacity(opacity);
      
      if (opacity >= 1) {
        clearInterval(fadeInterval); // 航空写真への切り替えが完了！
        
        const googleLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
          attribution: '&copy; <a href="https://maps.google.com/">Google Maps</a>',
          maxZoom: 20,
          opacity: 0, // レイヤー追加の瞬間はまだ透明（見えない状態）
          zIndex: 3   // さらに上に重ねる
        }).addTo(map);

        // ここから新しく追加したGoogleレイヤーのフェードイン用アニメーションタイマーを開始
        let currentOpacity = 0;
        const googleFadeInterval = setInterval(() => {
          currentOpacity += 0.05;
          googleLayer.setOpacity(currentOpacity);
          
          if (currentOpacity >= 1) {
            clearInterval(googleFadeInterval); // Google航空写真へのフェードイン切り替えが完了！

             // ボタン選択時はストリートビュー優先
            if(buttonSelected){

                loadCustomStreetView3()

                console.log(
                "ここを選択 → スムーズ切替"
                );

                return;

  }


            // 📌【おすすめ追加！】すべての地図フェードインが完了した瞬間に、
            // 下部の黒背景エリア（#street）を自前パノラマストリートビューに書き換える
            loadCustomStreetView();
          }
        }, 50);
      }
    }, 50); // 約1秒かけてフェードイン
  }, 3500); 
}

// 📌 下部の黒い領域を360度パノラマビューアーに変える関数
function loadCustomStreetView() {
  const streetEl = document.getElementById('street');
  if (!streetEl) return;

  // 初期に入っているテキストやボタンを一度クリア
  streetEl.innerHTML = '';
  const viewer = pannellum.viewer('street', {

  "type": "equirectangular",

  "panorama": "https://pannellum.org/images/alma.jpg",

  "autoLoad": true,

  "compass": false,

  "showControls": true,

  // 最初は少しズーム状態
  "hfov": 120

});


// ふわっと表示
setTimeout(() => {

  const container = document.getElementById('street');

  if (container) {

    container.style.opacity = "1";

    // ゆっくり広がる
    viewer.setHfov(90, 3000);

  }

}, 50);
  
  // Googleマップの「共有」から取得できる埋め込み用のURLをそのまま使用する
  // ※以下は若宮大通公園高架下のストリートビューの埋め込みURLの例です
//   const embedUrl = "https://www.google.com/maps/embed?pb=!1m4!1m8!1m3!1d3261.64654316041!2d136.9061!3d35.1612!3m2!1i1024!2i768!4f13.1!2m1!1z6Iul5a6u5aSn6YCa5YWs5ZyS44CA44Ky44O844OI44Oc44O844Or5aC0!5e1!3m2!1sja!2sjp!4v1700000000000";

//   // 1. まず、全体を包むコンテナ、iframe、ボタンをひとまとめにしてHTMLを流し込む[cite: 3]
//   streetEl.innerHTML = `
//     <div style="width: 100%; height: 100%; position: relative; opacity: 0; transition: opacity 1s ease;" id="street-img-container">
//       <!-- ストリートビュー本体 -->
//       <iframe src="${embedUrl}" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
      
//       <!-- その上に重ねる「ここへ行く」ボタン -->
//       <button class="control-btn" onclick="startRoute()" style="
//         position: absolute; 
//         bottom: 20px; 
//         left: 50%; 
//         transform: translateX(-50%); 
//         z-index: 9999; 
//         font-weight: bold;
//         box-shadow: 0 4px 12px rgba(0,0,0,0.5);
//         white-space: nowrap;
//       ">
//         ここへ行く (Googleマップでルート案内)
//       </button>
//     </div>
//   `;
  //Pannellumビューアーを起動（#street の中に埋め込み）
//   pannellum.viewer('street', {
//     "type": "equirectangular",
//     // 💡 実装時は、若宮大通公園などのフリーの全天球パノラマ画像（.jpg）をご用意のうえ、パスを指定してください
//     // テスト用に正距円筒図法（Equirectangular）のサンプル画像URLを入れています
//     "panorama": "https://pannellum.org/images/alma.jpg", 
//     "autoLoad": true,
//     "compass": false,
//     "showControls": true // ズームやフルスクリーンボタンを表示
//   });
//   setTimeout(() => {
//     const container = document.getElementById('street-img-container');
//     if (container) container.style.opacity = '1';
//   }, 50);





  
}
function loadCustomStreetView3() {

  const streetEl = document.getElementById('street');
  if (!streetEl) return;


  const embedUrl =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3261.642192131341!2d136.90382897627443!3d35.161306958448375!2m3!1f349.52!2f88.3!2f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6003709067b96b5b%3A0xbbfdf3ff1da7caa7!2z6Iul5a6u5aSn6YCa5YWs5ZyS44CA44Ky44O844OI44Oc44O844Or5aC0!5e1!3m2!1sja!2sjp!4v1721280000000!5m2!1sja!2sjp";


  streetEl.innerHTML = `

  <div id="street-img-container"
  style="
  width:100%;
  height:100%;
  opacity:0;
  transition:opacity 1.5s ease;
  ">

  <iframe
  src="${embedUrl}"
  width="100%"
  height="100%"
  style="border:0;"
  allowfullscreen
  loading="lazy"
  referrerpolicy="no-referrer-when-downgrade">
  </iframe>

  </div>

  `;


  setTimeout(()=>{

    const container =
    document.getElementById(
      "street-img-container"
    );

    if(container){
      container.style.opacity="1";
    }
       // ゆっくり広がる
    viewer.setHfov(90, 3000);

  },50);

}

function loadCustomStreetView2() {

  const streetEl = document.getElementById('street');
  if (!streetEl) return;


  streetEl.innerHTML = `

  <div id="street-img-container"
  style="
  width:100%;
  height:100%;
  opacity:0;
  transition:opacity 1.5s ease;
  ">

  <iframe
  width="100%"
  height="100%"
  style="border:0"
  allowfullscreen
  loading="lazy"
  src="
  https://www.google.com/maps/embed?pb=!4v1!6m8!1m7!1sQ7sKuH0cUn5kEMYFcKd1-Q!2m2!1d35.161725!2d136.9122149!3f59.376!4f0!5f0.7820865974627469
  ">
  </iframe>

  </div>

  `;

// ふわっと表示
  setTimeout(()=>{

    const container =
    document.getElementById(
    'street-img-container'
    );

    if(container){
      container.style.opacity="1";
        // ゆっくり広がる
    viewer.setHfov(90, 3000);
    }

  },50);
  // 📌 パノラマの上に「ここへ行く」ボタンを再配置したい場合の動的生成
  const btn = document.createElement('button');
  btn.className = 'control-btn';
  btn.style.position = 'absolute';
  btn.style.bottom = '10px';
  btn.style.zIndex = '9999';
  btn.innerText = 'ここへ行く (Googleマップでルート案内)';
  btn.onclick = startRoute;
  streetEl.appendChild(btn);

}
// 📌 クリック不要！乗せるだけ・触るだけで100%発動する処理
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
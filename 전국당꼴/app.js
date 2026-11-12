/* ============================================================
   전국당꼴 - 모바일 웹 & 안드로이드 앱 코어 로직 (app.js)
   Google Maps & 모바일 지도 연동, 꼴찌 기록, 통계, 로컬 저장소 관리
   ============================================================ */

(function () {
  'use strict';

  // --- 기본 상수 및 상태 관리 ---
  const STORAGE_KEYS = {
    STORES: 'dangkkol_stores_v1',
    RECORDS: 'dangkkol_records_v1',
    NAVER_KEY: 'dangkkol_naver_key_v1',
    GMAP_KEY: 'dangkkol_gmap_key_v1',
    PLAYERS: 'dangkkol_players_v1'
  };

  const DEFAULT_NAVER_CLIENT_ID = 'shr1k32iat';

  // 기본 샘플 당구장 목록 (서울/수도권 및 범용 샘플)
  const DEFAULT_STORES = [
    { id: 'store_1', name: '강남 에이스 당구클럽', address: '서울 강남구 테헤란로 123 3층', lat: 37.498095, lng: 127.027610, memo: '대대 8대 완비, 국제식 테이블' },
    { id: 'store_2', name: '홍대 블랙 당구장', address: '서울 마포구 어울마당로 75 지하 1층', lat: 37.553120, lng: 126.923230, memo: '포켓볼 & 4구 전용존' },
    { id: 'store_3', name: '종로 골드 빌리어드', address: '서울 종로구 종로 104 4층', lat: 37.570180, lng: 126.989250, memo: '쾌적한 금연 당구클럽' },
    { id: 'store_4', name: '신촌 매니아 당구장', address: '서울 서대문구 연세로 18 2층', lat: 37.558350, lng: 126.936850, memo: '학생 할인 및 친절한 사장님' },
    { id: 'store_5', name: '판교 큐클럽', address: '경기 성남시 분당구 판교역로 146 5층', lat: 37.394850, lng: 127.111890, memo: '직장인 단체석 구비' }
  ];

  // 기본 샘플 꼴찌 전적 기록
  const DEFAULT_RECORDS = [
    { id: 'rec_1', storeId: 'store_1', storeName: '강남 에이스 당구클럽', storeAddress: '서울 강남구 테헤란로 123 3층', loser: '김철수', winner: '이민호', gameType: '4구', fee: 18000, excuse: '초크 안 칠해서 삑사리 남', date: '2026-11-10T20:30' },
    { id: 'rec_2', storeId: 'store_1', storeName: '강남 에이스 당구클럽', storeAddress: '서울 강남구 테헤란로 123 3층', loser: '김철수', winner: '박영희', gameType: '3구(중대)', fee: 22000, excuse: '오늘 큐대가 휨 (명백한 큐대 탓)', date: '2026-11-11T21:15' },
    { id: 'rec_3', storeId: 'store_2', storeName: '홍대 블랙 당구장', storeAddress: '서울 마포구 어울마당로 75 지하 1층', loser: '박영희', winner: '김철수', gameType: '포켓볼', fee: 15000, excuse: '쿠션 각도가 안 나옴', date: '2026-11-09T19:40' },
    { id: 'rec_4', storeId: 'store_3', storeName: '종로 골드 빌리어드', storeAddress: '서울 종로구 종로 104 4층', loser: '최준호', winner: '김철수', gameType: '4구', fee: 16000, excuse: '깔끔하게 실력 인정함...', date: '2026-11-08T18:20' },
    { id: 'rec_5', storeId: 'store_1', storeName: '강남 에이스 당구클럽', storeAddress: '서울 강남구 테헤란로 123 3층', loser: '최준호', winner: '이민호', gameType: '3구(대대)', fee: 25000, excuse: '공이 이상하게 굴러감', date: '2026-11-07T22:00' }
  ];

  // 상태
  let stores = [];
  let records = [];
  let currentMap = null;
  let mapMarkers = [];
  let selectedStore = null;
  let userLocation = { lat: 37.498095, lng: 127.027610 }; // 기본값 (강남역 부근)
  let googleMapInstance = null;
  let isGoogleMapActive = false;
  let naverMapInstance = null;
  let isNaverMapActive = false;

  // DOM Elements
  const elMap = document.getElementById('map');
  const elBottomSheet = document.getElementById('store-bottom-sheet');
  const elSheetStoreName = document.getElementById('sheet-store-name');
  const elSheetStoreAddress = document.getElementById('sheet-store-address');
  const elSheetRecordCount = document.getElementById('sheet-record-count');
  const elSheetTopLoser = document.getElementById('sheet-top-loser');
  const elSheetTotalFee = document.getElementById('sheet-total-fee');
  const elBtnOpenRecordModal = document.getElementById('btn-open-record-modal');
  const elBtnViewStoreHistory = document.getElementById('btn-view-store-history');
  
  const elRecordModal = document.getElementById('record-modal');
  const elRecordForm = document.getElementById('record-form');
  const elModalStoreName = document.getElementById('modal-store-name');
  const elRecordStoreId = document.getElementById('record-store-id');
  const elRecordDate = document.getElementById('record-date');
  const elRecordLoser = document.getElementById('record-loser');
  const elRecordWinner = document.getElementById('record-winner');
  const elRecordFee = document.getElementById('record-fee');
  const elRecordExcuse = document.getElementById('record-excuse');
  const elQuickPlayers = document.getElementById('quick-players');
  
  const elAddStoreModal = document.getElementById('add-store-modal');
  const elAddStoreForm = document.getElementById('add-store-form');
  const elNewStoreName = document.getElementById('new-store-name');
  const elNewStoreAddress = document.getElementById('new-store-address');
  const elNewStoreMemo = document.getElementById('new-store-memo');
  
  const elSettingsModal = document.getElementById('settings-modal');
  const elSettingGmapApiKey = document.getElementById('setting-gmap-key');
  const elApiKeyBanner = document.getElementById('api-key-banner');

  const elToast = document.getElementById('toast');
  const elToastMsg = document.getElementById('toast-message');

  // --- 초기화 함수 ---
  function init() {
    loadData();
    setupEventListeners();
    setupNavigation();
    initMap();
    renderRanking();
    renderHistory();
    tryGetUserLocation();
  }

  // --- 데이터 로드 & 저장 ---
  function loadData() {
    try {
      const storedStores = localStorage.getItem(STORAGE_KEYS.STORES);
      stores = storedStores ? JSON.parse(storedStores) : [...DEFAULT_STORES];

      const storedRecords = localStorage.getItem(STORAGE_KEYS.RECORDS);
      records = storedRecords ? JSON.parse(storedRecords) : [...DEFAULT_RECORDS];

      const savedNaverKey = localStorage.getItem(STORAGE_KEYS.NAVER_KEY) || DEFAULT_NAVER_CLIENT_ID;
      const elSettingNaverKey = document.getElementById('setting-naver-key');
      if (savedNaverKey && elSettingNaverKey) {
        elSettingNaverKey.value = savedNaverKey;
      }

      const savedGmapKey = localStorage.getItem(STORAGE_KEYS.GMAP_KEY);
      if (savedGmapKey && elSettingGmapApiKey) {
        elSettingGmapApiKey.value = savedGmapKey;
      }
    } catch (e) {
      console.warn('데이터 로드 실패, 기본값 사용:', e);
      stores = [...DEFAULT_STORES];
      records = [...DEFAULT_RECORDS];
    }
  }

  function saveStores() {
    localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(stores));
  }

  function saveRecords() {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  }

  // --- 토스트 알림 표시 ---
  function showToast(message, icon = '🎱') {
    elToastMsg.textContent = message;
    elToast.querySelector('.toast-icon').textContent = icon;
    elToast.classList.remove('hidden');
    setTimeout(() => {
      elToast.classList.add('hidden');
    }, 2800);
  }

  // --- 지도 초기화 (네이버 지도 기본 연동) ---
  function initMap() {
    const naverKey = localStorage.getItem(STORAGE_KEYS.NAVER_KEY) || DEFAULT_NAVER_CLIENT_ID;
    const gmapKey = localStorage.getItem(STORAGE_KEYS.GMAP_KEY);

    if (naverKey && naverKey.trim().length > 3) {
      loadNaverMapsAPI(naverKey.trim());
    } else if (gmapKey && gmapKey.trim().length > 15) {
      loadGoogleMapsAPI(gmapKey.trim());
    } else {
      loadLeafletMap();
    }
  }

  // 1. Naver Maps JS API v3 동적 로더
  function loadNaverMapsAPI(clientId) {
    if (window.naver && window.naver.maps) {
      renderNaverMap();
      return;
    }
    const script = document.createElement('script');
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${clientId}&submodules=geocoder`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      renderNaverMap();
      showToast('네이버 지도가 성공적으로 연결되었습니다!', '🗺️');
    };
    script.onerror = () => {
      console.warn('네이버 지도 API 로드 실패, 대체 지도로 전환합니다.');
      showToast('네이버 지도 연결 실패 (Client ID를 확인하세요)', '⚠️');
      loadLeafletMap();
    };
    document.head.appendChild(script);
  }

  function renderNaverMap() {
    isNaverMapActive = true;
    isGoogleMapActive = false;
    elMap.innerHTML = '';

    const mapOptions = {
      center: new naver.maps.LatLng(userLocation.lat, userLocation.lng),
      zoom: 16,
      zoomControl: false,
      mapTypeControl: false,
      scaleControl: false
    };
    naverMapInstance = new naver.maps.Map('map', mapOptions);

    naver.maps.Event.addListener(naverMapInstance, 'click', (e) => {
      openAddStoreModalWithCoords(e.coord.lat(), e.coord.lng());
    });

    renderNaverMarkers();
  }

  function renderNaverMarkers() {
    if (!naverMapInstance) return;
    mapMarkers.forEach(m => m.setMap(null));
    mapMarkers = [];

    stores.forEach(store => {
      const isSelected = selectedStore && selectedStore.id === store.id;
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(store.lat, store.lng),
        map: naverMapInstance,
        title: store.name,
        icon: {
          content: `
            <div style="position:relative; cursor:pointer;">
              <div class="billiard-marker ${isSelected ? 'selected' : ''}">🎱</div>
              <div class="billiard-marker-label">${escapeHtml(store.name)}</div>
            </div>
          `,
          anchor: new naver.maps.Point(19, 19)
        }
      });

      naver.maps.Event.addListener(marker, 'click', () => {
        selectStore(store);
      });
      mapMarkers.push(marker);
    });
  }

  // 1. Google Maps JS API 동적 로더
  function loadGoogleMapsAPI(apiKey) {
    if (window.google && window.google.maps) {
      renderGoogleMap();
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=ko&callback=window.__onGoogleMapsLoaded`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      console.warn('구글맵 API 로드 실패, 대체 지도로 전환합니다.');
      showToast('구글맵 로드 실패 - 기본 지도로 전환', '⚠️');
      loadLeafletMap();
    };
    window.__onGoogleMapsLoaded = () => {
      renderGoogleMap();
    };
    document.head.appendChild(script);
  }

  function renderGoogleMap() {
    isGoogleMapActive = true;
    elMap.innerHTML = '';
    const mapOptions = {
      center: userLocation,
      zoom: 15,
      disableDefaultUI: true,
      zoomControl: false,
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] }
      ]
    };
    googleMapInstance = new google.maps.Map(elMap, mapOptions);

    // 지도 탭 시 새 당구장 추가 유도
    googleMapInstance.addListener('click', (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      openAddStoreModalWithCoords(lat, lng);
    });

    // 구글 마커 렌더링
    renderGoogleMarkers();
  }

  function renderGoogleMarkers() {
    if (!googleMapInstance) return;
    mapMarkers.forEach(m => m.setMap(null));
    mapMarkers = [];

    stores.forEach(store => {
      const marker = new google.maps.Marker({
        position: { lat: store.lat, lng: store.lng },
        map: googleMapInstance,
        title: store.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 14,
          fillColor: '#22c55e',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });

      marker.addListener('click', () => {
        selectStore(store);
      });
      mapMarkers.push(marker);
    });
  }

  // 2. Leaflet Fallback 지도 (키 없이도 100% 동작 & 모바일 최적화)
  function loadLeafletMap() {
    isGoogleMapActive = false;
    elMap.innerHTML = '';

    if (currentMap) {
      currentMap.remove();
    }

    currentMap = L.map('map', {
      center: [userLocation.lat, userLocation.lng],
      zoom: 15,
      zoomControl: false
    });

    // 어두운 빌리어드 테마 타일 레이어
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap & CartoDB',
      maxZoom: 19
    }).addTo(currentMap);

    // 지도 클릭 시 새 당구장 추가
    currentMap.on('click', (e) => {
      openAddStoreModalWithCoords(e.latlng.lat, e.latlng.lng);
    });

    renderLeafletMarkers();
  }

  function renderLeafletMarkers() {
    if (!currentMap) return;

    // 기존 마커 제거
    mapMarkers.forEach(m => currentMap.removeLayer(m));
    mapMarkers = [];

    stores.forEach(store => {
      const storeRecords = records.filter(r => r.storeId === store.id);
      const recordCount = storeRecords.length;

      // 커스텀 8번 당구공 마커
      const customIcon = L.divIcon({
        className: 'custom-billiard-icon',
        html: `
          <div class="billiard-marker ${selectedStore && selectedStore.id === store.id ? 'selected' : ''}">
            🎱
          </div>
          <div class="billiard-marker-label">${escapeHtml(store.name)}</div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19]
      });

      const marker = L.marker([store.lat, store.lng], { icon: customIcon }).addTo(currentMap);
      
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        selectStore(store);
      });

      mapMarkers.push(marker);
    });
  }

  // --- 당구장 선택 & 바텀 시트 표시 ---
  function selectStore(store) {
    selectedStore = store;
    const storeRecords = records.filter(r => r.storeId === store.id);

    elSheetStoreName.textContent = store.name;
    elSheetStoreAddress.textContent = store.address || '주소 정보 없음';
    elSheetRecordCount.textContent = `경기 ${storeRecords.length}회`;

    // 최다 꼴찌 계산
    if (storeRecords.length > 0) {
      const loserCountMap = {};
      let totalFee = 0;

      storeRecords.forEach(r => {
        loserCountMap[r.loser] = (loserCountMap[r.loser] || 0) + 1;
        totalFee += (Number(r.fee) || 0);
      });

      let topLoserName = '';
      let topCount = 0;
      for (const [name, count] of Object.entries(loserCountMap)) {
        if (count > topCount) {
          topCount = count;
          topLoserName = name;
        }
      }

      elSheetTopLoser.textContent = `${topLoserName} (${topCount}회 꼴찌 💀)`;
      elSheetTotalFee.textContent = `${totalFee.toLocaleString()}원`;
    } else {
      elSheetTopLoser.textContent = '아직 전적 없음 (첫 꼴찌를 등록하세요!)';
      elSheetTotalFee.textContent = '0원';
    }

    // 바텀 시트 열기
    elBottomSheet.classList.remove('collapsed');

    // 지도 중심 이동
    if (isNaverMapActive && naverMapInstance) {
      naverMapInstance.panTo(new naver.maps.LatLng(store.lat, store.lng));
      renderNaverMarkers();
    } else if (isGoogleMapActive && googleMapInstance) {
      googleMapInstance.panTo({ lat: store.lat, lng: store.lng });
    } else if (currentMap) {
      currentMap.panTo([store.lat, store.lng], { animate: true });
      renderLeafletMarkers();
    }
  }

  function closeBottomSheet() {
    elBottomSheet.classList.add('collapsed');
  }

  // --- 사용자 현재 GPS 위치 획득 ---
  function tryGetUserLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          userLocation = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
          moveToCurrentLocation();
          showToast('내 주변 당구장을 탐색했습니다', '📍');
        },
        (err) => {
          console.log('GPS 위치 획득 실패, 기본 위치(강남) 유지:', err.message);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }

  function moveToCurrentLocation() {
    if (isNaverMapActive && naverMapInstance) {
      naverMapInstance.setCenter(new naver.maps.LatLng(userLocation.lat, userLocation.lng));
      naverMapInstance.setZoom(16);
    } else if (isGoogleMapActive && googleMapInstance) {
      googleMapInstance.setCenter(userLocation);
      googleMapInstance.setZoom(15);
    } else if (currentMap) {
      currentMap.setView([userLocation.lat, userLocation.lng], 15);
    }
  }

  // --- 꼴찌 등록 모달 처리 ---
  function openRecordModal() {
    if (!selectedStore) {
      showToast('먼저 지도에서 당구장을 터치해주세요!', '⚠️');
      return;
    }

    elModalStoreName.textContent = selectedStore.name;
    elRecordStoreId.value = selectedStore.id;
    document.getElementById('record-store-name-val').value = selectedStore.name;
    document.getElementById('record-store-address-val').value = selectedStore.address || '';

    // 현재 일시 기본값 채우기 (YYYY-MM-DDTHH:MM)
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    elRecordDate.value = now.toISOString().slice(0, 16);

    // 폼 초기화
    elRecordLoser.value = '';
    elRecordWinner.value = '';
    elRecordFee.value = '15000';
    elRecordExcuse.value = '';

    // 최근 플레이어 목록 퀵 태그 생성
    renderQuickPlayers();

    elRecordModal.classList.remove('hidden');
    elRecordLoser.focus();
  }

  function closeRecordModal() {
    elRecordModal.classList.add('hidden');
  }

  function renderQuickPlayers() {
    const playersSet = new Set();
    records.forEach(r => {
      if (r.loser) playersSet.add(r.loser);
      if (r.winner) playersSet.add(r.winner);
    });

    elQuickPlayers.innerHTML = '';
    if (playersSet.size > 0) {
      const label = document.createElement('span');
      label.className = 'text-xs text-slate-400 mr-1';
      label.textContent = '최근: ';
      elQuickPlayers.appendChild(label);

      Array.from(playersSet).slice(0, 5).forEach(name => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'quick-tag-chip';
        chip.textContent = name;
        chip.addEventListener('click', () => {
          elRecordLoser.value = name;
        });
        elQuickPlayers.appendChild(chip);
      });
    }
  }

  // --- 새 당구장 등록 모달 ---
  let tempCoord = null;
  function openAddStoreModalWithCoords(lat, lng) {
    tempCoord = { lat, lng };
    elNewStoreName.value = '';
    elNewStoreAddress.value = '';
    elNewStoreMemo.value = '';
    elAddStoreModal.classList.remove('hidden');
    elNewStoreName.focus();
  }

  function closeAddStoreModal() {
    elAddStoreModal.classList.add('hidden');
    tempCoord = null;
  }

  // --- 랭킹 화면 계산 & 렌더링 ---
  let currentRankingTab = 'loser-count';

  function renderRanking() {
    const rankingList = document.getElementById('ranking-list');
    const storeStatsList = document.getElementById('store-stats-list');

    // 친구별 통계 집계
    const playerStats = {};
    records.forEach(r => {
      const loser = r.loser;
      const fee = Number(r.fee) || 0;

      if (!playerStats[loser]) {
        playerStats[loser] = {
          name: loser,
          lossCount: 0,
          winCount: 0,
          totalFee: 0,
          lastStore: r.storeName
        };
      }
      playerStats[loser].lossCount += 1;
      playerStats[loser].totalFee += fee;

      // 승자 집계
      if (r.winner) {
        if (!playerStats[r.winner]) {
          playerStats[r.winner] = {
            name: r.winner,
            lossCount: 0,
            winCount: 0,
            totalFee: 0,
            lastStore: r.storeName
          };
        }
        playerStats[r.winner].winCount += 1;
      }
    });

    const playersArray = Object.values(playerStats);

    if (playersArray.length === 0) {
      rankingList.innerHTML = `
        <div class="text-center py-10 text-slate-400">
          <p class="text-3xl mb-2">🎱</p>
          <p>아직 등록된 꼴찌 기록이 없습니다.<br>지도에서 당구장을 터치해 첫 패배자를 등록하세요!</p>
        </div>
      `;
      return;
    }

    // 탭에 따른 정렬
    if (currentRankingTab === 'loser-count') {
      playersArray.sort((a, b) => b.lossCount - a.lossCount || b.totalFee - a.totalFee);
    } else {
      playersArray.sort((a, b) => b.totalFee - a.totalFee || b.lossCount - a.lossCount);
    }

    rankingList.innerHTML = '';
    playersArray.forEach((p, idx) => {
      const rankNum = idx + 1;
      const rankClass = rankNum === 1 ? 'top-1' : rankNum === 2 ? 'top-2' : rankNum === 3 ? 'top-3' : '';

      const card = document.createElement('div');
      card.className = `rank-card ${rankClass}`;
      card.innerHTML = `
        <div class="rank-badge-num">${rankNum}</div>
        <div class="rank-card-info">
          <div class="rank-player-name">
            ${escapeHtml(p.name)}
            ${rankNum === 1 ? '<span class="badge-sub">🏆 영구 물주</span>' : ''}
          </div>
          <div class="rank-stat-sub">
            총 ${p.lossCount + p.winCount}전 중 <strong>${p.lossCount}회 패배</strong> (승리 ${p.winCount}회)
          </div>
        </div>
        <div class="rank-card-score">
          <div class="score-main">${p.lossCount}회 꼴찌 💀</div>
          <div class="score-sub">${p.totalFee.toLocaleString()}원 지출 💸</div>
        </div>
      `;
      rankingList.appendChild(card);
    });

    // 당구장별 단골 꼴찌 분석
    storeStatsList.innerHTML = '';
    stores.forEach(store => {
      const storeRecs = records.filter(r => r.storeId === store.id);
      if (storeRecs.length > 0) {
        const counts = {};
        storeRecs.forEach(r => counts[r.loser] = (counts[r.loser] || 0) + 1);
        let topLoser = '';
        let maxC = 0;
        for (const [name, c] of Object.entries(counts)) {
          if (c > maxC) { maxC = c; topLoser = name; }
        }

        const row = document.createElement('div');
        row.className = 'store-stat-row';
        row.innerHTML = `
          <span>📍 <strong>${escapeHtml(store.name)}</strong></span>
          <span>단골 패배자: <span class="text-red-400 font-bold">${escapeHtml(topLoser)}</span> (${maxC}패)</span>
        `;
        storeStatsList.appendChild(row);
      }
    });
  }

  // --- 경기 히스토리 렌더링 ---
  function renderHistory(filterStoreId = null) {
    const historyList = document.getElementById('history-list');
    let displayRecords = [...records];

    if (filterStoreId) {
      displayRecords = displayRecords.filter(r => r.storeId === filterStoreId);
    }

    displayRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (displayRecords.length === 0) {
      historyList.innerHTML = `
        <div class="text-center py-10 text-slate-400">
          <p class="text-3xl mb-2">📜</p>
          <p>등록된 경기 기록이 없습니다.</p>
        </div>
      `;
      return;
    }

    historyList.innerHTML = '';
    displayRecords.forEach(rec => {
      const feeNum = Number(rec.fee) || 0;
      const formattedDate = formatKoreanDate(rec.date);

      const card = document.createElement('div');
      card.className = 'history-card';
      card.innerHTML = `
        <div class="history-card-header">
          <span class="history-store-tag">
            <i class="fa-solid fa-location-dot"></i> ${escapeHtml(rec.storeName)}
          </span>
          <span class="history-date">${formattedDate}</span>
        </div>
        <div class="history-body">
          <div class="history-loser-box">
            <div class="loser-avatar">💀</div>
            <div class="loser-info">
              <h4>${escapeHtml(rec.loser)}</h4>
              <span>${rec.winner ? `승자: ${escapeHtml(rec.winner)}` : '단독 꼴찌 확정'}</span>
            </div>
          </div>
          <div class="history-fee-box">
            <div class="history-fee-amount">${feeNum.toLocaleString()}원</div>
            <div class="history-game-chip">${escapeHtml(rec.gameType || '4구')}</div>
          </div>
        </div>
        ${rec.excuse ? `
          <div class="history-excuse">
            <i class="fa-solid fa-quote-left"></i>
            <span>${escapeHtml(rec.excuse)}</span>
          </div>
        ` : ''}
        <div class="history-actions">
          <button class="btn-card-del" data-id="${rec.id}">
            <i class="fa-solid fa-trash-can"></i> 삭제
          </button>
        </div>
      `;

      card.querySelector('.btn-card-del').addEventListener('click', () => {
        deleteRecord(rec.id);
      });

      historyList.appendChild(card);
    });
  }

  function deleteRecord(recId) {
    if (confirm('이 경기 기록을 삭제하시겠습니까?')) {
      records = records.filter(r => r.id !== recId);
      saveRecords();
      renderHistory();
      renderRanking();
      if (selectedStore) selectStore(selectedStore);
      showToast('기록이 삭제되었습니다.', '🗑️');
    }
  }

  // --- 이벤트 리스너 설정 ---
  function setupEventListeners() {
    // 바텀 시트 핸들 드래그/클릭으로 닫기
    document.getElementById('sheet-handle').addEventListener('click', closeBottomSheet);

    // 꼴찌 등록 모달 열기/닫기
    elBtnOpenRecordModal.addEventListener('click', openRecordModal);
    document.getElementById('btn-close-record-modal').addEventListener('click', closeRecordModal);
    document.getElementById('btn-cancel-record').addEventListener('click', closeRecordModal);

    // 당구장 전적 보기 버튼
    elBtnViewStoreHistory.addEventListener('click', () => {
      if (selectedStore) {
        switchView('view-history');
        renderHistory(selectedStore.id);
      }
    });

    // 꼴찌 폼 제출 (저장!)
    elRecordForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const newRecord = {
        id: 'rec_' + Date.now(),
        storeId: elRecordStoreId.value,
        storeName: document.getElementById('record-store-name-val').value,
        storeAddress: document.getElementById('record-store-address-val').value,
        date: elRecordDate.value || new Date().toISOString(),
        gameType: document.querySelector('input[name="game-type"]:checked')?.value || '4구',
        loser: elRecordLoser.value.trim(),
        winner: elRecordWinner.value.trim(),
        fee: Number(elRecordFee.value) || 0,
        excuse: elRecordExcuse.value.trim()
      };

      records.unshift(newRecord);
      saveRecords();

      closeRecordModal();
      if (selectedStore) selectStore(selectedStore);
      renderRanking();
      renderHistory();

      showToast(`'${newRecord.loser}'님의 꼴찌 기록이 박제되었습니다! 💀`, '🎱');
    });

    // 금액 칩 클릭
    document.querySelectorAll('.btn-fee-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        elRecordFee.value = btn.dataset.amount;
      });
    });

    // 변명 칩 클릭
    document.querySelectorAll('.btn-excuse-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        elRecordExcuse.value = btn.textContent;
      });
    });

    // 수동 당구장 추가 모달
    document.getElementById('btn-add-store-manual').addEventListener('click', () => {
      openAddStoreModalWithCoords(userLocation.lat, userLocation.lng);
    });
    document.getElementById('btn-close-store-modal').addEventListener('click', closeAddStoreModal);
    document.getElementById('btn-cancel-add-store').addEventListener('click', closeAddStoreModal);

    elAddStoreForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const storeName = elNewStoreName.value.trim();
      if (!storeName) return;

      const newStore = {
        id: 'store_' + Date.now(),
        name: storeName,
        address: elNewStoreAddress.value.trim() || '직접 등록한 당구장',
        lat: tempCoord ? tempCoord.lat : userLocation.lat,
        lng: tempCoord ? tempCoord.lng : userLocation.lng,
        memo: elNewStoreMemo.value.trim()
      };

      stores.push(newStore);
      saveStores();
      closeAddStoreModal();

      if (isNaverMapActive) renderNaverMarkers();
      else if (isGoogleMapActive) renderGoogleMarkers();
      else renderLeafletMarkers();

      selectStore(newStore);
      showToast(`새 당구장 '${storeName}'이(가) 등록되었습니다!`, '📍');
    });

    // 내 위치 버튼
    document.getElementById('btn-my-location').addEventListener('click', () => {
      tryGetUserLocation();
      moveToCurrentLocation();
    });

    // 검색 바 토글
    const elSearchToggle = document.getElementById('btn-search-toggle');
    const elSearchBar = document.getElementById('search-bar');
    const elSearchInput = document.getElementById('search-input');
    const elSearchResults = document.getElementById('search-results');
    const elBtnClear = document.getElementById('btn-search-clear');

    elSearchToggle.addEventListener('click', () => {
      elSearchBar.classList.toggle('hidden');
      if (!elSearchBar.classList.contains('hidden')) {
        elSearchInput.focus();
      }
    });

    elSearchInput.addEventListener('input', () => {
      const query = elSearchInput.value.trim().toLowerCase();
      if (query.length > 0) {
        elBtnClear.classList.remove('hidden');
        const matched = stores.filter(s => s.name.toLowerCase().includes(query) || (s.address && s.address.toLowerCase().includes(query)));

        if (matched.length > 0) {
          elSearchResults.classList.remove('hidden');
          elSearchResults.innerHTML = matched.map(s => `
            <div class="search-item" data-id="${s.id}">
              <div class="search-item-title">${escapeHtml(s.name)}</div>
              <div class="search-item-addr">${escapeHtml(s.address || '')}</div>
            </div>
          `).join('');

          elSearchResults.querySelectorAll('.search-item').forEach(item => {
            item.addEventListener('click', () => {
              const targetStore = stores.find(s => s.id === item.dataset.id);
              if (targetStore) {
                selectStore(targetStore);
                elSearchBar.classList.add('hidden');
                elSearchResults.classList.add('hidden');
              }
            });
          });
        } else {
          elSearchResults.classList.remove('hidden');
          elSearchResults.innerHTML = `
            <div class="p-3 text-center text-xs text-slate-400">
              검색 결과가 없습니다.
            </div>
          `;
        }
      } else {
        elBtnClear.classList.add('hidden');
        elSearchResults.classList.add('hidden');
      }
    });

    elBtnClear.addEventListener('click', () => {
      elSearchInput.value = '';
      elBtnClear.classList.add('hidden');
      elSearchResults.classList.add('hidden');
    });

    // 설정 모달 (구글맵 API Key)
    const openSettings = () => {
      elSettingsModal.classList.remove('hidden');
    };
    document.getElementById('btn-settings').addEventListener('click', openSettings);
    document.getElementById('btn-banner-settings').addEventListener('click', openSettings);
    document.getElementById('btn-close-settings-modal').addEventListener('click', () => {
      elSettingsModal.classList.add('hidden');
    });

    // 네이버 지도 Client ID 저장 및 새로고침
    const btnSaveNaverKey = document.getElementById('btn-save-naver-key');
    if (btnSaveNaverKey) {
      btnSaveNaverKey.addEventListener('click', () => {
        const key = document.getElementById('setting-naver-key')?.value.trim();
        if (key) {
          localStorage.setItem(STORAGE_KEYS.NAVER_KEY, key);
          elSettingsModal.classList.add('hidden');
          showToast('네이버 지도 키가 저장되었습니다. 지도를 로드합니다!', '🗺️');
          initMap();
        } else {
          showToast('Client ID를 입력해주세요.', '⚠️');
        }
      });
    }

    // 구글맵 API 키 저장 및 새로고침
    const btnSaveGmapKey = document.getElementById('btn-save-gmap-key');
    if (btnSaveGmapKey) {
      btnSaveGmapKey.addEventListener('click', () => {
        const key = elSettingGmapApiKey.value.trim();
        localStorage.setItem(STORAGE_KEYS.GMAP_KEY, key);
        elSettingsModal.classList.add('hidden');
        showToast('설정이 저장되었습니다. 지도를 새로고침합니다.', '⚙️');
        initMap();
      });
    }

    // 데이터 백업 및 복원
    document.getElementById('btn-backup-data').addEventListener('click', () => {
      const backupData = {
        stores,
        records,
        exportDate: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `전국당꼴_백업_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('백업 파일이 다운로드되었습니다.', '💾');
    });

    const fileInput = document.getElementById('input-restore-file');
    document.getElementById('btn-restore-data-trigger').addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          if (imported.stores && imported.records) {
            stores = imported.stores;
            records = imported.records;
            saveStores();
            saveRecords();
            initMap();
            renderRanking();
            renderHistory();
            elSettingsModal.classList.add('hidden');
            showToast('데이터가 성공적으로 복원되었습니다!', '✅');
          } else {
            alert('올바른 백업 파일 형식이 아닙니다.');
          }
        } catch (err) {
          alert('파일을 읽는 중 오류가 발생했습니다: ' + err.message);
        }
      };
      reader.readAsText(file);
    });

    // 샘플 데이터 재설정
    document.getElementById('btn-reset-demo').addEventListener('click', () => {
      if (confirm('모든 기록을 초기 데모 데이터로 재설정하시겠습니까?')) {
        stores = [...DEFAULT_STORES];
        records = [...DEFAULT_RECORDS];
        saveStores();
        saveRecords();
        initMap();
        renderRanking();
        renderHistory();
        elSettingsModal.classList.add('hidden');
        showToast('초기 데모 데이터로 복원되었습니다.', '🔄');
      }
    });

    // 전체 공유 버튼 (카카오톡/클립보드 복사)
    document.getElementById('btn-export-share').addEventListener('click', () => {
      if (records.length === 0) {
        showToast('공유할 경기 기록이 없습니다.', '⚠️');
        return;
      }
      const topRecord = records[0];
      const shareText = `[🎱 전국당꼴 - 오늘의 꼴찌 속보!]\n📍 당구장: ${topRecord.storeName}\n💀 오늘의 꼴찌: ${topRecord.loser}님\n💸 결제한 게임비: ${Number(topRecord.fee).toLocaleString()}원\n💬 한마디: "${topRecord.excuse || '할 말 없음'}"\n\n모두 모여 다음 대결을 준비합시다!`;

      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText).then(() => {
          showToast('공유 문구가 클립보드에 복사되었습니다! 카톡에 붙여넣으세요 💬', '📋');
        });
      } else {
        alert(shareText);
      }
    });

    // 랭킹 탭 전환
    document.querySelectorAll('.rank-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.rank-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentRankingTab = btn.dataset.tab;
        renderRanking();
      });
    });
  }

  // --- 하단 탭 네비게이션 ---
  function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        switchView(targetId);
      });
    });
  }

  function switchView(targetViewId) {
    document.querySelectorAll('.nav-item').forEach(b => {
      b.classList.toggle('active', b.dataset.target === targetViewId);
    });

    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.toggle('active', sec.id === targetViewId);
    });

    if (targetViewId === 'view-map') {
      if (currentMap) {
        setTimeout(() => currentMap.invalidateSize(), 100);
      }
    } else if (targetViewId === 'view-ranking') {
      renderRanking();
    } else if (targetViewId === 'view-history') {
      renderHistory();
    }
  }

  // --- 유틸리티 ---
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatKoreanDate(isoString) {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const m = d.getMonth() + 1;
      const day = d.getDate();
      const h = d.getHours();
      const min = String(d.getMinutes()).padStart(2, '0');
      const ampm = h >= 12 ? '오후' : '오전';
      const h12 = h % 12 || 12;
      return `${m}월 ${day}일 ${ampm} ${h12}:${min}`;
    } catch {
      return isoString;
    }
  }

  // 실행
  window.addEventListener('DOMContentLoaded', init);
})();

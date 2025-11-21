// ডেটা লোড করার জন্য একটি সার্বজনীন ফাংশন
async function fetchData(fileName) {
  try {
    const response = await fetch(fileName);
    if (!response.ok) throw new Error(`ফাইল লোড করা যায়নি: ${fileName}`);
    return await response.json();
  } catch (error) {
    console.error('ডেটা লোড করতে সমস্যা হয়েছে:', error);
    return [];
  }
}

// সূরা বা পারার তালিকা দেখানোর প্রধান ফাংশন
async function loadList(type) {
  const listContainer = document.getElementById('list-container');
  listContainer.innerHTML = '<div class="loading">লোড হচ্ছে...</div>';
  let data = [];
  let listHTML = '';

  if (type === 'surah') {
    data = await fetchData('surah_list.json');
    data.forEach(item => {
      listHTML += `
        <div class="list-item" onclick="openPdf(${item.start_page})">
          <div class="item-number">${item.surah_no}</div>
          <div class="item-details">
            <p><strong>${item.surah_name_bn}</strong> (${item.surah_name_ar})</p>
            <p class="item-info">আয়াত: ${item.total_ayat} | প্রকার: ${item.revelation_type}</p>
          </div>
          <div class="item-icon">&#128214;</div>
        </div>`;
    });
  } else if (type === 'para') {
    data = await fetchData('para_list.json');
    data.forEach(item => {
      listHTML += `
        <div class="list-item" onclick="openPdf(${item.start_page})">
          <div class="item-number">${item.para_number}</div>
          <div class="item-details">
            <p><strong>${item.para_name_ar}</strong></p> 
            <p class="item-info">${item.para_name_bn}</p>
          </div>
          <div class="item-icon">&#128214;</div>
        </div>`;
    });
  }
  listContainer.innerHTML = data.length ? listHTML : '<div class="error-message">❌ ডেটা পাওয়া যায়নি।</div>';
}

// পিডিএফ ভিউয়ার খোলার ফাংশন (চূড়ান্ত এবং সঠিক)
function openPdf(pageNumber) {
    const pdfViewer = document.getElementById('pdf-viewer');
    const pdfFrame = document.getElementById('pdf-frame'); // সঠিক id ব্যবহার করা হচ্ছে
    
    const pdfUrl = `${window.location.origin}${window.location.pathname.replace('index.html', '')}quran.pdf`;
    const viewerUrl = `lib/web/viewer.html?file=${encodeURIComponent(pdfUrl)}#page=${pageNumber}`;

    pdfFrame.src = viewerUrl;
    pdfViewer.classList.remove('hidden');
}

// পিডিএফ ভিউয়ার বন্ধ করার ফাংশন
function closePdf() {
  document.getElementById('pdf-viewer').classList.add('hidden');
  document.getElementById('pdf-frame').src = ''; // iframe রিসোর্স খালি করা
}

// ট্যাব পরিবর্তনের ফাংশন
function setupTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const type = tab.getAttribute('data-type');
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      loadList(type);
    });
  });
}

// পৃষ্ঠা লোড হওয়ার সাথে সাথে ডিফল্টভাবে সূরা তালিকা দেখানো এবং ট্যাব সেটআপ করা
window.onload = () => {
  setupTabs();
  loadList('surah');
};

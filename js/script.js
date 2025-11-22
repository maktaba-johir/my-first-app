document.addEventListener('DOMContentLoaded', () => {
    const surahListContainer = document.getElementById('surah-list');
    const paraListContainer = document.getElementById('para-list');
    const surahBtn = document.getElementById('surah-btn');
    const paraBtn = document.getElementById('para-btn');
    const pdfViewer = document.getElementById('pdf-viewer');
    const pdfEmbed = document.getElementById('pdf-embed');
    const closeBtn = document.getElementById('close-btn');
    const pageNumberInput = document.getElementById('page-number');
    const totalPagesSpan = document.getElementById('total-pages');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');

    let pdfDoc = null;
    let pageNum = 1;
    let pageIsRendering = false;
    let pageNumIsPending = null;
    let zoomLevel = 1.5;
    const RENDER_SCALE = 1.5;

    // Use the correct path for the hosted PDF file
    const pdfUrl = 'quran.pdf';

    // Load Surah and Para lists
    fetch('surah_list.json')
        .then(response => response.json())
        .then(data => {
            data.forEach(surah => {
                const li = document.createElement('li');
                li.innerHTML = `<span>${surah.name} (${surah.englishName})</span><span>${surah.page}</span>`;
                li.dataset.page = surah.page;
                surahListContainer.appendChild(li);
            });
        });

    fetch('para_list.json')
        .then(response => response.json())
        .then(data => {
            data.forEach(para => {
                const li = document.createElement('li');
                li.innerHTML = `<span>${para.name}</span><span>${para.page}</span>`;
                li.dataset.page = para.page;
                paraListContainer.appendChild(li);
            });
        });

    // Tab switching
    surahBtn.addEventListener('click', () => {
        surahBtn.classList.add('active');
        paraBtn.classList.remove('active');
        surahListContainer.style.display = 'block';
        paraListContainer.style.display = 'none';
    });

    paraBtn.addEventListener('click', () => {
        paraBtn.classList.add('active');
        surahBtn.classList.remove('active');
        paraListContainer.style.display = 'block';
        surahListContainer.style.display = 'none';
    });

    // Function to render page
    const renderPage = num => {
        pageIsRendering = true;
        pdfDoc.getPage(num).then(page => {
            const viewport = page.getViewport({ scale: zoomLevel });
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };

            page.render(renderContext).promise.then(() => {
                pageIsRendering = false;
                if (pageNumIsPending !== null) {
                    renderPage(pageNumIsPending);
                    pageNumIsPending = null;
                }
                // Clear previous canvas and append new one
                const container = document.getElementById('canvas-container');
                container.innerHTML = '';
                container.appendChild(canvas);
            });

            pageNumberInput.value = num;
        });
    };

    const queueRenderPage = num => {
        if (pageIsRendering) {
            pageNumIsPending = num;
        } else {
            renderPage(num);
        }
    };

    // PDF viewer logic
    const openPdfViewer = (page) => {
        pageNum = parseInt(page, 10);
        pdfViewer.style.display = 'flex';

        pdfjsLib.getDocument(pdfUrl).promise.then(pdfDoc_ => {
            pdfDoc = pdfDoc_;
            totalPagesSpan.textContent = pdfDoc.numPages;
            renderPage(pageNum);
        }).catch(err => {
            console.error('Error loading PDF:', err);
            // Display an error message to the user
            const container = document.getElementById('canvas-container');
            container.innerHTML = `<p style="color: white; text-align: center;">দুঃখিত, কুরআন ফাইলটি লোড করা যাচ্ছে না।</p><p style="color: white; text-align: center;">Error: ${err.message}</p>`;
        });
    };

    surahListContainer.addEventListener('click', (e) => {
        const li = e.target.closest('li');
        if (li && li.dataset.page) {
            openPdfViewer(li.dataset.page);
        }
    });

    paraListContainer.addEventListener('click', (e) => {
        const li = e.target.closest('li');
        if (li && li.dataset.page) {
            openPdfViewer(li.dataset.page);
        }
    });

    closeBtn.addEventListener('click', () => {
        pdfViewer.style.display = 'none';
    });

    prevPageBtn.addEventListener('click', () => {
        if (pageNum <= 1) return;
        pageNum--;
        queueRenderPage(pageNum);
    });

    nextPageBtn.addEventListener('click', () => {
        if (pageNum >= pdfDoc.numPages) return;
        pageNum++;
        queueRenderPage(pageNum);
    });

    pageNumberInput.addEventListener('change', () => {
        const newPageNum = parseInt(pageNumberInput.value, 10);
        if (newPageNum > 0 && newPageNum <= pdfDoc.numPages) {
            pageNum = newPageNum;
            queueRenderPage(pageNum);
        }
    });
    
    zoomInBtn.addEventListener('click', () => {
        zoomLevel += 0.25;
        renderPage(pageNum);
    });

    zoomOutBtn.addEventListener('click', () => {
        if (zoomLevel <= 0.5) return;
        zoomLevel -= 0.25;
        renderPage(pageNum);
    });

});

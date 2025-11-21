const { pdfjsLib } = globalThis;
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;

// Use a simple relative path for the PDF file
const pdfUrl = 'quran.pdf';

let pdfDoc = null,
    pageNum = 1,
    pageIsRendering = false,
    pageNumIsPending = null;

const scale = 1.5,
    canvas = document.querySelector('#pdf-render' ),
    ctx = canvas.getContext('2d');

// Render the page
const renderPage = num => {
    pageIsRendering = true;

    // Get page
    pdfDoc.getPage(num).then(page => {
        // Set scale
        const viewport = page.getViewport({ scale });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderCtx = {
            canvasContext: ctx,
            viewport
        };

        page.render(renderCtx).promise.then(() => {
            pageIsRendering = false;

            if (pageNumIsPending !== null) {
                renderPage(pageNumIsPending);
                pageNumIsPending = null;
            }
        });

        // Output current page
        document.querySelector('#page-num').textContent = num;
    });
};

// Check for pages rendering
const queueRenderPage = num => {
    if (pageIsRendering) {
        pageNumIsPending = num;
    } else {
        renderPage(num);
    }
};

// Show Prev Page
const showPrevPage = () => {
    if (pageNum <= 1) {
        return;
    }
    pageNum--;
    queueRenderPage(pageNum);
};

// Show Next Page
const showNextPage = () => {
    if (pageNum >= pdfDoc.numPages) {
        return;
    }
    pageNum++;
    queueRenderPage(pageNum);
};

// Go to a specific page
const goToPage = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= pdfDoc.numPages) {
        pageNum = pageNumber;
        queueRenderPage(pageNum);
    }
};

// Fetch Surah and Para lists
const fetchJson = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
};

const populateList = (elementId, data, pageOffset = 0) => {
    const listElement = document.getElementById(elementId);
    data.forEach(item => {
        const listItem = document.createElement('li');
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = `${item.id}. ${item.name} (${item.total_ayat || item.juz_name_arabic})`;
        link.onclick = (e) => {
            e.preventDefault();
            goToPage(item.page + pageOffset);
        };
        listItem.appendChild(link);
        listElement.appendChild(listItem);
    });
};

// Main function to initialize everything
const initializeApp = async () => {
    try {
        // Load PDF document
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        pdfDoc = await loadingTask.promise;
        document.querySelector('#page-count').textContent = pdfDoc.numPages;
        renderPage(pageNum);

        // Load Surah and Para lists
        const surahList = await fetchJson('surah_list.json');
        const paraList = await fetchJson('para_list.json');

        populateList('surah-list', surahList, 0); // No offset for Surah pages
        populateList('para-list', paraList, 0); // No offset for Para pages

    } catch (err) {
        // Display error
        const div = document.createElement('div');
        div.className = 'error';
        div.appendChild(document.createTextNode(err.message));
        document.querySelector('body').insertBefore(div, canvas);
        // Hide top bar
        document.querySelector('.top-bar').style.display = 'none';
    }
};


// Button Events
document.querySelector('#prev-page').addEventListener('click', showPrevPage);
document.querySelector('#next-page').addEventListener('click', showNextPage);

// Initialize the application
initializeApp();

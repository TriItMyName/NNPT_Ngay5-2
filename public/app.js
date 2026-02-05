const searchInput = document.getElementById('searchInput');
const pageSizeSelect = document.getElementById('pageSize');
const tableBody = document.getElementById('tableBody');
const pagination = document.getElementById('pagination');
const tooltip = document.getElementById('tooltip');

const sortTitleBtn = document.getElementById('sortTitleBtn');
const sortPriceBtn = document.getElementById('sortPriceBtn');

const detailModalEl = document.getElementById('detailModal');
const createModalEl = document.getElementById('createModal');

const detailId = document.getElementById('detailId');
const detailCategoryName = document.getElementById('detailCategoryName');
const detailImagePreview = document.getElementById('detailImagePreview');
const detailError = document.getElementById('detailError');

const editTitle = document.getElementById('editTitle');
const editPrice = document.getElementById('editPrice');
const editDesc = document.getElementById('editDesc');
const editCategoryId = document.getElementById('editCategoryId');
const editImageUrl = document.getElementById('editImageUrl');

const createImagePreview = document.getElementById('createImagePreview');
const createError = document.getElementById('createError');

const newTitle = document.getElementById('newTitle');
const newPrice = document.getElementById('newPrice');
const newDesc = document.getElementById('newDesc');
const newCategoryId = document.getElementById('newCategoryId');
const newImageUrl = document.getElementById('newImageUrl');

let products = [], filtered = [];
let currentPage = 1;
let pageSize = 10;
let selectedId = null;

let sortState = {
    field: null, // 'title' | 'price'
    dir: 'asc',
};

const API_BASE = '/api/products';

function setAlert(el, message) {
    if (!el) return;
    if (!message) {
        el.classList.add('d-none');
        el.textContent = '';
        return;
    }
    el.textContent = message;
    el.classList.remove('d-none');
}

function safeText(v) {
    return v == null ? '' : String(v);
}

function getFirstImage(p) {
    const img = Array.isArray(p?.images) ? p.images[0] : '';
    return typeof img === 'string' ? img : '';
}

function updatePreviewImage(imgEl, url) {
    if (!imgEl) return;
    const val = (url || '').trim();
    imgEl.src = val || 'https://placehold.co/600x400?text=No+Image';
}

async function loadData(){
    const res = await fetch(API_BASE);
    products = await res.json();
    applyFiltersAndRender();
}
loadData();

function applyFiltersAndRender() {
    const q = (searchInput.value || '').trim().toLowerCase();
    filtered = products.filter(p => safeText(p?.title).toLowerCase().includes(q));

    applySort();

    const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
    if (currentPage > pages) currentPage = pages;
    if (currentPage < 1) currentPage = 1;

    render();
}

searchInput.addEventListener('input', ()=>{
    currentPage = 1;
    applyFiltersAndRender();
});

pageSizeSelect.addEventListener('change', (e)=>{
    pageSize = +e.target.value;
    currentPage = 1;
    applyFiltersAndRender();
});

function setSort(field) {
    if (sortState.field === field) {
        sortState.dir = sortState.dir === 'asc' ? 'desc' : 'asc';
    } else {
        sortState.field = field;
        sortState.dir = 'asc';
    }
    applyFiltersAndRender();
}

function applySort() {
    if (!sortState.field) {
        updateSortButtons();
        return;
    }

    const dirMul = sortState.dir === 'asc' ? 1 : -1;
    const field = sortState.field;

    filtered.sort((a, b) => {
        if (field === 'price') {
            const av = Number(a?.price ?? 0);
            const bv = Number(b?.price ?? 0);
            return (av - bv) * dirMul;
        }
        if (field === 'title') {
            const av = safeText(a?.title).toLowerCase();
            const bv = safeText(b?.title).toLowerCase();
            return av.localeCompare(bv) * dirMul;
        }
        return 0;
    });

    updateSortButtons();
}

function updateSortButtons() {
    const arrow = (field) => {
        if (sortState.field !== field) return 'Sort';
        return sortState.dir === 'asc' ? 'Sort ↑' : 'Sort ↓';
    };
    if (sortTitleBtn) sortTitleBtn.textContent = arrow('title');
    if (sortPriceBtn) sortPriceBtn.textContent = arrow('price');
}

function paginate(){
    const start=(currentPage-1)*pageSize;
    return filtered.slice(start,start+pageSize);
}

function render(){
    const data=paginate();
    tableBody.innerHTML = "";

    data.forEach(p => {
        const tr = document.createElement('tr');
        tr.dataset.id = safeText(p?.id);
        tr._product = p;

        const tdId = document.createElement('td');
        tdId.textContent = safeText(p?.id);

        const tdTitle = document.createElement('td');
        tdTitle.className = 'fw-semibold';
        tdTitle.textContent = safeText(p?.title);

        const tdPrice = document.createElement('td');
        tdPrice.className = 'text-nowrap';
        tdPrice.textContent = `$${safeText(p?.price)}`;

        const tdCat = document.createElement('td');
        tdCat.textContent = safeText(p?.category?.name);

        const tdImg = document.createElement('td');
        const img = document.createElement('img');
        img.className = 'img-thumb';
        img.alt = 'thumb';
        img.loading = 'lazy';
        img.src = getFirstImage(p) || 'https://placehold.co/100x100?text=No+Image';
        tdImg.appendChild(img);

        tr.appendChild(tdId);
        tr.appendChild(tdTitle);
        tr.appendChild(tdPrice);
        tr.appendChild(tdCat);
        tr.appendChild(tdImg);

        tableBody.appendChild(tr);
    });

    renderPagination();
}

function renderPagination(){
    const pages=Math.ceil(filtered.length/pageSize);
    pagination.innerHTML="";

    if (pages <= 1) return;

    for(let i=1;i<=pages;i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i==currentPage?'active':''}`;
        const a = document.createElement('button');
        a.type = 'button';
        a.className = 'page-link';
        a.textContent = String(i);
        a.addEventListener('click', ()=>{
            currentPage = i;
            render();
        });
        li.appendChild(a);
        pagination.appendChild(li);
    }
}

function showDescAt(x, y, text) {
    tooltip.textContent = text || '';
    if (!text) {
        tooltip.style.display = 'none';
        return;
    }
    tooltip.style.display = 'block';
    tooltip.style.top = (y + 12) + 'px';
    tooltip.style.left = (x + 12) + 'px';
}

// Tooltip + click handler via event delegation
tableBody.addEventListener('mousemove', (e) => {
    const tr = e.target.closest('tr');
    if (!tr || !tableBody.contains(tr)) {
        tooltip.style.display = 'none';
        return;
    }
    const p = tr._product;
    const desc = safeText(p?.description);
    showDescAt(e.pageX, e.pageY, desc);
});

tableBody.addEventListener('mouseleave', () => {
    tooltip.style.display = 'none';
});

tableBody.addEventListener('click', (e) => {
    const tr = e.target.closest('tr');
    if (!tr || !tableBody.contains(tr)) return;
    const id = tr.dataset.id;
    if (!id) return;
    openDetail(+id);
});

function exportCSV(){
    function csvEscape(value) {
        const s = safeText(value);
        if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
        return s;
    }

    let csv="id,title,price,category,image\n";
    paginate().forEach(p=>{
        csv += [
            csvEscape(p?.id),
            csvEscape(p?.title),
            csvEscape(p?.price),
            csvEscape(p?.category?.name),
            csvEscape(getFirstImage(p)),
        ].join(',') + "\n";
    });
    const blob=new Blob([csv]);
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download="products.csv";
    a.click();
}

function openDetail(id){
    selectedId=id;
    const p=products.find(x=>x.id==id);

    setAlert(detailError, '');

    detailId.textContent = safeText(p?.id);
    detailCategoryName.textContent = safeText(p?.category?.name);
    editTitle.value = safeText(p?.title);
    editPrice.value = safeText(p?.price);
    editDesc.value = safeText(p?.description);
    editCategoryId.value = safeText(p?.category?.id ?? 1);
    editImageUrl.value = getFirstImage(p);

    updatePreviewImage(detailImagePreview, editImageUrl.value);

    const modal = bootstrap.Modal.getOrCreateInstance(detailModalEl);
    modal.show();
}

async function updateItem(){
    try {
        setAlert(detailError, '');
        const payload = {
            title: editTitle.value,
            price: +editPrice.value,
            description: editDesc.value,
            categoryId: +editCategoryId.value || 1,
            images: [editImageUrl.value || 'https://placehold.co/640x480?text=Image'],
        };

        const res = await fetch(`${API_BASE}/${selectedId}`,{
            method:"PUT",
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const txt = await res.text();
            throw new Error(txt || `Update failed (${res.status})`);
        }

        await loadData();
    } catch (err) {
        setAlert(detailError, err?.message || 'Failed to update product');
    }
}

function openCreate(){
    setAlert(createError, '');
    newTitle.value = '';
    newPrice.value = '';
    newDesc.value = '';
    newCategoryId.value = '1';
    newImageUrl.value = '';
    updatePreviewImage(createImagePreview, '');

    const modal = bootstrap.Modal.getOrCreateInstance(createModalEl);
    modal.show();
}

async function createItem(){
    try {
        setAlert(createError, '');
        const payload = {
            title: newTitle.value,
            price: +newPrice.value,
            description: newDesc.value,
            categoryId: +newCategoryId.value || 1,
            images: [newImageUrl.value || 'https://placehold.co/640x480?text=Image'],
        };

        const res = await fetch(API_BASE,{
            method:"POST",
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const txt = await res.text();
            throw new Error(txt || `Create failed (${res.status})`);
        }

        // Close modal after create
        bootstrap.Modal.getOrCreateInstance(createModalEl).hide();
        await loadData();
    } catch (err) {
        setAlert(createError, err?.message || 'Failed to create product');
    }
}
async function deleteItem(){
    await fetch(`${API_BASE}/${selectedId}`,{
        method:"DELETE"
    });
    loadData();
}

// Live preview for image fields
editImageUrl.addEventListener('input', ()=> updatePreviewImage(detailImagePreview, editImageUrl.value));
newImageUrl.addEventListener('input', ()=> updatePreviewImage(createImagePreview, newImageUrl.value));

// Initialize
pageSize = +pageSizeSelect.value;
updateSortButtons();
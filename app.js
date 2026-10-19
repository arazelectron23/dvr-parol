import { db, collection, getDocs, doc, deleteDoc, updateDoc, serverTimestamp } from "./firebase.js";
import { addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const dvrCollectionRef = collection(db, "dvr_records");

const dvrListContainer = document.getElementById("dvrListContainer");
const searchInput = document.getElementById("searchInput");
const dvrModal = document.getElementById("dvrModal");
const detailModal = document.getElementById("detailModal");
const openModalBtn = document.getElementById("openModalBtn");
const closeBtn = document.querySelector(".close-btn");
const closeModalBtn = document.querySelector(".close-modal");
const closeDetailCross = document.querySelector(".close-detail-btn");
const detailEditBtn = document.getElementById("detailEditBtn");
const detailDeleteBtn = document.getElementById("detailDeleteBtn");
const patternValueInput = document.getElementById("patternValue");
const patternDisplay = document.getElementById("patternDisplay");
const detailPattern = document.getElementById("detailPattern");
const copyPatternBtn = document.getElementById("copyPatternBtn");
const detailPatternBox = document.getElementById("detailPatternBox");
// Naxışa bax düyməsinə kliklədikdə modalı açmaq və xətləri çəkmək üçün:
const viewPatternBtn = document.getElementById("viewPatternBtn");
const viewPatternModal = document.getElementById("viewPatternModal");
const closeViewPatternBtn = document.querySelector(".close-view-pattern-btn");
const closeViewPatternModalBtn = document.getElementById("closeViewPatternModalBtn");

const dvrForm = document.getElementById("dvrForm");
const modalTitle = document.getElementById("modalTitle");
const dvrIdInput = document.getElementById("dvrId");

let allDvrData = [];
let currentDetailId = null;

// Yeni DVR Modalı açmaq
openModalBtn.addEventListener("click", () => {
    dvrForm.reset();
    dvrIdInput.value = "";
    modalTitle.textContent = "Yeni DVR Qeydiyyatı";
    
    dvrModal.style.display = "flex";
    setTimeout(() => {
        dvrModal.classList.add("active");
    }, 10);

    history.pushState({ modalOpen: true }, "");
});

function closeModal() {
    dvrModal.classList.remove("active");
    dvrModal.classList.add("closing");
    
    setTimeout(() => {
        dvrModal.style.display = "none";
        dvrModal.classList.remove("closing");
    }, 300);
}

function openDetailModal(item, dateStr) {
    currentDetailId = item.id;
    currentItemPattern = item.pattern || ""; // Naxış dəyərini yadda saxlayırıq
    
    // Növləri təyin edirik
    const entryType = item.entryType || "serial";
    
    document.getElementById("detailSerial").textContent = item.serialNumber || "-";
    document.getElementById("detailPassword").textContent = item.password || "-";
    
    // Detal modalındakı başlığı dinamik dəyişirik (S/N və ya Ad)
    const detailSerialTitleElement = document.getElementById("detailSerialTitle");
    if (detailSerialTitleElement) {
        detailSerialTitleElement.textContent = entryType === "customer" ? "Ad:" : "S/N:";
    }

    // Naxış qutusunun göstərilməsi və ya gizlədilməsi
    const detailPatternBox = document.getElementById("detailPatternBox");
    if (detailPatternBox) {
        if (item.pattern && item.pattern.trim() !== "" && item.pattern !== "Naxış çəkilməyib") {
            detailPatternBox.style.display = "flex";
        } else {
            detailPatternBox.style.display = "none";
        }
    }

    document.getElementById("detailDate").textContent = dateStr;

    // Qeyd varsa çərçivəni göstər, yoxdursa tamamilə gizlət
    const noteBox = document.getElementById("detailNoteBox");
    const detailNote = document.getElementById("detailNote");
    if (item.note && item.note.trim() !== "") {
        detailNote.textContent = item.note;
        noteBox.style.display = "flex";
    } else {
        noteBox.style.display = "none";
    }

    detailModal.style.display = "flex";
    setTimeout(() => {
        detailModal.classList.add("active");
    }, 10);

    history.pushState({ detailOpen: true }, "");
}

// Detal Modalını bağlamaq
function closeDetailModalFunc() {
    detailModal.classList.remove("active");
    detailModal.classList.add("closing");
    
    setTimeout(() => {
        detailModal.style.display = "none";
        detailModal.classList.remove("closing");
    }, 300);
}

function showNotification(message, type = 'success') {
    const toast = document.getElementById("toastNotification");
    if (!toast) return;
    
    toast.textContent = message;
    
    // Rəng təyini
    if (type === 'error') {
        toast.style.background = "#e74c3c"; // Qırmızı
    } else {
        toast.style.background = "#2ecc71"; // Yaşıl
    }
    
    // Əvvəlki taymerləri təmizləyirik (əgər ardıcıl cəld basılsa)
    if (toast.timeoutId) clearTimeout(toast.timeoutId);
    
    // Görünən etmək üçün 'show' sinfini əlavə edirik (sağdan sola içəri girir)
    toast.style.display = "block";
    setTimeout(() => {
        toast.classList.add("show");
    }, 10);
    
    // 2.5 saniyə sonra soldan sağa sürüşərək yoxa çıxır
    toast.timeoutId = setTimeout(() => {
        toast.classList.remove("show");
        
        // Animasiya bitdikdən sonra display-i none edirik
        setTimeout(() => {
            if (!toast.classList.contains("show")) {
                toast.style.display = "none";
            }
        }, 400); // CSS transition müddəti ilə eyni olmalıdır
    }, 2500);
}

// Kopyalama köməkçi funksiyası
function copyToClipboard(text, btnElement) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            triggerCopySuccess(btnElement);
        }).catch(err => {
            console.error("Clipboard API xətası, fallback sınanır...", err);
            fallbackCopyText(text, btnElement);
        });
    } else {
        fallbackCopyText(text, btnElement);
    }
}

function fallbackCopyText(text, btnElement) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            triggerCopySuccess(btnElement);
            showNotification("Mətn kopyalandı!", "success"); // Əlavə edildi
        } else {
            showNotification("Kopyalamaq mümkün olmadı.", "error"); // alert əvəzinə
        }
    } catch (err) {
        console.error('Fallback kopyalama xətası:', err);
        showNotification("Kopyalamaq mümkün olmadı.", "error"); // alert əvəzinə
    }
    document.body.removeChild(textarea);
}

function triggerCopySuccess(btnElement) {
    const originalHTML = btnElement.innerHTML;
    btnElement.innerHTML = `<i class="fa-solid fa-check" style="color: #2ecc71; font-size: 12px;"></i>`;
    btnElement.style.background = "rgba(46, 204, 113, 0.2)";

    setTimeout(() => {
        btnElement.innerHTML = originalHTML;
        btnElement.style.background = "#2a2a40";
    }, 1500);
}


// Təhlükəsiz kopyalama düyməsi dinləyiciləri
const copySerialBtn = document.getElementById("copySerialBtn");
if (copySerialBtn) {
    copySerialBtn.addEventListener("click", function() {
        const text = document.getElementById("detailSerial").textContent;
        if (text && text !== "-") copyToClipboard(text, this);
    });
}

const copyPasswordBtn = document.getElementById("copyPasswordBtn");
if (copyPasswordBtn) {
    copyPasswordBtn.addEventListener("click", function() {
        const text = document.getElementById("detailPassword").textContent;
        if (text && text !== "-") copyToClipboard(text, this);
    });
}

if (closeBtn) {
    closeBtn.addEventListener("click", () => {
        closeModal();
        if (history.state && history.state.modalOpen) history.back();
    });
}

if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
        closeModal();
        if (history.state && history.state.modalOpen) history.back();
    });
}

if (closeDetailCross) {
    closeDetailCross.addEventListener("click", () => {
        closeDetailModalFunc();
        if (history.state && history.state.detailOpen) history.back();
    });
}

// Modal içindən Redaktə düyməsi
if (detailEditBtn) {
    detailEditBtn.addEventListener("click", () => {
        if (currentDetailId) {
            // Əvvəlcə detalları silmədən birbaşa modalı vizual olaraq bağlayırıq (history.back işlətmədən)
            detailModal.classList.remove("active");
            detailModal.style.display = "none";
            
            // Redaktə formasını açırıq (bu yeni pushState əlavə edəcək)
            handleEdit(currentDetailId);
        }
    });
}

if (detailDeleteBtn) {
    detailDeleteBtn.addEventListener("click", async () => {
        if (currentDetailId) {
            // Standart confirm əvəzinə bizim kiçik modal açılır
            const isConfirmed = await showConfirmModal("Təsdiq");
            
            if (isConfirmed) {
                try {
                    await deleteDoc(doc(db, "dvr_records", currentDetailId));
                    closeDetailModalFunc();
                    if (history.state && history.state.detailOpen) history.back();
                    fetchDvrRecords();
                    showNotification("Qeyd uğurla silindi!", "success");
                } catch (error) {
                    console.error("Silmə xətası:", error);
                    showNotification("Silinərkən xəta baş verdi!", "error");
                }
            }
        }
    });
}

window.addEventListener("click", (e) => {
    if (e.target === dvrModal) {
        closeModal();
        if (history.state && history.state.modalOpen) history.back();
    }
    if (e.target === detailModal) {
        closeDetailModalFunc();
        if (history.state && history.state.detailOpen) history.back();
    }
});

window.addEventListener("popstate", () => {
    if (patternModal && patternModal.classList.contains("active")) {
        closePatternModalFunc();
    } else if (viewPatternModal && viewPatternModal.classList.contains("active")) {
        closeViewPatternModal();
    } else if (detailModal.classList.contains("active")) {
        closeDetailModalFunc();
    } else if (dvrModal.classList.contains("active")) {
        closeModal();
    }
});

async function fetchDvrRecords() {
    // Səhifə açılarkən və ya yenilənərkən animasiyanı göstəririk:
    dvrListContainer.innerHTML = `
        <div class="spinner-container">
            <div class="spinner"></div>
            <span>Yüklənir...</span>
        </div>
    `;
    
    try {
        const querySnapshot = await getDocs(dvrCollectionRef);
        allDvrData = [];
        querySnapshot.forEach((docSnap) => {
            allDvrData.push({ id: docSnap.id, ...docSnap.data() });
        });
        renderList(allDvrData);
    } catch (error) {
        console.error("Xəta:", error);
        dvrListContainer.innerHTML = `<div class="empty-text" style="color:red;">Məlumatları yükləmək olmadı. İnterneti yoxlayın.</div>`;
    }
}

function renderList(dataArray) {
    if (dataArray.length === 0) {
        dvrListContainer.innerHTML = `<div class="empty-text">Heç bir DVR qeydi tapılmadı.</div>`;
        return;
    }

    dataArray.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
    });

    dvrListContainer.innerHTML = "";
    dataArray.forEach((item) => {
        const card = document.createElement("div");
        card.className = "dvr-card card-clickable";
        card.dataset.id = item.id;
        card.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 5px 0;">
                <span class="customer-name" style="font-size: 16px; color: #fff;">${item.serialNumber || "-"}</span>
            </div>
        `;
        dvrListContainer.appendChild(card);
    });

    document.querySelectorAll(".card-clickable").forEach(el => {
        el.addEventListener("click", (e) => {
            const id = e.currentTarget.dataset.id;
            const item = allDvrData.find(d => d.id === id);
            if (item) {
               let dStr = "";
                if (item.createdAt && item.createdAt.toDate) {
                    const date = item.createdAt.toDate();
                    dStr = date.toLocaleDateString("az-AZ"); // Yalnız tarix (saat silindi)
                }
                openDetailModal(item, dStr);
            }
        });
    });
}

searchInput.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase().trim();
    const filtered = allDvrData.filter(item => {
        return (
            (item.serialNumber && item.serialNumber.toLowerCase().includes(term)) ||
            (item.note && item.note.toLowerCase().includes(term))
        );
    });
    renderList(filtered);
});

dvrForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = dvrIdInput.value;
    const serialNumber = document.getElementById("serialNumber").value.trim();
    const password = document.getElementById("password").value.trim();
    const pattern = patternValueInput.value.trim();
    const note = document.getElementById("note").value.trim();
    
    const entryType = document.querySelector('input[name="entryType"]:checked').value;

    // Yalnız Seriya / Müştəri adı məcburidir
    if (!serialNumber) {
        showNotification("Seriya Nömrəsi və ya Müştəri Adını daxil edin!", "error");
        return;
    }

    // Naxış artıq məcburi deyil, boş qala bilər.

    try {
        if (id) {
            const docRef = doc(db, "dvr_records", id);
            await updateDoc(docRef, { serialNumber, password, pattern, note, entryType });
            showNotification("Məlumat uğurla yeniləndi!", "success");
        } else {
            await addDoc(dvrCollectionRef, {
                serialNumber, password, pattern, note, entryType,
                createdAt: serverTimestamp()
            });
            showNotification("Yeni qeyd əlavə edildi!", "success");
        }
        closeModal();
        if (history.state && history.state.modalOpen) history.back();
        fetchDvrRecords();
    } catch (error) {
        console.error("Xəta:", error);
        showNotification("Yadda saxlanılarkən xəta baş verdi!", "error");
    }
});

function handleEdit(id) {
    const item = allDvrData.find(d => d.id === id);
    if (!item) return;

    dvrIdInput.value = item.id;
    document.getElementById("serialNumber").value = item.serialNumber || "";
    document.getElementById("password").value = item.password || "";
    
    // Əgər müştəri adıdırsa müştəri düyməsini, seriyadırsa seriya düyməsini aktiv edirik
    const entryType = item.entryType || "serial";
    if (entryType === "customer") {
        document.querySelector('input[name="entryType"][value="customer"]').checked = true;
        document.getElementById("inputTitleLabel").textContent = "Müştəri Adı";
        document.getElementById("serialNumber").placeholder = "Müştərinin adını daxil edin";
        typeCustomerLbl.style.background = "#1a1a2e";
        typeCustomerLbl.style.color = "#fff";
        typeSerialLbl.style.background = "transparent";
        typeSerialLbl.style.color = "#8899a6";
    } else {
        document.querySelector('input[name="entryType"][value="serial"]').checked = true;
        document.getElementById("inputTitleLabel").textContent = "Seriya Nömrəsi (S/N)";
        document.getElementById("serialNumber").placeholder = "Seriya nömrəsini daxil edin";
        typeSerialLbl.style.background = "#1a1a2e";
        typeSerialLbl.style.color = "#fff";
        typeCustomerLbl.style.background = "transparent";
        typeCustomerLbl.style.color = "#8899a6";
    }
    // Naxışı yüklə
    patternValueInput.value = item.pattern || "";
    if (item.pattern) {
        patternDisplay.value = "Naxış təyin edildi (" + item.pattern + ")";
    } else {
        patternDisplay.value = "";
    }

    document.getElementById("note").value = item.note || "";

    modalTitle.textContent = "Məlumatı Yenilə";
    dvrModal.style.display = "flex";
    setTimeout(() => {
        dvrModal.classList.add("active");
    }, 10);

    history.pushState({ modalOpen: true }, "");
}

fetchDvrRecords();

// Naxış Modalı Elementləri
const patternModal = document.getElementById("patternModal");
const openPatternModalBtn = document.getElementById("openPatternModalBtn");
const closePatternBtn = document.querySelector(".close-pattern-btn");
const clearPatternBtn = document.getElementById("clearPatternBtn");
const savePatternBtn = document.getElementById("savePatternBtn");
const patternPreviewText = document.getElementById("patternPreviewText");

let isDrawing = false;
let selectedDots = [];
const patternContainer = document.getElementById("patternLockContainer");
const dots = document.querySelectorAll(".pattern-dot");
const svg = document.querySelector(".pattern-line-svg");
const passwordInput = document.getElementById("password");

// Naxış Modalını Açmaq
if (openPatternModalBtn) {
    openPatternModalBtn.addEventListener("click", () => {
        patternModal.style.display = "flex";
        setTimeout(() => patternModal.classList.add("active"), 10);
        resetPattern();
    });
}

function closePatternModalFunc() {
    if (!patternModal.classList.contains("active")) return;
    patternModal.classList.remove("active");
    patternModal.classList.add("closing");
    setTimeout(() => {
        patternModal.style.display = "none";
        patternModal.classList.remove("closing");
    }, 300);
}

if (closePatternBtn) {
    closePatternBtn.addEventListener("click", () => {
        if (history.state && history.state.patternModalOpen) {
            history.back();
        } else {
            closePatternModalFunc();
        }
    });
}

// Əgər kənara kliklə bağlamaq hissəsi varsa onu da bu cür edin:
window.addEventListener("click", (e) => {
    if (e.target === patternModal) {
        if (history.state && history.state.patternModalOpen) {
            history.back();
        } else {
            closePatternModalFunc();
        }
    }
    // Digər modal yoxlamaları...
});

// Naxış çəkməfunksiyaları
function getDotCenter(dot) {
    const rect = patternContainer.getBoundingClientRect();
    const dotRect = dot.getBoundingClientRect();
    return {
        x: dotRect.left + dotRect.width / 2 - rect.left,
        y: dotRect.top + dotRect.height / 2 - rect.top
    };
}

function startDrawing(e) {
    isDrawing = true;
    selectedDots = [];
    svg.innerHTML = "";
    dots.forEach(d => d.classList.remove("active"));
    patternPreviewText.textContent = "Naxış çəkilir...";
    checkTouch(e);
}

function moveDrawing(e) {
    if (!isDrawing) return;
    checkTouch(e);
}

function stopDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
}

function checkTouch(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const target = document.elementFromPoint(clientX, clientY);
    if (target && target.classList.contains("pattern-dot")) {
        const dotId = target.dataset.id;
        if (!selectedDots.includes(dotId)) {
            selectedDots.push(dotId);
            target.classList.add("active");
            updateSvgLines();
            patternPreviewText.textContent = "Kod: " + selectedDots.join("-");
        }
    }
}

function updateSvgLines() {
    svg.innerHTML = "";
    for (let i = 0; i < selectedDots.length - 1; i++) {
        const dot1 = document.querySelector(`[data-id="${selectedDots[i]}"]`);
        const dot2 = document.querySelector(`[data-id="${selectedDots[i+1]}"]`);
        const c1 = getDotCenter(dot1);
        const c2 = getDotCenter(dot2);
        
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", c1.x);
        line.setAttribute("y1", c1.y);
        line.setAttribute("x2", c2.x);
        line.setAttribute("y2", c2.y);
        svg.appendChild(line);
    }
}

function resetPattern() {
    selectedDots = [];
    svg.innerHTML = "";
    dots.forEach(d => d.classList.remove("active"));
    patternPreviewText.textContent = "Naxış çəkilməyib";
}

if (clearPatternBtn) {
    clearPatternBtn.addEventListener("click", () => {
        resetPattern();
        patternValueInput.value = ""; // Gizli inputu təmizləyirik
        patternDisplay.value = "";  // Ekranda görünən sahəni təmizləyirik
    });
}

if (savePatternBtn) {
    savePatternBtn.addEventListener("click", () => {
        // Əgər naxış çəkilməyibsə və ya təmizlənibsə, boş olaraq yadda saxlasın
        if (selectedDots.length === 0) {
            patternValueInput.value = "";
            patternDisplay.value = "Naxış çəkilməyib";
            showNotification("Naxış silindi!", "success");
            closePatternModalFunc();
            return;
        }

        if (selectedDots.length === 1) {
            showNotification("Ən azı 2 nöqtə birləşdirməlisiniz və ya naxışı tamamilə təmizləyin!", "error");
            return;
        }

        const patternStr = selectedDots.join(" ➔ ");
        patternValueInput.value = patternStr;
        patternDisplay.value = "Naxış təyin edildi (" + patternStr + ")";
        showNotification("Naxış uğurla yadda saxlandı!", "success");
        closePatternModalFunc();
    });
}

// Event Listeners for Pattern Box
if (patternContainer) {
    patternContainer.addEventListener("mousedown", startDrawing);
    window.addEventListener("mousemove", moveDrawing);
    window.addEventListener("mouseup", stopDrawing);

    patternContainer.addEventListener("touchstart", startDrawing);
    window.addEventListener("touchmove", moveDrawing);
    window.addEventListener("touchend", stopDrawing);
}

if (copyPatternBtn) {
    copyPatternBtn.addEventListener("click", function() {
        const text = document.getElementById("detailPattern").textContent;
        if (text && text !== "Naxış yoxdur") copyToClipboard(text, this);
    });
}

let currentItemPattern = "";

if (viewPatternBtn) {
    viewPatternBtn.addEventListener("click", () => {
        if (viewPatternModal) {
            viewPatternModal.style.display = "flex";
            setTimeout(() => {
                viewPatternModal.classList.add("active");
            }, 10);
            
            drawSavedPattern(currentItemPattern);
            
            // Tarixçəyə əlavə edirik ki, geri düyməsi işləsin
            history.pushState({ viewPatternOpen: true }, "");
        }
    });
}

// Modalı bağlamaq düymələri
[closeViewPatternBtn, closeViewPatternModalBtn].forEach(btn => {
    if (btn) {
        btn.addEventListener("click", () => {
            if (viewPatternModal) viewPatternModal.style.display = "none";
        });
    }
});

function closeViewPatternModal() {
    if (!viewPatternModal.classList.contains("active")) return;
    viewPatternModal.classList.remove("active");
    viewPatternModal.classList.add("closing");
    setTimeout(() => {
        viewPatternModal.style.display = "none";
        viewPatternModal.classList.remove("closing");
    }, 300);
}

[closeViewPatternBtn, closeViewPatternModalBtn].forEach(btn => {
    if (btn) {
        btn.addEventListener("click", () => {
            if (history.state && history.state.viewPatternOpen) {
                history.back();
            } else {
                closeViewPatternModal();
            }
        });
    }
});

window.addEventListener("click", (e) => {
    if (e.target === viewPatternModal) {
        if (history.state && history.state.viewPatternOpen) {
            history.back();
        } else {
            closeViewPatternModal();
        }
    }
});

function drawSavedPattern(patternStr) {
    if (!viewPatternContainer) return;
    
    const dots = viewPatternContainer.querySelectorAll(".pattern-dot");
    const svg = viewPatternContainer.querySelector(".pattern-line-svg");
    const viewPatternText = document.getElementById("viewPatternText") || { textContent: "" };
    
    dots.forEach(d => d.classList.remove("active"));
    svg.innerHTML = "";

    if (!patternStr) return;

    const dotIds = patternStr.match(/\d+/g);
    if (!dotIds || dotIds.length === 0) return;

    viewPatternText.textContent = "Ardıcıllıq: " + patternStr;

    // Nöqtələri aktivləşdiririk
    dotIds.forEach(id => {
        const dot = viewPatternContainer.querySelector(`[data-id="${id}"]`);
        if (dot) dot.classList.add("active");
    });

    setTimeout(() => {
        svg.innerHTML = "";
        
        for (let i = 0; i < dotIds.length - 1; i++) {
            const d1 = viewPatternContainer.querySelector(`[data-id="${dotIds[i]}"]`);
            const d2 = viewPatternContainer.querySelector(`[data-id="${dotIds[i+1]}"]`);
            
            if (d1 && d2) {
                //offsetLeft və offsetTop birbaşa daxili konteynerə nəzərən tam mərkəzi verir
                const c1 = { 
                    x: d1.offsetLeft + d1.offsetWidth / 2, 
                    y: d1.offsetTop + d1.offsetHeight / 2 
                };
                const c2 = { 
                    x: d2.offsetLeft + d2.offsetWidth / 2, 
                    y: d2.offsetTop + d2.offsetHeight / 2 
                };

                const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                line.setAttribute("x1", c1.x);
                line.setAttribute("y1", c1.y);
                line.setAttribute("x2", c2.x);
                line.setAttribute("y2", c2.y);
                line.setAttribute("stroke", "#3498db");
                line.setAttribute("stroke-width", "4");
                line.setAttribute("stroke-linecap", "round");

                svg.appendChild(line);
            }
        }
    }, 50);
}

const radioInputs = document.querySelectorAll('input[name="entryType"]');
const inputTitleLabel = document.getElementById("inputTitleLabel");
const serialInput = document.getElementById("serialNumber");
const typeSerialLbl = document.getElementById("typeSerialLbl");
const typeCustomerLbl = document.getElementById("typeCustomerLbl");

radioInputs.forEach(radio => {
    radio.addEventListener("change", (e) => {
        if (e.target.value === "serial") {
            inputTitleLabel.textContent = "Seriya Nömrəsi (S/N)";
            serialInput.placeholder = "Seriya nömrəsini daxil edin";
            typeSerialLbl.style.background = "#1a1a2e";
            typeSerialLbl.style.color = "#fff";
            typeCustomerLbl.style.background = "transparent";
            typeCustomerLbl.style.color = "#8899a6";
        } else {
            inputTitleLabel.textContent = "Müştəri Adı";
            serialInput.placeholder = "Müştərinin adını daxil edin";
            typeCustomerLbl.style.background = "#1a1a2e";
            typeCustomerLbl.style.color = "#fff";
            typeSerialLbl.style.background = "transparent";
            typeSerialLbl.style.color = "#8899a6";
        }
    });
});

function showConfirmModal(message) {
    return new Promise((resolve) => {
        const modal = document.getElementById("customConfirmModal");
        const msgEl = document.getElementById("confirmMessage");
        const yesBtn = document.getElementById("confirmYesBtn");
        const noBtn = document.getElementById("confirmNoBtn");

        if (!modal) {
            resolve(confirm(message));
            return;
        }

        msgEl.textContent = message;
        modal.style.display = "flex";

        // Geri düyməsi (history) üçün state əlavə edirik
        history.pushState({ confirmOpen: true }, "");

        let isResolved = false;

        const close = (result) => {
            if (isResolved) return;
            isResolved = true;

            modal.style.display = "none";
            yesBtn.onclick = null;
            noBtn.onclick = null;
            modal.onclick = null;
            window.removeEventListener("popstate", handlePopState);

            // Əgər hələ də history state-də qalırsa, geri qaytarırıq
            if (history.state && history.state.confirmOpen) {
                history.back();
            }

            resolve(result);
        };

        const handlePopState = (e) => {
            if (isResolved) return;
            // Telefonun geri düyməsinə basıldıqda modalı ləğv et
            modal.style.display = "none";
            yesBtn.onclick = null;
            noBtn.onclick = null;
            modal.onclick = null;
            window.removeEventListener("popstate", handlePopState);
            isResolved = true;
            resolve(false);
        };

        // Telefonun geri düyməsini dinləyirik
        window.addEventListener("popstate", handlePopState);

        yesBtn.onclick = () => close(true);
        noBtn.onclick = () => close(false);

        // Modanın çölünə (qara fon hissəsinə) kliklədikdə bağlanması
        modal.onclick = (e) => {
            if (e.target === modal) {
                close(false);
            }
        };
    });
}
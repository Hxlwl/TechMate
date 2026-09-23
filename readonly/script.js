// TechMate shared interactions + simple in-browser page editor.

const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");

function openSidebar() {
    if (!sidebar || !menuToggle || !sidebarOverlay) return;
    sidebar.classList.add("open");
    menuToggle.classList.add("open");
    sidebarOverlay.classList.add("visible");
}

function closeSidebar() {
    if (!sidebar || !menuToggle || !sidebarOverlay) return;
    sidebar.classList.remove("open");
    menuToggle.classList.remove("open");
    sidebarOverlay.classList.remove("visible");
}

menuToggle?.addEventListener("click", () => {
    sidebar?.classList.contains("open") ? closeSidebar() : openSidebar();
});
sidebarOverlay?.addEventListener("click", closeSidebar);

document.querySelectorAll(".sidebar-nav a, .sidebar-cta").forEach((link) => {
    link.addEventListener("click", closeSidebar);
});

/* ---------------- Page editor ---------------- */
const EDIT_KEY = `techmate-page-${location.pathname.replace(/\\/g, "/")}`;
const editButton = document.getElementById("editPageButton");
let editorToolbar = null;
let editing = false;
let originalValues = new Map();

function getEditableElements() {
    const selectors = [
        "main .badge",
        "main h1",
        "main h2",
        "main h3",
        "main p",
        "main .card-kicker",
        "main .number",
        "main .rank",
        "main .player",
        "main .level",
        "main .score",
        "footer span"
    ];

    const elements = [];
    selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            if (!elements.includes(el)) elements.push(el);
        });
    });
    return elements;
}

function assignEditableKeys() {
    getEditableElements().forEach((el, index) => {
        if (!el.dataset.editable) el.dataset.editable = `item-${index}`;
    });
}

function loadSavedContent() {
    assignEditableKeys();
    const saved = localStorage.getItem(EDIT_KEY);
    if (!saved) return;

    try {
        const values = JSON.parse(saved);
        getEditableElements().forEach(el => {
            const key = el.dataset.editable;
            if (Object.prototype.hasOwnProperty.call(values, key)) {
                el.innerHTML = values[key];
            }
        });
    } catch (error) {
        console.warn("Could not load saved TechMate content.", error);
    }
}

function saveContent() {
    assignEditableKeys();
    const values = {};
    getEditableElements().forEach(el => {
        values[el.dataset.editable] = el.innerHTML;
    });
    localStorage.setItem(EDIT_KEY, JSON.stringify(values));
}

function restoreOriginal() {
    originalValues.forEach((html, el) => {
        el.innerHTML = html;
    });
}

function createToolbar() {
    editorToolbar = document.createElement("div");
    editorToolbar.className = "editor-toolbar";
    editorToolbar.innerHTML = `
        <span class="editor-hint">Click text to edit</span>
        <button class="save" type="button" data-editor-save>Save</button>
        <button type="button" data-editor-cancel>Cancel</button>
        <button type="button" data-editor-reset>Reset saved</button>
    `;
    document.body.appendChild(editorToolbar);

    editorToolbar.querySelector("[data-editor-save]").addEventListener("click", () => {
        saveContent();
        stopEditing();
    });

    editorToolbar.querySelector("[data-editor-cancel]").addEventListener("click", () => {
        restoreOriginal();
        stopEditing();
    });

    editorToolbar.querySelector("[data-editor-reset]").addEventListener("click", () => {
        if (!confirm("Reset all saved edits on this page?")) return;
        localStorage.removeItem(EDIT_KEY);
        location.reload();
    });
}

function startEditing() {
    if (editing) return;
    editing = true;
    assignEditableKeys();
    originalValues = new Map();

    getEditableElements().forEach(el => {
        originalValues.set(el, el.innerHTML);
        el.contentEditable = "true";
        el.spellcheck = true;
    });

    document.body.classList.add("editing");
    editButton.textContent = "Editing…";
    editButton.disabled = true;
    createToolbar();
}

function stopEditing() {
    editing = false;
    getEditableElements().forEach(el => {
        el.contentEditable = "false";
    });
    document.body.classList.remove("editing");
    if (editorToolbar) {
        editorToolbar.remove();
        editorToolbar = null;
    }
    if (editButton) {
        editButton.textContent = "Edit Page";
        editButton.disabled = false;
    }
}

editButton?.addEventListener("click", startEditing);

// Restore each page's saved content when it opens.
loadSavedContent();

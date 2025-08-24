// --- Configuration ---
const WEBHOOK_URL = "https://discord.com/api/webhooks/1408946665259536384/rA8d_H_vC3K4l7W5A8ELx1vaTQSIwNTk3xPlWFtp835is8uheOl5v-GLNZaz3GAqxhdX";

// --- DOM ---
const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const resultsList = document.getElementById("resultsList");
const dropzone = document.getElementById("dropzone");
const messageInput = document.getElementById("messageInput");
const usernameInput = document.getElementById("usernameInput");

// --- Helpers ---
function addResultRow(initialText = "", status = "") {
  const li = document.createElement("li");
  li.className = "result";

  const url = document.createElement("a");
  url.className = "result__url";
  url.href = initialText || "#";
  url.textContent = initialText || status || "—";
  url.target = "_blank";

  const right = document.createElement("div");
  right.style.display = "grid";
  right.style.gap = "6px";
  right.style.gridAutoFlow = "column";
  right.style.alignItems = "center";

  const statusEl = document.createElement("span");
  statusEl.className = "status";
  statusEl.textContent = status;

  const copyBtn = document.createElement("button");
  copyBtn.className = "copy";
  copyBtn.textContent = "Copy";
  copyBtn.addEventListener("click", async () => {
    const urlToCopy = url.href && url.href !== "#" ? url.href : url.textContent;
    if (!urlToCopy) return;
    try {
      await navigator.clipboard.writeText(urlToCopy);
      copyBtn.textContent = "Copied!";
      setTimeout(() => (copyBtn.textContent = "Copy"), 1000);
    } catch {
      copyBtn.textContent = "Err";
      setTimeout(() => (copyBtn.textContent = "Copy"), 1000);
    }
  });

  right.appendChild(statusEl);
  right.appendChild(copyBtn);
  li.appendChild(url);
  li.appendChild(right);
  resultsList.prepend(li);

  return { li, statusEl, copyBtn, url };
}

async function postFiles(files) {
  const username = usernameInput.value.trim();
  const content = messageInput.value.trim();

  for (const file of files) {
    const row = addResultRow("", `Uploading ${file.name}…`);
    const form = new FormData();

    const payload = {};
    if (content) payload.content = content;
    if (username) payload.username = username;
    form.append("payload_json", JSON.stringify(payload));

    form.append("files[0]", file, file.name);

    try {
      const res = await fetch(WEBHOOK_URL, { method: "POST", body: form });

      if (!res.ok) {
        const text = await res.text();
        row.statusEl.textContent = `Failed (${res.status})`;
        row.url.textContent = text.slice(0, 140) || "Error";
        row.url.removeAttribute("href");
        continue;
      }

      const data = await res.json().catch(() => null);
      const fileUrl = data?.attachments?.[0]?.url;
      if (fileUrl) {
        row.url.href = fileUrl;
        row.url.textContent = fileUrl;
        row.statusEl.textContent = "Done";
      } else {
        row.statusEl.textContent = "No URL in response";
        row.url.textContent = "—";
        row.url.removeAttribute("href");
      }
    } catch (err) {
      row.statusEl.textContent = "Network error";
      row.url.textContent = err.message || "Error";
      row.url.removeAttribute("href");
    }
  }

  // Reset input so the same file can be uploaded again
  fileInput.value = "";
}

// --- Events ---
uploadBtn.addEventListener("click", () => {
  const files = fileInput.files;
  if (!files || !files.length) {
    alert("Choose at least one file.");
    return;
  }
  postFiles(files);
});

["dragenter", "dragover"].forEach(evt =>
  dropzone.addEventListener(evt, e => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.add("dragging");
  })
);
["dragleave", "drop"].forEach(evt =>
  dropzone.addEventListener(evt, e => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove("dragging");
  })
);
dropzone.addEventListener("drop", e => {
  const dt = e.dataTransfer;
  if (!dt?.files?.length) return;
  fileInput.files = dt.files;
});

// Removed automatic file explorer opening
// dropzone.addEventListener("click", () => fileInput.click());

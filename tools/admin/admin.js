let state, parkId, imageDrafts = [], blogSlug;
const workspace = document.querySelector("#workspace"), status = document.querySelector("#status");
const escape = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const message = (value, error = false) => { status.textContent = value; status.classList.toggle("error", error); };
async function load() { const result = await fetch("/api/state"); if (!result.ok) throw new Error("Could not load the local editor."); state = await result.json(); }
async function save(path, value) {
  message("Saving…");
  const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json", "X-Admin-Token": state.token }, body: JSON.stringify(value) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error);
  await load();
  message("Saved to project files. Build and deploy when you want the live site updated.");
  return result;
}
function field(label, name, value = "", kind = "input") { return `<label>${escape(label)}${kind === "input" ? `<input name="${name}" value="${escape(value)}">` : `<textarea name="${name}">${escape(value)}</textarea>`}</label>`; }
function catchErrors(action) { return async (event) => { event?.preventDefault(); const button = event?.submitter; if (button) button.disabled = true; try { await action(event); } catch (error) { message(error.message, true); } finally { if (button) button.disabled = false; } }; }
function setTab(blogs) { document.querySelector("#parks-tab").setAttribute("aria-pressed", String(!blogs)); document.querySelector("#blogs-tab").setAttribute("aria-pressed", String(blogs)); }
function renderPark() {
  setTab(false);
  parkId ||= state.parks[0].id;
  const park = state.parks.find((item) => item.id === parkId);
  const evergreen = state.evergreen.find((item) => item.destinationId === parkId);
  const notice = state.notices.find((item) => item.destinationId === parkId) ?? {};
  imageDrafts = structuredClone(state.images.filter((image) => image.destinationId === parkId).sort((a, b) => a.position - b.position));
  workspace.innerHTML = `<label>Choose a park<select id="park-select">${state.parks.map((item) => `<option value="${escape(item.id)}" ${item.id === parkId ? "selected" : ""}>${escape(item.publicName)}</option>`).join("")}</select></label><h2>${escape(park.publicName)}</h2>
    <details><summary>Review official and evergreen content (read-only)</summary><h3>About this place</h3><p>${escape(evergreen?.overview?.text || "No reviewed overview.")}</p><pre>${escape(JSON.stringify(evergreen ?? {}, null, 2))}</pre><h3>Official inventory, amenities, map point, and source links</h3><pre>${escape(JSON.stringify(park, null, 2))}</pre><p class="hint">Transit remains sourced from the imported 511 dataset. It is not editable here.</p></details>
    <section class="notice"><h3>Park notice</h3><form id="notice-form"><label class="check"><input type="checkbox" name="active" ${notice.active ? "checked" : ""}> Show this notice</label>${field("Title", "title", notice.title)}${field("Body", "body", notice.body, "textarea")}<label>Expiration date (optional, through end of day in San Francisco)<input type="date" name="expiresOn" value="${escape(notice.expiresOn)}"></label><button>Save notice</button></form></section>
    <section><h3>Page images</h3><p class="hint">Full-image previews. Move up/down to set gallery order. Hidden images remain in Blob and the catalog. Save image changes after editing.</p><form id="images-form"><div id="image-list"></div><button>Save image changes</button></form></section>
    <section><h3>Upload a photograph to Vercel Blob</h3><p class="hint">Uploads become public immediately. Only upload images you have permission to share. The site does not display them until deployment. Originals are not kept by this tool.</p><form id="upload-form"><label>Image file (JPEG, PNG, WebP; maximum 20 MB)<input type="file" name="file" accept="image/jpeg,image/png,image/webp" required></label>${field("Caption", "caption")}${field("Alt text", "alt")}${field("Creator", "creator", "Michael Baker")}${field("Attribution", "attribution", "Photo by Michael Baker")}${field("License ID", "licenseId", "CC-BY-4.0")}${field("License URL", "licenseUrl", "https://creativecommons.org/licenses/by/4.0/")}<label class="check"><input type="checkbox" name="permission" required> I have permission to publish this photograph under the specified license.</label><button>Upload & add to this park</button></form></section>`;
  document.querySelector("#park-select").addEventListener("change", (event) => { parkId = event.target.value; renderPark(); });
  document.querySelector("#notice-form button").insertAdjacentHTML("beforebegin", `<label>More information URL (optional)<input type="url" name="url" value="${escape(notice.url)}" placeholder="https://sfrecpark.org/…"></label>${field("URL display text (optional)", "urlText", notice.urlText)}<p class="hint">Link to the official notice or another relevant web page. Display text defaults to the URL. Leave the URL blank to hide the entire More Information section.</p>`);
  workspace.querySelector("details").insertAdjacentHTML("beforeend", `<h3>Nearby transit (read-only)</h3><pre>${escape(JSON.stringify(state.nearbyTransit[parkId], null, 2))}</pre>`);
  renderImages();
  document.querySelector("#notice-form").addEventListener("submit", catchErrors(async (event) => { const values = Object.fromEntries(new FormData(event.target)); await save("/api/notices", { ...values, active: event.target.elements.active.checked, destinationId: parkId }); }));
  document.querySelector("#images-form").addEventListener("submit", catchErrors(async () => { await save("/api/images", { destinationId: parkId, images: imageDrafts }); renderPark(); }));
  document.querySelector("#upload-form").addEventListener("submit", catchErrors(async (event) => {
    const values = Object.fromEntries(new FormData(event.target)), file = values.file;
    if (!file.size || file.size > 20 * 1024 * 1024) throw new Error("Choose a non-empty photograph under 20 MB.");
    const base64 = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(",")[1]); reader.onerror = reject; reader.readAsDataURL(file); });
    delete values.file;
    await save("/api/upload", { ...values, filename: file.name, base64, destinationId: parkId });
    renderPark();
  }));
}
function renderImages() {
  const list = document.querySelector("#image-list");
  list.innerHTML = imageDrafts.length ? imageDrafts.map((image, index) => {
    const asset = state.blobAssets.find((item) => item.localPath === image.localPath);
    const src = asset?.variants?.at(-1)?.url ?? image.imageUrl;
    return `<div class="image-card" data-index="${index}"><h4>Image ${index + 1}${image.visible === false ? " — hidden" : ""}</h4><div class="preview"><img src="${escape(src)}" alt="${escape(image.alt)}"></div><p class="hint">${escape(image.originalFilename || image.commonsFileTitle || image.localPath)} · ${escape(image.sourceType || "wikimedia-commons")}</p><div class="actions"><button type="button" class="secondary move" data-offset="-1" ${index === 0 ? "disabled" : ""} aria-label="Move image ${index + 1} up">↑ Move up</button><button type="button" class="secondary move" data-offset="1" ${index === imageDrafts.length - 1 ? "disabled" : ""} aria-label="Move image ${index + 1} down">↓ Move down</button><a href="${escape(image.filePageUrl)}" target="_blank" rel="noopener noreferrer">Source image ↗</a></div><label class="check"><input type="checkbox" name="visible" ${image.visible !== false ? "checked" : ""}> Visible on the site</label>${field("Caption", "caption", image.caption, "textarea")}${field("Alt text", "alt", image.alt, "textarea")}<div class="grid">${field("Creator", "creator", image.creator)}${field("Attribution", "attribution", image.attribution)}</div>${image.sourceType === "project-original" ? `<div class="grid">${field("License ID", "licenseId", image.licenseId)}${field("License URL", "licenseUrl", image.licenseUrl)}</div>` : `<p>Source license (read-only): <a href="${escape(image.licenseUrl)}">${escape(image.licenseId)}</a></p>`}</div>`;
  }).join("") : "<p>No location photographs yet. Upload one below.</p>";
  list.querySelectorAll("input,textarea").forEach((input) => input.addEventListener("input", () => { const index = Number(input.closest(".image-card").dataset.index); imageDrafts[index][input.name] = input.type === "checkbox" ? input.checked : input.value; }));
  list.querySelectorAll(".move").forEach((button) => button.addEventListener("click", () => { const index = Number(button.closest(".image-card").dataset.index), target = index + Number(button.dataset.offset); [imageDrafts[index], imageDrafts[target]] = [imageDrafts[target], imageDrafts[index]]; renderImages(); list.querySelector(`[data-index="${target}"] .move`)?.focus(); }));
}
function renderBlogs() {
  setTab(true);
  const post = state.blogs.find((item) => item.slug === blogSlug) ?? state.blogs[0];
  blogSlug = post?.slug ?? "";
  workspace.innerHTML = `<section><h2>Blog posts</h2><label>Choose a post<select id="blog-select">${state.blogs.map((item) => `<option ${item.slug === blogSlug ? "selected" : ""}>${escape(item.slug)}</option>`).join("")}</select></label><button type="button" class="secondary" id="new-blog">New post</button><form id="blog-form">${field("Filename / slug (no .md)", "slug", blogSlug)}<label>Full Markdown, including YAML frontmatter<textarea id="markdown" name="markdown" spellcheck="false">${escape(post?.markdown)}</textarea></label><p class="hint">Use existing /media/ paths for blog covers and galleries. Keep title, summary, and publishedAt frontmatter. Saving changes project files immediately; the production build validates the complete schema.</p><button>Save blog post</button></form></section><details><summary>Available image paths for covers and galleries</summary>${state.images.map((image) => `<p><code>${escape(image.localPath)}</code> — ${escape(image.caption)}${image.visible === false ? " (hidden)" : ""}</p>`).join("")}</details>`;
  document.querySelector("#blog-select").addEventListener("change", (event) => { blogSlug = event.target.value; renderBlogs(); });
  document.querySelector("#new-blog").addEventListener("click", () => { const form = document.querySelector("#blog-form"); form.elements.slug.value = ""; form.elements.markdown.value = `---\ntitle: New park update\nsummary: A short description of this update.\npublishedAt: ${new Date().toISOString().slice(0, 10)}\n---\n\nWrite your post here.\n`; form.elements.slug.focus(); });
  document.querySelector("#blog-form").addEventListener("submit", catchErrors(async (event) => { const values = Object.fromEntries(new FormData(event.target)); await save("/api/blogs", values); blogSlug = values.slug; renderBlogs(); }));
}
document.querySelector("#parks-tab").addEventListener("click", renderPark);
document.querySelector("#blogs-tab").addEventListener("click", renderBlogs);
try { await load(); renderPark(); message(`Loaded ${state.parks.length} park pages and ${state.images.length} photographs. No server credentials are exposed to this editor.`); } catch (error) { message(error.message, true); }

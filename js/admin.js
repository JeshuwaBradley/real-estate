import { supabaseClient } from "./supabase.js";

let currentUser = null;
let properties = [];
let editingPropertyId = null;

const propertiesTableBody = document.getElementById("propertiesTableBody");
const propertySearch = document.getElementById("propertySearch");
const propertyStatusFilter = document.getElementById("propertyStatusFilter");

const propertyDialog = document.getElementById("propertyDialog");
const openPropertyDialogBtn = document.getElementById("openPropertyDialogBtn");
const closePropertyDialogBtn = document.getElementById("closePropertyDialogBtn");
const cancelPropertyBtn = document.getElementById("cancelPropertyBtn");
const propertyForm = document.getElementById("propertyForm");

const adminSidebar = document.getElementById("adminSidebar");
const adminSidebarToggle = document.getElementById("adminSidebarToggle");

const viewPropertyDialog = document.getElementById("viewPropertyDialog");
const closeViewPropertyDialogBtn = document.getElementById("closeViewPropertyDialogBtn");
const viewPropertyContent = document.getElementById("viewPropertyContent");

function moneyLkr(value) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0
  }).format(value);
}

async function requireAuth() {
  const {
    data: { session },
    error
  } = await supabaseClient.auth.getSession();

  if (error) {
    console.error("Auth session error:", error);
    window.location.href = "/login.html";
    return null;
  }

  if (!session) {
    window.location.href = "/login.html";
    return null;
  }

  currentUser = session.user;
  return session;
}

function getGradeClass(grade) {
  return `grade-${String(grade).toLowerCase()}`;
}

function getStatusClass(status) {
  return `status-${status}`;
}

function formatStatus(status) {
  if (status === "published") return "Published";
  if (status === "draft") return "Draft";
  if (status === "review") return "In Review";
  return status;
}

function renderProperties(items) {
  propertiesTableBody.innerHTML = items
    .map((property) => {
      const thumb = property.cover_image_url
        ? `<img class="admin-property-thumb" src="${property.cover_image_url}" alt="${property.title ?? "Property"}" />`
        : `<div class="admin-property-thumb-placeholder">No Image</div>`;

      return `
        <tr>
          <td>
            <div class="admin-property-cell">
              ${thumb}
              <div class="admin-property-main">
                <div class="admin-property-name">${property.title ?? "-"}</div>
                <div class="admin-property-meta">
                  ${property.location ?? "-"}${property.district ? `, ${property.district}` : ""}
                </div>
              </div>
            </div>
          </td>

          <td>${property.property_type ?? "-"}</td>

          <td>
            <span class="admin-badge ${getGradeClass(property.grade)}">
              Grade ${property.grade ?? "-"}
            </span>
          </td>

          <td>
            <span class="admin-badge ${getStatusClass(property.status)}">
              ${formatStatus(property.status)}
            </span>
          </td>

          <td class="admin-price-strong">
            ${property.price_display || moneyLkr(property.price || 0)}
          </td>

          <!--<td>
            <span class="admin-ref-code">${property.reference_code || "-"}</span>
          </td>-->

          <td>
            <div class="admin-row-actions">
              <button class="admin-action-btn edit-btn" type="button" data-edit-id="${property.id}">Edit</button>
              <button class="admin-action-btn view-btn" type="button" data-view-id="${property.id}">View</button>
              <button class="admin-action-btn delete-btn" type="button" data-delete-id="${property.id}">Delete</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  if (!items.length) {
    propertiesTableBody.innerHTML = `
      <tr>
        <td colspan="7" style="padding: 28px; text-align: center; color: var(--muted);">
          No properties found for the selected filters.
        </td>
      </tr>
    `;
  }
}

function filterProperties() {
  const searchValue = propertySearch.value.trim().toLowerCase();
  const statusValue = propertyStatusFilter.value;

  const filtered = properties.filter((property) => {
    const matchesSearch =
      !searchValue ||
      property.title?.toLowerCase().includes(searchValue) ||
      property.location?.toLowerCase().includes(searchValue) ||
      property.district?.toLowerCase().includes(searchValue) ||
      property.property_type?.toLowerCase().includes(searchValue);

    const matchesStatus = !statusValue || property.status === statusValue;

    return matchesSearch && matchesStatus;
  });

  renderProperties(filtered);
}

function openDialog() {
  propertyDialog.showModal();
}

function closeDialog() {
  propertyDialog.close();
  propertyForm.reset();
  editingPropertyId = null;
  const dialogTitle = document.getElementById("propertyDialogTitle");
  if (dialogTitle) dialogTitle.textContent = "Add Property";
}

async function fetchProperties() {
  const { data, error } = await supabaseClient
    .from("properties")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching properties:", error);
    alert("Failed to load properties.");
    return;
  }

  properties = data || [];
  filterProperties();
}

async function uploadPropertyImage(file) {
  if (!file) return { imageUrl: null, storagePath: null };

  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
  const filePath = `properties/${fileName}`;

  const { error: uploadError } = await supabaseClient.storage
    .from("property-images")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabaseClient.storage
    .from("property-images")
    .getPublicUrl(filePath);

  return {
    imageUrl: data.publicUrl,
    storagePath: filePath
  };
}

function getFormValues() {
  return {
    title: document.getElementById("propertyTitle").value.trim(),
    location: document.getElementById("propertyLocation").value.trim(),
    district: document.getElementById("propertyDistrict").value.trim(),
    price: Number(document.getElementById("propertyPrice").value),
    price_display: document.getElementById("propertyPriceDisplay").value.trim(),
    grade: document.getElementById("propertyGrade").value,
    listing_type: document.getElementById("listingType").value,
    property_type: document.getElementById("propertyType").value,
    condition: document.getElementById("propertyCondition").value.trim(),
    bedrooms: Number(document.getElementById("propertyBedrooms").value) || 0,
    summary: document.getElementById("propertySummary").value.trim(),
    facts: document
      .getElementById("propertyFacts")
      .value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean),
    verified: document.getElementById("propertyVerified").checked,
    status: document.getElementById("propertyStatus").value,
    reference_code: document.getElementById("propertyRef").value.trim()
  };
}

async function createProperty(values, imageFile) {
  let imageUrl = null;
  let storagePath = null;

  if (imageFile) {
    const upload = await uploadPropertyImage(imageFile);
    imageUrl = upload.imageUrl;
    storagePath = upload.storagePath;
  }

  const insertPayload = {
    ...values,
    cover_image_url: imageUrl
  };

  const { data, error } = await supabaseClient
    .from("properties")
    .insert([insertPayload])
    .select()
    .single();

  if (error) throw error;

  if (imageUrl) {
    const { error: imageError } = await supabaseClient
      .from("property_images")
      .insert([
        {
          property_id: data.id,
          image_url: imageUrl,
          storage_path: storagePath,
          is_cover: true,
          sort_order: 0
        }
      ]);

    if (imageError) throw imageError;
  }
}

async function updateProperty(id, values, imageFile) {
  let payload = { ...values };

  if (imageFile) {
    const upload = await uploadPropertyImage(imageFile);
    payload.cover_image_url = upload.imageUrl;

    const { error: imageError } = await supabaseClient
      .from("property_images")
      .insert([
        {
          property_id: id,
          image_url: upload.imageUrl,
          storage_path: upload.storagePath,
          is_cover: true,
          sort_order: 0
        }
      ]);

    if (imageError) throw imageError;
  }

  const { error } = await supabaseClient
    .from("properties")
    .update(payload)
    .eq("id", id);

  if (error) throw error;
}

async function deleteProperty(id) {
  const confirmed = window.confirm("Delete this property?");
  if (!confirmed) return;

  const { error } = await supabaseClient
    .from("properties")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Delete error:", error);
    alert("Failed to delete property.");
    return;
  }

  await fetchProperties();
}

function fillForm(property) {
  document.getElementById("propertyTitle").value = property.title ?? "";
  document.getElementById("propertyLocation").value = property.location ?? "";
  document.getElementById("propertyDistrict").value = property.district ?? "";
  document.getElementById("propertyPrice").value = property.price ?? "";
  document.getElementById("propertyPriceDisplay").value = property.price_display ?? "";
  document.getElementById("propertyGrade").value = property.grade ?? "";
  document.getElementById("listingType").value = property.listing_type ?? "";
  document.getElementById("propertyType").value = property.property_type ?? "";
  document.getElementById("propertyCondition").value = property.condition ?? "";
  document.getElementById("propertyBedrooms").value = property.bedrooms ?? "";
  document.getElementById("propertySummary").value = property.summary ?? "";
  document.getElementById("propertyFacts").value = Array.isArray(property.facts)
    ? property.facts.join("\n")
    : "";
  document.getElementById("propertyVerified").checked = !!property.verified;
  document.getElementById("propertyStatus").value = property.status ?? "draft";
  document.getElementById("propertyRef").value = property.reference_code ?? "";
}


function renderFacts(facts) {
  if (!Array.isArray(facts) || !facts.length) {
    return `<span class="admin-preview-fact">No facts added</span>`;
  }

  return facts
    .map((fact) => `<span class="admin-preview-fact">${fact}</span>`)
    .join("");
}

function renderPreview(property) {
  const imageMarkup = property.cover_image_url
    ? `
      <div class="admin-preview-image-wrap">
        <img src="${property.cover_image_url}" alt="${property.title ?? "Property"}" />
      </div>
    `
    : `
      <div class="admin-preview-image-empty">
        No property image uploaded
      </div>
    `;

  viewPropertyContent.innerHTML = `
    <div class="admin-preview-hero">
      ${imageMarkup}

      <div class="admin-preview-summary">
        <div class="admin-preview-topline">
          <span class="admin-badge ${getGradeClass(property.grade)}">Grade ${property.grade ?? "-"}</span>
          <span class="admin-badge ${getStatusClass(property.status)}">${formatStatus(property.status)}</span>
        </div>

        <h3 class="admin-preview-title">${property.title ?? "-"}</h3>
        <div class="admin-preview-location">
          ${property.location ?? "-"}${property.district ? `, ${property.district}` : ""}
        </div>
        <div class="admin-preview-price">
          ${property.price_display || moneyLkr(property.price || 0)}
        </div>
      </div>
    </div>

    <div class="admin-preview-grid">
      <div class="admin-preview-stat">
        <span>Property Type</span>
        <strong>${property.property_type ?? "-"}</strong>
      </div>
      <div class="admin-preview-stat">
        <span>Listing Type</span>
        <strong>${property.listing_type ?? "-"}</strong>
      </div>
      <div class="admin-preview-stat">
        <span>Bedrooms</span>
        <strong>${property.bedrooms ?? 0}</strong>
      </div>
      <div class="admin-preview-stat">
        <span>Reference</span>
        <strong>${property.reference_code ?? "-"}</strong>
      </div>
    </div>

    <div class="admin-preview-content">
      <div class="admin-preview-section">
        <h3>Summary</h3>
        <p>${property.summary || "No summary added."}</p>
      </div>

      <div class="admin-preview-section">
        <h3>Property Facts</h3>
        <div class="admin-preview-facts">
          ${renderFacts(property.facts)}
        </div>
      </div>

      <div class="admin-preview-section">
        <h3>Additional Details</h3>
        <p>
          <strong>Condition:</strong> ${property.condition || "-"}<br />
          <strong>Verified:</strong> ${property.verified ? "Yes" : "No"}
        </p>
      </div>
    </div>
  `;
}

function openViewDialog(property) {
  renderPreview(property);
  viewPropertyDialog.showModal();
}

function closeViewDialog() {
  viewPropertyDialog.close();
  viewPropertyContent.innerHTML = "";
}

function setupDialog() {
  openPropertyDialogBtn?.addEventListener("click", () => {
    editingPropertyId = null;
    const dialogTitle = document.getElementById("propertyDialogTitle");
    if (dialogTitle) dialogTitle.textContent = "Add Property";
    openDialog();
  });

  closePropertyDialogBtn?.addEventListener("click", closeDialog);
  cancelPropertyBtn?.addEventListener("click", closeDialog);
  closeViewPropertyDialogBtn?.addEventListener("click", closeViewDialog);

  propertyForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      const values = getFormValues();
      const imageFile = document.getElementById("propertyImageFile")?.files?.[0] || null;

      if (editingPropertyId) {
        await updateProperty(editingPropertyId, values, imageFile);
      } else {
        await createProperty(values, imageFile);
      }

      await fetchProperties();
      closeDialog();
    } catch (error) {
      console.error("Save property error:", error);
      alert(error.message || "Failed to save property.");
    }
  });
}

function setupFilters() {
  propertySearch?.addEventListener("input", filterProperties);
  propertyStatusFilter?.addEventListener("change", filterProperties);
}

function setupSidebar() {
  if (!adminSidebarToggle || !adminSidebar) return;

  adminSidebarToggle.addEventListener("click", () => {
    adminSidebar.classList.toggle("open");
  });
}

function setupTableActions() {
  propertiesTableBody?.addEventListener("click", async (event) => {
    const editId = event.target.dataset.editId;
    const deleteId = event.target.dataset.deleteId;
    const viewId = event.target.dataset.viewId;

    if (editId) {
      const property = properties.find((item) => item.id === editId);
      if (!property) return;

      editingPropertyId = editId;
      const dialogTitle = document.getElementById("propertyDialogTitle");
      if (dialogTitle) dialogTitle.textContent = "Edit Property";
      fillForm(property);
      openDialog();
      return;
    }

    if (deleteId) {
      await deleteProperty(deleteId);
      return;
    }

    if (viewId) {
	  const property = properties.find((item) => item.id === viewId);
	  if (!property) return;

	  openViewDialog(property);
	  return;
	}
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const session = await requireAuth();
  if (!session) return;

  setupDialog();
  setupFilters();
  setupSidebar();
  setupTableActions();
  await fetchProperties();
});
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

const savePropertyBtn = document.getElementById("savePropertyBtn");
const adminToastContainer = document.getElementById("adminToastContainer");
const adminSavingOverlay = document.getElementById("adminSavingOverlay");
const adminSavingText = document.getElementById("adminSavingText");

function moneyLkr(value) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0
  }).format(value);
}

function getErrorMessage(error) {
  if (!error) return "Something went wrong.";
  if (typeof error === "string") return error;
  return error.message || "Something went wrong.";
}

function showToast(message, type = "error", title = null) {
  if (!adminToastContainer) {
    window.alert(message);
    return;
  }

  const toast = document.createElement("div");
  toast.className = `admin-toast ${type}`;
  toast.innerHTML = `
    <div class="admin-toast-title">${title || (type === "success" ? "Success" : "Error")}</div>
    <div class="admin-toast-message">${message}</div>
  `;

  adminToastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4000);
}

function setSavingState(isSaving, text = "Saving property...") {
  if (savePropertyBtn) {
    savePropertyBtn.classList.toggle("is-loading", isSaving);
    savePropertyBtn.disabled = isSaving;
  }

  if (cancelPropertyBtn) {
    cancelPropertyBtn.disabled = isSaving;
  }

  if (closePropertyDialogBtn) {
    closePropertyDialogBtn.disabled = isSaving;
  }

  if (adminSavingOverlay) {
    adminSavingOverlay.hidden = !isSaving;
  }

  if (adminSavingText) {
    adminSavingText.textContent = text;
  }
}

async function removeUploadedFiles(storagePaths = []) {
  const validPaths = storagePaths.filter(Boolean);
  if (!validPaths.length) return;

  const { error } = await supabaseClient.storage
    .from("property-images")
    .remove(validPaths);

  if (error) {
    console.error("Failed to remove uploaded files during rollback:", error);
  }
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
                <div class="admin-property-name" title="${property.title}">${property.title ?? "-"}</div>
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
  document.getElementById("propertyImageFile").value = "";
  editingPropertyId = null;
  const dialogTitle = document.getElementById("propertyDialogTitle");
  if (dialogTitle) dialogTitle.textContent = "Add Property";
}

async function fetchProperties() {
  const { data, error } = await supabaseClient
    .from("properties")
    .select(`
      *,
      property_images (
        id,
        image_url,
        is_cover,
        sort_order
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching properties:", error);
    alert("Failed to load properties.");
    return;
  }

  properties = (data || []).map((property) => {
    const sortedImages = Array.isArray(property.property_images)
      ? [...property.property_images].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      : [];

    return {
      ...property,
      gallery_images: sortedImages
    };
  });

  filterProperties();
}

async function uploadPropertyImage(file) {
  if (!file) return { imageUrl: null, storagePath: null };

  const fileExt = file.name.split(".").pop();
  const safeName = file.name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}.${fileExt}`;
  const filePath = `properties/${fileName}`;

  const { error: uploadError } = await supabaseClient.storage
    .from("property-images")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false
    });

  if (uploadError) throw uploadError;

  const { data } = supabaseClient.storage
    .from("property-images")
    .getPublicUrl(filePath);

  return {
    imageUrl: data.publicUrl,
    storagePath: filePath
  };
}

async function uploadPropertyImages(files) {
  if (!files || !files.length) return [];

  const uploads = [];

  for (const file of files) {
    const uploaded = await uploadPropertyImage(file);
    uploads.push(uploaded);
  }

  return uploads;
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

async function createProperty(values, imageFiles) {
  let uploadedImages = [];
  let createdPropertyId = null;

  try {
    if (imageFiles && imageFiles.length) {
      uploadedImages = await uploadPropertyImages(imageFiles);
    }

    const coverImage = uploadedImages[0] || null;

    const insertPayload = {
      ...values,
      cover_image_url: coverImage?.imageUrl || null
    };

    const { data, error } = await supabaseClient
      .from("properties")
      .insert([insertPayload])
      .select()
      .single();

    if (error) throw error;

    createdPropertyId = data.id;

    if (uploadedImages.length) {
      const imageRows = uploadedImages.map((image, index) => ({
        property_id: data.id,
        image_url: image.imageUrl,
        storage_path: image.storagePath,
        is_cover: index === 0,
        sort_order: index
      }));

      const { error: imageError } = await supabaseClient
        .from("property_images")
        .insert(imageRows);

      if (imageError) throw imageError;
    }

    return data;
  } catch (error) {
    await removeUploadedFiles(uploadedImages.map((item) => item.storagePath));

    if (createdPropertyId) {
      const { error: cleanupError } = await supabaseClient
        .from("properties")
        .delete()
        .eq("id", createdPropertyId);

      if (cleanupError) {
        console.error("Failed to rollback created property:", cleanupError);
      }
    }

    throw error;
  }
}

async function updateProperty(id, values, imageFiles) {
  const existingProperty = properties.find((item) => item.id === id);
  let uploadedImages = [];
  const previousCoverImageUrl = existingProperty?.cover_image_url || null;

  try {
    let payload = { ...values };

    if (imageFiles && imageFiles.length) {
      uploadedImages = await uploadPropertyImages(imageFiles);
      const coverImage = uploadedImages[0];

      if (coverImage) {
        payload.cover_image_url = coverImage.imageUrl;
      }
    }

    const { error: updateError } = await supabaseClient
      .from("properties")
      .update(payload)
      .eq("id", id);

    if (updateError) throw updateError;

    if (uploadedImages.length) {
      const imageRows = uploadedImages.map((image, index) => ({
        property_id: id,
        image_url: image.imageUrl,
        storage_path: image.storagePath,
        is_cover: index === 0,
        sort_order: index
      }));

      const { error: imageError } = await supabaseClient
        .from("property_images")
        .insert(imageRows);

      if (imageError) {
        await supabaseClient
          .from("properties")
          .update({ cover_image_url: previousCoverImageUrl })
          .eq("id", id);

        throw imageError;
      }
    }
  } catch (error) {
    await removeUploadedFiles(uploadedImages.map((item) => item.storagePath));
    throw error;
  }
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
  const gallery = Array.isArray(property.gallery_images) ? property.gallery_images : [];
  const heroImage = property.cover_image_url || gallery[0]?.image_url || null;
  
  const imageMarkup = heroImage
    ? `
      <div class="admin-preview-image-wrap">
        <img src="${heroImage}" alt="${property.title ?? "Property"}" />
      </div>
    `
    : `
      <div class="admin-preview-image-empty">
        No property image uploaded
      </div>
    `;
  
  const galleryMarkup = gallery.length
    ? `
      <div class="admin-preview-gallery">
        ${gallery
          .map(
            (image) => `
              <img
                class="admin-preview-gallery-thumb"
                src="${image.image_url}"
                alt="${property.title ?? "Property"}"
              />
            `
          )
          .join("")}
      </div>
    `
    : "";

  viewPropertyContent.innerHTML = `
    <div class="admin-preview-hero">
      ${galleryMarkup}

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

	  const imageFiles = Array.from(document.getElementById("propertyImageFile")?.files || []);

	  try {
		setSavingState(true, editingPropertyId ? "Updating property..." : "Saving property...");

		const values = getFormValues();

		if (editingPropertyId) {
		  await updateProperty(editingPropertyId, values, imageFiles);
		  showToast("Property updated successfully.", "success", "Saved");
		} else {
		  await createProperty(values, imageFiles);
		  showToast("Property created successfully.", "success", "Saved");
		}

		await fetchProperties();
		closeDialog();
	  } catch (error) {
		console.error("Save property error:", error);
		showToast(getErrorMessage(error), "error", "Save failed");
	  } finally {
		setSavingState(false);
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
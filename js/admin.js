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
    .map(
      (property) => `
        <tr>
          <td class="admin-table-title">${property.title ?? "-"}</td>
          <td>${property.location ?? "-"}</td>
          <td>${property.property_type ?? "-"}</td>
          <td>
            <span class="admin-badge ${getGradeClass(property.grade)}">Grade ${property.grade ?? "-"}</span>
          </td>
          <td>
            <span class="admin-badge ${getStatusClass(property.status)}">${formatStatus(property.status)}</span>
          </td>
          <td>${property.price_display || moneyLkr(property.price || 0)}</td>
          <td>
            <div class="admin-row-actions">
              <button class="admin-action-btn" type="button" data-edit-id="${property.id}">Edit</button>
              <button class="admin-action-btn" type="button" data-view-id="${property.id}">View</button>
              <button class="admin-action-btn" type="button" data-delete-id="${property.id}">Delete</button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
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

function setupDialog() {
  openPropertyDialogBtn?.addEventListener("click", () => {
    editingPropertyId = null;
    const dialogTitle = document.getElementById("propertyDialogTitle");
    if (dialogTitle) dialogTitle.textContent = "Add Property";
    openDialog();
  });

  closePropertyDialogBtn?.addEventListener("click", closeDialog);
  cancelPropertyBtn?.addEventListener("click", closeDialog);

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

      alert(
        `${property.title}\n${property.location}\n${property.price_display || moneyLkr(property.price || 0)}`
      );
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
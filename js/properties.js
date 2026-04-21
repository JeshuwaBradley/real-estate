import { supabaseClient } from "./supabase.js";

let properties = [];

const propertyGrid = document.getElementById("propertyGrid");
const resultsCount = document.getElementById("resultsCount");
const filterForm = document.getElementById("filterForm");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");
const sortBy = document.getElementById("sortBy");

const searchLocation = document.getElementById("searchLocation");
const listingType = document.getElementById("listingType");
const propertyType = document.getElementById("propertyType");
const grade = document.getElementById("grade");
const condition = document.getElementById("condition");
const bedrooms = document.getElementById("bedrooms");
const budget = document.getElementById("budget");

function applyFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search);

  const locationValue = params.get("location") || "";
  const budgetValue = params.get("budget") || "";
  const gradeValue = params.get("grade") || "";
  const listingTypeValue = params.get("listingType") || "";
  const propertyTypeValue = params.get("propertyType") || "";

  const searchLocation = document.getElementById("searchLocation");
  const budget = document.getElementById("budget");
  const grade = document.getElementById("grade");
  const listingType = document.getElementById("listingType");
  const propertyType = document.getElementById("propertyType");

  if (searchLocation) searchLocation.value = locationValue;
  if (budget) budget.value = budgetValue;
  if (grade) grade.value = gradeValue;
  if (listingType) listingType.value = listingTypeValue;
  if (propertyType) propertyType.value = propertyTypeValue;
}

function moneyLkr(value) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function getGradeClass(gradeValue) {
  switch (gradeValue) {
    case "A":
      return "grade-a";
    case "B":
      return "grade-b";
    case "C":
      return "grade-c";
    case "D":
      return "grade-d";
    default:
      return "grade-b";
  }
}

function getBudgetMatch(price, budgetValue) {
  const numericPrice = Number(price) || 0;

  if (!budgetValue) return true;
  if (budgetValue === "below-15m") return numericPrice < 15000000;
  if (budgetValue === "15m-30m") return numericPrice >= 15000000 && numericPrice <= 30000000;
  if (budgetValue === "30m-60m") return numericPrice > 30000000 && numericPrice <= 60000000;
  if (budgetValue === "above-60m") return numericPrice > 60000000;

  return true;
}

function normaliseProperty(row) {
  return {
    id: row.id,
    title: row.title ?? "Untitled Property",
    location: row.location ?? "",
    district: row.district ?? "",
    price: Number(row.price) || 0,
    priceDisplay: row.price_display?.trim() || moneyLkr(row.price),
    grade: row.grade ?? "B",
    listingType: row.listing_type ?? "",
    propertyType: row.property_type ?? "",
    condition: row.condition ?? "",
    bedrooms: Number(row.bedrooms) || 0,
    summary: row.summary ?? "",
    image: row.cover_image_url || "https://placehold.co/1200x800?text=No+Image",
    facts: Array.isArray(row.facts) ? row.facts : [],
    verified: !!row.verified,
    createdAt: row.created_at ?? null
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderProperties(items) {
  if (!propertyGrid) return;

  if (!items.length) {
    propertyGrid.innerHTML = `
      <div class="property-card" style="grid-column: 1 / -1;">
        <div class="property-body">
          <h3 class="property-title">No properties found</h3>
          <p class="property-summary">
            Try adjusting your filters to see more results.
          </p>
        </div>
      </div>
    `;

    if (resultsCount) {
      resultsCount.textContent = "Showing 0 properties";
    }

    return;
  }

  propertyGrid.innerHTML = items
    .map((property) => {
      const listingLabel = property.listingType === "rent" ? "For Rent" : "For Sale";

      return `
        <article class="property-card">
          <div class="property-image-wrap">
            <img src="${escapeHtml(property.image)}" alt="${escapeHtml(property.title)}" />
            <span class="grade-badge ${getGradeClass(property.grade)}">Grade ${escapeHtml(property.grade)}</span>
          </div>

          <div class="property-body">
            <div class="property-status-row">
              <span class="status-chip">${listingLabel}</span>
              ${property.verified ? `<span class="status-chip verified-chip">Verified</span>` : ""}
            </div>

            <div class="property-meta">
              <span class="property-location">${escapeHtml(property.location)}</span>
              <span class="property-price">${escapeHtml(property.priceDisplay)}</span>
            </div>

            <h3 class="property-title">${escapeHtml(property.title)}</h3>
            <p class="property-summary">${escapeHtml(property.summary)}</p>

            <div class="property-facts">
              ${property.facts.map((fact) => `<span class="fact-pill">${escapeHtml(fact)}</span>`).join("")}
            </div>

            <div class="property-footer">
              <a href="./property.html?id=${encodeURIComponent(property.id)}" class="view-link">View Property</a>
              <!--<div class="property-card-actions">
                <a href="./property.html?id=${encodeURIComponent(property.id)}" class="btn btn-outline">Request Details</a>
              </div>-->
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  if (resultsCount) {
    resultsCount.textContent = `Showing ${items.length} propert${items.length === 1 ? "y" : "ies"}`;
  }
}

function getFilteredProperties() {
  const locationValue = searchLocation?.value.trim().toLowerCase() || "";
  const listingTypeValue = listingType?.value || "";
  const propertyTypeValue = propertyType?.value || "";
  const gradeValue = grade?.value || "";
  const conditionValue = condition?.value || "";
  const bedroomsValue = bedrooms?.value || "";
  const budgetValue = budget?.value || "";

  return properties.filter((property) => {
    const propertyLocation = (property.location || "").toLowerCase();
    const propertyDistrict = (property.district || "").toLowerCase();
    const propertyTitle = (property.title || "").toLowerCase();

    const matchesLocation =
      !locationValue ||
      propertyLocation.includes(locationValue) ||
      propertyDistrict.includes(locationValue) ||
      propertyTitle.includes(locationValue);

    const matchesListingType =
      !listingTypeValue || property.listingType === listingTypeValue;

    const matchesPropertyType =
      !propertyTypeValue || property.propertyType === propertyTypeValue;

    const matchesGrade =
      !gradeValue || property.grade === gradeValue;

    const matchesCondition =
      !conditionValue || property.condition === conditionValue;

    const matchesBedrooms =
      !bedroomsValue || property.bedrooms >= Number(bedroomsValue);

    const matchesBudget =
      getBudgetMatch(property.price, budgetValue);

    return (
      matchesLocation &&
      matchesListingType &&
      matchesPropertyType &&
      matchesGrade &&
      matchesCondition &&
      matchesBedrooms &&
      matchesBudget
    );
  });
}

function sortProperties(items) {
  const sortValue = sortBy?.value || "recommended";
  const sorted = [...items];

  if (sortValue === "price-low") {
    sorted.sort((a, b) => a.price - b.price);
  } else if (sortValue === "price-high") {
    sorted.sort((a, b) => b.price - a.price);
  } else if (sortValue === "grade-high") {
    const gradeOrder = { A: 4, B: 3, C: 2, D: 1 };
    sorted.sort((a, b) => (gradeOrder[b.grade] || 0) - (gradeOrder[a.grade] || 0));
  } else if (sortValue === "newest") {
    sorted.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  return sorted;
}

function updateProperties() {
  const filtered = getFilteredProperties();
  const sorted = sortProperties(filtered);
  renderProperties(sorted);
}

async function fetchProperties() {
  if (!propertyGrid) return;

  propertyGrid.innerHTML = `
    <div class="property-card" style="grid-column: 1 / -1;">
      <div class="property-body">
        <h3 class="property-title">Loading properties...</h3>
        <p class="property-summary">Please wait while listings are being fetched.</p>
      </div>
    </div>
  `;

  const { data, error } = await supabaseClient
    .from("properties")
    .select(`
      id,
      title,
      location,
      district,
      price,
      price_display,
      grade,
      listing_type,
      property_type,
      condition,
      bedrooms,
      summary,
      cover_image_url,
      facts,
      verified,
      status,
      created_at
    `)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching properties:", error);

    propertyGrid.innerHTML = `
      <div class="property-card" style="grid-column: 1 / -1;">
        <div class="property-body">
          <h3 class="property-title">Failed to load properties</h3>
          <p class="property-summary">Please try again later.</p>
        </div>
      </div>
    `;

    if (resultsCount) {
      resultsCount.textContent = "Showing 0 properties";
    }

    return;
  }

  properties = (data || []).map(normaliseProperty);
  updateProperties();
}

function setupFilters() {
  if (!filterForm) return;

  filterForm.addEventListener("submit", (event) => {
    event.preventDefault();
    updateProperties();
  });

  const liveFilterElements = [
    searchLocation,
    listingType,
    propertyType,
    grade,
    condition,
    bedrooms,
    budget
  ];

  liveFilterElements.forEach((element) => {
    if (!element) return;

    const eventName = element.tagName === "INPUT" ? "input" : "change";
    element.addEventListener(eventName, updateProperties);
  });

  sortBy?.addEventListener("change", updateProperties);

  clearFiltersBtn?.addEventListener("click", () => {
    filterForm.reset();

    if (sortBy) {
      sortBy.value = "recommended";
    }

    updateProperties();
  });
}

function setupMobileMenu() {
  const menuToggle = document.getElementById("menuToggle");
  const mainNav = document.getElementById("mainNav");

  if (!menuToggle || !mainNav) return;

  menuToggle.addEventListener("click", () => {
    mainNav.classList.toggle("active");
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  setupFilters();
  setupMobileMenu();
  applyFiltersFromUrl();
  await fetchProperties();
});
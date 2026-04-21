import { supabaseClient } from "./supabase.js";

let properties = [];

const propertyGrid = document.getElementById("propertyGrid");
const resultsCount = document.getElementById("resultsCount");
const filterForm = document.getElementById("filterForm");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");
const sortBy = document.getElementById("sortBy");

function moneyLkr(value) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function getGradeClass(grade) {
  switch (grade) {
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

function getBudgetMatch(price, budget) {
  const numericPrice = Number(price) || 0;

  if (!budget) return true;
  if (budget === "below-15m") return numericPrice < 15000000;
  if (budget === "15m-30m") return numericPrice >= 15000000 && numericPrice <= 30000000;
  if (budget === "30m-60m") return numericPrice > 30000000 && numericPrice <= 60000000;
  if (budget === "above-60m") return numericPrice > 60000000;

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
      const listingLabel =
        property.listingType === "rent" ? "For Rent" : "For Sale";

      return `
        <article class="property-card">
          <div class="property-image-wrap">
            <img src="${property.image}" alt="${property.title}" />
            <span class="grade-badge ${getGradeClass(property.grade)}">Grade ${property.grade}</span>
          </div>

          <div class="property-body">
            <div class="property-status-row">
              <span class="status-chip">${listingLabel}</span>
              ${property.verified ? `<span class="status-chip verified-chip">Verified</span>` : ""}
            </div>

            <div class="property-meta">
              <span class="property-location">${property.location}</span>
              <span class="property-price">${property.priceDisplay}</span>
            </div>

            <h3 class="property-title">${property.title}</h3>
            <p class="property-summary">${property.summary}</p>

            <div class="property-facts">
              ${property.facts.map((fact) => `<span class="fact-pill">${fact}</span>`).join("")}
            </div>

            <div class="property-footer">
              <a href="./property.html?id=${property.id}" class="view-link">View Property</a>
              <div class="property-card-actions">
                <a href="./property.html?id=${property.id}" class="btn btn-outline">Request Details</a>
              </div>
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
  const location = document.getElementById("searchLocation")?.value.trim().toLowerCase() || "";
  const listingTypeValue = document.getElementById("listingType")?.value || "";
  const propertyTypeValue = document.getElementById("propertyType")?.value || "";
  const gradeValue = document.getElementById("grade")?.value || "";
  const conditionValue = document.getElementById("condition")?.value || "";
  const bedroomsValue = document.getElementById("bedrooms")?.value || "";
  const budgetValue = document.getElementById("budget")?.value || "";

  return properties.filter((property) => {
    const matchesLocation =
      !location ||
      property.location.toLowerCase().includes(location) ||
      property.district.toLowerCase().includes(location) ||
      property.title.toLowerCase().includes(location);

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
  await fetchProperties();
});
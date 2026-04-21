import { supabaseClient } from "./supabase.js";

let featuredProperties = [];

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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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
    featured: !!row.featured,
    createdAt: row.created_at ?? null
  };
}

function renderFeaturedProperties(items) {
  const propertyGrid = document.getElementById("propertyGrid");
  if (!propertyGrid) return;

  if (!items.length) {
    propertyGrid.innerHTML = `
      <div class="property-card" style="grid-column: 1 / -1;">
        <div class="property-body">
          <h3 class="property-title">No featured properties available</h3>
          <p class="property-summary">Please add published properties in Supabase.</p>
        </div>
      </div>
    `;
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
              <a href="./property.html?id=${encodeURIComponent(property.id)}" class="btn btn-outline">Request Details</a>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function buildListingsUrl(filters) {
  const params = new URLSearchParams();

  if (filters.location) params.set("location", filters.location);
  if (filters.budget) params.set("budget", filters.budget);
  if (filters.grade) params.set("grade", filters.grade);
  if (filters.listingType) params.set("listingType", filters.listingType);
  if (filters.propertyType) params.set("propertyType", filters.propertyType);

  return `./properties.html?${params.toString()}`;
}

async function fetchFeaturedProperties() {
  const propertyGrid = document.getElementById("propertyGrid");
  if (!propertyGrid) return;

  propertyGrid.innerHTML = `
    <div class="property-card" style="grid-column: 1 / -1;">
      <div class="property-body">
        <h3 class="property-title">Loading featured properties...</h3>
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
      featured,
      status,
      created_at
    `)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    console.error("Error fetching featured properties:", error);

    propertyGrid.innerHTML = `
      <div class="property-card" style="grid-column: 1 / -1;">
        <div class="property-body">
          <h3 class="property-title">Failed to load featured properties</h3>
          <p class="property-summary">Please try again later.</p>
        </div>
      </div>
    `;
    return;
  }

  featuredProperties = (data || []).map(normaliseProperty);

  const featuredOnly = featuredProperties.filter((property) => property.featured);
  const finalItems = featuredOnly.length ? featuredOnly.slice(0, 3) : featuredProperties.slice(0, 3);

  renderFeaturedProperties(finalItems);
}

function setupMobileMenu() {
  const menuToggle = document.getElementById("menuToggle");
  const mainNav = document.getElementById("mainNav");

  if (!menuToggle || !mainNav) return;

  menuToggle.addEventListener("click", () => {
    mainNav.classList.toggle("active");
  });
}

function setupSearchForm() {
  const searchForm = document.getElementById("searchForm");
  if (!searchForm) return;

  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const location = document.getElementById("location")?.value.trim() || "";
    const budget = document.getElementById("budget")?.value || "";
    const grade = document.getElementById("grade")?.value || "";
    const listingType = document.getElementById("listingType")?.value || "";
    const propertyType = document.getElementById("propertyType")?.value || "";

    const targetUrl = buildListingsUrl({
      location,
      budget,
      grade,
      listingType,
      propertyType
    });

    window.location.href = targetUrl;
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  setupMobileMenu();
  setupSearchForm();
  await fetchFeaturedProperties();
});
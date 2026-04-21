import { supabaseClient } from "./supabase.js";

let currentProperty = null;
let relatedProperties = [];

function moneyLkr(value) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function getUrlPropertyId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
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

function formatListingType(value) {
  if (value === "rent") return "For Rent";
  if (value === "sale") return "For Sale";
  return "Listing";
}

function capitaliseWords(value) {
  return String(value || "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normaliseProperty(row) {
  const images = Array.isArray(row.property_images)
    ? [...row.property_images].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    : [];

  const gallery = images.map((item) => item.image_url).filter(Boolean);
  const coverImage = row.cover_image_url || gallery[0] || "https://placehold.co/1400x900?text=No+Image";

  return {
    id: row.id,
    title: row.title ?? "Untitled Property",
    location: row.location ?? "",
    district: row.district ?? "",
    referenceCode: row.reference_code ?? "-",
    listingType: row.listing_type ?? "",
    price: Number(row.price) || 0,
    priceDisplay: row.price_display?.trim() || moneyLkr(row.price),
    grade: row.grade ?? "B",
    summary: row.summary ?? "No summary added.",
    condition: row.condition ?? "",
    bedrooms: Number(row.bedrooms) || 0,
    propertyType: row.property_type ?? "",
    verified: !!row.verified,
    facts: Array.isArray(row.facts) ? row.facts : [],
    coverImage,
    gallery: gallery.length ? gallery : [coverImage],
    propertyImages: images,
    pros: Array.isArray(row.pros) ? row.pros : [],
    cons: Array.isArray(row.cons) ? row.cons : [],
    grading: Array.isArray(row.grading) ? row.grading : [],
    totalScore: Number(row.total_score) || null,
    inspectionNotes: row.inspection_notes ?? "",
    createdAt: row.created_at ?? null
  };
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderPropertyHeader(property) {
  document.title = `${property.title} | VeriEstate Sri Lanka`;

  setText("breadcrumbTitle", property.title);
  setText("propertyTitle", property.title);
  setText(
    "propertyLocation",
    `${property.location}${property.district ? `, ${property.district} District` : ""}`
  );
  setText("propertyRef", `Ref: ${property.referenceCode}`);
  setText("propertyPrice", property.priceDisplay);
  setText("propertySummary", property.summary);

  const listingTypeChip = document.getElementById("listingTypeChip");
  if (listingTypeChip) {
    listingTypeChip.textContent = formatListingType(property.listingType);
  }

  const gradeElement = document.getElementById("propertyGrade");
  if (gradeElement) {
    gradeElement.textContent = `Grade ${property.grade}`;
    gradeElement.className = `grade-badge property-grade-large ${getGradeClass(property.grade)}`;
  }
}

function renderQuickFacts(property) {
  const quickFactsGrid = document.getElementById("quickFactsGrid");
  if (!quickFactsGrid) return;

  const quickFacts = [
    { label: "Bedrooms", value: property.bedrooms || "-" },
    { label: "Condition", value: property.condition ? capitaliseWords(property.condition) : "-" },
    { label: "Property Type", value: property.propertyType ? capitaliseWords(property.propertyType) : "-" },
    { label: "District", value: property.district || "-" },
    { label: "Listing Type", value: formatListingType(property.listingType) },
    { label: "Verified", value: property.verified ? "Yes" : "No" }
  ];

  quickFactsGrid.innerHTML = quickFacts
    .map(
      (fact) => `
        <div class="quick-fact-item">
          <span class="quick-fact-label">${escapeHtml(fact.label)}</span>
          <span class="quick-fact-value">${escapeHtml(fact.value)}</span>
        </div>
      `
    )
    .join("");
}

function renderProsCons(property) {
  const prosList = document.getElementById("prosList");
  const consList = document.getElementById("consList");
  if (!prosList || !consList) return;

  const fallbackPros = [
    "Verified property information",
    "Clear pricing and summary",
    "Structured listing presentation"
  ];

  const fallbackCons = [
    "Independent legal review is still recommended"
  ];

  const pros = property.pros.length ? property.pros : fallbackPros;
  const cons = property.cons.length ? property.cons : fallbackCons;

  prosList.innerHTML = pros.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  consList.innerHTML = cons.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderGrading(property) {
  const gradingList = document.getElementById("gradingList");
  const gradingTotal = document.getElementById("gradingTotal");
  if (!gradingList || !gradingTotal) return;

  if (!property.grading.length) {
    gradingList.innerHTML = `
      <div class="grade-row">
        <div class="grade-row-top">
          <span>Overall Listing Quality</span>
          <span>${property.grade ? `Grade ${escapeHtml(property.grade)}` : "-"}</span>
        </div>
        <div class="grade-bar">
          <div class="grade-bar-fill" style="width: 75%;"></div>
        </div>
      </div>
    `;
    gradingTotal.textContent = property.totalScore ? `${property.totalScore} / 100` : "N/A";
    return;
  }

  const computedTotal = property.grading.reduce((sum, item) => sum + (Number(item.score) || 0), 0);
  const computedMax = property.grading.reduce((sum, item) => sum + (Number(item.max) || 0), 0);
  const total = property.totalScore || computedTotal;

  gradingTotal.textContent = computedMax ? `${total} / ${computedMax}` : `${total}`;

  gradingList.innerHTML = property.grading
    .map((item) => {
      const score = Number(item.score) || 0;
      const max = Number(item.max) || 0;
      const percentage = max ? (score / max) * 100 : 0;

      return `
        <div class="grade-row">
          <div class="grade-row-top">
            <span>${escapeHtml(item.label ?? "Score")}</span>
            <span>${score} / ${max}</span>
          </div>
          <div class="grade-bar">
            <div class="grade-bar-fill" style="width: ${percentage}%;"></div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderInspectionNotes(property) {
  setText(
    "inspectionNotes",
    property.inspectionNotes || "Inspection notes have not been added for this property yet."
  );
}

function renderGallery(property) {
  const mainImage = document.getElementById("mainPropertyImage");
  const galleryThumbs = document.getElementById("galleryThumbs");
  if (!mainImage || !galleryThumbs) return;

  const gallery = property.gallery.length ? property.gallery : [property.coverImage];

  mainImage.src = gallery[0];
  mainImage.alt = property.title;

  galleryThumbs.innerHTML = gallery
    .map(
      (image, index) => `
        <button class="gallery-thumb ${index === 0 ? "active-thumb" : ""}" data-image="${escapeHtml(image)}" type="button">
          <img src="${escapeHtml(image)}" alt="Property thumbnail ${index + 1}" />
        </button>
      `
    )
    .join("");
  const leftBtn = document.getElementById("thumbLeft");
  const rightBtn = document.getElementById("thumbRight");
  
  if (leftBtn && rightBtn && galleryThumbs) {
    leftBtn.onclick = () => {
      galleryThumbs.scrollBy({ left: -200, behavior: "smooth" });
    };
  
    rightBtn.onclick = () => {
      galleryThumbs.scrollBy({ left: 200, behavior: "smooth" });
    };
  }

  const thumbs = document.querySelectorAll(".gallery-thumb");
  thumbs.forEach((thumb) => {
    thumb.addEventListener("click", () => {
      const selectedImage = thumb.dataset.image;
      mainImage.src = selectedImage;

      thumbs.forEach((item) => item.classList.remove("active-thumb"));
      thumb.classList.add("active-thumb");
    });
  });
}

function renderRelatedProperties(items) {
  const relatedGrid = document.getElementById("relatedPropertiesGrid");
  if (!relatedGrid) return;

  if (!items.length) {
    relatedGrid.innerHTML = `
      <div class="property-section-empty">
        <p>No related properties available right now.</p>
      </div>
    `;
    return;
  }

  relatedGrid.innerHTML = items
    .map((property) => {
      const facts = Array.isArray(property.facts) ? property.facts.slice(0, 3) : [];

      return `
        <article class="property-card">
          <div class="property-image-wrap">
            <img src="${escapeHtml(property.coverImage)}" alt="${escapeHtml(property.title)}" />
            <span class="grade-badge ${getGradeClass(property.grade)}">Grade ${escapeHtml(property.grade)}</span>
          </div>

          <div class="property-body">
            <div class="property-meta">
              <span class="property-location">${escapeHtml(property.location)}</span>
              <span class="property-price">${escapeHtml(property.priceDisplay)}</span>
            </div>

            <h3 class="property-title">${escapeHtml(property.title)}</h3>
            <p class="property-summary">${escapeHtml(property.summary)}</p>

            <div class="property-facts">
              ${facts.map((fact) => `<span class="fact-pill">${escapeHtml(fact)}</span>`).join("")}
            </div>

            <div class="property-footer">
              <a href="./property.html?id=${property.id}" class="view-link">View Property</a>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function setupInquiryForm(property) {
  const inquiryForm = document.getElementById("inquiryForm");
  if (!inquiryForm) return;

  inquiryForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const fullName = document.getElementById("fullName")?.value.trim() || "";
    const phoneNumber = document.getElementById("phoneNumber")?.value.trim() || "";
    const emailAddress = document.getElementById("emailAddress")?.value.trim() || "";
    const message = document.getElementById("message")?.value.trim() || "";

    console.log("Inquiry submitted:", {
      propertyId: property.id,
      propertyRef: property.referenceCode,
      fullName,
      phoneNumber,
      emailAddress,
      message
    });

    alert("Inquiry form UI is ready. Next we can connect this to Supabase or Netlify Functions.");
    inquiryForm.reset();
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

function renderNotFound(message = "Property not found.") {
  const mainSection = document.querySelector(".property-page-section .property-main-content");
  if (mainSection) {
    mainSection.innerHTML = `
      <div class="property-section-card">
        <div class="section-heading-inline">
          <h2>${escapeHtml(message)}</h2>
        </div>
        <p class="property-long-summary">
          The property may have been removed, is no longer published, or the link is invalid.
        </p>
        <p>
          <a href="./properties.html" class="btn btn-primary">Back to Properties</a>
        </p>
      </div>
    `;
  }
}

async function fetchProperty(propertyId) {
  const { data, error } = await supabaseClient
    .from("properties")
    .select(`
      *,
      property_images (
        id,
        image_url,
        storage_path,
        is_cover,
        sort_order
      )
    `)
    .eq("id", propertyId)
    .eq("status", "published")
    .single();

  if (error) throw error;
  return normaliseProperty(data);
}

async function fetchRelatedProperties(property) {
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
      created_at
    `)
    .eq("status", "published")
    .neq("id", property.id)
    .eq("district", property.district)
    .limit(3);

  if (error) {
    console.error("Related properties fetch error:", error);
    return [];
  }

  return (data || []).map(normaliseProperty);
}

async function initPage() {
  setupMobileMenu();

  const propertyId = getUrlPropertyId();
  if (!propertyId) {
    renderNotFound("No property selected.");
    return;
  }

  try {
    currentProperty = await fetchProperty(propertyId);
    relatedProperties = await fetchRelatedProperties(currentProperty);

    renderPropertyHeader(currentProperty);
    renderQuickFacts(currentProperty);
    renderProsCons(currentProperty);
    renderGrading(currentProperty);
    renderInspectionNotes(currentProperty);
    renderGallery(currentProperty);
    renderRelatedProperties(relatedProperties);
    setupInquiryForm(currentProperty);
  } catch (error) {
    console.error("Property load error:", error);
    renderNotFound("Unable to load this property.");
  }
}

document.addEventListener("DOMContentLoaded", initPage);
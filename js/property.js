const propertyData = {
  ref: "VE-1024",
  title: "Contemporary Family Home in Colombo 07",
  location: "Colombo 07, Colombo District",
  listingType: "For Sale",
  price: "LKR 68,000,000",
  grade: "A",
  totalScore: 88,
  summary:
    "Well-maintained family home in a prime residential area with strong overall presentation, practical internal flow, and a more polished residential setting than many comparable properties currently available.",
  inspectionNotes:
    "This property presents strongly in person and stands out for its location, usable internal flow, and general maintenance standard. The structure appears sound at a visual level, and the home offers a comfortable move-in-ready experience with only limited cosmetic improvements likely to add further value.",
  quickFacts: [
    { label: "Bedrooms", value: "4" },
    { label: "Bathrooms", value: "3" },
    { label: "Land Size", value: "12 Perches" },
    { label: "Building Size", value: "4,200 sqft" },
    { label: "Parking", value: "2 Vehicles" },
    { label: "Condition", value: "Move-in Ready" },
    { label: "Property Type", value: "House" },
    { label: "District", value: "Colombo" }
  ],
  pros: [
    "Prime residential location with strong convenience",
    "Well-kept interiors and solid overall presentation",
    "Good natural light and practical internal layout",
    "More confidence-inspiring than many comparable listings"
  ],
  cons: [
    "Some buyers may still prefer minor interior modernization",
    "Price point places it in a more premium segment",
    "Parking capacity may feel limited for larger households"
  ],
  grading: [
    { label: "Structural Condition", score: 18, max: 20 },
    { label: "Interior Quality", score: 13, max: 15 },
    { label: "Exterior & Land", score: 12, max: 15 },
    { label: "Location & Accessibility", score: 19, max: 20 },
    { label: "Functional Layout", score: 9, max: 10 },
    { label: "Utilities & Infrastructure", score: 9, max: 10 },
    { label: "Legal Confidence", score: 8, max: 10 }
  ],
  gallery: [
    "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=1400",
    "https://images.pexels.com/photos/280229/pexels-photo-280229.jpeg?auto=compress&cs=tinysrgb&w=1400"
  ]
};

const relatedProperties = [
  {
    title: "Refined Villa in Rajagiriya",
    location: "Rajagiriya",
    price: "LKR 54,000,000",
    grade: "A",
    summary: "A polished city-edge home with strong presentation and practical comfort.",
    image:
      "https://images.pexels.com/photos/439391/pexels-photo-439391.jpeg?auto=compress&cs=tinysrgb&w=1200",
    facts: ["3 Beds", "2 Baths", "2,800 sqft"]
  },
  {
    title: "Premium Residence in Dehiwala",
    location: "Dehiwala",
    price: "LKR 47,500,000",
    grade: "B",
    summary: "A spacious family-oriented property with strong convenience and good value.",
    image:
      "https://images.pexels.com/photos/280222/pexels-photo-280222.jpeg?auto=compress&cs=tinysrgb&w=1200",
    facts: ["4 Beds", "3 Baths", "3,600 sqft"]
  }
];

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

function renderPropertyHeader() {
  document.getElementById("breadcrumbTitle").textContent = propertyData.title;
  document.getElementById("propertyTitle").textContent = propertyData.title;
  document.getElementById("propertyLocation").textContent = propertyData.location;
  document.getElementById("propertyRef").textContent = `Ref: ${propertyData.ref}`;
  document.getElementById("propertyPrice").textContent = propertyData.price;
  document.getElementById("propertySummary").textContent = propertyData.summary;
  document.getElementById("inspectionNotes").textContent = propertyData.inspectionNotes;
  document.getElementById("gradingTotal").textContent = `${propertyData.totalScore} / 100`;

  const gradeElement = document.getElementById("propertyGrade");
  gradeElement.textContent = `Grade ${propertyData.grade}`;
  gradeElement.className = `grade-badge property-grade-large ${getGradeClass(propertyData.grade)}`;

  document.getElementById("listingTypeChip").textContent = propertyData.listingType;
}

function renderQuickFacts() {
  const quickFactsGrid = document.getElementById("quickFactsGrid");
  quickFactsGrid.innerHTML = propertyData.quickFacts
    .map(
      (fact) => `
        <div class="quick-fact-item">
          <span class="quick-fact-label">${fact.label}</span>
          <span class="quick-fact-value">${fact.value}</span>
        </div>
      `
    )
    .join("");
}

function renderProsCons() {
  const prosList = document.getElementById("prosList");
  const consList = document.getElementById("consList");

  prosList.innerHTML = propertyData.pros.map((item) => `<li>${item}</li>`).join("");
  consList.innerHTML = propertyData.cons.map((item) => `<li>${item}</li>`).join("");
}

function renderGrading() {
  const gradingList = document.getElementById("gradingList");

  gradingList.innerHTML = propertyData.grading
    .map((item) => {
      const percentage = (item.score / item.max) * 100;

      return `
        <div class="grade-row">
          <div class="grade-row-top">
            <span>${item.label}</span>
            <span>${item.score} / ${item.max}</span>
          </div>
          <div class="grade-bar">
            <div class="grade-bar-fill" style="width: ${percentage}%;"></div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderGallery() {
  const mainImage = document.getElementById("mainPropertyImage");
  const galleryThumbs = document.getElementById("galleryThumbs");

  mainImage.src = propertyData.gallery[0];

  galleryThumbs.innerHTML = propertyData.gallery
    .map(
      (image, index) => `
        <button class="gallery-thumb ${index === 0 ? "active-thumb" : ""}" data-image="${image}" type="button">
          <img src="${image}" alt="Property thumbnail ${index + 1}" />
        </button>
      `
    )
    .join("");

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

function renderRelatedProperties() {
  const relatedGrid = document.getElementById("relatedPropertiesGrid");

  relatedGrid.innerHTML = relatedProperties
    .map((property) => {
      return `
        <article class="property-card">
          <div class="property-image-wrap">
            <img src="${property.image}" alt="${property.title}" />
            <span class="grade-badge ${getGradeClass(property.grade)}">Grade ${property.grade}</span>
          </div>

          <div class="property-body">
            <div class="property-meta">
              <span class="property-location">${property.location}</span>
              <span class="property-price">${property.price}</span>
            </div>

            <h3 class="property-title">${property.title}</h3>
            <p class="property-summary">${property.summary}</p>

            <div class="property-facts">
              ${property.facts.map((fact) => `<span class="fact-pill">${fact}</span>`).join("")}
            </div>

            <div class="property-footer">
              <a href="#" class="view-link">View Property</a>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function setupInquiryForm() {
  const inquiryForm = document.getElementById("inquiryForm");

  inquiryForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const fullName = document.getElementById("fullName").value.trim();
    const phoneNumber = document.getElementById("phoneNumber").value.trim();
    const emailAddress = document.getElementById("emailAddress").value.trim();
    const message = document.getElementById("message").value.trim();

    console.log("Inquiry submitted:", {
      propertyRef: propertyData.ref,
      fullName,
      phoneNumber,
      emailAddress,
      message
    });

    alert("Inquiry form UI is ready. We can connect this to Supabase and Netlify Functions next.");
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

document.addEventListener("DOMContentLoaded", () => {
  renderPropertyHeader();
  renderQuickFacts();
  renderProsCons();
  renderGrading();
  renderGallery();
  renderRelatedProperties();
  setupInquiryForm();
  setupMobileMenu();
});
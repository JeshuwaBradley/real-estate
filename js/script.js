const featuredProperties = [
  {
    title: "Contemporary Family Home in Colombo 07",
    location: "Colombo 07",
    price: "LKR 68,000,000",
    grade: "A",
    summary: "Well-maintained home in a prime residential area with strong overall presentation.",
    image:
      "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1200",
    facts: ["4 Beds", "3 Baths", "4,200 sqft"]
  },
  {
    title: "Refined Coastal Villa in Negombo",
    location: "Negombo",
    price: "LKR 42,500,000",
    grade: "B",
    summary: "A bright and attractive property with strong lifestyle appeal and good access.",
    image:
      "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1200",
    facts: ["3 Beds", "2 Baths", "Near Beach"]
  },
  {
    title: "Investor-Friendly House in Kandy",
    location: "Kandy",
    price: "LKR 24,000,000",
    grade: "B",
    summary: "Solid location and layout with potential for upgrades and long-term value.",
    image:
      "https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=1200",
    facts: ["3 Beds", "2 Baths", "12 Perches"]
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

function renderFeaturedProperties() {
  const propertyGrid = document.getElementById("propertyGrid");
  if (!propertyGrid) return;

  propertyGrid.innerHTML = featuredProperties
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
              <a href="#" class="btn btn-outline">Request Details</a>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
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

    const location = document.getElementById("location").value.trim();
    const budget = document.getElementById("budget").value;
    const grade = document.getElementById("grade").value;
    const listingType = document.getElementById("listingType").value;
    const propertyType = document.getElementById("propertyType").value;

    console.log("Search submitted:", {
      location,
      budget,
      grade,
      listingType,
      propertyType
    });

    alert("Search UI is ready. We can connect this to the listings page next.");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderFeaturedProperties();
  setupMobileMenu();
  setupSearchForm();
});
const properties = [
  {
    title: "Contemporary Family Home in Colombo 07",
    location: "Colombo 07",
    district: "Colombo",
    price: 68000000,
    priceDisplay: "LKR 68,000,000",
    grade: "A",
    listingType: "sale",
    propertyType: "house",
    condition: "move-in-ready",
    bedrooms: 4,
    summary:
      "Well-maintained home in a prime residential area with strong overall presentation.",
    image:
      "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1200",
    facts: ["4 Beds", "3 Baths", "4,200 sqft"],
    verified: true
  },
  {
    title: "Refined Coastal Villa in Negombo",
    location: "Negombo",
    district: "Gampaha",
    price: 42500000,
    priceDisplay: "LKR 42,500,000",
    grade: "B",
    listingType: "sale",
    propertyType: "villa",
    condition: "good",
    bedrooms: 3,
    summary:
      "A bright and attractive property with strong lifestyle appeal and good access.",
    image:
      "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1200",
    facts: ["3 Beds", "2 Baths", "Near Beach"],
    verified: true
  },
  {
    title: "Investor-Friendly House in Kandy",
    location: "Kandy",
    district: "Kandy",
    price: 24000000,
    priceDisplay: "LKR 24,000,000",
    grade: "B",
    listingType: "sale",
    propertyType: "house",
    condition: "needs-updates",
    bedrooms: 3,
    summary:
      "Solid location and layout with potential for upgrades and long-term value.",
    image:
      "https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=1200",
    facts: ["3 Beds", "2 Baths", "12 Perches"],
    verified: true
  },
  {
    title: "Modern Apartment in Rajagiriya",
    location: "Rajagiriya",
    district: "Colombo",
    price: 32000000,
    priceDisplay: "LKR 32,000,000",
    grade: "A",
    listingType: "sale",
    propertyType: "apartment",
    condition: "move-in-ready",
    bedrooms: 2,
    summary:
      "Modern city living with a clean finish, convenient access, and good overall usability.",
    image:
      "https://images.pexels.com/photos/439391/pexels-photo-439391.jpeg?auto=compress&cs=tinysrgb&w=1200",
    facts: ["2 Beds", "2 Baths", "1,250 sqft"],
    verified: true
  },
  {
    title: "Spacious Rental Home in Kurunegala",
    location: "Kurunegala",
    district: "Kurunegala",
    price: 180000,
    priceDisplay: "LKR 180,000 / month",
    grade: "B",
    listingType: "rent",
    propertyType: "house",
    condition: "good",
    bedrooms: 4,
    summary:
      "Comfortable family rental with generous space and a practical layout for daily living.",
    image:
      "https://images.pexels.com/photos/280229/pexels-photo-280229.jpeg?auto=compress&cs=tinysrgb&w=1200",
    facts: ["4 Beds", "3 Baths", "For Rent"],
    verified: true
  },
  {
    title: "Residential Land in Galle",
    location: "Galle",
    district: "Galle",
    price: 15500000,
    priceDisplay: "LKR 15,500,000",
    grade: "C",
    listingType: "sale",
    propertyType: "land",
    condition: "good",
    bedrooms: 0,
    summary:
      "Well-located residential land with good future potential for the right buyer or investor.",
    image:
      "https://images.pexels.com/photos/440731/pexels-photo-440731.jpeg?auto=compress&cs=tinysrgb&w=1200",
    facts: ["18 Perches", "Residential", "Road Access"],
    verified: true
  }
];

const propertyGrid = document.getElementById("propertyGrid");
const resultsCount = document.getElementById("resultsCount");
const filterForm = document.getElementById("filterForm");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");
const sortBy = document.getElementById("sortBy");

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
  if (!budget) return true;

  if (budget === "below-15m") return price < 15000000;
  if (budget === "15m-30m") return price >= 15000000 && price <= 30000000;
  if (budget === "30m-60m") return price > 30000000 && price <= 60000000;
  if (budget === "above-60m") return price > 60000000;

  return true;
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
    resultsCount.textContent = "Showing 0 properties";
    return;
  }

  propertyGrid.innerHTML = items
    .map((property) => {
      return `
        <article class="property-card">
          <div class="property-image-wrap">
            <img src="${property.image}" alt="${property.title}" />
            <span class="grade-badge ${getGradeClass(property.grade)}">Grade ${property.grade}</span>
          </div>

          <div class="property-body">
            <div class="property-status-row">
              <span class="status-chip">${property.listingType === "rent" ? "For Rent" : "For Sale"}</span>
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
              <a href="#" class="view-link">View Property</a>
              <div class="property-card-actions">
                <a href="#" class="btn btn-outline">Request Details</a>
              </div>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  resultsCount.textContent = `Showing ${items.length} propert${items.length === 1 ? "y" : "ies"}`;
}

function getFilteredProperties() {
  const location = document.getElementById("searchLocation").value.trim().toLowerCase();
  const listingTypeValue = document.getElementById("listingType").value;
  const propertyTypeValue = document.getElementById("propertyType").value;
  const gradeValue = document.getElementById("grade").value;
  const conditionValue = document.getElementById("condition").value;
  const bedroomsValue = document.getElementById("bedrooms").value;
  const budgetValue = document.getElementById("budget").value;

  return properties.filter((property) => {
    const matchesLocation =
      !location ||
      property.location.toLowerCase().includes(location) ||
      property.district.toLowerCase().includes(location) ||
      property.title.toLowerCase().includes(location);

    const matchesListingType = !listingTypeValue || property.listingType === listingTypeValue;
    const matchesPropertyType = !propertyTypeValue || property.propertyType === propertyTypeValue;
    const matchesGrade = !gradeValue || property.grade === gradeValue;
    const matchesCondition = !conditionValue || property.condition === conditionValue;
    const matchesBedrooms = !bedroomsValue || property.bedrooms >= Number(bedroomsValue);
    const matchesBudget = getBudgetMatch(property.price, budgetValue);

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
  const sortValue = sortBy.value;
  const sorted = [...items];

  if (sortValue === "price-low") {
    sorted.sort((a, b) => a.price - b.price);
  } else if (sortValue === "price-high") {
    sorted.sort((a, b) => b.price - a.price);
  } else if (sortValue === "grade-high") {
    const gradeOrder = { A: 4, B: 3, C: 2, D: 1 };
    sorted.sort((a, b) => gradeOrder[b.grade] - gradeOrder[a.grade]);
  } else if (sortValue === "newest") {
    sorted.reverse();
  }

  return sorted;
}

function updateProperties() {
  const filtered = getFilteredProperties();
  const sorted = sortProperties(filtered);
  renderProperties(sorted);
}

function setupFilters() {
  if (!filterForm) return;

  filterForm.addEventListener("submit", (event) => {
    event.preventDefault();
    updateProperties();
  });

  sortBy.addEventListener("change", updateProperties);

  clearFiltersBtn.addEventListener("click", () => {
    filterForm.reset();
    sortBy.value = "recommended";
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

document.addEventListener("DOMContentLoaded", () => {
  renderProperties(properties);
  setupFilters();
  setupMobileMenu();
});
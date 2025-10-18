const cardsArea = document.getElementById("cards-area");
const basketBtn = document.getElementById("basket-btn");
const basketCount = document.getElementById("basket-count");
const themeToggle = document.getElementById("theme-toggle");
const _BASE_URL = "https://restaurant.stepprojects.ge/api/";

let currentCategory = null;
let currentFilters = {
  vegeterian: false,
  nuts: false,
  spiciness: 0
};

document.addEventListener("DOMContentLoaded", () => {
  getAllProducts();
  updateBasketCount();
  initTheme();
});

// Theme management
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.body.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const current = document.body.getAttribute('data-theme');
  const newTheme = current === 'light' ? 'dark' : 'light';
  document.body.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  const icon = themeToggle.querySelector('i');
  icon.className = theme === 'light' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
}

async function getAllProducts() {
  try {
    currentCategory = null;
    removeActiveCategory();
    const res = await fetch(`${_BASE_URL}Products/GetAll`);
    const data = await res.json();
    createCard(data);
  } catch (err) {
    console.error(err);
  }
}

function createCard(arr) {
  cardsArea.innerHTML = "";
  arr.forEach((el) => {
    const spiceLevel = el.spiciness || 0;
    
    cardsArea.innerHTML += `
      <div class="card" style="width: 18rem;">
        <img src="${el.image}" class="card-img-top" alt="${el.name}">
        <div class="card-body">
          <h5 class="card-title">${el.name}</h5>
          <p class="card-text mb-2"><strong>ფასი:</strong> ${el.price} ₾</p>
          <div class="d-flex gap-3 mb-3">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" ${el.nuts ? 'checked' : ''} disabled>
              <label class="form-check-label checkbox-label">
                🥜 Nuts
              </label>
            </div>
            <div class="form-check">
              <input class="form-check-input" type="checkbox" ${el.vegeterian ? 'checked' : ''} disabled>
              <label class="form-check-label checkbox-label">
                🌱 Vegetarian
              </label>
            </div>
          </div>
          <p class="card-text mb-3"><small>🌶️ Spiciness: <strong>${spiceLevel}</strong></small></p>
          <button class="btn btn-success" onclick="addToBasket(${el.price}, ${el.id})">
            <i class="fa-solid fa-cart-plus"></i> Add to Basket
          </button>
        </div>
      </div>`;
  });
}

async function addToBasket(price, id) {
  try {    const basketRes = await fetch(`${_BASE_URL}Baskets/GetAll`);
    const basketData = await basketRes.json();
    
    const existingProduct = basketData.find(item => item.product.id === id);
    
    if (existingProduct) {
      const newQuantity = existingProduct.quantity + 1;
      const totalPrice = existingProduct.product.price * newQuantity;
      
      await fetch(`${_BASE_URL}Baskets/UpdateBasket`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          quantity: newQuantity, 
          price: totalPrice, 
          productId: id 
        }),
      });
      
      alert("Product quantity increased in basket");
    } else {
      await fetch(`${_BASE_URL}Baskets/AddToBasket`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: 1, price, productId: id }),
      });
      
      alert("Product added to basket");
    }
    
    updateBasketCount();
  } catch (err) {
    console.error(err);
    alert("Something went wrong");
  }
}

basketBtn.addEventListener("click", getBasket);

async function getBasket() {
  try {
    const res = await fetch(`${_BASE_URL}Baskets/GetAll`);
    const data = await res.json();
    getBasketProducts(data);
  } catch (err) {
    console.error(err);
  }
}

function getBasketProducts(arr) {
  cardsArea.innerHTML = "";

  arr.forEach((el) => {
    cardsArea.innerHTML += `
      <div class="card" style="width: 18rem;">
        <img src="${el.product.image}" class="card-img-top" alt="${el.product.name}">
        <div class="card-body">
          <h5 class="card-title">${el.product.name}</h5>
          <p class="card-text">ფასი: ${el.product.price} ₾</p>
          <p class="card-text">რაოდენობა: ${el.quantity}</p>
          <p class="card-text">ჯამური: ${el.price} ₾</p>
          <div class="btn-group">
            <button class="btn btn-outline-danger" onclick="updateProductMinus(${el.quantity}, ${el.product.price}, ${el.product.id})">−</button>
            <button class="btn btn-outline-success" onclick="updateProduct(${el.quantity}, ${el.product.price}, ${el.product.id})">+</button>
            <button class="btn btn-outline-secondary" onclick="deleteProduct(${el.product.id})">წაშალე პროდუქტი</button>
          </div>
        </div>
      </div>`;
  });

  const totalSum = calculateTotal(arr);
  cardsArea.innerHTML += `
    <div class="card p-3 w-100">
      <h4 class="text-end fw-bold">ჯამური ფასი: ${totalSum} ₾</h4>
    </div>`;
}

async function updateBasketCount() {
  try {
    const res = await fetch(`${_BASE_URL}Baskets/GetAll`);
    const data = await res.json();
    const totalItems = data.reduce((sum, el) => sum + el.quantity, 0);

    if (totalItems > 0) {
      basketCount.textContent = totalItems;
      basketCount.classList.remove("d-none");
    } else {
      basketCount.classList.add("d-none");
    }
  } catch (err) {
    console.error("Error updating basket count:", err);
  }
}

function deleteProduct(id) {
  fetch(`${_BASE_URL}Baskets/DeleteProduct/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  })
    .then((res) => {
      if (res.ok) {
        getBasket();
        updateBasketCount();
      }
    })
    .catch(() => alert("Something went wrong"));
}

function updateProduct(quantity, price, id) {
  const newQuantity = quantity + 1;
  const totalPrice = price * newQuantity;
  fetch(`${_BASE_URL}Baskets/UpdateBasket`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity: newQuantity, price: totalPrice, productId: id }),
  }).then((res) => {
    if (res.ok) {
      getBasket();
      updateBasketCount();
    }
  });
}

function updateProductMinus(quantity, price, id) {
  if (quantity <= 1) {
    deleteProduct(id);
    return;
  }
  const newQuantity = quantity - 1;
  const totalPrice = price * newQuantity;
  fetch(`${_BASE_URL}Baskets/UpdateBasket`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity: newQuantity, price: totalPrice, productId: id }),
  }).then((res) => {
    if (res.ok) {
      getBasket();
      updateBasketCount();
    }
  });
}

async function filterByCategory(categoryId) {
  try {
    currentCategory = categoryId;
    setActiveCategory(categoryId);
    
    const res = await fetch(`${_BASE_URL}Categories/GetCategory/${categoryId}`);
    const data = await res.json();
    
    let products = data.products || [];
    
    // Apply current filters if any are active
    if (currentFilters.vegeterian || currentFilters.nuts || currentFilters.spiciness > 0) {
      products = applyFiltersToProducts(products);
    }
    
    if (products.length > 0) {
      createCard(products);
    } else {
      cardsArea.innerHTML = "<p>No products found in this category.</p>";
    }
  } catch (err) {
    console.error(err);
  }
}

function setActiveCategory(categoryId) {
  document.querySelectorAll('#filter-buttons button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const buttons = document.querySelectorAll('#filter-buttons button');
  buttons.forEach(btn => {
    if (btn.getAttribute('onclick')?.includes(`filterByCategory(${categoryId})`)) {
      btn.classList.add('active');
    }
  });
}

function removeActiveCategory() {
  document.querySelectorAll('#filter-buttons button').forEach(btn => {
    btn.classList.remove('active');
  });
}

function calculateTotal(arr) {
  return arr.reduce((sum, el) => sum + el.price, 0);
}

const vegeterianFilter = document.getElementById("filter-vegeterian");
const nutsFilter = document.getElementById("filter-nuts");
const spiceRange = document.getElementById("spice-range");
const spiceValue = document.getElementById("spice-value");

spiceRange.addEventListener("input", () => {
  const val = spiceRange.value;
  spiceValue.textContent = val == 0 ? "Not chosen" : val;
});

async function applyFilter() {
  const vegeterian = vegeterianFilter.checked;
  const nuts = nutsFilter.checked;
  const spiciness = spiceRange.value;
  
  currentFilters = { vegeterian, nuts, spiciness };

  try {
    let data;
    
    if (currentCategory !== null) {
      const res = await fetch(`${_BASE_URL}Categories/GetCategory/${currentCategory}`);
      const categoryData = await res.json();
      data = applyFiltersToProducts(categoryData.products || []);
    } else {
      const res = await fetch(
        `${_BASE_URL}Products/GetFiltered?vegeterian=${vegeterian}&nuts=${nuts}&spiciness=${spiciness}`
      );
      data = await res.json();
    }
    
    if (data && data.length > 0) {
      createCard(data);
    } else {
      cardsArea.innerHTML = "<p>No products found with these filters.</p>";
    }
  } catch (err) {
    console.error(err);
  }
}

function applyFiltersToProducts(products) {
  return products.filter(product => {
    let matches = true;
    
    if (currentFilters.vegeterian && !product.vegeterian) {
      matches = false;
    }
    
    if (currentFilters.nuts && product.nuts) {
      matches = false;
    }
    
    if (currentFilters.spiciness > 0 && product.spiciness != currentFilters.spiciness) {
      matches = false;
    }
    
    return matches;
  });
}

function resetFilters() {
  vegeterianFilter.checked = false;
  nutsFilter.checked = false;
  spiceRange.value = 0;
  spiceValue.textContent = "Not chosen";
  currentFilters = { vegeterian: false, nuts: false, spiciness: 0 };
  
  if (currentCategory !== null) {
    filterByCategory(currentCategory);
  } else {
    getAllProducts();
  }
}
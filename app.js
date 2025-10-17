const cardsArea = document.getElementById("cards-area");
const basketBtn = document.getElementById("basket-btn");
const basketCount = document.getElementById("basket-count");
const _BASE_URL = "https://restaurant.stepprojects.ge/api/";

document.addEventListener("DOMContentLoaded", () => {
  getAllProducts();
  updateBasketCount();
});

async function getAllProducts() {
  try {
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
    cardsArea.innerHTML += `
      <div class="card" style="width: 18rem;">
        <img src="${el.image}" class="card-img-top" alt="${el.name}">
        <div class="card-body">
          <h5 class="card-title">${el.name}</h5>
          <p class="card-text">ფასი: ${el.price} ₾</p>
          <button class="btn btn-success" onclick="addToBasket(${el.price}, ${el.id})">
            <i class="fa-solid fa-cart-plus"></i> Add to Basket
          </button>
        </div>
      </div>`;
  });
}

function addToBasket(price, id) {
  fetch(`${_BASE_URL}Baskets/AddToBasket`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity: 1, price, productId: id }),
  })
    .then((res) => {
      if (res.ok) {
        alert("Product added to basket");
        updateBasketCount();
      }
    })
    .catch(() => alert("Something went wrong"));
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
    const res = await fetch(`${_BASE_URL}Categories/GetCategory/${categoryId}`);
    const data = await res.json();
    if (data.products && data.products.length > 0) createCard(data.products);
    else cardsArea.innerHTML = "<p>No products found in this category.</p>";
  } catch (err) {
    console.error(err);
  }
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
  spiceValue.textContent =
    val == 0 ? "Not chosen" : `${val} 🔥`;
});

async function applyFilter() {
  const vegeterian = vegeterianFilter.checked;
  const nuts = nutsFilter.checked;
  const spiciness = spiceRange.value;

  try {
    const res = await fetch(
      `${_BASE_URL}Products/GetFiltered?vegeterian=${vegeterian}&nuts=${nuts}&spiciness=${spiciness}`
    );
    const data = await res.json();
    if (data && data.length > 0) createCard(data);
    else cardsArea.innerHTML = "<p>No products found with these filters.</p>";
  } catch (err) {
    console.error(err);
  }
}

function resetFilters() {
  vegeterianFilter.checked = false;
  nutsFilter.checked = false;
  spiceRange.value = 0;
  spiceValue.textContent = "Not chosen";
  getAllProducts();
}


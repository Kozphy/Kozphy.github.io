import { btnAddRm } from "../common/btnAddRm.js";
import { footer } from "../footer.js";
import { renderforms } from "../RenderForms.js";
import { browserStorage } from "../common/browserStorage.js";
import { nav } from "../navbar.js";
import { Checkout } from "./checkout.js";

let checkout = new Checkout();

class ShopCart extends btnAddRm {
  constructor() {
    super();
    this.storage = sessionStorage;
    this.storageName = "products";
    this.shopCart = document.querySelector(".shopCart");
    this.shopCartBody = this.shopCart.querySelector(".card-body");
    this.shopCartProducts =
      this.shopCartBody.querySelector(".shopCartProducts");

    this.addEvents();
  }

  addEvents() {
    this.renderProductsToShopCart();
    this.addBtn = this.shopCartBody.querySelectorAll(".addBtn");
    this.reduceBtn = this.shopCartBody.querySelectorAll(".reduceBtn");
    this.rmBtn = this.shopCartBody.querySelectorAll(".shopCartRmBtn");
    this.increaseCounterEvent();
    this.reduceCounterEvent();
    this.clickTrashEvent();
  }

  renderPageAndReAttatchEvent() {
    nav.changeNavShoppingCartCounter();
    this.addEvents();
  }

  removeStorageData(productTitle) {
    let storageDatas = browserStorage.getStorageData(
      this.storage,
      this.storageName
    );

    if (!storageDatas) {
      return;
    }

    let newStorageDatas = storageDatas.filter((product) => {
      return product.Title != productTitle;
    });

    browserStorage.removeStorageData(
      this.storage,
      this.storageName,
      newStorageDatas
    );
  }

  counterChange(e, oper) {
    let productsInStorage = this.getProductsFromStorage();
    let DOMProductTitle = this.getDOMProductTitle(e);
    let newDatas;
    // console.log(productsInStorage);

    // TODO: refactor
    if (oper == "+") {
      for (let product of productsInStorage) {
        if (DOMProductTitle == product.Title) {
          let unitPrice = Number(product.Price) / Number(product.Counter);
          product.Counter = Number(product.Counter) + 1;
          product.Price = unitPrice * product.Counter;
        }
      }
    } else if (oper == "-") {
      for (let product of productsInStorage) {
        if (DOMProductTitle == product.Title) {
          let unitPrice = Number(product.Price) / Number(product.Counter);
          product.Counter = Number(product.Counter) - 1;
          product.Price = unitPrice * product.Counter;
        }
      }
    }

    newDatas = productsInStorage;

    browserStorage.setStorageData(this.storage, this.storageName, newDatas);
    this.renderPageAndReAttatchEvent();
  }

  increaseCounterEvent() {
    this.addBtn.forEach((el, ind) => {
      el.addEventListener("click", (e) => {
        this.counterChange(e, "+");
      });
    });
  }

  reduceCounterEvent() {
    this.reduceBtn.forEach((el, ind) => {
      el.addEventListener("click", (e) => {
        let nextElementSibling = e.currentTarget.nextElementSibling;
        let value = nextElementSibling.getAttribute("value");
        let productTitle = this.getDOMProductTitle(e);

        if (value > 1) {
          this.counterChange(e, "-");
        } else {
          this.removeStorageData(productTitle);
          this.renderPageAndReAttatchEvent();
          alert("刪除成功");
        }
      });
    });
  }

  clickTrashEvent() {
    this.rmBtn.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        let DOMProductTitle = this.getDOMProductTitle(e);
        this.removeStorageData(DOMProductTitle);
        this.renderPageAndReAttatchEvent();
        alert("刪除成功");
      });
    });
  }

  getProductsFromStorage() {
    let productsInStorage = browserStorage.getStorageData(
      sessionStorage,
      this.storageName
    );

    if (!Array.isArray(productsInStorage)) {
      alert("storage is not array");
      return;
    }

    return productsInStorage;
  }

  //TODO: add reorder
  reorderShopCartProducts() {
    // let sortLabel = document.querySelector("#sortShopCart");
    // let products = productsInStorage;
    // console.log(products);
    let value = e.target.value;

    if (value == "increment") {
      products.sort((a, b) => {
        return Number(a["Price"]) - Number(b["Price"]);
      });
    } else if (value == "decrease") {
      products.sort((a, b) => {
        return Number(b["Price"]) - Number(a["Price"]);
      });
    }
    return products;
  }

  renderProductsToShopCart() {
    this.shopCartProducts.innerHTML = "";
    let productsInStorage = this.getProductsFromStorage();

    if (!productsInStorage) {
      return;
    }
    let total = 0;

    // sortLabel.addEventListener("change", (e) => {
    //   if (e.target.value != "none") {
    //     products = this.reorderShopCartProducts(e, productsInStorage);
    //   }
    // });
    // console.log(products);

    productsInStorage.forEach((product) => {
      let productPrice = Number(product.Price);
      // console.log(productPrice);
      total += productPrice;

      let shopCartHTML = this.getshopCartHTML(product, productPrice);

      this.shopCartProducts.innerHTML += shopCartHTML;
    });

    checkout.caculateCheckOutSum(total);
  }

  getDOMProductTitle(e) {
    let productTitle = e.target
      .closest(".shopCartProduct")
      .querySelector(".productTitle")
      .textContent.trim();
    return productTitle;
  }

  getshopCartHTML(product, total) {
    return `<div class="row gx-3 justify-content-center align-items-center mb-3 shopCartProduct">
                  <div class="col-lg-3 text-center">
                    <img
                      src="${product.img.src}"
                      class="img-fluid rounded-start rounded"
                      alt="${product.img.alt}"
                    />
                  </div>
                  <div class="col-lg-4">
                    <p class="card-text text-center productTitle">
                    ${product.Title}
                    </p>
                  </div>
                  <div class="col-lg-2 d-flex">
                    <button class="btn btn-secondary-link reduceBtn" type="button">
                      <i class="fas fa-minus"></i>
                    </button>
                    <input
                      type="text"
                      class="form-control text-center"
                      min="1"
                      value="${product.Counter}"
                    />
                    <button class="btn btn-secondary-link addBtn" type="button">
                      <i class="fas fa-plus"></i>
                    </button>
                  </div>
                  <div class="col-lg-2">
                    <h5 class="mb-0 fw-bolder text-center">$ ${total} 
                    </h5>
                  </div>
                  <div class="col-lg-1 d-flex justify-content-end">
                    <button
                      type="button"
                      class="btn btn-link text-danger shopCartRmBtn"
                    >
                      <i class="fas fa-trash fa-lg"></i>
                    </button>
                  </div>
              </div>
    `;
  }
}

let shopCart = new ShopCart();

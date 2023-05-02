import { productsSrc } from "./productsData.js";
import { btnAddRm } from "../common/btnAddRm.js";
import { browserStorage } from "../common/browserStorage.js";
import { shopCartCanvas } from "../shopCartCanvas.js";
import { nav } from "../navbar.js";

export { product };

const filterMap = {
  HQcoffee: "coffeeBeverage",
  coffeeBean: "coffeeBean",
  Indonesia: "Indonesia",
  India: "India",
  sunShine: "sunShine",
  waterWash: "waterWash",
};

class Product extends btnAddRm {
  constructor() {
    super();

    this.content = document.querySelector(".products");
    this.productSection = this.content.querySelector(".products-content .row");
    this.filterSection = document.querySelector(".products-filter");
    this.filterCheckboxs = this.filterSection.querySelectorAll(
      "input[type='checkbox']"
    );

    this.storage = sessionStorage;
    this.storageObjectName = "products";

    this.renderProductsData = productsSrc;
    this.filterConditions = [];

    this.init();

    shopCartCanvas.renderCanvasProducts();
    this.productsSearchClickEvent();
  }

  init() {
    this.renderProducts();
    this.addBtn = this.content.querySelectorAll(".products-content .btn-add");
    this.reduceBtn = this.content.querySelectorAll(".btn-reduce");
    this.addEvents();
  }

  addEvents() {
    this.increaseCounterEvent();
    this.reduceCounterEvent();
    this.productToShopCartClickEvent();

    this.filterCheckboxs.forEach((checkbox) => {
      checkbox.addEventListener("change", (e) => {
        this.handleFilterChange(e);
      });
    });
  }

  handleFilterChange(event) {
    const filterMethod = filterMap[event.target.getAttribute("id")];
    const checkedCondition = event.target.checked;

    if (checkedCondition) {
      this.filterConditions.push(filterMethod);
    } else {
      const removeArrIndex = this.filterConditions.indexOf(filterMethod);
      this.filterConditions.splice(removeArrIndex, 1);
    }

    if (this.filterConditions.length === 0) {
      this.renderProductsData = productsSrc;
    } else {
      this.renderProductsData = productsSrc.filter((product) => {
        return (
          this.filterConditions.indexOf(product.productType) !== -1 ||
          this.filterConditions.indexOf(product.placeOfOrigin) !== -1 ||
          this.filterConditions.indexOf(product.handleMethod) !== -1
        );
      });
    }

    this.renderProducts();
    this.productToShopCartClickEvent();
  }

  renderProducts() {
    this.productSection.innerHTML = "";

    this.renderProductsData.forEach((product) => {
      const productHTML = this.getProductHTML(product);
      this.productSection.insertAdjacentHTML("beforeend", productHTML);
    });
  }

  getProductHTML(product) {
    let badgesMap = {
      coffeeBean: "咖啡豆",
      coffeeBeverage: "精品咖啡",
      waterWash: "水洗",
      sunShine: "日曬",
      Indonesia: "印尼",
      India: "印度",
    };

    return `<div class="col-lg-4 col-12 mb-3">
                <div class="card img-fluid" >
                <a href="${
                  product.img_src
                }" data-lightbox="img-1" style="display:inline-block" 
                data-title="${product.cardTitle}"
                data-alt="${product.img_alt}">

                  <img
                    src="${product.img_src}"
                    class="card-img-top"
                    alt="${product.img_alt}"
                  />
                </a>
                  <div class="card-body">
                    <h5 class="card-title productName">
                    ${product.cardTitle} 
                    </h5>
                    <h5 class="product-badges">
                      <span class="badge bg-secondary">${
                        badgesMap[product.productType]
                      }</span>
                      <span class="badge bg-secondary">${
                        badgesMap[product.placeOfOrigin]
                      }</span>
                      <span class="badge bg-secondary">${
                        badgesMap[product.handleMethod]
                      }</span>
                    </h5>
                    <p class="card-text productContent overflow-auto" style="height:120px">
                    ${product.content}
                    </p>
                    <div class="input-group  mb-3">
                      <button
                        class="btn btn-outline-secondary btn-reduce"
                        type="button"
                      >
                        <span>-</span>
                      </button>
                      <input
                        type="text"
                        class="form-control text-center productCounter"
                        aria-label="Example text with button addon"
                        aria-describedby="button-addon1"
                        value="1"
                      />
                      <button
                        class="btn btn-outline-secondary btn-add"
                        type="button"
                      >
                        <span> + </span>
                      </button>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                    <div class"mb-2">
                      <span class="romantic-text productPrice h5">$ ${
                        product.price
                      }</span>
                    </div>
                    <button id="liveToastBtn" type="button"  class="btn btn-primary addToCart">加入購物車</button>
                    </div>
                  </div>
                </div>
              </div>`;
  }

  productToShopCartClickEvent() {
    // reset counter handler
    const productCounterResetHandler = (e) => {
      let productCounter =
        e.currentTarget.parentNode.parentNode.querySelector(".productCounter");

      if (productCounter.value > 1) {
        productCounter.setAttribute("value", 1);
      }
    };

    const getDOMProductInfo = (e) => {
      let cardDOM = e.target.closest(".card");
      let productImg = cardDOM.querySelector("img");
      let cardBody = cardDOM.querySelector(".card-body");
      // console.log("productImg: ", productImg);
      let productTitle = cardBody.querySelector(".productName");
      // console.log("productTitle: ", productTitle.getAttribute);
      let productContent = cardBody.querySelector(".productContent");
      // console.log("productContent: ", productContent.textContent);
      let productCounter = cardBody.querySelector(".productCounter");
      // console.log("productCounter: ", productCounter.value);
      let prodcutPrice = cardBody.querySelector(".productPrice");
      let productPriceWithoutPrefix = prodcutPrice.textContent
        .trim()
        .split(" ")[1];
      // console.log("prodcutPrice: ", prodcutPrice.textContent);
      let product = {
        img: {
          src: productImg.getAttribute("src"),
          alt: productImg.getAttribute("alt"),
        },
        Title: productTitle.textContent.trim(),
        Counter: productCounter.value,
        Content: productContent.textContent.trim(),
        Price: productPriceWithoutPrefix,
      };
      // console.log(product);
      return product;
    };

    const mergeDOMAndStorageData = (DOMproductInfo) => {
      let storageDatas = browserStorage.getStorageData(
        this.storage,
        this.storageObjectName
      );

      if (!storageDatas.length) {
        return [DOMproductInfo];
      }

      let newDatas;
      for (let i = 0; i < storageDatas.length; i++) {
        if (storageDatas[i].Title.trim() == DOMproductInfo.Title.trim()) {
          // console.log(storageDatas[i].Price.split(" ")[1]);

          let unitPrice =
            Number(storageDatas[i].Price) / storageDatas[i].Counter;
          console.log(unitPrice);
          let quantity =
            Number(storageDatas[i].Counter) + Number(DOMproductInfo.Counter);
          storageDatas[i].Counter = quantity;
          storageDatas[i].Price = quantity * unitPrice;
          newDatas = storageDatas;
          return newDatas;
        }
      }

      storageDatas.push(DOMproductInfo);
      newDatas = storageDatas;
      return newDatas;
    };

    let addToShoppingCartBtn = document.querySelectorAll(
      ".content .products .addToCart"
    );

    // add to shopCart click event
    addToShoppingCartBtn.forEach((btn, ind) => {
      btn.addEventListener("click", (e) => {
        const DOMproductInfo = getDOMProductInfo(e);
        const newDatas = mergeDOMAndStorageData(DOMproductInfo);
        browserStorage.setStorageData(
          this.storage,
          this.storageObjectName,
          newDatas
        );
        productCounterResetHandler(e);
        shopCartCanvas.renderCanvasProducts();
        nav.changeNavShoppingCartCounter();

        let toastEl = document.getElementById("liveToast");
        const toastB = bootstrap.Toast.getOrCreateInstance(toastEl);
        toastB.show();
      });
    });
  }

  productsSearchClickEvent() {
    let productsSearchBtn = this.content.querySelector(".productsSearchBtn");
    // console.log(productsSearchBtn);
    const searchproducts = (e) => {
      let searchBtnParent = e.target.closest(".search-bar");
      let searchBar = searchBtnParent.querySelector(".productsSearchBar");
      if (searchBar.value) {
        let datas = productsSrc.filter((product) => {
          return product.cardTitle.includes(searchBar.value);
        });
        this.renderProductsData = datas;
      } else {
        this.renderProductsData = productsSrc;
      }
    };

    productsSearchBtn.addEventListener("click", (e) => {
      searchproducts(e);
      console.log(1);
      this.init();
    });
  }
}

let product = new Product();

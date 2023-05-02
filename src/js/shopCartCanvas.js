import { browserStorage } from "./common/browserStorage.js";
export { shopCartCanvas };

class ShopCartCanvas {
  constructor() {
    this.renderCanvasTitle();
    this.renderCanvasProducts();
    this.shopCartCanvasRemoveEvent();
  }

  goToShapCartEvent(navbar) {
    let goToShopCartBtn = document.querySelector(".goToShopCartBtn");
    let shopCartUrl = navbar.querySelector(".FeFe-shopping").href;
    goToShopCartBtn.addEventListener("click", () => {
      window.location.replace(shopCartUrl);
    });
  }
  shopCartCanvasRemoveEvent() {
    let shopCartCanvas = document.querySelector(
      ".shopCanvas .offcanvas-body .container"
    );
    const removeHandler = (e) => {
      const base = e.currentTarget;
      const deck = [...base.querySelectorAll("button")];
      // console.log("deck: ", deck);
      const item = e.target;
      // console.log("item: ", item);
      const index = deck.indexOf(item);
      // console.log(index);

      if (index != -1) {
        // localStorage.removeItem()
        item.closest(".canvasItem").remove();
      }
    };

    shopCartCanvas.addEventListener("click", removeHandler);
  }

  renderCanvasTitle() {
    let productsTitle = document.querySelector(
      ".shopCanvas .offcanvas-body .productsTitle"
    );
    let productTitleHTML = this.getProductsTitleHTML();

    productsTitle.innerHTML = productTitleHTML;
  }

  renderCanvasProducts() {
    let productsInStorage = browserStorage.getStorageData(
      sessionStorage,
      "products"
    );

    // console.log(productsInStorage);
    if (!productsInStorage) {
      return;
    }

    let shopCartCanvas = document.querySelector(
      ".shopCanvas .offcanvas-body .shopCanvasProducts"
    );
    // console.log(shopCartCanvas);

    shopCartCanvas.innerHTML = "";

    productsInStorage.forEach((product) => {
      let productHtmlText = this.getProductsHTML(product);
      shopCartCanvas.innerHTML += productHtmlText;
    });
  }

  getProductsTitleHTML() {
    return `<div class="row mb-3 border-bottom">
                  <div class="col-sm-4 text-center">產品名稱</div>
                  <div class="col-sm-4 text-center">數量</div>
                  <div class="col-sm-4 text-center">單價</div>
                </div>`;
  }

  getProductsHTML(product) {
    return `
        <div class="row canvasItem mb-3">
            <div class="col-sm-4">
                  ${product.Title}
            </div>
            <div class="col-sm-4">
                  ${product.Counter}
            </div>
            <div class="col-sm-4">
                ${product.Price}
            </div>
          <div>
        `;
  }
}

let shopCartCanvas = new ShopCartCanvas();

import { FetchLocalHtml } from "./fetchLocalHtml.js";
import { shopCartCanvas } from "./shopCartCanvas.js";
import { browserStorage } from "./common/browserStorage.js";
import { PersonalInfo } from "./personalInfo.js";

export { nav };
// import $ from "./jquery/jquery.module.js";
// import { createRoot } from "react-dom/client.js";

let navPlaceholder = "nav-placeholder";

class Navbar extends FetchLocalHtml {
  constructor(placeholder, htmlFileName) {
    super(placeholder, htmlFileName);
    this._announcement;
    this._nav;
  }

  replace(data) {
    const parser = new DOMParser();
    const navDoc = parser.parseFromString(data, "text/html");
    const navbarDatas = navDoc.querySelector(".header").children;
    this._announcement = navDoc.querySelector(".announcement");
    this._nav = navDoc.querySelector(".container-fluid");
    this.changeActiveOnNavbar();
    this.changeNavShoppingCartCounter();
    this.placeholder.replaceWith(...navbarDatas);
    return this._nav;
  }

  changeActiveOnNavbar() {
    let urls = window.location.href.split("/");
    let url_path = urls[urls.length - 1];
    let pattern = /(\w+\.html$)/;
    let current_html = url_path.match(pattern);
    if (!current_html) {
      current_html = "index.html";
    } else {
      current_html = current_html[0];
    }

    let navLinks;
    navLinks = this._nav.querySelectorAll(".nav-link");
    navLinks.forEach((el) => {
      el.classList.remove("active");

      let navLink_href = el.getAttribute("href").split("/").pop();

      if (current_html === navLink_href) {
        el.classList.add("active");
      }
    });
  }

  changeNavShoppingCartCounter() {
    let navShopCartCounter = this._nav.querySelector(".shop-cart-counter");
    let datasInStorage = browserStorage.getStorageData(
      sessionStorage,
      "products"
    );

    if (!datasInStorage) {
      navShopCartCounter.textContent = 0;
      return;
    }

    navShopCartCounter.textContent = datasInStorage.length;
  }
}

// let personalInfo;
// console.log(1);

// let nav = new Navbar(navPlaceholder, "navbar.html");
// nav
//   .fetchHtmlFileContent()
//   .then((data) => {
//     let navbar = nav.replace(data);
//     return navbar;
//   })
//   .then((navbar) => {
//     shopCartCanvas.goToShapCartEvent(navbar);
//     personalInfo = new PersonalInfo(navbar);
//     console.log(2);
//   });

// export { personalInfo };
const nav = new Navbar(navPlaceholder, "navbar.html");
let personalInfo;

async function initialize() {
  try {
    const data = await nav.fetchHtmlFileContent();
    const navbar = nav.replace(data);
    shopCartCanvas.goToShapCartEvent(navbar);
    personalInfo = new PersonalInfo(navbar);
  } catch (error) {
    console.error(error);
  }
}

await initialize();

export { personalInfo };

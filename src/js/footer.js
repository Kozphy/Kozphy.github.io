export { footer };
import { FetchLocalHtml } from "./fetchLocalHtml.js";

let footerPlaceholder = "footer-placeholder";

class Footer extends FetchLocalHtml {
  constructor(placeholder, htmlFileName) {
    super(placeholder, htmlFileName);
    this._footer;
  }

  replace(data) {
    const parser = new DOMParser();
    const navDoc = parser.parseFromString(data, "text/html");
    this._footer = navDoc.querySelector(".footer > .container");
    this.placeholder.replaceWith(this._footer);
  }
}

let footer = new Footer(footerPlaceholder, "footer.html");
footer.fetchHtmlFileContent().then((data) => footer.replace(data));

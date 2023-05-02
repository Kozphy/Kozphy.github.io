export { FetchLocalHtml };

class FetchLocalHtml {
  constructor(placeholder, htmlFileName) {
    this.placeholder = document.querySelector("#" + placeholder);
    this.htmlFileName = htmlFileName;
  }
  async fetchHtmlFileContent() {
    return fetch(this.htmlFileName)
      .then((response) => response.text())
      .then((data) => {
        return data;
      })
      .catch((e) => console.error(e));
  }
}

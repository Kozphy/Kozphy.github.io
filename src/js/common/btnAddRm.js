export { btnAddRm };

class btnAddRm {
  constructor() {}
  increaseCounterEvent() {
    this.addBtn.forEach((el, ind) => {
      el.addEventListener("click", (e) => {
        let previousElementSibling = e.currentTarget.previousElementSibling;
        let value = previousElementSibling.getAttribute("value");
        value = Number(previousElementSibling.value) + 1;
        previousElementSibling.setAttribute("value", value);
      });
    });
  }

  reduceCounterEvent() {
    this.reduceBtn.forEach((el, ind) => {
      el.addEventListener("click", (e) => {
        let nextElementSibling = e.currentTarget.nextElementSibling;
        let value = nextElementSibling.getAttribute("value");
        if (value > 1) {
          value = Number(value) - 1;
          nextElementSibling.setAttribute("value", value);
        } else {
          alert("商品數量必須大於 1");
        }
      });
    });
  }
}

export { Checkout };

import anime from "../../../node_modules/animejs/lib/anime.es.js";

class Checkout {
  constructor() {
    this.shippingFee = 60;
    this.subTotalPrice = 0;

    this.shopCartSum = document.querySelector(".shopCartSum");
    this.shopCartCheckout = document.querySelector(".shopCartCheckout");
    this.subTotalPriceElement =
      this.shopCartSum.querySelector(".subTotalPrice");
    this.shippingFeeElement = this.shopCartSum.querySelector(".shippingFee");
    this.totalPriceElement = this.shopCartSum.querySelector(".totalPrice");

    this.addEvents();
  }

  addEvents() {}

  caculateCheckOutSum(total) {
    this.subTotalPrice = total;
    this.renderCheckOutSum();
    this.hideCheckOutSection();
  }

  hide() {
    anime({
      targets: this.shopCartCheckout,
      opacity: 0,
      easing: "linear",
      zIndex: {
        value: [10, -1],
        round: true,
      },
    });
  }
  show() {
    anime({
      targets: this.shopCartCheckout,
      opacity: 1,
      easing: "linear",
      zIndex: {
        value: [10, 10],
        round: true,
      },
    });
  }

  hideCheckOutSection() {
    window.onscroll = () => {
      // Variables to calculate the scroll position and height of the page
      const scrollTop =
        (document.documentElement && document.documentElement.scrollTop) ||
        document.body.scrollTop;
      const scrollHeight =
        (document.documentElement && document.documentElement.scrollHeight) ||
        document.body.scrollHeight;
      const clientHeight =
        document.documentElement.clientHeight || window.innerHeight;

      // If the user has scrolled to the bottom of the page
      if (scrollTop + clientHeight >= scrollHeight) {
        console.log("You've reached the bottom of the page!");
        this.hide();
        // } else if (loginForm.formStatus || signUpForm.formStatus) {
        //   this.hide();
        // Do something here, like loading more content with AJAX
      } else {
        this.show();
      }
    };

    if (this.subTotalPrice == 0) {
      this.hide();
    }
  }

  renderCheckOutSum() {
    function numberChangeAnimate(target, targetValue) {
      anime({
        targets: target,
        textContent: [0, targetValue],
        round: 1,
        easing: "easeInOutExpo",
        duration: 500,
      });
    }

    let total = this.subTotalPrice - this.shippingFee;
    if (total < 0) {
      total = 0;
    }
    numberChangeAnimate(this.subTotalPriceElement, this.subTotalPrice);
    numberChangeAnimate(this.shippingFeeElement, this.shippingFee);
    numberChangeAnimate(this.totalPriceElement, total);
  }

  // TODO:  addEvent to paymentMethod
}

// let checkout = new CheckOut();

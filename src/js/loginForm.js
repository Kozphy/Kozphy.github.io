import anime from "../../node_modules/animejs/lib/anime.es.js";
import { browserStorage } from "./common/browserStorage.js";
import { Form } from "./form.js";
import { signUpForm } from "./RenderForms.js";
export { LoginForm };
import { personalInfo } from "./navbar.js";

class LoginForm extends Form {
  constructor() {
    super();
    this.storage = sessionStorage;
    this.storageDataName = "userData";
    this.formStatus = false;
    this._loginForm = document.getElementById("loginForm");
    this.signUpFormElement = this._loginForm.querySelector(".modal-content");
    this._loginTab = this._loginForm.querySelector(".login-tab");
    this._registerTab = this._loginForm.querySelector(".register-tab");
    this._loginBtn = this._loginForm.querySelector(".loginbtn");
    this._fa_form_close = this._loginForm.querySelector(".fa-window-close");
    this._signUpForm;
    this.addEvents();
  }

  addEvents() {
    this.registerTabEvent();
    this.formCloseBtnEvent();
    this.loginEvent();
  }

  loginEvent() {
    this.signUpFormElement.addEventListener("submit", (e) =>
      this.loginAction(e)
    );
  }

  loginAction(e) {
    const formData = new FormData(e.target);
    let userAlreadyExist = this.checkUserExist(formData)[0];
    if (!userAlreadyExist) {
      alert("使用者不存在");
      return;
    }
    let user = formData.get("email");
    browserStorage.setStorageData(this.storage, "loginUser", [user]);
    personalInfo.afterLoginPersonalInfoContent();
    console.log(1);
    console.log(this.signUpFormElement);
    this.closeForm();
    alert("登入成功");
  }

  formCloseBtnEvent() {
    this._fa_form_close.addEventListener(
      "click",
      () => {
        this.closeForm();
      },
      false
    );
  }

  registerTabEvent() {
    this._registerTab.addEventListener(
      "click",
      () => {
        this.closeForm();
        this._signUpForm = signUpForm;
        this._signUpForm.show();
      },
      false
    );
  }

  closeForm() {
    this.formStatus = false;
    this.hide();
  }

  show() {
    this.formStatus = true;
    anime({
      targets: this.signUpFormElement,
      begin: () => {
        this._loginForm.style.display = "block";
      },
    });
  }
  hide() {
    this.formStatus = false;
    anime({
      targets: this.signUpFormElement,
      begin: () => {
        this._loginForm.style.display = "none";
      },
    });
  }

  outerClickCloseForm() {
    window.onclick = (event) => {
      // console.log(event.target);
      if (event.target == this._loginForm) {
        this.formStatus = false;
        this.closeForm();
      }
    };
  }
}

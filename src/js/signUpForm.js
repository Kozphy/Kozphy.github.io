import anime from "../../node_modules/animejs/lib/anime.es.js";
import { Form } from "./form.js";
import { loginForm } from "./RenderForms.js";
import { browserStorage } from "./common/browserStorage.js";
export { SignUpForm };

class SignUpForm extends Form {
  constructor() {
    super();
    this.storage = sessionStorage;
    this.storageDataName = "userData";
    this.formStatus = false;
    this._signupForm = document.getElementById("signUpForm");
    this.signupFormElement = this._signupForm.querySelector(".modal-content");
    this._loginTab = this._signupForm.querySelector(".login-tab");
    this._registerTab = this._signupForm.querySelector(".register-tab");
    this._cancelSignUpBtn = this._signupForm.querySelector(".cancelSignUpbtn");
    this._signUpBtn = this._signupForm.querySelector(".signUpbtn");
    this._fa_form_close = this._signupForm.querySelector(".fa-window-close");
    this._loginForm;
    this.addEvents();
  }

  addEvents() {
    this.formLoginTabEvent();
    this.formCloseEvent();
    this.formCancelBtnEvent();
    this.signUpEvent();
  }

  formCloseEvent() {
    this._fa_form_close.addEventListener(
      "click",
      () => {
        this.closeForm();
      },
      false
    );
  }

  formLoginTabEvent() {
    this._loginTab.addEventListener(
      "click",
      () => {
        this.closeForm();
        this._loginForm = loginForm;
        this._loginForm.show();
      },
      false
    );
  }

  formCancelBtnEvent() {
    this._cancelSignUpBtn.addEventListener(
      "click",
      () => {
        this.closeForm();
      },
      false
    );
  }
  signUpEvent() {
    this.signupFormElement.addEventListener("submit", (e) => {
      this.signUpAction(e);
    });
  }

  signUpAction(e) {
    const formData = new FormData(e.target);

    let [userAlreadyExist, datasInStorage] = this.checkUserExist(formData);

    if (userAlreadyExist) {
      e.preventDefault();
      alert("email已被註冊");
      return;
    }

    const objFormData = this.formDataToObject(formData);
    datasInStorage.push(objFormData);

    let newDatas = datasInStorage;

    browserStorage.setStorageData(this.storage, this.storageDataName, newDatas);
    this.closeForm();
    alert("註冊成功");
  }
  show() {
    this.formStatus = true;
    anime({
      targets: this.signupFormElement,
      begin: () => {
        this._signupForm.style.display = "block";
      },
    });
  }
  hide() {
    this.formStatus = false;
    anime({
      targets: this.signupFormElement,
      begin: () => {
        this._signupForm.style.display = "none";
      },
    });
  }

  closeForm() {
    this.hide();
  }

  outerClickCloseForm() {
    window.onclick = (event) => {
      // console.log(event.target);
      // console.log(this._signupForm);
      if (event.target == this._signupForm) {
        this.formStatus = false;
        this.closeForm();
      }
    };
  }
}

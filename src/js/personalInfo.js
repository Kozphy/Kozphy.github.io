import anime from "../../node_modules/animejs/lib/anime.es.js";
import { signUpForm, loginForm } from "./RenderForms.js";
import { browserStorage } from "./common/browserStorage.js";

export { PersonalInfo };

class PersonalInfo {
  constructor(navbar) {
    this.storage = sessionStorage;
    this.LoginState = false;
    this.loginUser;
    this.showFlag = false;
    this.personalInfoContent = document.querySelector(".personalInfoContent");
    this.personalInfoUser =
      this.personalInfoContent.querySelector(".personalInfoUser");
    this.personalInfoLogin =
      this.personalInfoContent.querySelector(".personalInfoLogin");
    this.personalInfoSignUp = this.personalInfoContent.querySelector(
      ".personalInfoSignUp"
    );
    this.personalInfoClose =
      this.personalInfoContent.querySelector(".personalInfoClose");
    this.personalInfoLogout = this.personalInfoContent.querySelector(
      ".personalInfoLogout"
    );
    this.navPersonalInfo = navbar.querySelector(".personalInfo");
    this.addEvents();
  }

  addEvents() {
    this.show();
    this.afterLoginPersonalInfoContent();
    this.closeBtnEvent();
    this.loginBtnEvent();
    this.signUpBtnEvent();
    this.logoutBtnEvent();
  }

  afterLoginPersonalInfoContent() {
    this.loginUser = browserStorage.getStorageData(this.storage, "loginUser");
    if (this.loginUser.length != 0) {
      this.personalInfoLogin.style.display = "none";
      anime({
        targets: this.personalInfoLogout,
        begin: () => {
          this.personalInfoLogout.style.display = "block";
        },
      });
      this.personalInfoUser.textContent = this.loginUser;
      this.personalInfoSignUp.style.display = "none";
    }
  }

  afterLogoutPersonalInfoContent() {
    this.personalInfoLogin.style.display = "block";
    anime({
      targets: this.personalInfoLogout,
      begin: () => {
        this.personalInfoLogout.style.display = "none";
      },
    });
    this.personalInfoUser.textContent = "";
    this.personalInfoSignUp.style.display = "block";
  }

  loginBtnEvent() {
    this.personalInfoLogin.addEventListener("click", () => {
      loginForm.show();
      this.close();
    });
  }

  signUpBtnEvent() {
    this.personalInfoSignUp.addEventListener("click", () => {
      signUpForm.show();
      this.close();
    });
  }
  logoutBtnEvent() {
    this.personalInfoLogout.addEventListener("click", () => {
      this.loginUser = [];
      browserStorage.removeStorageData(this.storage, "loginUser", []);
      this.afterLogoutPersonalInfoContent();
    });
  }

  closeBtnEvent() {
    this.personalInfoClose.addEventListener("click", () => {
      this.close();
    });
  }

  close() {
    anime({
      targets: this.personalInfoContent,
      width: "0px",
      height: "0%",
      easing: "easeInOutQuad",
      duration: 500,
    });

    this.showFlag = false;
  }

  show() {
    if (!this.LoginState) {
      anime({
        targets: this.personalInfoLogout,
        begin: () => {
          this.personalInfoLogout.style.display = "none";
        },
      });
    }
    this.navPersonalInfo.addEventListener("click", () => {
      if (!this.showFlag) {
        this.showFlag = true;
        anime({
          targets: this.personalInfoContent,
          width: "200px",
          height: "100%",
          zIndex: [30],
          easing: "easeInOutQuad",
          duration: 500,
        });
        return;
      }

      this.close();
    });
  }
}

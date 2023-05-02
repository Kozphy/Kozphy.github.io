import { signUpForm } from "../RenderForms.js";
import { personalInfo } from "../navbar.js";
export { join_us_btn };

let join_us_btn = document.querySelector(".join-us-btn");

async function initialize() {
  try {
    const person = personalInfo;
    join_us_btn.addEventListener("click", () => {
      if (!person.loginUser.length) {
        signUpForm.show();
      } else {
        alert("you have already logged in");
      }
    });
  } catch (error) {
    console.error(error);
  }
}

initialize();

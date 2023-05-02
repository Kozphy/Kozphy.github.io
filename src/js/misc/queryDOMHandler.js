function querySelectorDOM(search) {
  let res = document.querySelector(search);

  if (!res) {
    alert(`${res} DOM element not found`);
  }

  return res;
}

function querySelectorAllDOM(search) {
  let res = document.querySelectorAll(search);

  if (!res) {
    alert(`${res} DOM element not found`);
  }

  return res;
}

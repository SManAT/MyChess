import "@scss/login.scss";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import $ from "jquery";
import axios from "axios";
window.$ = $;
window.axios = axios;

// axios define Server URL
axios.defaults.baseURL = import.meta.env.VITE_SERVER_URL;

$(function () {
  $("#username").trigger("focus");

  $("#login_form").on("submit", async function (e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const loginData = {
      username: formData.get("username"),
      password: formData.get("password"),
    };

    //Debug
    window.location.href = "/chess.html";
    console.log("JWT noch offen!!");

    // Store data that persists even after browser restart
    localStorage.setItem("username", loginData.username);

    // JWT to Server

    let data = JSON.stringify(loginData);
    await axios.post("/login", data).then((response) => {
      if (response.data?.authenticated) {
        // Success
        //localStorage.setItem("authToken", result.token);
        window.location.href = "/dashboard";
        return;
      }
    });
  });
});

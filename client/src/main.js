import "@scss/login.scss";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import $ from "jquery";
window.$ = $;

$(function () {
  $("#username").trigger("focus");

  $("#login_form").on("submit", async function (e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const loginData = {
      email: formData.get("username"),
      password: formData.get("password"),
    };

    //Debug
    window.location.href = "/chess.html";
    console.log("JWT noch offen!!");
    /*
    // JWT to Server
    $.ajax({
      url: "/api/login",
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify(loginData),
    })
      .done(function (result) {
        // Success
        localStorage.setItem("authToken", result.token);
        window.location.href = "/dashboard";
      })
      .fail(function (xhr) {
        // Error
        const error = xhr.responseJSON || {};
        alert(error.message || "Login failed");
      });
      */
  });
});

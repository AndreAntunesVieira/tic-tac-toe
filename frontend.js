const log = document.querySelector("#log");
const input = document.querySelector("#input");
const status = document.querySelector("#status");

let myColor = false;
let myName = false;

window.WebSocket = window.WebSocket || window.MozWebSocket;

if (!window.WebSocket)
  log.innerHTML = "Sorry, but your browser doesn't support WebSocket.";

const connection = new WebSocket("ws://127.0.0.1:1337");
connection.onopen = function() {
  input.removeAttribute("disabled");
  status.innerText = "Choose name:";
};
connection.onerror = function(error) {
  console.log(error)
  log.innerHTML = "Sorry, but there's some problem with your connection or the server is down."
};

connection.onmessage = function(message) {
  console.log(message)
  // try {
  //   var json = JSON.parse(message.data);
  // } catch (e) {
  //   console.log("Invalid JSON: ", message.data);
  //   return;
  // }
  // // NOTE: if you're not sure about the JSON structure
  // // check the server source code above
  // // first response from the server with user's color
  // if (json.type === "color") {
  //   myColor = json.data;
  //   status.text(myName + ": ").css("color", myColor);
  //   input.removeAttr("disabled").focus();
  //   // from now user can start sending messages
  // } else if (json.type === "history") {
  //   // entire message history
  //   // insert every single message to the chat window
  //   for (var i = 0; i < json.data.length; i++) {
  //     addMessage(
  //       json.data[i].author,
  //       json.data[i].text,
  //       json.data[i].color,
  //       new Date(json.data[i].time)
  //     );
  //   }
  // } else if (json.type === "message") {
  //   // it's a single message
  //   // let the user write another message
  //   input.removeAttr("disabled");
  //   addMessage(
  //     json.data.author,
  //     json.data.text,
  //     json.data.color,
  //     new Date(json.data.time)
  //   );
  // } else {
  //   console.log("Hmm..., I've never seen JSON like this:", json);
  // }
// };

// input.keydown(function(e) {
//   if (e.keyCode === 13) {
//     var msg = $(this).val();
//     if (!msg) {
//       return;
//     }
//     // send the message as an ordinary text
//     connection.send(msg);
//     $(this).val("");
//     // disable the input field to make the user wait until server
//     // sends back response
//     input.attr("disabled", "disabled");
//     // we know that the first message sent from a user their name
//     if (myName === false) {
//       myName = msg;
//     }
//   }
// });

setInterval(function() {
  if (connection.readyState !== 1) {
    status.text("Error");
    input.setAttribute("disabled", "disabled")
    input.value = "Unable to communicate with the WebSocket server.";
  }
}, 3000)

// function addMessage(author, message, color, dt) {
//   log.prepend(
//     '<p><span style="color:' +
//       color +
//       '">' +
//       author +
//       "</span> @ " +
//       (dt.getHours() < 10 ? "0" + dt.getHours() : dt.getHours()) +
//       ":" +
//       (dt.getMinutes() < 10 ? "0" + dt.getMinutes() : dt.getMinutes()) +
//       ": " +
//       message +
//       "</p>"
//   );
}

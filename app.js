const port = process.env.PORT || 3000;
const token = process.env.WHATSAPP_TOKEN;

// Imports dependencies and set up http server
const request = require("request"),
express = require("express"),
body_parser = require("body-parser"),
axios = require("axios").default,
app = express().use(body_parser.json()); // creates express http server

const { MongoClient } = require('mongodb');
// Connection URL
const urlConnectString = 'mongodb+srv://sombass002:VcLYM0RAbO5D1AiK@cluster0.t3zaba5.mongodb.net/?retryWrites=true&w=majority';
const client = new MongoClient(urlConnectString);
// Database Name
const dbName = 'whatsapp';
app.get('/', async (req, res) => {
  res.send('Hello Sombass!! 2002');
});

app.listen(port, () => {
  console.log('Server is listening on port 3000');
});

// Accepts GET requests at the /webhook endpoint. You need this URL to setup webhook initially.
// info on verification request payload: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
app.get("/webhook", (req, res) => {
  /**
  * UPDATE YOUR VERIFY TOKEN
  *This will be the Verify Token value when you set up webhook
  **/
  const verify_token = process.env.VERIFY_TOKEN;
  
  // Parse params from the webhook verification request
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];
  
  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === "subscribe" && token === verify_token) {
      // Respond with 200 OK and challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

// Accepts POST requests at /webhook endpoint
app.post("/webhook", async (req, res) => {
  // Parse the request body from the POST
  let body = req.body;
  // Check the Incoming webhook message
  // console.log(JSON.stringify(req.body, null, 2));
  const dadaJson = JSON.parse(body);
  await client.connect();
  console.log('Connected successfully to server');
  const db = client.db(dbName);
  const collection = db.collection('chats_data');
  await collection.insertOne(dadaJson.entry[0]);
  console.log('insertOne successfully to server');
  // info on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages
  if (req.body.object) {
    if (
      req.body.entry &&
      req.body.entry[0].changes &&
      req.body.entry[0].changes[0] &&
      req.body.entry[0].changes[0].value.messages &&
      req.body.entry[0].changes[0].value.messages[0]
      ) {
        let phone_number_id =
        req.body.entry[0].changes[0].value.metadata.phone_number_id;
        let from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
        let msg_body = req.body.entry[0].changes[0].value.messages[0].text.body; // extract the message text from the webhook payload
        
        if (msg_body == "redeem") {
          app.redeem(from, phone_number_id);
        }
        
        axios({
          method: "POST", // Required, HTTP method, a string, e.g. POST, GET
          url:
          "https://graph.facebook.com/v12.0/" +
          phone_number_id +
          "/messages?access_token=" +
          token,
          data: {
            messaging_product: "whatsapp",
            to: from,
            text: { body: "Ack: " + msg_body },
          },
          headers: { "Content-Type": "application/json" },
        });
      }
      res.sendStatus(200);
    } else {
      // Return a '404 Not Found' if event is not from a WhatsApp API
      res.sendStatus(404);
    }
  });
  
  app.redeem = function (from, phone_number_id) {
    console.log("SOMBASS LOG" + phone_number_id);
    axios({
      method: "POST", // Required, HTTP method, a string, e.g. POST, GET
      url:
      "https://graph.facebook.com/v15.0/" +
      phone_number_id +
      "/messages?access_token=" +
      token,
      data: {
        messaging_product: "whatsapp",
        to: from,
        text: { body: "Redeem: Body" },
      },
      headers: { "Content-Type": "application/json" },
    });
  };
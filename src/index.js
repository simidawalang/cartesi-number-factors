// XXX even though ethers is not used in the code below, it's very likely
// it will be used by any DApp, so we are already including it here
const { ethers } = require("ethers");

const rollup_server = process.env.ROLLUP_HTTP_SERVER_URL;
console.log("HTTP rollup_server url is " + rollup_server);

const isInputAnInteger = (num) => {
  if (Math.round(num) === Number(num)) {
    return true;
  } else {
    return false;
  }
};

const getFactors = (num) => {
  let factors = [];

  for (let i = 0; i <= num / 2; i++) {
    if (num % i === 0) {
      factors.push(i);
    }
  }
  factors.push(Math.round(num));

  return factors;
};

async function handle_advance(data) {
  console.log("Received advance request data " + JSON.stringify(data));

  const decodedInput = ethers.toUtf8String(data["payload"]);

  if (!isInputAnInteger(decodedInput)) {
    console.log("Invalid integer value");
    console.log(
      "The received advance request for the hex data string value " +
        JSON.stringify(decodedInput)
    );
  } else {
    const factors = getFactors(decodedInput);
    console.log("Valid integer");
    console.log(
      "The received advance request for the hex data number value " +
        JSON.stringify(factors)
    );
  }

  return "accept";
}

async function handle_inspect(data) {
  console.log("Received inspect request data " + JSON.stringify(data));
  return "accept";
}

var handlers = {
  advance_state: handle_advance,
  inspect_state: handle_inspect,
};

var finish = { status: "accept" };

(async () => {
  while (true) {
    const finish_req = await fetch(rollup_server + "/finish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "accept" }),
    });

    console.log("Received finish status " + finish_req.status);

    if (finish_req.status == 202) {
      console.log("No pending rollup request, trying again");
    } else {
      const rollup_req = await finish_req.json();
      var handler = handlers[rollup_req["request_type"]];
      finish["status"] = await handler(rollup_req["data"]);
    }
  }
})();

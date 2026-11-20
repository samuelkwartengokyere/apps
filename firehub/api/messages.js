var STORAGE_KEY = "firehub_messages";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

async function upstash(command) {
  var url = process.env.UPSTASH_REDIS_REST_URL;
  var token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  var response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  return response.json();
}

async function readMessages() {
  var data = await upstash(["GET", STORAGE_KEY]);
  if (!data || !data.result) return [];
  try {
    var parsed = JSON.parse(data.result);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

async function writeMessages(list) {
  await upstash(["SET", STORAGE_KEY, JSON.stringify(list)]);
}

module.exports = async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    res.status(503).json({ error: "Messages API not configured" });
    return;
  }

  if (req.method === "GET") {
    res.status(200).json(await readMessages());
    return;
  }

  if (req.method === "POST") {
    var body = req.body;
    if (!Array.isArray(body)) {
      res.status(400).json({ error: "Expected a JSON array of messages" });
      return;
    }
    await writeMessages(body);
    res.status(200).json(body);
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
};

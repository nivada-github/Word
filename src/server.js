const app = require("./app");

const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`Word API running on http://${HOST}:${PORT}`);
});

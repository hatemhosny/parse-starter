// The main entry to cloud code

const config = require("../config");

Parse.Cloud.define("hello", () => "hello world!");
// you can call this function by running the following code (e.g. in the dashboard JS console)
// Parse.Cloud.run('hello').then(result => {
//   console.log(result);
// });

Parse.Cloud.define("addAndGetAverage", async (req) => {
  const { name, value } = req.params;
  const obj = new Parse.Object("Demo");
  obj.set("name", name);
  obj.set("value", value);
  await obj.save();

  const query = new Parse.Query("Demo");
  const results = await query.find();
  const values = results
    .map((result) => result.get("value"))
    .filter((value) => value);
  const sum = values.reduce((a, b) => a + b);
  return sum / values.length;
});
// and call like this
// (async () => {
//   const rnd = Math.floor(Math.random() * 10)
//   const params = { name: 'demo' + rnd, value: rnd };
//   const avg = await Parse.Cloud.run('addAndGetAverage', params);
//   console.log(avg);
// })();

// CMS Cloud Code
if (config.extraConfig.cmsEnabled) {
  require("../cms/cloud/main");
}

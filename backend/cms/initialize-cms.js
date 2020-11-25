const Parse = require("parse/node");

const initializeCMS = async (config) => {
  Parse.initialize(config.appId, null, config.masterKey);
  Parse.serverURL = config.serverURL;

  const {
    cmsUserEmail: username,
    cmsUserPassword: password,
  } = config.extraConfig;
  if (username && password) {
    const query = new Parse.Query(Parse.User);
    query.equalTo("username", username);
    const user = await query.first();
    if (user) {
      user.set("password", password);
      user.set("email", username);
      await user.save(null, { useMasterKey: true });
    } else {
      const newUser = new Parse.User();
      newUser.set("username", username);
      newUser.set("password", password);
      newUser.set("email", username);
      newUser.set("verifiedEmail", undefined);
      await newUser.signUp(null, { useMasterKey: true });
    }
  }

  if (config.StripeConfig) {
    try {
      await request({
        url: config.publicServerURL + "/config",
        method: "PUT",
        json: true,
        headers: {
          "X-Parse-Application-Id": config.appId,
          "X-Parse-Master-Key": config.masterKey,
        },
        body: { params: { StripeKeyPublic: config.StripeConfig.keyPublic } },
      });
    } catch (e) {
      console.error(e);
    }
  }

  // set templates
  if (config.siteTemplates) {
    const templates = require("./siteTemplates/templates.json");
    const fs = require("fs");

    const Template = Parse.Object.extend("Template");
    const Model = Parse.Object.extend("Model");
    const ModelField = Parse.Object.extend("ModelField");

    const ACL = new Parse.ACL();
    ACL.setPublicReadAccess(true);
    ACL.setPublicWriteAccess(false);

    for (let template of templates) {
      const res = await new Parse.Query("Template")
        .equalTo("name", template.name)
        .first();
      if (res) continue;

      const template_o = new Template();

      template_o.set("name", template.name);
      template_o.set("description", template.description);
      template_o.setACL(ACL);

      if (template.icon) {
        const iconData = fs.readFileSync(
          `./siteTemplates/icons/${template.icon}`
        );
        const iconFile = new Parse.File("icon.png", [...iconData]);
        await iconFile.save(null, { useMasterKey: true });
        template_o.set("icon", iconFile);
      }

      await template_o.save(null, { useMasterKey: true });

      for (let model of template.models) {
        const model_o = new Model();

        model_o.set("name", model.name);
        model_o.set("nameId", model.nameId);
        model_o.set("description", model.description);
        model_o.set("color", model.color);
        model_o.set("template", template_o);
        model_o.setACL(ACL);

        await model_o.save(null, { useMasterKey: true });

        for (let field of model.fields) {
          const field_o = new ModelField();
          field_o.set(field);
          field_o.set("model", model_o);
          field_o.setACL(ACL);
          field_o.save(null, { useMasterKey: true });
        }
      }
    }
  }
};

module.exports = initializeCMS;

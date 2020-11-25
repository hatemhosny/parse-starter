console.log('Cloud code connected');

const {config, SITE, ROLE_ADMIN, ROLE_EDITOR, promisifyW, getAllObjects} = require('./common');

const {getPayPlan} = require('./payment');


const checkRights = (user, obj) => {
  const acl = obj.getACL();
  if (!acl)
    return true;

  const read = acl.getReadAccess(user.id);
  const write = acl.getWriteAccess(user.id);

  const pRead = acl.getPublicReadAccess();
  const pWrite = acl.getPublicWriteAccess();
  
  return read && write || pRead && pWrite;
};


const getTableData = async (table) => {
  const endpoint = '/schemas/' + table;
  
  try {
    const response = await Parse.Cloud.httpRequest({
      url: config.serverURL + endpoint,
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
        'X-Parse-Application-Id': config.appId,
        'X-Parse-Master-Key': config.masterKey
      }
    });
  
    if (response.status == 200)
      return response.data;
    
  } catch (e) {}
  
  return null;
};

const setTableData = async (table, data, method = 'POST') => {
  const endpoint = '/schemas/' + table;
  
  const response = await Parse.Cloud.httpRequest({
    url: config.serverURL + endpoint,
    method,
    mode: 'cors',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
      'X-Parse-Application-Id': config.appId,
      'X-Parse-Master-Key': config.masterKey
    },
    body: JSON.stringify(data)
  });
  
  if (response.status != 200)
    throw response.status;
};

const deleteTable = async (table) => {
  const endpoint = '/schemas/' + table;
  
  const response = await Parse.Cloud.httpRequest({
    url: config.serverURL + endpoint,
    method: 'DELETE',
    mode: 'cors',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
      'X-Parse-Application-Id': config.appId,
      'X-Parse-Master-Key': config.masterKey
    }
  });
  
  if (response.status != 200)
    throw response.status;
};


const deleteContentItem = async (user, tableName, itemId) => {
  const item = await new Parse.Query(tableName)
    .get(itemId, {useMasterKey: true});

  if (!checkRights(user, item))
    throw "Access denied!";
  
  
  //removing MediaItem's belonging to content item
  const tableData = await getTableData(tableName);
  
  for (let field in tableData.fields) {
    const val = tableData.fields[field];
    if (val.type == 'Pointer' && val.targetClass == 'MediaItem') {
      const media = item.get(field);
      //!! uncontrolled async operation
      if (media)
        media.destroy({useMasterKey: true});
    }
  }
  
  
  //seeking draft version of content item
  const itemDraft = await new Parse.Query(tableName)
    .equalTo('t__owner', item)
    .first({useMasterKey: true});
  
  if (itemDraft) {
    if (!checkRights(user, itemDraft))
      throw "Access denied!";
  
    for (let field in tableData.fields) {
      const val = tableData.fields[field];
      if (val.type == 'Pointer' && val.targetClass == 'MediaItem') {
        const media = itemDraft.get(field);
        //!! uncontrolled async operation
        if (media)
          media.destroy({useMasterKey: true});
      }
    }
  
    await itemDraft.destroy({useMasterKey: true});
  }
  
  await item.destroy({useMasterKey: true});
};

const deleteModel = async (user, model, deleteRef = true, deleteModel = true) => {
  if (!checkRights(user, model))
    throw "Access denied!";
  
  
  //removing model fields
  let fields = await getAllObjects(
    new Parse.Query('ModelField')
      .equalTo('model', model)
  );
  
  let promises = [];
  for (let field of fields) {
    if (checkRights(user, field))
      promises.push(promisifyW(field.destroy({useMasterKey: true})));
  }
  await Promise.all(promises);
  
  
  //removing content items of model
  const tableName = model.get('tableName');
  const items = await getAllObjects(new Parse.Query(tableName));
  promises = [];
  for (let item of items) {
    promises.push(promisifyW(deleteContentItem(user, tableName, item.id)));
  }
  await Promise.all(promises);

  try {
    await deleteTable(tableName);
  } catch (e) {}
  
  
  //removing reference validation to model
  if (deleteRef) {
    const models = await getAllObjects(
      new Parse.Query('Model')
        .equalTo('site', model.get('site'))
    );
    fields = await getAllObjects(
      new Parse.Query('ModelField')
        .containedIn('model', models)
        .notEqualTo('model', model)
        .equalTo('type', 'Reference')
    );
  
    const promises = [];
    for (let field of fields) {
      const validations = field.get('validations');
      if (!validations || !validations.models || !validations.models.active || !validations.models.modelsList)
        continue;
    
      const i = validations.models.modelsList.indexOf(model.get('nameId'));
      if (i == -1)
        continue;
    
      validations.models.modelsList.splice(i, 1);
      field.set('validations', validations);
      promises.push(promisifyW(field.save(null, {useMasterKey: true})));
    }
    await Promise.all(promises);
  }
  
  
  //remove model
  if (deleteModel)
    await model.destroy({useMasterKey: true});
};


Parse.Cloud.define("deleteContentItem", async (request) => {
  if (!request.user)
    throw 'Must be signed in to call this Cloud Function.';

  const {tableName, itemId} = request.params;
  if (!tableName || !itemId)
    throw 'There is no tableName or itemId params!';

  try {
    await deleteContentItem(request.user, tableName, itemId);
    return "Successfully deleted content item.";
  } catch (error) {
    throw `Could not delete content item: ${error}`;
  }
});

Parse.Cloud.beforeDelete(`Model`, async request => {
  if (request.master)
    return;
  
  try {
    return await deleteModel(request.user, request.object, true, false);
  } catch (error) {
    throw `Could not delete model: ${JSON.stringify(error, null, 2)}`;
  }
});

Parse.Cloud.beforeDelete(`Site`, async request => {
  if (request.master)
    return;
  
  const site = request.object;
  
  if (!checkRights(request.user, site))
    throw "Access denied!";
  
  //removing site's models
  const models = await getAllObjects(
    new Parse.Query('Model')
      .equalTo('site', site));
  
  let promises = [];
  for (let model of models)
    promises.push(promisifyW(
      deleteModel(request.user, model, false)
    ));
  await Promise.all(promises);
  
  
  //removing site's collaborations
  const collabs = await getAllObjects(
    new Parse.Query('Collaboration')
      .equalTo('site', site));
  
  promises = [];
  for (let collab of collabs)
    promises.push(promisifyW(
      collab.destroy({useMasterKey: true})
    ));
  await Promise.all(promises);
});


const onCollaborationModify = async (collab, deleting = false) => {
  const site = collab.get('site');
  const user = collab.get('user');
  const role = collab.get('role');
  
  if (!user)
    return;
  
  await site.fetch({useMasterKey: true});
  
  //ACL for collaborations
  const owner = site.get('owner');
  let collabACL = collab.getACL();
  if (!collabACL)
    collabACL = new Parse.ACL(owner);
    
  //getting all site collabs
  const collabs = await getAllObjects(
    new Parse.Query('Collaboration')
      .equalTo('site', site)
      .notEqualTo('user', user));
  
  for (let tempCollab of collabs) {
    if (tempCollab.id == collab.id)
      continue;
    
    //set ACL for others collab
    let tempCollabACL = tempCollab.getACL();
    if (!tempCollabACL)
      tempCollabACL = new Parse.ACL(owner);
    
    tempCollabACL.setReadAccess(user, !deleting && role == ROLE_ADMIN);
    tempCollabACL.setWriteAccess(user, !deleting && role == ROLE_ADMIN);
    
    tempCollab.setACL(tempCollabACL);
    //!! uncontrolled async operation
    tempCollab.save(null, {useMasterKey: true});
    
    //set ACL for current collab
    if (!deleting) {
      const tempRole = tempCollab.get('role');
      const tempUser = tempCollab.get('user');
      collabACL.setReadAccess(tempUser, tempRole == ROLE_ADMIN);
      collabACL.setWriteAccess(tempUser, tempRole == ROLE_ADMIN);
    }
  }
  
  collabACL.setReadAccess(user, true);
  collabACL.setWriteAccess(user, true);
  collab.setACL(collabACL);
  
  
  //ACL for site
  let siteACL = site.getACL();
  if (!siteACL)
    siteACL = new Parse.ACL(owner);
  
  siteACL.setReadAccess(user, !deleting);
  siteACL.setWriteAccess(user, !deleting && role == ROLE_ADMIN);
  site.setACL(siteACL);
  //!! uncontrolled async operation
  site.save(null, {useMasterKey: true});

  
  //ACL for media items
  const mediaItems = await getAllObjects(
    new Parse.Query('MediaItem')
      .equalTo('site', site));
  
  for (let item of mediaItems) {
    let itemACL = item.getACL();
    if (!itemACL)
      itemACL = new Parse.ACL(owner);

    itemACL.setReadAccess(user, !deleting);
    itemACL.setWriteAccess(user, !deleting && role == ROLE_ADMIN);
    item.setACL(itemACL);
    //!! uncontrolled async operation
    item.save(null, {useMasterKey: true});
  }
  
  
  //ACL for models and content items
  const models = await getAllObjects(
    new Parse.Query('Model')
      .equalTo('site', site));
      
  for (let model of models) {
    let modelACL = model.getACL();
    if (!modelACL)
      modelACL = new Parse.ACL(owner);
    
    modelACL.setReadAccess(user, !deleting);
    modelACL.setWriteAccess(user, !deleting && role == ROLE_ADMIN);
    model.setACL(modelACL);
    //!! uncontrolled async operation
    model.save(null, {useMasterKey: true});

    const tableName = model.get('tableName');
    //!! uncontrolled async operation
    getTableData(tableName)
      .then(response => {
        let CLP = response ? response.classLevelPermissions : null;
        if (!CLP)
          CLP = {
            'get': {},
            'find': {},
            'create': {},
            'update': {},
            'delete': {},
            'addField': {}
          };
        
        if (!deleting) {
          CLP['get'][user.id] = true;
          CLP['find'][user.id] = true;
        } else {
          if (CLP['get'].hasOwnProperty(user.id))
            delete CLP['get'][user.id];
          if (CLP['find'].hasOwnProperty(user.id))
            delete CLP['find'][user.id];
        }
        
        if (!deleting && (role == ROLE_ADMIN || role == ROLE_EDITOR)) {
          CLP['create'][user.id] = true;
          CLP['update'][user.id] = true;
          CLP['delete'][user.id] = true;
        } else {
          if (CLP['create'].hasOwnProperty(user.id))
            delete CLP['create'][user.id];
          if (CLP['update'].hasOwnProperty(user.id))
            delete CLP['update'][user.id];
          if (CLP['delete'].hasOwnProperty(user.id))
            delete CLP['delete'][user.id];
        }
        
        if (!deleting && role == ROLE_ADMIN)
          CLP['addField'][user.id] = true;
        else if (CLP['addField'].hasOwnProperty(user.id))
          delete CLP['addField'][user.id];
        
        //!! uncontrolled async operation
        const data = {"classLevelPermissions": CLP};
        setTableData(tableName, data)
          .catch(() => setTableData(tableName, data, 'PUT'));
      });
  }
  
  
  //ACL for fields
  const fields = await getAllObjects(
    new Parse.Query('ModelField')
      .containedIn('model', models));
      
  for (let field of fields) {
    let fieldACL = field.getACL();
    if (!fieldACL)
      fieldACL = new Parse.ACL(owner);

    fieldACL.setReadAccess(user, !deleting);
    fieldACL.setWriteAccess(user, !deleting && role == ROLE_ADMIN);
    field.setACL(fieldACL);
    //!! uncontrolled async operation
    field.save(null, {useMasterKey: true});
  }
};


Parse.Cloud.beforeSave("Collaboration", async request => {
  if (request.master)
    return;
  
  const collab = request.object;
  if (!checkRights(request.user, collab))
    throw "Access denied!";
    
  return onCollaborationModify(collab);
});

Parse.Cloud.beforeDelete("Collaboration", async request => {
  if (request.master)
    return;
  
  const collab = request.object;
  if (!checkRights(request.user, collab))
    throw "Access denied!";
  
  return onCollaborationModify(collab, true);
});

Parse.Cloud.beforeSave(Parse.User, request => {
  const user = request.object;
  const email = user.get('email');
  if (user.get('username') != email)
    user.set('username', email);
});

Parse.Cloud.afterSave(Parse.User, async request => {
  const user = request.object;
  
  const collabs = await new Parse.Query('Collaboration')
    .equalTo('email', user.get('email'))
    .find({useMasterKey: true});

  const promises = [];

  for (let collab of collabs) {
    if (collab.get('user'))
      continue;
  
    collab.set('user', user);
    collab.set('email', '');
  
    promises.push(collab.save(null, {useMasterKey: true}));
    promises.push(promisifyW(onCollaborationModify(collab)));
  }
  
  await Promise.all(promises);
});

Parse.Cloud.beforeSave("Site", async request => {
  if (request.master)
    return;
  
  //updating an existing site
  if (request.object.id)
    return true;

  const user = request.user;
  if (!user)
    throw 'Must be signed in to save sites.';
  
  const payPlan = await getPayPlan(user);
  if (!payPlan)
    return true;
  
  const sitesLimit = payPlan.get('limitSites');
  if (!sitesLimit)
    return true;
    
  const sites = await new Parse.Query('Site')
    .equalTo('owner', user)
    .count({useMasterKey: true});
  
  if (sites >= sitesLimit)
    throw `The user has exhausted their sites' limit!`;
    
  return true;
});

Parse.Cloud.beforeSave(`Model`, async request => {
  if (request.master)
    return;
  
  const model = request.object;
  if (model.id)
    return;
  
  const site = model.get('site');
  await site.fetch({useMasterKey: true});
  
  //ACL for collaborations
  const owner = site.get('owner');
  const modelACL = new Parse.ACL(owner);
  
  const collabs = await getAllObjects(
    new Parse.Query('Collaboration')
      .equalTo('site', site));
  
  const admins = [owner.id];
  const writers = [owner.id];
  const all = [owner.id];
  
  for (let collab of collabs) {
    const user = collab.get('user');
    const role = collab.get('role');
    
    modelACL.setReadAccess(user, true);
    modelACL.setWriteAccess(user, role == ROLE_ADMIN);
    
    if (role == ROLE_ADMIN)
      admins.push(user.id);
    if (role == ROLE_ADMIN || role == ROLE_EDITOR)
      writers.push(user.id);
    all.push(user.id);
  }
  
  model.setACL(modelACL);
  
  //set CLP for content table
  const CLP = {
    'get': {},
    'find': {},
    'create': {},
    'update': {},
    'delete': {},
    'addField': {}
  };
  
  for (let user of all) {
    CLP['get'][user] = true;
    CLP['find'][user] = true;
  }
  for (let user of writers) {
    CLP['create'][user] = true;
    CLP['update'][user] = true;
    CLP['delete'][user] = true;
  }
  for (let user of admins) {
    CLP['addField'][user] = true;
  }
  
  const data = {"classLevelPermissions": CLP};
  await setTableData(model.get('tableName'), data);
});

Parse.Cloud.beforeSave(`ModelField`, async request => {
  if (request.master)
    return;
  
  const field = request.object;
  if (field.id)
    return;
  
  const model = field.get('model');
  await model.fetch({useMasterKey: true});

  const site = model.get('site');
  await site.fetch({useMasterKey: true});
  
  //ACL for collaborations
  const owner = site.get('owner');
  const fieldACL = new Parse.ACL(owner);

  const collabs = await getAllObjects(
    new Parse.Query('Collaboration')
      .equalTo('site', site));

  for (let collab of collabs) {
    const user = collab.get('user');
    const role = collab.get('role');

    fieldACL.setReadAccess(user, true);
    fieldACL.setWriteAccess(user, role == ROLE_ADMIN);
  }

  field.setACL(fieldACL);
});

Parse.Cloud.beforeSave(`MediaItem`, async request => {
  if (request.master)
    return;
  
  const item = request.object;
  if (item.id)
    return;

  const site = item.get('site');
  await site.fetch({useMasterKey: true});
  
  //ACL for collaborations
  const owner = site.get('owner');
  const itemACL = new Parse.ACL(owner);
  
  const collabs = await getAllObjects(
    new Parse.Query('Collaboration')
      .equalTo('site', site));
    
  for (let collab of collabs) {
    const user = collab.get('user');
    const role = collab.get('role');

    itemACL.setReadAccess(user, true);
    itemACL.setWriteAccess(user, role == ROLE_ADMIN);
  }

  item.setACL(itemACL);
});


Parse.Cloud.define("onContentModify", async request => {
  if (!request.user)
    throw 'Must be signed in to call this Cloud Function.';

  const {URL} = request.params;
  if (!URL)
    return 'Warning! There is no content hook!';

  const response = await Parse.Cloud.httpRequest({
    url: URL,
    method: 'GET'
  });
  
  if (response.status == 200)
    return response.data;
  else
    throw response.status;
});

Parse.Cloud.define("inviteUser", async request => {
  if (!request.user)
    throw 'Must be signed in to call this Cloud Function.';
  
  const {email, siteName} = request.params;
  if (!email || !siteName)
    throw 'Email or siteName is empty!';

  console.log(`Send invite to ${email} ${new Date()}`);
  
  const {AppCache} = require('parse-server/lib/cache');
  const emailAdapter = AppCache.get(config.appId)['userController']['adapter'];

  const emailSelf = request.user.get('email');
  const link = `${SITE}/sign?mode=register&email=${email}`;

  try {
    await emailAdapter.send({
      templateName: 'inviteEmail',
      recipient: email,
      variables: {siteName, emailSelf, link}
    });
    console.log(`Invite sent to ${email} ${new Date()}`);
    return "Invite email sent!";
  
  } catch (error) {
    console.log(`Got an error in inviteUser: ${error}`);
    throw error;
  }
});

Parse.Cloud.define("checkPassword", request => {
  if (!request.user)
    throw 'Must be signed in to call this Cloud Function.';

  const {password} = request.params;
  if (!password)
    throw 'There is no password param!';

  const username = request.user.get('username');

  return Parse.User.logIn(username, password);
});
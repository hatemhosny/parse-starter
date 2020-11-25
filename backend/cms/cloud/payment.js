const {StripeConfig, CLOUD_ERROR_CODE__STRIPE_INIT_ERROR} = require('./common');

let stripe;
if (StripeConfig && StripeConfig.keyPrivate)
  stripe = require("stripe")(StripeConfig.keyPrivate);


let defaultPayPlan;

//if there are no pay plans, return null
const getDefaultPayPlan = async () => {
  if (!defaultPayPlan)
    defaultPayPlan = await new Parse.Query('PayPlan')
      .equalTo('priceMonthly', 0)
      .first();

  return defaultPayPlan;
};

const getPayPlan = async (user) => {
  if (!stripe) {
    //return null;
    //throw {errorMsg: 'Stripe is not initialized!', errorCode: 701};

    let payPlan = user.get('payPlan');
    if (!payPlan)
      return null;

    await payPlan.fetch();
    return payPlan;
  }

  const customerId = user.get('StripeId');
  if (!customerId)
    return getDefaultPayPlan();

  let customer;
  try {
    customer = await stripe.customers.retrieve(customerId);
  } catch (e) {}
  if (!customer || customer.deleted)
    return getDefaultPayPlan();

  const subscription = customer.subscriptions.data[0];
  if (!subscription || subscription.status == 'canceled' || !subscription.plan)
    return getDefaultPayPlan();

  const payPlan = await new Parse.Query('PayPlan')
    .equalTo('StripeId', subscription.plan.product)
    .first();
  if (!payPlan)
    return getDefaultPayPlan();

  return payPlan;
};
module.exports.getPayPlan = getPayPlan;



Parse.Cloud.define("getStripeData", async request => {
  if (!stripe)
    throw {errorMsg: 'Stripe is not initialized!', errorCode: CLOUD_ERROR_CODE__STRIPE_INIT_ERROR};

  const {user} = request;
  if (!user)
    throw 'Must be signed in to call this Cloud Function.';

  const customerId = user.get('StripeId');
  if (!customerId)
    return null;

  let customer;
  try {
    customer = await stripe.customers.retrieve(customerId);
  } catch (e) {}
  if (!customer || customer.deleted)
    return null;

  const sources = [];
  for await (const source of stripe.customers.listSources(customerId)) {
    sources.push(source);
  }

  let subscription = customer.subscriptions.data[0];
  if (subscription && subscription.status == 'canceled')
    subscription = null;

  return {
    defaultSource: customer.default_source,
    sources,
    subscription
  };
});

Parse.Cloud.define("savePaymentSource", async request => {
  if (!stripe)
    throw {errorMsg: 'Stripe is not initialized!', errorCode: CLOUD_ERROR_CODE__STRIPE_INIT_ERROR};

  const {user} = request;
  if (!user)
    throw 'Must be signed in to call this Cloud Function.';

  const {tokenId, asDefault} = request.params;
  if (!tokenId)
    throw 'There is no token param!';

  const customerId = user.get('StripeId');
  let customer;
  try {
    customer = await stripe.customers.retrieve(customerId);
  } catch (e) {}

  if (customer && !customer.deleted) {
    const source = await stripe.customers.createSource(customerId, {source: tokenId});
    if (asDefault)
      await stripe.customers.update(customerId, {default_source: source.id});

    return null;

  } else {
    customer = await stripe.customers.create({
      source: tokenId,
      email: user.get('email')
    });
    user.set('StripeId', customer.id);
    await user.save(null, {useMasterKey: true});

    return customer.id;
  }
});

Parse.Cloud.define("setDefaultPaymentSource", async request => {
  if (!stripe)
    throw {errorMsg: 'Stripe is not initialized!', errorCode: CLOUD_ERROR_CODE__STRIPE_INIT_ERROR};

  const {user} = request;
  if (!user)
    throw 'Must be signed in to call this Cloud Function.';

  const {sourceId} = request.params;
  if (!sourceId)
    throw 'There is no source param!';

  let customerId = user.get('StripeId');
  if (!customerId)
    throw 'There is no customer object yet!';

  await stripe.customers.update(customerId, {default_source: sourceId});

  return null;
});

Parse.Cloud.define("removePaymentSource", async request => {
  if (!stripe)
    throw {errorMsg: 'Stripe is not initialized!', errorCode: CLOUD_ERROR_CODE__STRIPE_INIT_ERROR};

  const {user} = request;
  if (!user)
    throw 'Must be signed in to call this Cloud Function.';

  const {sourceId} = request.params;
  if (!sourceId)
    throw 'There is no sourceId param!';

  let customerId = user.get('StripeId');
  if (!customerId)
    throw 'There is no customer object yet!';

  await stripe.customers.deleteSource(customerId, sourceId);

  const customer = await stripe.customers.retrieve(customerId);

  return {defaultSource: customer.default_source};
});

Parse.Cloud.define('paySubscription', async request => {
  if (!stripe)
    throw {errorMsg: 'Stripe is not initialized!', errorCode: CLOUD_ERROR_CODE__STRIPE_INIT_ERROR};

  const {user} = request;
  if (!user)
    throw 'Must be signed in to call this Cloud Function.';

  const customerId = user.get('StripeId');
  if (!customerId)
    throw 'There are no payment methods!';

  const {planId, isYearly} = request.params;
  if (!planId)
    throw 'There is no plan param!';

  const payPlan = await new Parse.Query("PayPlan").get(planId);
  if (!payPlan)
    throw 'There is no pay plan!';

  const StripePlanId = isYearly ? payPlan.get('StripeIdYearly') : payPlan.get('StripeIdMonthly');
  if (!StripePlanId)
    throw 'Wrong pay plan!';

  const customer = await stripe.customers.retrieve(customerId);

  let subscription = customer.subscriptions.data[0];
  if (subscription) {
    subscription = await stripe.subscriptions.update(subscription.id, {
      items: [{
        id: subscription.items.data[0].id,
        plan: StripePlanId
      }],
      cancel_at_period_end: false
    });

  } else {
    subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{plan: StripePlanId}]
    });
  }

  user.set('payPlan', payPlan);
  await user.save(null, {useMasterKey: true});

  return subscription;
});

Parse.Cloud.define('cancelSubscription', async request => {
  if (!stripe)
    throw {errorMsg: 'Stripe is not initialized!', errorCode: CLOUD_ERROR_CODE__STRIPE_INIT_ERROR};

  const {user} = request;
  if (!user)
    throw 'Must be signed in to call this Cloud Function.';

  const customerId = user.get('StripeId');
  if (!customerId)
    throw 'There are no Stripe customer!';

  const customer = await stripe.customers.retrieve(customerId);

  const subscription = customer.subscriptions.data[0];
  if (!subscription)
    throw 'There are no subscription!';

  return await stripe.subscriptions.update(subscription.id, {cancel_at_period_end: true});
});

// @ts-check
const CosmosClient = require('@azure/cosmos').CosmosClient;

const config = require('./config');
// const url = require('url');

const endpoint = config.endpoint;
const key = config.key;

const databaseId = config.database.id;
const containerId = config.container.id;
const partitionKey = { kind: 'Hash', paths: ['/userdetails'] };

const client = new CosmosClient({ endpoint, key });

/**
 * Read the database definition
 */

async function readDatabase() {
  const { resource: databaseDefinition } = await client
    .database(databaseId)
    .read();
  console.log(`Reading database:\n${databaseDefinition.id}\n`);
}

/**
 * Read the container definition
 */
async function readContainer() {
  const { resource: containerDefinition } = await client
    .database(databaseId)
    .container(containerId)
    .read();
  console.log(`Reading container:\n${containerDefinition.id}\n`);
}

/**
 * Scale a container
 * You can scale the throughput (RU/s) of your container up and down to meet the needs of the workload. Learn more: https://aka.ms/cosmos-request-units
 */
async function scaleContainer() {
  const { resource: containerDefinition } = await client
    .database(databaseId)
    .container(containerId)
    .read();
  const { resources: offers } = await client.offers.readAll().fetchAll();

  const newRups = 500;
  for (var offer of offers) {
    if (containerDefinition._rid !== offer.offerResourceId) {
      continue;
    }
    offer.content.offerThroughput = newRups;
    const offerToReplace = client.offer(offer.id);
    await offerToReplace.replace(offer);
    console.log(`Updated offer to ${newRups} RU/s\n`);
    break;
  }
}

/**
 * Create family item if it does not exist
 */
async function createItem(itemBody) {
  const { item } = await client
    .database(databaseId)
    .container(containerId)
    .items.upsert(itemBody);
  console.log(`Created family item with id:\n${item.id}\n`);
  console.log(item.id);
  return item;
}

/**
 * Query the container using SQL
 */
async function queryContainer(querySpec) {
  console.log(`Querying container:\n${config.container.id}`);

  // query to return all children in a family
  // Including the partition key value of lastName in the WHERE filter results in a more efficient query
  //   const querySpec = {
  //     query: 'SELECT * from c',
  //   };

  const { resources: results } = await client
    .database(databaseId)
    .container(containerId)
    .items.query(querySpec)
    .fetchAll();

  return results;
}

/**
 * Replace the item by ID.
 */
async function updateItem(itemBody) {
  console.log(`Replacing item:\n${itemBody.id}\n`);
  // Change property 'grade'
  const { item } = await client
    .database(databaseId)
    .container(containerId)
    .item(itemBody.id)
    .replace(itemBody);
  console.log(`Replacing item:\n${item.id}\n`);
  return item;
}

/**
 * Delete the item by ID.
 */
// async function deleteFamilyItem(itemBody) {
//     await client
//         .database(databaseId)
//         .container(containerId)
//         .item(itemBody.id, itemBody.Country)
//         .delete(itemBody);
//     console.log(`Deleted item:\n${ itemBody.id }\n`);
// }

/**
 * Cleanup the database and collection on completion
 */
// async function cleanup() {
//     await client.database(databaseId).delete();
// }

/**
 * Exit the app with a prompt
 * @param {string} message - The message to display
 */
function exit(message) {
  console.log(message);
  console.log('Press any key to exit');
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', process.exit.bind(process, 0));
}

async function callDB() {
  await readDatabase();
  await readContainer();
  await scaleContainer();
  await queryContainer()
    .then(() => {
      exit('Completed successfully');
    })
    .catch((error) => {
      exit(`Completed with error ${JSON.stringify(error)}`);
    });
}

module.exports.callDB = { createItem, updateItem, queryContainer };

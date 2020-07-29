const { callDB } = require('./db');

const executeQuery = function (res, query) {
  callDB
    .queryContainer(query)
    .then(function (records) {
      console.log(records);
      res.statusCode = 200;
      res.send(JSON.stringify(records));
    })
    .catch(function (err) {
      console.log(2, err);
      res.statusCode = 400;
      res.send('Something went Wrong');
    });
};

exports.userDetails = function (req, res) {
  const { startDate, endDate } = req.body;
  const query = { query: `select * from c` };
  executeQuery(res, query);
};
/** Block Ends ***/

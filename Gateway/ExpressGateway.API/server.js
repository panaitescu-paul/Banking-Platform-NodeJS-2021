const path = require('path');
const gateway = require('express-gateway');
require('../../Borger/borger_system');
require('../../Bank/bank_api');
require('../../Skat/skat_api')

gateway()
  .load(path.join(__dirname, 'config'))
  .run();

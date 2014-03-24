var Oversight = require('../src/oversight');
var assert = require('../node_modules/chai/chai.js').assert;

describe('in depth observer tests -> ', function() {
    //remove all
    //destroy
    //onGet
    //onSet -> correct values in oldValue and newValue
    //a free fn observer and a key observer can co exist and fire correctly in the right order
    //double observified functions
});
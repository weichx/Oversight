var Oversight = require('../dist/oversight-test.js');
var assert = require('../node_modules/chai/chai.js').assert;
var sinon = require('../node_modules/sinon/lib/sinon.js');

describe('get tests', function() {
    it('can be used to get properties from any object', function() {
        var obj = {
            prop: 1
        };
        var retn = Oversight.unboundGet(obj, 'prop');
        assert.equal(retn, 1, 'should have retrieved the property');
    });

    it('can be used to get properties from any function', function() {
        var fn = function(){};
        fn.prop = 1;
        var retn = Oversight.unboundGet(fn, 'prop');
        assert.equal(retn, 1, 'should have retrieved the property');
    });

    it('will call onGet observers if any exist', function() {
        var target = {
            prop: 1
        };
        var onGetSpy = sinon.spy();
        Oversight.onGet(target, 'prop', onGetSpy);
        Oversight.unboundGet(target, 'prop');
        assert.ok(onGetSpy.calledOnce);
        assert.ok(onGetSpy.calledWith(1));
    });

    it('will return the original function when called on a target key that is observified', function() {
        var original = function(){};
        var target = {
            fn: original
        };
        Oversight.after(target, 'fn', function(){});
        assert.ok(target.__observers['fn'].original);
        assert.notEqual(original, target.fn, 'should have observified target.fn');
        var retn = Oversight.unboundGet(target, 'fn');
        assert.equal(retn, original, 'should return the original function');
    });
});
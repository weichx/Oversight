var Oversight = require('../dist/oversight-test.js');
var assert = require('../node_modules/chai/chai.js').assert;
var sinon = require('../node_modules/sinon/lib/sinon.js');

describe('new tests', function () {
    var originalSpy;
    var original;
    var observed;
    var target;
    beforeEach(function () {
        original = function(x, y) {
            this.x = x;
            this.y = y;
        };
        original.something = 'somethingIsHere';
        original.prototype.fn = function() {
            return this.x * this.y;
        };

        originalSpy = sinon.spy(original);
    });
    /*======================================================
     free functions new
     =====================================================*/
    describe('Free function new -> ', function () {
        beforeEach(function () {
            observed = Oversight.observify(originalSpy);
        });

        it('correctly retains the prototype of an input function', function() {
            assert.notEqual(observed, original, 'observed should not be the same object as original');
            assert.equal(observed.prototype, original.prototype, 'observed should use original\'s prototype');
        });

        it('correctly retains any constructor level variables on the observed function', function() {
            assert.notEqual(original, observed, 'observed should not equal original');
            assert.equal(observed.something, original.something, 'observed should take the value of original.something');
        });

        it('correctly returns and instance object when called with new', function() {
            var instance = new observed(5, 6);
            assert.instanceOf(instance, original, 'should be an instance of the original');
            assert.equal(30, instance.fn(), 'fn() should return 30');
        });

        it('will execute an observer added with Oversight.UseCurrentContext in the correct context', function() {
            Oversight.after(observed, function(){
                this.x = 10;
            }, Oversight.UseCallingContext);
            var instance = new observed(5, 6);
            assert.equal(instance.x, 10, 'x should be 10 since we set it in the observer');
            assert.equal(instance.y, 6, 'y should be 6 since we did not change it');
            assert.equal(instance.fn(), 60, 'fn() should return x * y so 60');
        });
    });

    /*======================================================
     target functions new
     =====================================================*/
    describe('target function new -> ', function () {
        beforeEach(function() {
            target = {
               fn: original
            };
        });

        it('correctly retains the prototype of an input function', function() {
            Oversight.after(target, 'fn', function(){}); //need to setup an observer
            assert.notEqual(target.fn, original, 'target.fn should not be the same object as original');
            assert.equal(target.fn.prototype, original.prototype, 'target.fn should use original\'s prototype');
        });

        it('correctly retains any constructor level variables on the observed function', function() {
            Oversight.after(target, 'fn', function(){}); //need to setup an observer
            assert.notEqual(original, target.fn, 'target.fn should not equal original');
            assert.equal(target.fn.something, original.something, 'target.fn should take the value of original.something');
        });

        it('correctly returns and instance object when called with new', function() {
            Oversight.after(target, 'fn', function(){});
            var instance = new target.fn(5, 6);
            assert.instanceOf(instance, original, 'should be an instance of the original');
            assert.equal(30, instance.fn(), 'fn() should return 30');
        });

        it('will execute an observer added with Oversight.UseCurrentContext in the correct context', function() {
            Oversight.after(target, 'fn', function(){
                this.x = 10;
            }, Oversight.UseCallingContext);
            var instance = new target.fn(5, 6);
            assert.equal(instance.x, 10, 'x should be 10 since we set it in the observer');
            assert.equal(instance.y, 6, 'y should be 6 since we did not change it');
            assert.equal(instance.fn(), 60, 'fn() should return x * y so 60');
        });

    });
    /*======================================================
     chain functions new
     =====================================================*/
    describe('chain function new -> ', function () {
        beforeEach(function() {
            target = {
                prop: {
                    fn: originalSpy
                }
            };
        });

        it('correctly retains the prototype of an input function', function() {
            Oversight.after(target, 'prop.fn', function(){}); //need to setup an observer
            assert.notEqual(target.prop.fn, original, 'target.prop.fn should not be the same object as original');
            assert.equal(target.prop.fn.prototype, original.prototype, 'target.prop.fn should use original\'s prototype');
        });

        it('correctly retains any constructor level variables on the observed function', function() {
            Oversight.after(target, 'prop.fn', function(){}); //need to setup an observer
            assert.notEqual(original, target.prop.fn, 'target.prop.fn should not equal original');
            assert.equal(target.prop.fn.something, original.something, 'target.prop.fn should take the value of original.something');
        });

        it('correctly returns and instance object when called with new', function() {
            Oversight.after(target, 'prop.fn', function(){});
            var instance = new target.prop.fn(5, 6);
            assert.instanceOf(instance, original, 'should be an instance of the original');
            assert.equal(30, instance.fn(), 'fn() should return 30');
        });

        it('will execute an observer added with Oversight.UseCurrentContext in the correct context', function() {
            Oversight.after(target, 'prop.fn', function(){
                this.x = 10;
            }, Oversight.UseCallingContext);
            var instance = new target.prop.fn(5, 6);
            assert.equal(instance.x, 10, 'x should be 10 since we set it in the observer');
            assert.equal(instance.y, 6, 'y should be 6 since we did not change it');
            assert.equal(instance.fn(), 60, 'fn() should return x * y so 60');
        });
    });
});
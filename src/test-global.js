(function (global) {
    global['test'] = 123;
})(this);
if (!('test' in global)) {
    global.test = this.test;
}
global.test2 = 456;

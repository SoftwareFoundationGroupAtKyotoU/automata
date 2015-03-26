module.exports = function(b) {
    return require('../reactify')(
        ['./js/record/record.js'],
        'public/record',
        b
    );
};

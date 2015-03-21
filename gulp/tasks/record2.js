module.exports = function(b) {
    return require('../reactify')(
        ['./js/record2/record.js'],
        'public/record2',
        b
    );
};

module.exports = function(b) {
    return require('../reactify')(
        ['./js/post2/app.js'],
        'public/post2',
        b
    );
};

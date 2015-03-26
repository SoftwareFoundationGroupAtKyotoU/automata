module.exports = function(b) {
    return require('../reactify')(
        ['./js/post/app.js'],
        'public/post',
        b
    );
};

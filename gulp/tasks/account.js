module.exports = function(b) {
    return require('../reactify')(
        ['./js/account/msg.js'],
        'public/account',
        b
    );
};

module.exports = function(b) {
    return require('../reactify')(
        ['./js/admin/admin.js'],
        'public/admin',
        b
    );
};

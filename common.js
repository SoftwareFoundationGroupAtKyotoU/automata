var setYear = function(year) {
    with (GNN.UI) {
        // set year
        var special;
        if (!/^\d+$/.test(year)) special = year;

        document.title = [
            document.title,
            ' (', special || ('Winter Semester ' + year), ')'
        ].join('');
        var spans = document.getElementsByTagName('span');
        for (var i=0; i < spans.length; i++) {
            if (spans[i].className == 'year') {
                spans[i].appendChild($text(special || (year+'年度')));
            }
        }
    }
};

// This restores the unmodified scale color
//  and makes it final.
var box11_strokeColor = pvc.finished(function(s) {
    return this.sign.scaleColor(s);
});

new pvc.BarChart({
    canvas: "cccBarExample11",
    width:  600,
    height: 500,

    // Plots
    plots: [
        // Main plot - bars
        {
            name: 'main',
            barSizeMax:      15,
            barSizeRatio:    0.8,
            bar_lineWidth:   pvc.finished(1),
            bar_strokeStyle: pvc.finished()
        },
        // Second plot - boxes
        {
            type: 'box',
            visualRoles: {
                // Comment the ones you don't want represented
                median:       'value',
                lowerQuartil: 'value2',
                upperQuartil: 'value3',
                minimum:      'value4',
                maximum:      'value5'
            },

            // Within the same category, 
            // boxes of different series are spread along
            // the category band
            layout: 'grouped',

            // These two must be the same as barSizeMax and barSizeRatio,
            // for grouped boxes to align with corresponding bars
            boxSizeMax:   15,
            boxSizeRatio: 0.8,

            // Styling boxes
            colorAxis: 2,

            // Make the box/category panel smaller, 
            // so that boxes are narrower than bars
            panel_width: function() { return this.delegate() * 0.4; },

            boxBar_fillStyle:           'rgba(250,250,250,0.01)',
            boxBar_strokeStyle:         box11_strokeColor,
            boxRuleMax_strokeStyle:     box11_strokeColor,
            boxRuleMedian_strokeStyle:  box11_strokeColor,
            boxRuleMedian_lineWidth:    3,
            boxRuleMin_strokeStyle:     box11_strokeColor,
            boxRuleWhisker_strokeStyle: box11_strokeColor
            //,boxRuleWhisker_strokeDasharray: '- '
        }
    ],

    // Cartesian axes
    baseAxisGrid:   true,
    panelSizeRatio: 0.8,

    // Color axes
    color2AxisTransform: function(c) { return c.brighter(1); },
    color2AxisLegendVisible: false,

    // Panels
    legend: true,

    // Chart/Interaction
    animate:    false,
    selectable: true,
    hoverable:  true
})
.setData(relational_04c, {crosstabMode: false})
.render();
/**
 * CategoricalAbstract is the base class for all categorical or timeseries
 */

pvc.CategoricalAbstract = pvc.TimeseriesAbstract.extend({

    yAxisPanel : null,
    xAxisPanel : null,
    secondXAxisPanel: null,
    secondYAxisPanel: null,

    yScale: null,
    xScale: null,

    prevMax: null,
    prevMin: null,


    constructor: function(o){

        this.base(o);

        var _defaults = {
            showAllTimeseries: false, // meaningless here
            showXScale: true,
            showYScale: true,
            yAxisPosition: "left",
            xAxisPosition: "bottom",
            yAxisSize: 50,
            xAxisSize: 50,
            xAxisFullGrid: false,
            yAxisFullGrid: false,

            secondAxis: false,
            secondAxisIdx: -1,
            secondAxisIndependentScale: false,
            secondAxisOriginIsZero: true,
            secondAxisOffset: 0,
            secondAxisColor: "blue",
            secondAxisSize: 0, // calculated
            
            panelSizeRatio: 1,//TODO:

            // CvK  added extra parameter for implementation of HeatGrid
            orthoAxisOrdinal: false
        // if orientation==vertical then perpendicular-axis is the y-axis
        //  else perpendicular-axis is the x-axis.
        };


        // Apply options
        $.extend(this.options,_defaults, o);
        // Sanitize some options:
        if (this.options.showYScale == false){
            this.options.yAxisSize = 0
        }
        if (this.options.showXScale == false){
            this.options.xAxisSize = 0
        }

        if(this.options.secondAxis && this.options.secondAxisIndependentScale){
            this.options.secondAxisSize = this.options.orientation=="vertical"?this.options.yAxisSize:this.options.xAxisSize;
        }
        else{
            this.options.secondAxisSize = 0;
        }

    },

    preRender: function(){

        this.base();

        pvc.log("Prerendering in CategoricalAbstract");
        
        // Sanitize some options:
        if (this.options.showYScale == false){
            this.options.yAxisSize = 0
        }
        if (this.options.showXScale == false){
            this.options.xAxisSize = 0
        }

        this.xScale = this.getXScale();
        this.yScale = this.getYScale();
        this.secondScale =  this.options.secondAxisIndependentScale?this.getSecondScale(): this.getLinearScale();


        // Generate axis

        if(this.options.secondAxis){
            this.generateSecondXAxis(); // this goes before the other because of the fullGrid
        }
        this.generateXAxis();
        if(this.options.secondAxis){
            this.generateSecondYAxis(); // this goes before the other because of the fullGrid
        }
        this.generateYAxis();

    },


    /*
     * Generates the X axis. It's in a separate function to allow overriding this value
     */

    generateXAxis: function(){

        if (this.options.showXScale){
            this.xAxisPanel = new pvc.XAxisPanel(this, {
                ordinal: this.isXAxisOrdinal(),
                showAllTimeseries: false,
                anchor: this.options.xAxisPosition,
                axisSize: this.options.xAxisSize,
                oppositeAxisSize: this.options.yAxisSize,
                fullGrid:  this.options.xAxisFullGrid,
                ordinalElements: this.getAxisOrdinalElements("x"),
                clickAction: this.options.xAxisClickAction,
                useCompositeAxis: this.options.useCompositeAxis //TODO:new
            });

            //            this.xAxisPanel.setScale(this.xScale);
            this.xAxisPanel.setScale(this.xScale);
            this.xAxisPanel.appendTo(this.basePanel); // Add it

        }

    },


    /*
     * Generates the Y axis. It's in a separate function to allow overriding this value
     */

    generateYAxis: function(){

        if (this.options.showYScale){
            this.yAxisPanel = new pvc.YAxisPanel(this, {
                ordinal: this.isYAxisOrdinal(),
                showAllTimeseries: false,
                anchor: this.options.yAxisPosition,
                axisSize: this.options.yAxisSize,
                oppositeAxisSize: this.options.xAxisSize,
                fullGrid:  this.options.yAxisFullGrid,
                ordinalElements: this.getAxisOrdinalElements("y"),
                clickAction: this.options.yAxisClickAction,
                useCompositeAxis: this.options.useCompositeAxis //TODO:new
            });

            this.yAxisPanel.setScale(this.yScale);
            this.yAxisPanel.appendTo(this.basePanel); // Add it

        }

    },


    /*
     * Generates the second axis for X, if exists and only for vertical horizontal charts
     */

    generateSecondXAxis: function(){

        if( this.options.secondAxisIndependentScale && this.options.orientation == "horizontal"){
            this.secondXAxisPanel = new pvc.XAxisPanel(this, {
                ordinal: this.isXAxisOrdinal(),
                showAllTimeseries: false,
                anchor: pvc.BasePanel.oppositeAnchor[this.options.xAxisPosition],
                axisSize: this.options.secondAxisSize,
                oppositeAxisSize: this.options.yAxisSize,
                fullGrid:  false, // not supported
                ordinalElements: this.getAxisOrdinalElements("x"),
                tickColor: this.options.secondAxisColor
            });

            this.secondXAxisPanel.setScale(this.secondScale);
            this.secondXAxisPanel.appendTo(this.basePanel); // Add it
        }
    },

    /*
     * Generates the second axis for Y, if exists and only for vertical horizontal charts
     */

    generateSecondYAxis: function(){

        if( this.options.secondAxisIndependentScale && this.options.orientation == "vertical"){

            this.secondYAxisPanel = new pvc.YAxisPanel(this, {
                ordinal: this.isYAxisOrdinal(),
                showAllTimeseries: false,
                anchor: pvc.BasePanel.oppositeAnchor[this.options.yAxisPosition],
                axisSize: this.options.secondAxisSize,
                oppositeAxisSize: this.options.xAxisSize,
                fullGrid:  false, // not supported
                ordinalElements: this.getAxisOrdinalElements("y"),
                tickColor: this.options.secondAxisColor
            });

            this.secondYAxisPanel.setScale(this.secondScale);
            this.secondYAxisPanel.appendTo(this.basePanel); // Add it

        }
    },



    /*
     * Indicates if xx is an ordinal scale
     */

    isXAxisOrdinal: function(){
        var isOrdinal = false;
        if (this.options.orientation == "vertical") 
            isOrdinal = !(this.options.timeSeries);
        else 
            isOrdinal =  this.options.orthoAxisOrdinal;
        return isOrdinal;
    },


    /*
     * Indicates if yy is an ordinal scale
     */

    isYAxisOrdinal: function(){
        var isOrdinal = false;
        if (this.options.orientation == "vertical")
            isOrdinal =  this.options.orthoAxisOrdinal;
        else
            isOrdinal = !(this.options.timeSeries);
        return isOrdinal;
    },

    /*
     *  List of elements to use in the axis ordinal
     *
     */
    getAxisOrdinalElements: function(axis){
        var onSeries = false;

        // onSeries can only be true if the perpendicular axis is ordinal
        if (this.options.orthoAxisOrdinal) {
            if (axis == "x")
                onSeries = ! (this.options.orientation == "vertical");
            else
                onSeries = this.options.orientation == "vertical";
        }
        
        return onSeries ?
        this.dataEngine.getVisibleSeries() :
        this.dataEngine.getVisibleCategories();
    },



    /*
     * xx scale for categorical charts
     */

    getXScale: function(){
        var scale = null;

        if (this.options.orientation == "vertical") {
            scale = this.options.timeSeries  ?
            this.getTimeseriesScale()     :
            this.getOrdinalScale();
        } else {
            scale =  (this.options.orthoAxisOrdinal) ?
            this.getPerpOrdinalScale("x")    :
            this.getLinearScale();
        } 

        return scale;
    },

    /*
     * yy scale for categorical charts
     */

    getYScale: function(){
        var scale = null;
        if (this.options.orientation == "vertical") {
            scale =  (this.options.orthoAxisOrdinal) ?
            this.getPerpOrdinalScale("y")    :
            this.getLinearScale();
        } else { 
            scale = this.options.timeSeries  ?
            this.getTimeseriesScale()     :
            this.getOrdinalScale();
        }
        return scale;
    },

    /*
     * Helper function to facilitate  (refactoring)
     *     - getOrdinalScale()
     *     - getPerpOrdScale()
     *   (CvK)
     */
    getOrdScale: function(bypassAxis, orthoAxis){

        var yAxisSize = bypassAxis?0:this.options.yAxisSize;
        var xAxisSize = bypassAxis?0:this.options.xAxisSize;

        var secondXAxisSize = 0, secondYAxisSize = 0;
        
        if( this.options.orientation == "vertical"){
            secondYAxisSize = bypassAxis?0:this.options.secondAxisSize;
        }
        else{
            secondXAxisSize = bypassAxis?0:this.options.secondAxisSize;
        }

        if (orthoAxis) {   // added by CvK
            var categories = this.dataEngine.getVisibleSeries();
            var scale = new pv.Scale.ordinal(categories);

            if (orthoAxis == "y") {
                scale.min = 0;
                scale.max = this.basePanel.height - xAxisSize;
            } else {   // assume orthoAxis == "x"
                scale.min = yAxisSize;
                scale.max = this.basePanel.width;
            }

        } else {   // orthoAxis == false  (so normal ordinal axis)
            var categories = this.dataEngine.getVisibleCategories();
            var scale = new pv.Scale.ordinal(categories);

            var size = this.options.orientation=="vertical"?
            this.basePanel.width:
            this.basePanel.height;

            if (   this.options.orientation=="vertical"
                && this.options.yAxisPosition == "left"){
                scale.min = yAxisSize;
                scale.max = size - secondYAxisSize;
            }
            else if (   this.options.orientation=="vertical" 
                && this.options.yAxisPosition == "right"){
                scale.min = secondYAxisSize;
                scale.max = size-yAxisSize;
            }
            else{
                scale.min = secondYAxisSize;
                scale.max = size - xAxisSize - secondXAxisSize;
            }

        }  // end else-part -- if (orthoAxis)

        scale.splitBanded( scale.min, scale.max, this.options.panelSizeRatio);
        return scale;
    },

    /*
     * Scale for the ordinal axis. xx if orientation is vertical, yy otherwise
     *
     */
    getOrdinalScale: function(bypassAxis){
        var bpa = (bypassAxis) ? bypassAxis : null;
        var orthoAxis = null;
        var scale = this.getOrdScale(bpa, orthoAxis);
        return scale;
    },
    /*
     * Scale for the perpendicular ordinal axis.
     *     yy if orientation is vertical,
     *     xx otherwise
     *   (CvK)
     */
    getPerpOrdinalScale: function(orthoAxis){
        var bypassAxis = null;
        var scale = this.getOrdScale(bypassAxis, orthoAxis);
        return scale;
    },
    /**
    **/
    getLinearScale: function(bypassAxis){

        var yAxisSize = bypassAxis?0:this.options.yAxisSize;
        var xAxisSize = bypassAxis?0:this.options.xAxisSize;

        var isVertical = this.options.orientation=="vertical"
        var size = isVertical?this.basePanel.height:this.basePanel.width;

        var max, min;

        if(this.options.stacked){
            max = this.dataEngine.getCategoriesMaxSumOfVisibleSeries();
            min = 0;
        }
        else{
            max = this.dataEngine.getVisibleSeriesAbsoluteMax();
            min = this.dataEngine.getVisibleSeriesAbsoluteMin();

        }
        
        /* If the bounds are the same, things break,
         * so we add a wee bit of variation.
         */
        if (min === max) {
            min = min !== 0 ? min * 0.99 : this.options.originIsZero ? 0 : -0.1;
            max = max !== 0 ? max * 1.01 : 0.1;
        }
        if(min * max > 0 && this.options.originIsZero){
            if(min > 0){
                min = 0;
            }else{
                max = 0;
            }
        }

        // CvK:  added to set bounds
        if(   ('orthoFixedMin' in this.options)
            && (this.options.orthoFixedMin != null)
            && !(isNaN(Number(this.options.orthoFixedMin))))
            min = this.options.orthoFixedMin;
        if(   ('orthoFixedMax' in this.options)
            && (this.options.orthoFixedMax != null)
            && !(isNaN(Number(this.options.orthoFixedMax))))
            max = this.options.orthoFixedMax;


        // Adding a small offset to the scale:
        var offset = (max - min) * this.options.axisOffset;
        var scale = new pv.Scale.linear(min - (this.options.originIsZero && min == 0 ? 0 : offset),max + (this.options.originIsZero && max == 0 ? 0 : offset));


        if( !isVertical && this.options.yAxisPosition == "left"){
            scale.min = yAxisSize;
            scale.max = size;
            
        }
        else if( !isVertical && this.options.yAxisPosition == "right"){
            scale.min = 0;
            scale.max = size - yAxisSize;
        }
        else{
            scale.min = 0;
            scale.max = size - xAxisSize;
        }

        scale.range(scale.min, scale.max);
        return scale;

    },

    /*
     * Scale for the timeseries axis. xx if orientation is vertical, yy otherwise
     *
     */
    getTimeseriesScale: function(bypassAxis){

        var yAxisSize = bypassAxis?0:this.options.yAxisSize;
        var xAxisSize = bypassAxis?0:this.options.xAxisSize;
        var secondAxisSize = bypassAxis?0:this.options.secondAxisSize;

        var size = this.options.orientation=="vertical"?
        this.basePanel.width:
        this.basePanel.height;

        var parser = pv.Format.date(this.options.timeSeriesFormat);
        var categories =  this.dataEngine.getVisibleCategories().sort(function(a,b){
            return parser.parse(a) - parser.parse(b)
        });


        // Adding a small offset to the scale:
        var max = parser.parse(categories[categories.length -1]);
        var min = parser.parse(categories[0]);
        var offset = (max.getTime() - min.getTime()) * this.options.axisOffset;

        var scale = new pv.Scale.linear(new Date(min.getTime() - offset),new Date(max.getTime() + offset));

        if(this.options.orientation=="vertical" && this.options.yAxisPosition == "left"){
            scale.min = yAxisSize;
            scale.max = size;
            
        }
        else if(this.options.orientation=="vertical" && this.options.yAxisPosition == "right"){
            scale.min = 0;
            scale.max = size - yAxisSize;
        }
        else{
            scale.min = 0;
            scale.max = size - xAxisSize;
        }

        scale.range( scale.min , scale.max);
        return scale;


    },

    /*
     * Scale for the linear axis. yy if orientation is vertical, xx otherwise
     *
     */
    getSecondScale: function(bypassAxis){

        if(!this.options.secondAxis || !this.options.secondAxisIndependentScale){
            return this.getLinearScale(bypassAxis);
        }

        var yAxisSize = bypassAxis?0:this.options.yAxisSize;
        var xAxisSize = bypassAxis?0:this.options.xAxisSize;

        var isVertical = this.options.orientation=="vertical"
        var size = isVertical?this.basePanel.height:this.basePanel.width;

        var max = this.dataEngine.getSecondAxisMax();
        var min = this.dataEngine.getSecondAxisMin();

        if(min * max > 0 && this.options.secondAxisOriginIsZero){
            if(min > 0){
                min = 0;
            }else{
                max = 0;
            }
        }

        // Adding a small offset to the scale:
        var offset = (max - min) * this.options.secondAxisOffset;
        var scale = new pv.Scale.linear(min - (this.options.secondAxisOriginIsZero && min == 0 ? 0 : offset),max + (this.options.secondAxisOriginIsZero && max == 0 ? 0 : offset));


        if( !isVertical && this.options.yAxisPosition == "left"){
            scale.min = yAxisSize;
            scale.max = size;

        }
        else if( !isVertical && this.options.yAxisPosition == "right"){
            scale.min = 0;
            scale.max = size - yAxisSize;
        }
        else{
            scale.min = 0;
            scale.max = size - xAxisSize;
        }

        scale.range(scale.min, scale.max);
        return scale;

    }

}
)


/*
 * AxisPanel panel.
 *
 * 
 */
pvc.AxisPanel = pvc.BasePanel.extend({

    _parent: null,
    pvRule: null,
    pvTicks: null,
    pvLabel: null,
    pvRuleGrid: null,
    pvScale: null,

    ordinal: false,
    anchor: "bottom",
    axisSize: 30,
    tickLength: 6,
    tickColor: "#aaa",
    oppositeAxisSize: 30,
    panelName: "axis", // override
    scale: null,
    fullGrid: false,
    ordinalElements: [], // To be used in ordinal scales
    clickAction: null,//TODO: new

    constructor: function(chart, options){

        this.base(chart,options);

    },

    create: function(){

        // Size will depend only on the existence of the labels


        if (this.anchor == "top" || this.anchor == "bottom"){
            this.width = this._parent.width;
            this.height = this.axisSize;
        }
        else{
            this.height = this._parent.height;
            this.width = this.axisSize;
        }


        this.pvPanel = this._parent.getPvPanel().add(this.type)
        .width(this.width)
        .height(this.height)



        this.renderAxis();

        // Extend panel
        this.extend(this.pvPanel, this.panelName + "_");
        this.extend(this.pvRule, this.panelName + "Rule_");
        this.extend(this.pvTicks, this.panelName + "Ticks_");
        this.extend(this.pvLabel, this.panelName + "Label_");
        this.extend(this.pvRuleGrid, this.panelName + "Grid_");


    },


    setScale: function(scale){
        this.scale = scale;
    },

    renderAxis: function(){

        var min, max,myself=this;
        myself.pvScale = this.scale;
        myself.extend(myself.pvScale, myself.panelName + "Scale_");


        if (this.ordinal) {
            min = myself.pvScale.min;
            max = myself.pvScale.max;
        } else {
            var scaleRange = myself.pvScale.range();
            min = scaleRange[0];
            max = scaleRange[1];
        }
        this.pvRule = this.pvPanel
        .add(pv.Rule)
        .strokeStyle(this.tickColor)
        [pvc.BasePanel.oppositeAnchor[this.anchor]](0)
        [pvc.BasePanel.relativeAnchor[this.anchor]](min)
        [pvc.BasePanel.parallelLength[this.anchor]](max - min)

        if (this.ordinal == true){
            if(this.useCompositeAxis == true){
                  this.renderCompositeOrdinalAxis();
            }
            else {
                this.renderOrdinalAxis();
            }
        }
        else{
            this.renderLinearAxis();
        }
    
    },
    
    /////////////////////////////////////////////////
    //begin: composite axis
    
    getElementsTree: function(elements){
        var tree = {};
       for(var i =0; i<elements.length; i++){
            var baseElem = elements[i][0];
            if(!tree[baseElem]){
                tree[baseElem] = elements[i].length == 1 ? 0 : {};
            }
            var currObj = tree[baseElem];
            for(var j=1;j<elements[i].length;j++){
                var elem = elements[i][j];
                if(!currObj[elem]){
                  currObj[elem] = (j == elements[i].length-1) ? 0 : {};
                }
                currObj = currObj[elem];
            }
        }
    },
    
    getLayoutSingleCluster: function(tree, orientation, maxDepth){
        
        myself = this;

        var depthLength = this.axisSize;
        //displace to take out bogus-root
        var baseDisplacement = (1.0/++maxDepth)* depthLength;
        baseDisplacement -= 0.125 * depthLength;//compensation
        var scaleFactor = maxDepth*1.0/ (maxDepth -1);
        var orthogonalLength = pvc.BasePanel.orthogonalLength[orientation];
        //var dlen = (orthogonalLength == 'width')? 'dx' : 'dy';
        
        var displacement = (orthogonalLength == 'width')?
                ((orientation == 'left')? [-baseDisplacement, 0] : [baseDisplacement, 0]) :
                ((orientation == 'top')?  [0, -baseDisplacement] : [0, baseDisplacement]);
           
        this.pvRule.lineWidth(0).strokeStyle(null);
        var panel = this.pvRule
                        .add(pv.Panel)[orthogonalLength](depthLength).overflow('hidden').strokeStyle(null).lineWidth(0) //cropping panel
                        .add(pv.Panel)[orthogonalLength](depthLength * scaleFactor ).strokeStyle(null).lineWidth(0);// panel resized and shifted to make bogus root disappear
        panel.transform(pv.Transform.identity.translate(displacement[0], displacement[1]));
        
        //set full label path
        var nodes = pv.dom(tree).root('').nodes().map(function(node){
            var path = [];
            path.push(node.nodeName);
            for(var pnode = node.parentNode; pnode != null; pnode = pnode.parentNode){
              path.push(pnode.nodeName);      
            }
            node.nodePath = path.reverse().slice(1);
            return node;
        });
        
        //create with bogus-root;pv.Hierarchy must always have exactly one root and at least one element besides the root
        var layout = panel.add(pv.Layout.Cluster.Fill)
            .nodes(nodes)
            .orient(orientation)
            ;
        return layout;
    },
    
    getBreadthCounters: function(elements){
       var breadthCounters = {};
       for(var i =0; i<elements.length; i++){
            var name = elements[i][0];
            if(!breadthCounters[name]){
                breadthCounters[name] = 1;
            }
            else {
                breadthCounters[name] = breadthCounters[name] + 1;
            }
        }
        return breadthCounters;
    },
    
    renderCompositeOrdinalAxis: function(){
        var myself = this;

        var align = (this.anchor == "bottom" || this.anchor == "top") ?
        "center" : 
        (this.anchor == "left")  ?
        "right" :
        "left";
        
        var axisDirection = (this.anchor == 'bottom' || this.anchor == 'top')?
            'h':
            'v';

        var elements = this.ordinalElements.slice(0);
        //TODO: extend this to work with chart.orientation
        if(this.anchor == 'bottom' || this.anchor == 'left') {elements.reverse();}
        
        //build tree with elements
        var tree = {};
        var sectionNames = [];
        var xlen = elements.length;
        for(var i =0; i<elements.length; i++){
            var baseElem = elements[i][0];
            if(!tree[baseElem]){
                tree[baseElem] = elements[i].length == 1 ? 0 : {};
                sectionNames.push(baseElem);
            }
            var currObj = tree[baseElem];
            for(var j=1;j<elements[i].length;j++){
                var elem = elements[i][j];
                if(!currObj[elem]){
                  currObj[elem] = (j == elements[i].length-1) ? 0 : {};
                }
                currObj = currObj[elem];
            }
        }
        
        var maxDepth = pv.max(elements, function(col){
            return $.isArray(col) ? col.length : 1;
        });
        
        var layout = this.getLayoutSingleCluster(tree, this.anchor, maxDepth);
    
        var diagDepthCutoff = 2; //depth in [-1/(n+1), 1]
        //see what will fit
        layout.node
            .def("fitInfo", null)
            //.def("fitsBox",true) //TODO: change to fitInfo
            .height(function(d,e,f){//just iterate and get cutoff
                //var fitsBox = myself.doesTextSizeFit(d.dx, d.nodeName, null);
                //if(!fitsBox){
                //    this.fitsBox(fitsBox);
                //    diagDepthCutoff = Math.min(diagDepthCutoff, d.depth);
                //}
                var fitInfo = myself.getFitInfo(d.dx, d.dy, d.nodeName, null);//TODO:font
                if(!fitInfo.h){
                    diagDepthCutoff = Math.min(diagDepthCutoff, d.depth);
                }
                this.fitInfo( fitInfo );
                return d.dy;
            }) ;
        
        //fill space
        layout.node.add(pv.Bar)
            .fillStyle('rgba(127,127,127,.01)')
            .strokeStyle( function(d){
                if(d.maxDepth == 1 || d.maxDepth ==0 ) {return null;}
                else {return "rgba(127,127,127,0.5)";}
            })
            .lineWidth( function(d){
                if(d.maxDepth == 1 || d.maxDepth ==0 ) { return 0; }
                else {return 0.5;}
            })
            .text(function(d){
                return d.nodeName;
            })
            .cursor('pointer')
            .event('click', function(d){
                if(myself.clickAction){
                    myself.clickAction(d.nodePath);
                }
            })
            .event("mouseover", pv.Behavior.tipsy({//Tooltip
                gravity: "n",
                fade: true
            }));
        
        //cutoffs -> snap to vertical/horizontal
        var H_CUTOFF_ANG = 0.30;
        var V_CUTOFF_ANG = 1.27;
        var V_CUTOFF_RATIO = 0.8;
        
        //draw labels and make them fit
        this.pvLabel = layout.label.add(pv.Label)
            .def('lblDirection','h')
            .textAngle(function(d)
            {
                var fitInfo = this.fitInfo();
                if(d.depth >= diagDepthCutoff)
                {
                    var tan = d.dy/d.dx;
                    var angle = Math.atan(tan);
                    var hip = Math.sqrt(d.dy*d.dy + d.dx*d.dx);
                    if( (axisDirection == 'v' && ( fitInfo.v || Math.sin(angle) >=0.8 ))
                        || angle > V_CUTOFF_ANG)
                    {//prefer vertical
                        this.lblDirection('v');
                        return -Math.PI/2;
                    }
                    else if(angle > H_CUTOFF_ANG) {
                        //this.lblDirection('h');
                        //return 0;
                        this.lblDirection('d');
                        return -angle;
                    }
                    //else if(angle < Math.PI/2 && angle > V_CUTOFF_ANG) {
                    //    this.lblDirection('v');
                    //    return -Math.PI/2;
                    //}
                    //else {return -angle ;}
                }
                this.lblDirection('h');
                return 0;//horizontal
            
                //if(d.depth >= diagDepthCutoff){
                //    var tan = d.dy/d.dx;
                //    var res = -Math.atan(tan);// more vertical (ex -0.3)?..
                //    if(res < 0 && res > H_CUTOFF_ANG) {return 0;}
                //    else if(res > -Math.PI/2 && res < V_CUTOFF_ANG) {return -Math.PI/2;}
                //    else {return res ;}
                //}
                //else return 0;
            })
            .text(function(d){//TODO: change
                var fitInfo = this.fitInfo();
                switch(this.lblDirection()){
                    case 'h':
                        if(!fitInfo.h){
                            return myself.trimToWidth(d.dx, d.nodeName, null, '..');
                        }
                        break;
                    case 'v':
                        if(!fitInfo.v){
                            return myself.trimToWidth(d.dy, d.nodeName, null, '..');
                        }
                        break;
                    case 'd':
                       if(!fitInfo.d){
                            var diagonalLength = Math.sqrt(d.dy*d.dy + d.dx*d.dx);
                            return myself.trimToWidth(diagonalLength, d.nodeName, null, '..');
                        }
                        break;
                }
                //if(d.depth >= diagDepthCutoff){//trim if needed
                //    var diagonalLength = Math.sqrt(d.dy*d.dy + d.dx*d.dx);
                //    return myself.trimToWidth(diagonalLength, d.nodeName, null, '..');
                //}
                return d.nodeName ;
            })
            ;
    },
    
    //TODO: change uses for svg version 
    getTextSizePlaceholder : function(){
        //TODO:move elsewhere, chartHolder may not have id..
        var TEXT_SIZE_PHOLDER_APPEND='_textSizeHtmlObj';
        if(!this.textSizeTestHolder){
            var chartHolder = $('#' + this.chart.options.canvas);
            var textSizeTestHolderId = chartHolder.attr('id') + TEXT_SIZE_PHOLDER_APPEND;
            this.textSizeTestHolder = $('<div>')
                .attr('id', textSizeTestHolderId)
                .css('position', 'absolute')
                .css('visibility', 'hidden')
                .css('width', 'auto')
                .css('height', 'auto');
            chartHolder.append(this.textSizeTestHolder);
        }
        return this.textSizeTestHolder;
    },
    
    //whether fits horizaontally, vertical and/or in diagonal
    getFitInfo: function(w, h, text, font)
    {
        var fitInfo =
        {
            h: this.doesTextSizeFit(w, text, font),
            v: this.doesTextSizeFit(h, text, font),
            d: this.doesTextSizeFit(Math.sqrt(w*w + h*h), text, font)
        };
        return fitInfo;
    },
    
    //TODO: use svg approach
    doesTextSizeFit: function(length, text, font){
        var MARGIN = 15;//TODO: hcoded
        var holder = this.getTextSizePlaceholder();
        holder.text(text);
        return holder.width() - MARGIN <= length;
    },
    
    trimToWidth: function(w, text, font, trimTerminator){
        var MARGIN = 15;//TODO: hcoded
        var holder = this.getTextSizePlaceholder();
        if(font){
            holder.css("font", font);
        }
        var trimmed = false;
        for(holder.text(text); holder.width() - MARGIN > w;text = text.slice(0,text.length -1)){
            holder.text(text );//+ (trimmed? trimTerminator: ''));
            trimmed = true;
            holder.hide();
            holder.show();
        }
        return text + (trimmed? trimTerminator: '');
    },
    
    // end: composite axis
    /////////////////////////////////////////////////

    renderOrdinalAxis: function(){

        var myself = this;

        var align =  (this.anchor == "bottom" || this.anchor == "top") ?
        "center" : 
        (this.anchor == "left")  ?
        "right" :
        "left";

        this.pvLabel = this.pvRule.add(pv.Label)
        .data(this.ordinalElements)
        [pvc.BasePanel.parallelLength[this.anchor]](null)
        [pvc.BasePanel.oppositeAnchor[this.anchor]](10)
        [pvc.BasePanel.relativeAnchor[this.anchor]](function(d){
            return myself.scale(d) + myself.scale.range().band/2;
        })
        .textAlign(align)
        .textBaseline("middle")
        .text(pv.identity)
        .font("9px sans-serif");
        
    },


    renderLinearAxis: function(){

        var myself = this;
    
        var scale = this.scale;
        
        this.pvTicks = this.pvRule.add(pv.Rule)
        .data(scale.ticks())
        [pvc.BasePanel.parallelLength[this.anchor]](null)
        [pvc.BasePanel.oppositeAnchor[this.anchor]](0)
        [pvc.BasePanel.relativeAnchor[this.anchor]](this.scale)
        [pvc.BasePanel.orthogonalLength[this.anchor]](function(d){
            return myself.tickLength/(this.index%2 + 1)
        })
        .strokeStyle(this.tickColor);

        this.pvLabel = this.pvTicks
        .anchor(this.anchor)
        .add(pv.Label)
        .text(scale.tickFormat)
        .font("9px sans-serif")
        .visible(function(d){
            // mini grids
            if (this.index % 2){
                return false;
            }
            // also, hide the first and last ones
            if( scale(d) == 0  || scale(d) == scale.range()[1] ){
                return false;
            }
            return true;
        })


        // Now do the full grids
        if(this.fullGrid){

            this.pvRuleGrid = this.pvRule.add(pv.Rule)
            .data(scale.ticks())
            .strokeStyle("#f0f0f0")
            [pvc.BasePanel.parallelLength[this.anchor]](null)
            [pvc.BasePanel.oppositeAnchor[this.anchor]](- this._parent[pvc.BasePanel.orthogonalLength[this.anchor]] +
                this[pvc.BasePanel.orthogonalLength[this.anchor]])
            [pvc.BasePanel.relativeAnchor[this.anchor]](scale)
            [pvc.BasePanel.orthogonalLength[this.anchor]](this._parent[pvc.BasePanel.orthogonalLength[this.anchor]] -
                this[pvc.BasePanel.orthogonalLength[this.anchor]])
            .visible(function(d){
                // mini grids
                if (this.index % 2){
                    return false;
                }
                // also, hide the first and last ones
                if( scale(d) == 0  || scale(d) == scale.range()[1] ){
                    return false;
                }
                return true;
            })
        }
    }
});

/*
 * XAxisPanel panel.
 *
 *
 */
pvc.XAxisPanel = pvc.AxisPanel.extend({

    anchor: "bottom",
    panelName: "xAxis",

    constructor: function(chart, options){

        this.base(chart,options);

    }

});


/*
 * YAxisPanel panel.
 *
 *
 */
pvc.YAxisPanel = pvc.AxisPanel.extend({

    anchor: "left",
    panelName: "yAxis",
    pvRule: null,

    constructor: function(chart, options){

        this.base(chart,options);

    }



});

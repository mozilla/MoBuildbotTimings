/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

importScript("../lib/d3/d3.js");
importScript("../modevlib/MozillaPrograms.js");
importScript("../modevlib/qb/qb.js");
importScript("util.js");
importScript("../modevlib/charts/cccChart.js");
importScript("../modevlib/qb/qb.js");


function gantt(params){

	var DEBUG=true;


	var target = params.target;
	var drawDiv = d3.select("#" + target);

	var colors = aChart.DEFAULT_STYLES.select("color");

	var BORDER = 2;
	var HEIGHT = 30;
	var LINE_PADDING = 10;

	//FIND MIN AND MAX RANGES (OR CATEGORICAL DOMAIN)
	var min = {};  //MAP FROM AXIS NAME TO MINIMUM VALUE
	var max = {};
	var parts = {};  //MAP FROM AXIS NAME TO DOMAIN

	Map.items(params.series, function(name, series_details){
		var axis = coalesceAll(series_details, ["select.axis", "select.name", "axis"]);
		var value = coalesceAll(series_details, ["select.value", "value"]);
		var range = coalesceAll(series_details, ["select.range", "range"]);

		series_details._select = [];
		axis.forall(function(a, i){
			var select;
			if (value[i]) {
				select = {
					"axis": a,
					"value_accessor": qb.get(value[i])
				};
				series_details._select.append(select);

				var values = params.data.map(select.value_accessor);

				if (params.axis[a].type == "set") {
					parts[a] = Array.UNION([parts[a], values]);
				} else if (Array.AND(values.map(aMath.isNumeric))) {
					min[a] = aMath.min(min[a], aMath.MIN(values));
					max[a] = aMath.max(max[a], aMath.MAX(values));
				} else {
					parts[a] = Array.UNION([parts[a], values]).sort();
				}//endif
			} else {
				select = {
					"axis": a,
					"range": {
						"min_accessor": qb.get(Map.get(range[i], "min")),
						"max_accessor": qb.get(Map.get(range[i], "max"))
					}
				};
				series_details._select.append(select);

				var range_min = params.data.map(select.range.min_accessor);
				var range_max = params.data.map(select.range.max_accessor);
				min[a] = aMath.min(min[a], aMath.MIN(range_min), aMath.MIN(range_max));
				max[a] = aMath.max(max[a], aMath.MAX(range_min), aMath.MAX(range_max));
			}//endif
		});

		//ASSIGN DEFAULTS TO SERIES, IF NOT OVERRIDDEN
		series_details.tip = Map.setDefault(series_details.tip, params.tip);
		series_details.click = coalesce(series_details.click, params.click);
	});

	var all_axis_seen = Array.UNION([Map.keys(params.axis), Map.keys(min), Map.keys(max)]);
	var missed_axis = all_axis_seen.subtract(Map.keys(params.axis)).subtract(["x", "y"]);
	if (missed_axis.length > 0) {
		Log.error("{{missed}} axis have been mentioned, but not listed.", {"missed": missed_axis});
	}//endif

	// GIVE EACH AXIS A `domain._scale` TO BE USED WHILE CHARTING
	all_axis_seen.forall(function(a){
		var _axis = params.axis[a];
		if (!_axis) params.axis[a] = {};

		var pa = Map.get(_axis, "domain.partitions");
		if (!pa && parts[a]) pa = qb.sort(parts[a], ".");
		if (pa) {
			//TODO: MAKE A BETTER scaleBand THAT CAN HANDLE MORE BAR SPACING OPTIONS
			//TODO: GIVE EACH SERIES THEIR OWN scaleBand?
			var ratio = 0;
			var bar_spacing = coalesce(Map.get(_axis, "style.bar-spacing"), "10%");
			if (isString(bar_spacing) && bar_spacing.trim().right(1) == "%"){
				var percent = convert.String2Integer(bar_spacing.trim().leftBut(1));
				ratio = percent / (100 + percent);
			}else{
				Log.error("Only accepts % bar-spacing");
			}//endif
			Map.set(_axis, "domain._scale", d3.scaleBand().padding(ratio).domain(pa));
		} else {
			var mi = coalesce(Map.get(_axis, "domain.min"), min[a]);
			var ma = coalesce(Map.get(_axis, "domain.max"), max[a]);
			var showZero = coalesce(Map.get(_axis, "domain.showZero"), _axis.showZero);
			if (showZero) {
				if (ma < 0) ma = 0;
				if (mi > 0) mi = 0;
			}//endif

			Map.set(_axis, "domain._scale", d3.scaleLinear().domain([mi, ma]).nice());
		}//endif
	});

	var tip = d3.select("body").append("div")
		.style("visibility", "hidden")
		.html("")
		;



	var chartWidth = d3.scaleLinear();
	var chartHeight = d3.scaleLinear();
	params.style._width = chartWidth;
	params.style._height = chartHeight;

	var update = [];

	var svg = drawDiv
		.html("")
		.append("svg")
	;

	update.append(drawDiv
		.defer()
		.attr("width", function(d){ return chartWidth(1);})
		.attr("height", function(d){ return chartHeight(1);})
	);

	update.append(svg
		.defer()
		.width(function(d){ return chartWidth(1);})
		.height(function(d){ return chartHeight(1);})
	);

	svg = svg.append("g").translate(0,40);

	var e = svg
		.selectAll("rect")
		.data(params.data)
		.enter()
		;

	if (DEBUG){
		var div = $("#" + target);

		//SET HEIGHT AND WIDTH
		var width = Map.get(params, "style.width");
		var height = Map.get(params, "style.height");
		if (width!=null) drawDiv.width(width);
		if (height!=null) drawDiv.width(height);

		chartWidth.range([0, coalesce(Map.get(params, "style.width"), div.width())]);
		chartHeight.range([0, coalesce(Map.get(params, "style.height"), div.height())]);
	}

	//STYLE THE AXIS, AND LINES
	//Map.forall(params.axis, function(a, _axis){
	var xAxis = function(self){
		var range = params.axis.x.domain._scale.domain();
		var step = Duration.niceSteps(range[0]*1000, range[1]*1000);

		self.call(
			d3.axisTop()
				.scale(params.axis.x.domain._scale)
				.ticks(5)
				.tickFormat(function(value){
					return Duration.newInstance(value*1000).toString("hour")
				})
				.tickValues(Array.range(1, 10*2).map(function(v){return v*step.milli/1000;}))
				.tickSize(-chartHeight(1))
		);
	};
	update.append(svg
		.append('g')
		.defer()
		.call(xAxis)
	);

	//});


	//TODO: THE CHART AREAS HAVE DIMENSIONS, THAT CHANGES THE RANGE FOR THE AXIS
	// EACH (AREA, AXIS) PAIR SHOULD HAVE THEIR OWN SCALE
	params.series.forall(function(series, si){

		if (series.type == "gantt") {
			var area = Map.setDefault(Map.get(params.area, series.area), {"x": "x", "y": "y"});
			var selectX = series._select.filter({"eq": {"axis": area.x}})[0];
			var axisX = params.axis[selectX.axis];
			var dx = axisX.domain._scale.range(chartWidth.range());
			var selectY = series._select.filter({"eq": {"axis": area.y}})[0];
			var axisY = params.axis[selectY.axis];
			var dy = axisY.domain._scale.range(chartHeight.range());

			function exists(d){
				return dy.domain().contains(selectY.value_accessor(d));
			}

			function x(d){
				return safe(dx(selectX.range.min_accessor(d)));
			}

			function y(d){
				return safe(dy(selectY.value_accessor(d)));
			}

			function width(d){
				return safe(dx(selectX.range.max_accessor(d) - selectX.range.min_accessor(d)));
			}

			function height(d){
				return exists(d) ? safe(dy.bandwidth()) : 0;
			}

			//SHOW BARS
			update.append(e
				.append("rect")
				.defer()
				.exists(exists)
				.x(x)
				.y(y)
				.width(width)
				.height(height)
				.opacity(coalesce(Map.get(series, "style.opacity"), 1.0))
				.fill(coalesce(Map.get(series, "style.color"), colors[si]))
			);

			var text = new Template(coalesce(series.label, ""));

			//SHOW NAME OF EACH STEP (CLIP TO svg)
			var textHolder = e.append("svg");

			update.append(textHolder
			// IF NOT IN DOMAIN, THEN DO NOT SHOW
				.defer()
				.exists(exists)
				.x(function(d){
					return x(d) + BORDER;
				})
				.y(function(d){
					return y(d) + BORDER;
				})
				.width(function(d){
					return aMath.max(width(d) - BORDER - BORDER, 0)
				})
				.height(function(d){
					return aMath.max(0, height(d) - BORDER - BORDER)
				})
			);
			update.append(textHolder.append("text")
				.text(function(d){
					return text.expand(d);
				})
				.defer()
				.exists(exists)
				.style("font-size", function(d){
					if (exists(d)) return (dy.bandwidth() - BORDER - BORDER) + "px";
					return "0px"
				})
				.y(function(d){
					return aMath.max(0, height(d) - (BORDER * 3));
				})
				.fill('black')
			);

			//INVISIBLE HOVER OVERLAY
			update.append(e
				.exists(exists)
				.append("rect")
				.on("click", series.click)
				.on("mouseover", function(d){
					return tip
						.style(series.tip.style)
						.style({
							"top": (d3.event.pageY + 10) + "px",
							"left": (d3.event.pageX + 10) + "px",
							"visibility": "visible"
						})
						.html(new Template(series.tip.format).expand(d))
						;
				})
				.on("mousemove", function(d){
					return tip.style({
						"top": (d3.event.pageY + 10) + "px",
						"left": (d3.event.pageX + 10) + "px"
					});
				})
				.on("mouseout", function(d){
					return tip.style("visibility", "hidden");
				})
				.defer()
				.x(x)
				.y(y)
				.width(width)
				.height(height)
				.fill("transparent")
			);

		} else {
			Log.error("Do not know charts of type {{type}} as seen in series {{series}}", {"type": series.type, "series": coalesce(series.label, series.name)})
		}//endif
	});





	params._draw = function draw(){
		var div = $("#" + target);

		chartWidth.range([0, coalesce(Map.get(params, "style.width"), div.width())]);
		chartHeight.range([0, coalesce(Map.get(params, "style.height"), div.height())]);

		//TODO: THE CHART AREAS HAVE DIMENSIONS, THAT CHANGES THE RANGE FOR THE AXIS
		// EACH (AREA, AXIS) PAIR SHOULD HAVE THEIR OWN SCALE
		params.axis["x"].domain._scale.range(chartWidth.range());
		params.axis["y"].domain._scale.range(chartHeight.range());

		update.forall(function(u){
			u.transition()
		})
	};


	onDynamicLayout(params._draw);
	params._draw();

	function safe(v){
		return aMath.isNaN(v) || v==null ? 0 : v;
	}

	return params;
}



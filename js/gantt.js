importScript("../lib/d3/d3.js");
importScript("../modevlib/MozillaPrograms.js");
importScript("../modevlib/qb/qb.js");
importScript("util.js");
importScript("../modevlib/charts/cccChart.js");
importScript("../modevlib/qb/qb.js");


function gantt(params){
	var target = params.target;
	var drawDiv = $("#"+params.target);

	//SET HEIGHT AND WIDTH
	var width = Map.get(params, "style.width");
	var height = Map.get(params, "style.height");
	var layout = coalesce(drawDiv.attr("layout"), "");
	if (!width) {
		layout += layout + "left=" + target + ".left;right=" + target + ".right;";
		drawDiv.attr("layout", layout);
	} else {
		drawDiv.width(width);
	}//endif

	if (!height) {
		layout += layout + "top=" + target + ".top;bottom=" + target + ".bottom;";
		drawDiv.attr("layout", layout);
	} else {
		drawDiv.width(height);
	}//endif

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
			if (value[i]){
				select = {
					"axis": a,
					"value_accessor": qb.get(value[i])
				};
				series_details._select.append(select);

				var values = params.data.map(select.value_accessor);

				if (params.axis[a].type=="set"){
					parts[a] = Array.UNION([parts[a], values]);
				}else if (Array.AND(values.map(aMath.isNumeric))) {
					min[a] = aMath.min(min[a], aMath.MIN(values));
					max[a] = aMath.max(max[a], aMath.MAX(values));
				}else {
					parts[a] = Array.UNION([parts[a], values]).sort();
				}//endif
			}else{
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
		series_details.click = Map.setDefault(series_details.click, params.click);
	});

	var all_axis_seen = Array.UNION([Map.keys(params.axis), Map.keys(min), Map.keys(max)]);
	var missed_axis = all_axis_seen.subtract(Map.keys(params.axis)).subtract(["x", "y"]);
	if (missed_axis.length>0){
		Log.error("{{missed}} axis have been mentioned, but not listed.", {"missed": missed_axis});
	}//endif

	// GIVE EACH AXIS A `_domain.scale` TO BE USED WHILE CHARTING
	all_axis_seen.forall(function(a){
		var _axis = params.axis[a];
		var pa = Map.get(_axis, "domain.partitions");
		if (!pa && parts[a]) pa = qb.sort(parts[a], ".");
		if (pa){
			Map.set(_axis, "_domain.scale", d3.scaleBand().domain(pa));
		}else{
			var mi = coalesce(Map.get(_axis, "domain.min"), min[a]);
			var ma = coalesce(Map.get(_axis, "domain.max"), max[a]);
			var showZero = coalesce(Map.get(_axis, "domain.showZero"), _axis.showZero);
			if (showZero) {
				if (ma < 0) ma = 0;
				if (mi > 0) mi = 0;
			}//endif

			Map.set(_axis, "_domain.scale", d3.scaleLinear().domain([mi, ma]));
		}//endif
	});

	var tip = d3.select("body").append("div")
		.style("visibility", "hidden")
		.html("")
		;



	var draw = function draw(){
		//drawDiv.css(Map.setDefault(Map.get(params, "style"), drawDiv.css()));
		var h = coalesce(Map.get(params, "style.height"), drawDiv.height());
		var w = coalesce(Map.get(params, "style.width"), drawDiv.width());
		Log.note("HEIGHT = "+h);
		drawDiv.height(h);
		drawDiv.width(w);
		h=drawDiv.height();
		w=drawDiv.width();

		var d3Area = d3.select("#" + target);
		var e = d3Area
			.html("")
			.append("svg")
			.width(w)
			.height(h)
			.selectAll("rect")
			.data(params.data)
			.enter()
			;

		params.series.forall(function(series, si){
			if (series.type=="gantt") {
				var area = Map.setDefault(Map.get(params.area, series.area), {"x": "x", "y": "y"});
				var selectX = series._select.filter({"eq": {"axis": area.x}})[0];
				var axisX = params.axis[selectX.axis];
				var dx = axisX._domain.scale.range([0, w]);
				var selectY = series._select.filter({"eq": {"axis": area.y}})[0];
				var axisY = params.axis[selectY.axis];
				var dy = axisY._domain.scale.range([0, h]);

				function x(d){
					return dx(selectX.range.min_accessor(d));
				}

				function y(d){
					return dy(selectY.value_accessor(d));
				}

				function width(d){
					return dx(selectX.range.max_accessor(d) - selectX.range.min_accessor(d));
				}

				function height(d){
					return dy.bandwidth();
				}

				e.append("rect") //SHOW BAR
					.x(x)
					.y(y)
					.width(width)
					.height(height)
					.fill(coalesce(Map.get(series, "style.color"), colors[si]))
				;

				var text = coalesce(new Template(series.label), ""+selectX.value_accessor);

				e.append("svg")  //SHOW NAME OF EACH STEP (CLIP TO svg)
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
						return height(d) - BORDER - BORDER
					})
					.append("text")
					.text(function(d){
						return text.expand(d);
					})
					.style("font-size", (dy.bandwidth() - BORDER - BORDER)+"px")
					.y(function(d){ return height(d) - (BORDER * 3);})
					.fill('black')
				;

				e.append("rect") //INVISIIBLE HOVER OVERLAY
					.x(x)
					.y(y)
					.width(width)
					.height(height)
					.fill("transparent")
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
				;


			}else{
				Log.error("Do not know charts of type {{type}} as seen in series {{series}}", {"type":series.type, "series":coalesce(series.label, series.name)})
			}//endif
		});

	};

	onDynamicLayout(draw);
	draw();



}//showTimeline


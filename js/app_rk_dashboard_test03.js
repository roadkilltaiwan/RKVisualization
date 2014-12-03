// create module for custom directives
var d3RKDemoApp = angular.module('d3RKDemoApp', []);

var scinameMap = {}; // map author -> index

var txnCount = {};
var commonNameCan = [];
var commonNameMap = {};

var nodeLocked = false;
var lockedNode = {};
var lockedD = {};

var btn_clicked = 'all';



function init() {
  txnCount = {};
  commonNameCan = [];
  commonNameMap = {};

  nodeLocked = false;
  lockedNode = {};
  lockedD = {};

  btn_clicked = 'all';
}



// Heat map configuration
var cfg = {
  // radius should be small ONLY if scaleRadius is true (or small radius is intended)
  // if scaleRadius is false it will be the constant radius used in pixels
  "radius": 10,
  "maxOpacity": .8, 
  // scales the radius based on map zoom
  "scaleRadius": false, 
  // if set to false the heatmap uses the global maximum for colorization
  // if activated: uses the data maximum within the current map boundaries 
  //   (there will always be a red spot with useLocalExtremas true)
  "useLocalExtrema": true,
  // which field name in your data represents the latitude - default "lat"
  latField: 'lat',
  // which field name in your data represents the longitude - default "lng"
  lngField: 'lng',
  // which field name in your data represents the data value - default "value"
  valueField: 'count'
};
  var reformatRKTSV = function (data) {

    var date0 = new Date(data[data.length - 1]['eventDate']);


    // build up the data to be passed to our d3 visualization
    for (var i=0; i<data.length; i++) {
      var d = data[i], commonName;
      var nameIndex;
      nameIndex = 0;
      commonNames = d['vernacularName'].split('|');

      var family = d['family'].split(' ').pop();
      if (family === '') {
        family = '無資料';
      }

      commonNames.forEach(function(commonName) {
        if (commonName == '') commonName = '無資料';
        if (nameIndex === 0 ) {
          data[i]['vernacularName'] = commonName;
        }
        nameIndex++;

        if (commonNameCan.indexOf(commonName) == -1) {
          commonNameMap[commonName] = commonNameCan.length;
          commonNameCan.push(commonName);
        }



        if (txnCount[commonNameMap[commonName]] === undefined) {
          txnCount[commonNameMap[commonName]] = {month:{}, year:{}, nodate: 0, points: []};
          txnCount[commonNameMap[commonName]].total = 0;
          txnCount[commonNameMap[commonName]].name = commonName;
          txnCount[commonNameMap[commonName]].family = family;
        }
        txnCount[commonNameMap[commonName]].total++;
        if ((d['eventDate'] === '')||(d['eventDate'] === undefined)) {
          if ((data[i]['post_date'] !== '')&&(data[i]['post_date'] !== undefined)) {
            data[i]['eventDate'] = data[i]['post_date'].split(' ')[0];
          }
          else {
            data[i]['eventDate'] = '無資料'
            txnCount[commonNameMap[commonName]].nodate++;
          }
        }
        if (data[i]['eventDate'] !== '無資料') {
          var date = new Date(data[i]['eventDate']);
          var month = date.getMonth();
          var year = date.getFullYear();

          month+=1;
          if (txnCount[commonNameMap[commonName]].month[month] === undefined) {
            txnCount[commonNameMap[commonName]].month[month] = 0;
          }
          txnCount[commonNameMap[commonName]].month[month]++;

          if (txnCount[commonNameMap[commonName]].year[year] === undefined) {
            txnCount[commonNameMap[commonName]].year[year] = 0;
          }
          txnCount[commonNameMap[commonName]].year[year]++;
        }
        if ((data[i]['decimalLongitude']!='')&&(data[i]['decimalLatitude']!='')&&(data[i]['decimalLongitude']!=0)&&(data[i]['decimalLatitude']!='')) {
          txnCount[commonNameMap[commonName]].points.push({lat:data[i]['decimalLatitude'], lng:data[i]['decimalLongitude'], count: 1});
        }
      });
    }

    return txnCount;
  };




// controller business logic
d3RKDemoApp.controller('AppCtrl', function AppCtrl ($scope, $http) {

  // initialize the model
  $scope.tsv_data_loc = './data/rk_general.tsv';


  // helper for reformatting the Github API response into a form we can pass to D3

  $scope.getCommitData = function () {
    d3.tsv($scope.tsv_data_loc, type, function (error, data) {
//      $scope.data = reformatRKTSV(data);
      $scope.data = data;
      $scope.$apply();
    });
  };

  // get the commit data immediately
  $scope.getCommitData();
});

d3RKDemoApp.directive('d3Dashboard', function () {

  // constants
  var padding = 20;
  var width = 1200,
    height = 1600;
    color = d3.interpolateRgb("#ff7777", "#7777ff"),
    distinctColor = ['#330000', '#a4b386', '#3967e6', '#cc3333', '#7ae600', '#001180', '#bf8f8f', '#4b731d', '#000a4d', '#332626', '#e1ffbf', '#000733', '#ff2200', '#364d26', '#535ea6', '#991400', '#99f279', '#2d3359', '#7f2d20', '#688060', '#1a00bf', '#401610', '#304030', '#9286b3', '#ff9180', '#004d0a', '#6600ff', '#a65e53', '#2db33e', '#8660bf', '#f26d3d', '#4d9961', '#532080', '#d9896c', '#ace6c3', '#eabfff', '#734939', '#00ff88', '#5e4d66', '#ffd0bf', '#16593a', '#9900bf', '#993d00', '#003322', '#3d004d', '#593116', '#33cc99', '#45264d', '#996b4d', '#008066', '#f240ff', '#4d4139', '#2d5950', '#e673de', '#d97400', '#00ccbe', '#80407b', '#7f4400', '#bffffb', '#a6298d', '#f2ba79', '#00eeff', '#59003c', '#33271a', '#4d9499', '#ff40bf', '#ccb499', '#00ccff', '#bf8faf', '#8c5e00', '#002933', '#40303a', '#4c3300', '#335c66', '#f20081', '#d9a336', '#a3ced9', '#7f0044', '#7f6a40', '#23698c', '#33001b', '#f2c200', '#66aacc', '#ff80b3', '#4c4526', '#3d9df2', '#8c4662', '#d9cea3', '#13324d', '#990029', '#665f00', '#002e73', '#4d2630', '#e5de73', '#405980', '#ffbfd0', '#99944d', '#bfd9ff', '#661a24', '#9ba600', '#738299', '#d96c7b', '#f2ff40', '#303640', '#806064', '#9fbf60', '#003de6'];
//  var fill = d3.scale.ordinal().range(['#827d92','#827354','#523536','#72856a','#2a3285','#383435']);
  var fill = d3.scale.ordinal()
               .range(['#00A4C5','#C51B7D','#DE77AE','#F1B6DA','#FDE0EF','#E6F5D0','#B8E186','#7FBC41','#4D9221','#FF0000', '#000000'])
               .domain([0,1,2,3,4,5,6,7,8,9,10]);

  var render_h = 1600;
  var render_left = 300;
  var render_w = width - render_left;

  return {
    restrict: 'E',
    scope: {
      val: '=',
      grouped: '='
    },
    link: function (scope, element, attrs) {

      var legendMap = ['-inf', 'inf', 25, 10, 2, 0, -2, -10, -25, '+', 'no'];
      function createLegend () {

        var rect_width = 30;
        var margin = 5;
        var classes = legendMap.length;
        var width = (rect_width + 2 * margin) * classes;
        var height = 50;

        var data = [0,8,7,6,5,4,3,2,1,9,10];
        var x = d3.scale.ordinal()
          .domain(data)
          .rangeBands([0, width]);

        var legendSVG = d3.select(element[0])
          .append("svg")
          .attr("class", 'circle_legend')
          .attr("width", width)
          .attr("height", height);

        var bar = legendSVG.selectAll('g').data(data);
        bar.enter().append("g")
         .attr("class", "chart_legend_bar")
         .attr("transform", function(d, i) { return "translate(" + i * x.rangeBand() + ",0)"; });

        var rect = bar.append('rect')
          .attr('width', x.rangeBand() - 5)
          .attr('height', height /3)
//          .attr('x', function(d, i) {return i * (rect_width + 2*margin) + margin;})
          .attr('y', function(d, i) {return margin})
          .style('fill', function(d) {return fill(d)})
          .style('stroke', 'white');
        var rtext = bar.append('text')
          .attr('x', function(d, i) {return x.rangeBand()-rect_width/2;})
          .attr('y', height)
          .attr('dy', '-.5em')
          .attr('fill', 'white')
          .text(function(d) {return legendMap[(+d)];})

        var rtext = legendSVG.select('g').append('text')
          .attr('y', height)
          .attr('dy', '-.5em')
          .attr('fill', 'white')
          .text('-');


      }
      createLegend();
      // set up initial svg object
      var svg = d3.select(element[0])
        .append("svg")
          .attr("width", width)
          .attr("height", height);

      scope.$watch('val', function (newVal, oldVal) {

        init();
        // clear the elements inside of the directive
        svg.selectAll('*').remove();
        svg.on("click", function () { unlockAll();});

        // if 'val' is undefined, exit
        if (!newVal) {
          return;
        }

        newVal = reformatRKTSV(newVal);

        drawBar();

        var data = [];
        var thisYear = 2014;
        var lastYear = thisYear - 1;
        var rateMap = [-Infinity, -25, -10, -2, 0, 2, 10, 25, Infinity];

        scope.points = [];

        for (var prop in newVal) {
//          newVal[prop].radius = Math.log10(newVal[prop].total+1) * 3 + 1;
          newVal[prop].radius = Math.sqrt(newVal[prop].total);
          newVal[prop].radius100 = Math.sqrt(newVal[prop].total) + 100;
          newVal[prop].x = Math.random() * width;
          newVal[prop].y = Math.random() * height;
          newVal[prop].all = 'All';
          if ((newVal[prop].year[thisYear+''] !== undefined)&&(newVal[prop].year[lastYear+''] !== undefined)) {
            var rate = ((newVal[prop].year[thisYear+''] - newVal[prop].year[lastYear+'']) / newVal[prop].year[lastYear+'']) * 100;
            newVal[prop].rate = Math.round(rate, 2) + '%';
            for (var ir=1; ir<rateMap.length; ir++) {
              if ((rate > rateMap[ir-1]) && (rate <= rateMap[ir])) {
                newVal[prop].diff = 9 - ir;
              }
            }
          }
          else if ((newVal[prop].year[thisYear+''] === undefined)&&(newVal[prop].year[lastYear+''] === undefined)) {
            newVal[prop].diff = 10;
            newVal[prop].rate = '無紀錄時間';
          }
          else if (newVal[prop].year[thisYear+''] !== undefined) {
            newVal[prop].diff = 9;
            newVal[prop].rate = lastYear + '沒紀錄';
          }
          else if (newVal[prop].year[lastYear+''] !== undefined) {
            newVal[prop].diff = 0;
            newVal[prop].rate = thisYear + '沒紀錄';
          }


          if (data.length == +prop) {
            data.push(newVal[prop]);
          }
        }
        var maxRadius = d3.max(_.pluck(data, 'radius'));

        var getCenters = function (vname, size) {
          var centers, map;
          centers = _.uniq(_.pluck(data, vname)).map(function (d) {
            return {name: d, value: 1};
          });

          //map = d3.layout.pack().size(size);
//          map = d3.layout.treemap().size(size).ratio(1/1);
          map = d3.layout.treemap().size(size).ratio(1/1);
          map.nodes({children: centers});

          return centers;
        };

        var nodes = svg.selectAll("circle")
          .data(data);

        nodes.enter().append("circle")
          .attr("class", "node")
          .attr("diff", function (d) { return d.diff; })
          .attr("cx", function (d) { return d.x; })
          .attr("cy", function (d) { return d.y; })
          .attr("r", function (d) { return d.radius; })
          .style("fill", function (d) { return fill(d.diff); })
          .on("mouseover", function (d) { showPopover.call(this, d); if (!nodeLocked) drawBar(d); })
          .on("mouseout", function (d) { removePopovers(d); })
          .on("click", function (d) { toggleLock(d); })

        nodes.exit().remove();

        nodes.transition().duration(1000)
          .attr("r", function (d) { return d.radius; })

        var force = d3.layout.force()
          .friction(0.01).gravity(0);

        draw('all', {});

        $( ".btn" ).click(function() {
          lockedD.radius = lockedD.radius100 - 100;
/*
          data.forEach(function(d) {
            d.radius = d.radius100 - 100;
          });
*/
          if (this.id == 'all') {
            draw(this.id, lockedD);
          }
          else {
            draw(this.id, {});
          }
        });

        function draw (varname) {

          btn_clicked = varname;

          if (varname == 'all') {
            render_h = 600;
            padding = 20;
          }
          else {
            render_h = height;
            padding = 5;
          }
          var centers = getCenters(varname, [render_w, render_h]);
          force.on("tick", tick(centers, varname, lockedD));
          if (varname == 'name') {
            svg.selectAll(".label").remove();
          }
          else {
            labels(centers);
          }
          force.start();
        }

        function tick (centers, varname, lockedD) {
          var foci = {};
          for (var i = 0; i < centers.length; i++) {
            foci[centers[i].name] = centers[i];
          }
          return function (e) {
            for (var i = 0; i < data.length; i++) {
              var o = data[i];
              var f = foci[o[varname]];
//              o.y += (f.y - o.y) * e.alpha;
//              o.x += (f.x - o.x) * e.alpha;
              o.y += ((f.y + (f.dy / 2)) - o.y) * e.alpha;
              o.x += ((f.x + (f.dx / 2)) - o.x) * e.alpha;
            }
            nodes.each(collide(0.1, lockedD))
              .attr("cx", function (d) { return d.x + render_left; })
              .attr("cy", function (d) { return d.y; });
          }
        }

        function labels (centers) {
          svg.selectAll(".label").remove();

          svg.selectAll(".label")
          .data(centers).enter().append("text")
          .attr("class", "label")
          .text(function (d) {
            if (legendMap[d.name] === undefined) {
              return d.name;
            }
            else {
              return legendMap[d.name];
            }
          })
          .attr("transform", function (d, i) {
            //return "translate(" + (d.x - ((d.name.length)*3)) + ", " + (d.y - d.r) + ")";
            return "translate(" + (d.x + (d.dx / 2) + render_left) + ", " + (d.y + 20) + ")";
          });
        }

        function removePopovers () {
          $('.popover').each(function() {
            $(this).remove();
          });
          d3.selectAll(".node-focus").attr("class", "node");
        }

        function showPopover (d) {
          $(this).popover({
            placement: 'auto top',
            container: 'body',
            trigger: 'manual',
            html : true,
            content: function() { 
              return "物種: " + d.name + "<br/>數量:" + d.total + "</br/>"+lastYear+":" + d['year'][lastYear+''] + "<br/>"+thisYear+":" + d['year'][thisYear+''] + "<br/>差異:" + d.rate;
            }
          });
          $(this).popover('show');
          if (_.values($(this)[0].classList).indexOf('node-locked') === -1) {
            d3.select(this).attr('class', 'node node-focus');
          }
        }

        function unlockAll () {
          nodeLocked = false;
          d3.selectAll('.node-locked').attr('class', 'node');
/*
          data.forEach(function(d) {
            d.radius = d.radius100 - 100;
          });
*/
          lockedD.radius = lockedD.radius100 - 100;
          lockedNode = {};
          lockedD = {};
          draw(btn_clicked, {});
        }


        function toggleLock (d) {
          d3.event.stopPropagation();
          nodeLocked = true;
          d3.selectAll('.node-locked').attr('class', 'node');
          d3.select(d3.event.toElement).attr('class', 'node node-locked');
          if (lockedNode !== d3.event.toElement) {
            lockedNode = d3.event.toElement;
            lockedD.radius = lockedD.radius100 - 100;
            lockedD = d;
            drawBar(d);
          }
          draw(btn_clicked, lockedD);
          scope.points = d.points;
          scope.$apply();
        }


        function collide(alpha, lockedD) {
          var quadtree = d3.geom.quadtree(data);
          return function(d) {

            if ((d.name === lockedD.name)&&nodeLocked&&(btn_clicked=='all')) {
              d.radius = d.radius100;
            }

            var r = d.radius + maxRadius + padding,
                nx1 = d.x - r,
                nx2 = d.x + r,
                ny1 = d.y - r,
                ny2 = d.y + r;


            quadtree.visit(function(quad, x1, y1, x2, y2) {
              if (quad.point && (quad.point !== d)) {
                var x = d.x - quad.point.x,
                    y = d.y - quad.point.y,
                    l = Math.sqrt(x * x + y * y),
                    r = d.radius + quad.point.radius + padding;
                if (l < r) {
                  l = (l - r) / l * alpha;
                  d.x -= x *= l;
                  d.y -= y *= l;
                  quad.point.x += x;
                  quad.point.y += y;
                }
              }
              return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
            });
          };
        }

        // DRAW BAR
        function drawBar (spNode) {
          var width = 270,
              height = 200;
          var counts = [0,0,0,0,0,0,0,0,0,0,0,0];

          var title = '未選擇';
          if (spNode !== undefined) {
            for (var key_month in spNode.month) {
              counts[+key_month - 1] = spNode.month[key_month];
            }
            title = spNode.name;
          }

          var x = d3.scale.ordinal()
            .domain(['1','2','3','4','5','6','7','8','9','10','11','12'])
            .rangeBands([0, width]);
          var xAxisSettings = d3.svg.axis()
            .scale(x)
            .orient("bottom");


          var y = d3.scale.linear()
            .range([height, 30])
            .domain([0, d3.max(counts)]);

          d3.select('div#barchart').select('svg').remove();
          var chart = d3.select('div#barchart')
            .append('svg')
              .attr('width', width)
              .attr('height', height + 50);

          chart.selectAll("text.barchart_label").remove();
          chart.append("text")
            .attr("x", 0)
            .attr("y", 0)
            .attr("dy", "1em")
            .attr("class", "barchart_label")
            .text(title)
            .style("fill", "white");


          chart.selectAll('.axis').remove();
          var xAxis = chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxisSettings);

          xAxis.selectAll("text")
              .style('fill', 'white');
          xAxis.style('stroke', 'white');

          var bar = chart.selectAll("g.bar_chart")
            .data(counts);

          bar.enter().append("g")
            .attr("class", "bar_chart")
            .attr("transform", function(d, i) { return "translate(" + i * x.rangeBand() + ",0)"; });

          bar.selectAll("rect").remove();
          bar.append("rect")
            .attr("class", "month_bar_rect")
            .attr("y", function(d) { return y(d); })
            .attr("height", function(d) { return height - y(d); })
            .attr("width", x.rangeBand()-1);

          bar.selectAll("text").remove();
          bar.append("text")
            .attr("class", "month_bar_text")
            .attr("x", x.rangeBand() / 2)
            .attr("y", function(d) { return y(d) + 3; })
            .attr("dy", "-1em")
            .text(function(d) { return d; });
        }

        // DRAW MAP
        // TODO: need to fix "Error: Map container is already initialized."
        if (map === undefined) {
	        var map = new L.Map('maptest').setView(new L.LatLng(23.8, 121.1), 6).addLayer(new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'));
        }
        var heatmapLayer = new HeatmapOverlay(cfg);
        map.addLayer(heatmapLayer);
        scope.$watch (
          function (scope) {
            return scope.points;
          },
          function (newP, oldP) {
            if (newP.length != 0) {
              var ffss = {max: 3000, data: newP};
            }
            else {
              var ffss = {max: 3000, data: [{lat:23.8, lng:121.1, count:0}]};
            }
            heatmapLayer.setData(ffss);
          }
        )



      });
    }
  }
});

function type (d) {
  d.value = +d.value; // coerce to number
  return d;
}

// Function: rgb2hex
// Author: Zack Katz
// http://stackoverflow.com/questions/1740700/how-to-get-hex-color-value-rather-than-rgb-value
function rgb2hex(rgb) {
    rgb = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+))?\)$/);
    function hex(x) {
        return ("0" + parseInt(x).toString(16)).slice(-2);
    }
    return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
}


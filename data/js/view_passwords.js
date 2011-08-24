var loginData;
var vis;

var w=800;var h=600;var fill = d3.scale.category20();

function init() {
    vis = d3.select("#chart").append("svg:svg")
        .attr("width", w)
        .attr("height", h);
        
    window.loadLogins(function(logins) {
        loginData = logins;
        startViz();
    });
}

function startViz() {
    var force = d3.layout.force()
    .charge(-60)
    .nodes(loginData.nodes)
    .links(loginData.links)
    .size([800, 600])
    .start();

    var link = vis.selectAll("line.link")
    .data(loginData.links)
    .enter().append("svg:line")
    .attr("class", "link")
    .style("stroke-width", function(d) { return Math.sqrt(d.value); })
    .attr("x1", function(d) { return d.source.x; })
    .attr("y1", function(d) { return d.source.y; })
    .attr("x2", function(d) { return d.target.x; })
    .attr("y2", function(d) { return d.target.y; });

    var node = vis.selectAll("circle.node")
    .data(loginData.nodes)
    .enter().append("svg:circle")
    .attr("class", "node")
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; })
    .attr("r", 5)
    .style("fill", function(d) { return fill(d.group); })
    .call(force.drag);
    
    
    node.append("svg:text").text(function(d) { return "hey"; });
    
    node.append("svg:title")
        .text(function(d) { return d.name; });

    vis.style("opacity", 1e-6)
      .transition()
        .duration(1000)
        .style("opacity", 1);

    force.on("tick", function() {
      link.attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });

      node.attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
    });
    

}
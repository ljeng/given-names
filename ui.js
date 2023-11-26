var geojson_url = "https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json";

d3.json(geojson_url).then(function (geojson) {
    var fill = "white";
    var stroke = "black";
    var hoverColor = "#BB133E";
    var mouseOverDuration = 200;
    var mouseOutDuration = 500;
    var opacity = 0.9;
    var x = 0;
    var y = 0;

    // Create a tooltip element
    var tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Create a function to handle mouseover events
    function mouseOver(d, i) {
        d3.select(this)
            .style("fill", hoverColor);

        // Show the tooltip with the state name
        tooltip.transition()
            .duration(mouseOverDuration)
            .style("opacity", opacity);
        tooltip.html(d.properties.name) // Assuming the state name is in the 'name' property
            .style("left", (d3.event.pageX + x) + "px")
            .style("top", (d3.event.pageY + y) + "px");
    }

    // Create a function to handle mouseout events
    function mouseOut(d, i) {
        d3.select(this)
            .style("fill", fill);

        // Hide the tooltip
        tooltip.transition()
            .duration(mouseOutDuration)
            .style("opacity", 0);
    }

    d3.select("#map").selectAll("path")
        .data(geojson.features)
        .enter().append("path")
        .attr("d", d3.geoPath().projection(d3.geoAlbersUsa().fitSize([window.innerWidth, window.innerHeight], geojson)))
        .style("fill", fill)
        .style("stroke", stroke)
        .on("mouseover", mouseOver)
        .on("mouseout", mouseOut);
});

function selectAllRaces() {
    for (var checkbox of document.getElementsByName('race')) checkbox.checked = true;
}

function deselectAllRaces() {
    for (var checkbox of document.getElementsByName('race')) checkbox.checked = false;
}

function updateMaxMotherAgeOptions() {
    var minMotherAge = document.getElementById('minMotherAge').value;
    var maxMotherAge = document.getElementById('maxMotherAge');
    maxMotherAge.querySelectorAll('option').forEach(function(option) {
        option.disabled = false;
    });
    if (minMotherAge != 'under21') {
        maxMotherAge.querySelector('[value="under21"]').disabled = true;
        if (minMotherAge != 'over38') {
            var minMotherAgeValue = parseInt(minMotherAge);
            for (var i = 21; i <= 38; i++) maxMotherAge.querySelector('[value="' + i + '"]').disabled = (i < minMotherAgeValue);
        }
        else for (var i = 21; i <= 38; i++) maxMotherAge.querySelector('[value="' + i + '"]').disabled = true;
    }
}

function updateMinMotherAgeOptions() {
    var minMotherAge = document.getElementById('minMotherAge');
    var maxMotherAge = document.getElementById('maxMotherAge').value;
    minMotherAge.querySelectorAll('option').forEach(function(option) {
        option.disabled = false;
    });
    if (maxMotherAge != 'over38') {
        minMotherAge.querySelector('[value="over38"]').disabled = true;
        if (maxMotherAge != 'under21') {
            var maxMotherAgeValue = parseInt(maxMotherAge);
            for (var i = 21; i <= 38; i++) minMotherAge.querySelector('[value="' + i + '"]').disabled = (i > maxMotherAgeValue);
        }
        else for (var i = 21; i <= 38; i++) minMotherAge.querySelector('[value="' + i + '"]').disabled = true;
    }
}
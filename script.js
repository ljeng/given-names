let geojson_url = "https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json";

d3.json(geojson_url).then(function (geojson) {
    let fill = "white";
    let clickedFill = "#002147";
    let hoverFill = "#BB133E";
    let stroke = "black";
    let mouseOverDuration = 200;
    let mouseOutDuration = 500;
    let clickDuration = 200;
    let opacity = 0.9;
    let x = 0;
    let y = 0;
    let tooltip = d3
        .select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    function mouseOver(d, i) {
        d3.select(this)
            .style("fill", hoverFill);
        tooltip.transition()
            .duration(mouseOverDuration)
            .style("opacity", opacity);
        tooltip.html(d.properties.name)
            .style("left", (d3.event.pageX + x) + "px")
            .style("top", (d3.event.pageY + y) + "px");
    }

    function mouseOut(d, i) {
        d3.select(this)
            .style("fill", function () {
                return d3.select(this).classed("clicked") ? clickedFill : fill;
            });
        tooltip.transition()
            .duration(mouseOutDuration)
            .style("opacity", 0);
    }

    function click(d, i) {
        d3.selectAll("#map path")
            .classed("clicked", false)
            .transition()
            .duration(clickDuration)
            .style("fill", fill);
        d3.select(this)
            .classed("clicked", true)
            .transition()
            .duration(clickDuration)
            .style("fill", clickedFill);
    }

    d3.select("#map").selectAll("path")
        .data(geojson.features)
        .enter().append("path")
        .attr("d",
            d3.geoPath()
                .projection(d3
                    .geoAlbersUsa()
                    .fitSize([window.innerWidth, window.innerHeight],
                        geojson)))
        .style("fill", fill)
        .style("stroke", stroke)
        .on("mouseover", mouseOver)
        .on("mouseout", mouseOut)
        .on("click", click);
});


document.addEventListener("DOMContentLoaded", async function () {
    window.sorted_sex = await d3.json("json/sorted/sex.json");
    window.sorted_birthYear = await d3.json("json/sorted/birth_year.json");
    window.sum_sex = await d3.json("json/sum/sex.json");
    window.sum_birthYear = await d3.json("json/sum/birth_year.json");
    window.count_sex = await d3.json("json/count/sex.json");
    window.count_birthYear = await d3.json("json/count/birth_year.json");
    window.normalized_sex = await d3.json("json/normalized/sex.json");
    window.normalized_birthYear = await d3
        .json("json/normalized/birth_year.json");
});

async function submit() {
    const n = 100;
    const maleChecked = document.getElementById("maleCheckbox").checked;
    const femaleChecked = document.getElementById("femaleCheckbox").checked;
    let names_sex = [];
    if (maleChecked && !femaleChecked)
        names_sex = getNames(window.sorted_sex, "male", n);
    else if (femaleChecked && !maleChecked)
        names_sex = getNames(window.sorted_sex, "female", n);
    const minBirthYear = parseInt(document
        .getElementById("minBirthYear")
        .value,
        10);
    const maxBirthYear = parseInt(document
        .getElementById("maxBirthYear")
        .value,
        10);
    let superset_birthYear = [];
    for (let birthYear = minBirthYear; birthYear <= maxBirthYear; birthYear++)
        superset_birthYear
            .push(...getNames(window.sorted_birthYear, birthYear, n));
    const selected_birthYear = Array
        .from({ length: maxBirthYear - minBirthYear + 1 },
            (_, i) => minBirthYear + i);
    const weight_birthYear = getWeight(selected_birthYear,
        window.sum_birthYear);
    const multiplier_birthYear = getMultiplier(superset_birthYear,
        selected_birthYear,
        weight_birthYear,
        normalized_birthYear);
    let names_birthYear = Object.entries(multiplier_birthYear);
    names_birthYear.sort((x, y) => y[1] - x[1]);
    const data = document.getElementById("data");
    data.innerHTML = "";
    let ul = document.createElement("ul");
    names_sex.forEach(function (name) {
      let li = document.createElement("li");
      li.appendChild(document.createTextNode(name));
      ul.appendChild(li);
    });
    names_birthYear.slice(0, n).forEach(function (entry) {
      let li = document.createElement("li");
      li.appendChild(document.createTextNode(entry[0]));
      ul.appendChild(li);
    });
    data.appendChild(ul);
}

function getNames(sorted, key, n) {
    return sorted[key].slice(0, n).map(entry => entry[0]);
}

function getWeight(selected, sum) {
    const sum_weight = selected
        .reduce((accumulator, selection) => accumulator + sum[selection], 0);
    const weight = selected.reduce((accumulator, selection) => {
        accumulator[selection] = sum[selection] / sum_weight;
        return accumulator;
    }, {});
    return weight;
}

function getMultiplier(superset, selected, weight, normalized) {
    const multiplier = {};
    for (const name of superset) {
        multiplier[name] = 0;
        for (const selection of selected)
            if (name in normalized[selection])
                multiplier[name] += weight[selection] * normalized[selection][name];
    }
    return multiplier;
}


function selectAllRaces() {
    for (let checkbox of document.getElementsByName('race'))
        checkbox.checked = true;
}

function deselectAllRaces() {
    for (let checkbox of document.getElementsByName('race'))
        checkbox.checked = false;
}

function updateMaxMotherAgeOptions() {
    let minMotherAge = document.getElementById('minMotherAge').value;
    let maxMotherAge = document.getElementById('maxMotherAge');
    maxMotherAge.querySelectorAll('option').forEach(function(option) {
        option.disabled = false;
    });
    if (minMotherAge != 'under21') {
        maxMotherAge.querySelector('[value="under21"]').disabled = true;
        if (minMotherAge != 'over38') {
            let minMotherAgeValue = parseInt(minMotherAge);
            for (let i = 21; i <= 38; i++)
                maxMotherAge
                    .querySelector('[value="' + i + '"]')
                    .disabled = (i < minMotherAgeValue);
        }
        else
            for (let i = 21; i <= 38; i++)
                maxMotherAge
                    .querySelector('[value="' + i + '"]')
                    .disabled = true;
    }
}

function updateMinMotherAgeOptions() {
    let minMotherAge = document.getElementById('minMotherAge');
    let maxMotherAge = document.getElementById('maxMotherAge').value;
    minMotherAge.querySelectorAll('option').forEach(function(option) {
        option.disabled = false;
    });
    if (maxMotherAge != 'over38') {
        minMotherAge.querySelector('[value="over38"]').disabled = true;
        if (maxMotherAge != 'under21') {
            let maxMotherAgeValue = parseInt(maxMotherAge);
            for (let i = 21; i <= 38; i++)
                minMotherAge.querySelector('[value="' + i + '"]')
                    .disabled = (i > maxMotherAgeValue);
        }
        else
            for (let i = 21; i <= 38; i++)
                minMotherAge.querySelector('[value="' + i + '"]')
                    .disabled = true;
    }
}
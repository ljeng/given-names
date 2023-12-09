const geojson_url = "https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json";
const state_abbreviation = {
    "Alabama": "AL",
    "Alaska": "AK",
    "Arizona": "AZ",
    "Arkansas": "AR",
    "California": "CA",
    "Colorado": "CO",
    "Connecticut": "CT",
    "Delaware": "DE",
    "Florida": "FL",
    "Georgia": "GA",
    "Hawaii": "HI",
    "Idaho": "ID",
    "Illinois": "IL",
    "Indiana": "IN",
    "Iowa": "IA",
    "Kansas": "KS",
    "Kentucky": "KY",
    "Louisiana": "LA",
    "Maine": "ME",
    "Maryland": "MD",
    "Massachusetts": "MA",
    "Michigan": "MI",
    "Minnesota": "MN",
    "Mississippi": "MS",
    "Missouri": "MO",
    "Montana": "MT",
    "Nebraska": "NE",
    "Nevada": "NV",
    "New Hampshire": "NH",
    "New Jersey": "NJ",
    "New Mexico": "NM",
    "New York": "NY",
    "North Carolina": "NC",
    "North Dakota": "ND",
    "Ohio": "OH",
    "Oklahoma": "OK",
    "Oregon": "OR",
    "Pennsylvania": "PA",
    "Rhode Island": "RI",
    "South Carolina": "SC",
    "South Dakota": "SD",
    "Tennessee": "TN",
    "Texas": "TX",
    "Utah": "UT",
    "Vermont": "VT",
    "Virginia": "VA",
    "Washington": "WA",
    "West Virginia": "WV",
    "Wisconsin": "WI",
    "Wyoming": "WY",
}
let state = null;

d3.json(geojson_url).then(function (geojson) {
    const fill = "white";
    const clickedFill = "#002147";
    const hoverFill = "#BB133E";
    const stroke = "black";
    const mouseOverDuration = 200;
    const mouseOutDuration = 500;
    const clickDuration = 200;
    const opacity = 0.9;
    const x = 0;
    const y = 0;
    const tooltip = d3.select("body")
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
        state = d.properties.name;
    }

    d3.select("#map").selectAll("path")
        .data(geojson.features)
        .enter().append("path")
        .attr("d",
            d3.geoPath()
                .projection(d3.geoAlbersUsa()
                    .fitSize([window.innerWidth, window.innerHeight], geojson)))
        .style("fill", fill)
        .style("stroke", stroke)
        .on("mouseover", mouseOver)
        .on("mouseout", mouseOut)
        .on("click", click);
});

function submit() {
    d3.select("#treeMap").selectAll("*").remove();

    const rangeBirthYear = 123;
    const k = 100;
    const tolerance = 0.01;
    const width = 1568;
    const height = 980;
    const l = 70;

    let file_selection = {};
    const maleChecked = document.getElementById("maleCheckbox").checked;
    const femaleChecked = document.getElementById("femaleCheckbox").checked;
    let selection_sex = [];
    if (maleChecked && !femaleChecked) {
        selection_sex.push("male");
        file_selection["sex"] = selection_sex;
    }
    else if (femaleChecked && !maleChecked) {
        selection_sex.push("female");
        file_selection["sex"] = selection_sex;
    }
    let selection_birthYear = [];
    for (let birthYear = parseInt(document.getElementById("minBirthYear").value, 10);
        birthYear <= parseInt(document.getElementById("maxBirthYear").value, 10);
        birthYear++
    )
        selection_birthYear.push(birthYear.toString());
    if (selection_birthYear.length < rangeBirthYear)
        file_selection["birth_year"] = selection_birthYear;
    let selection_geo = [];
    if (state != null) {
        selection_geo.push(state_abbreviation[state]);
        file_selection["geo"] = selection_geo;
    }
    let selection_race = [];
    document.querySelectorAll('input[name="race"]:checked').forEach((checkbox) => {
        selection_race.push(checkbox.value);
    });
    if (selection_race.length > 0) file_selection["race"] = selection_race;
    let promises = [];
    for (let file of Object.keys(file_selection)) {
        promises.push(d3.json("json/sum/" + file + ".json"));
        promises.push(d3.json("json/normalized/" + file + ".json"));
    }
    promises.push(d3.json("json/sum/name.json"));

    Promise.all(promises).then((data) => {
        let sumMap = {};
        let normalizedMap = {};
        let nameMap = {};

        Object.keys(file_selection).forEach((file, i) => {
            i *= 2;
            sumMap[file] = data[i++];
            normalizedMap[file] = data[i++];
        });

        nameMap = data[data.length - 1];
        let memo = {};

        Object.entries(file_selection).forEach(([file, selection]) => {
            memo[file] = {};
            if (selection.length > 1) {
                let n = 0;
                for (let x of selection) n += sumMap[file][x];
                const weightMap = Object.fromEntries(selection.map((x) => [x, sumMap[file][x] / n]));
                for (let x of selection)
                    for (let name of Object.keys(normalizedMap[file][x])) {
                        memo[file][name] = 0;
                        if (normalizedMap[file][x].hasOwnProperty(name))
                            memo[file][name] += weightMap[x] * normalizedMap[file][x][name];
                    }
            }
            else {
                const x = selection[0];
                for (let name of Object.keys(normalizedMap[file][x]))
                    memo[file][name] = normalizedMap[file][x][name];
            }
        });

        let nameMultiplier = {};
        for (let file of Object.keys(memo)) {
            for (let name of Object.keys(memo[file])) {
                if (!nameMultiplier.hasOwnProperty(name))
                    nameMultiplier[name] = 1;
                nameMultiplier[name] *= memo[file][name];
            }
        }

        const nodes = Object.entries(nameMultiplier)
            .sort((a, b) => {
                const multiplierComparison = b[1] - a[1];
                return Math.abs(multiplierComparison) > tolerance
                    ? multiplierComparison
                    : nameMap[b[0]] - nameMap[a[0]];
            })
            .slice(0, k)
            .map(entry => ({name: entry[0],
                ratio: entry[1],
                count: nameMap[entry[0]]}))
            .sort((a, b) => a.name.localeCompare(b.name));
        console.log(nodes);

        const treemap = d3.treemap().size([width, height]);
        const root = d3.hierarchy({ children: nodes }).sum(d => d.count);
        treemap(root);
        const svg = d3.select("#treeMap")
            .append("svg")
            .attr("width", width)
            .attr("height", height);
        const gradient = d3.scaleSequential()
            .domain([d3.max(nodes, d => d.ratio), d3.min(nodes, d => d.ratio)])
            .interpolator(d3.interpolateViridis);
        const maxCount = d3.max(nodes, d => d.count);
        const minCount = d3.min(nodes, d => d.count);
        const countScale = d3.scaleLinear()
            .domain([minCount, maxCount])
            .range([Math.sqrt(minCount), Math.sqrt(maxCount)]);
        svg.selectAll(".cell")
            .data(root.leaves())
            .enter().append("rect")
            .attr("class", "cell")
            .attr("x", d => d.x0)
            .attr("y", d => d.y0)
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            .attr("width", d => countScale(d.data.count) * (d.x1 - d.x0))
            .attr("height", d => countScale(d.data.count) * (d.y1 - d.y0))
            .attr("fill", d => gradient(d.data.ratio));
        svg.selectAll(".label")
            .data(root.leaves())
            .enter().append("text")
            .attr("class", "label")
            .attr("x", d => (d.x0 + d.x1) / 2)
            .attr("y", d => (d.y0 + d.y1) / 2)
            .attr("text-anchor", "middle")
            .attr("fill",
                d => d3.lab(gradient(d.data.ratio)).l < l
                ? "white"
                : "black")
            .attr("transform",
                d => (d.y1 - d.y0 > d.x1 - d.x0)
                ? `rotate(90, ${(d.x0 + d.x1) / 2}, ${(d.y0 + d.y1) / 2})`
                : "")
            .text(d => d.data.name);
    })
}

function selectAllRaces() {
    for (let checkbox of document.getElementsByName('race'))
        checkbox.checked = true;
}

function deselectAllRaces() {
    for (let checkbox of document.getElementsByName('race'))
        checkbox.checked = false;
}

function updateMinMotherAgeOptions() {
    const minMotherAge = document.getElementById('minMotherAge');
    const maxMotherAge = document.getElementById('maxMotherAge').value;

    minMotherAge.querySelectorAll('option').forEach(function(option) {
        option.disabled = false;
    });

    if (maxMotherAge != 'over38') {
        minMotherAge.querySelector('[value="over38"]').disabled = true;
        if (maxMotherAge != 'under21') {
            const maxMotherAgeValue = parseInt(maxMotherAge);
            for (let i = 21; i <= 38; i++)
                minMotherAge.querySelector('[value="' + i + '"]').disabled = (i > maxMotherAgeValue);
        }
        else
            for (let i = 21; i <= 38; i++)
                minMotherAge.querySelector('[value="' + i + '"]').disabled = true;
    }
}

function updateMaxMotherAgeOptions() {
    const minMotherAge = document.getElementById('minMotherAge').value;
    const maxMotherAge = document.getElementById('maxMotherAge');

    maxMotherAge.querySelectorAll('option').forEach(function(option) {
        option.disabled = false;
    });

    if (minMotherAge != 'under21') {
        maxMotherAge.querySelector('[value="under21"]').disabled = true;
        if (minMotherAge != 'over38') {
            const minMotherAgeValue = parseInt(minMotherAge);
            for (let i = 21; i <= 38; i++)
                maxMotherAge.querySelector('[value="' + i + '"]').disabled = (i < minMotherAgeValue);
        }
        else
            for (let i = 21; i <= 38; i++)
                maxMotherAge.querySelector('[value="' + i + '"]').disabled = true;
    }
}
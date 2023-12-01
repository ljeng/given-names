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
        state = d.properties.name;
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

function submit() {
    const rangeBirthYear = 123;
    const k = 100;

    const file_selection = {};
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

    Promise.all(promises).then((_) => {
        let sumMap = {};
        let normalizedMap = {};

        Object.keys(file_selection).forEach((file, i) => {
            i *= 2;
            sumMap[file] = _[i++];
            normalizedMap[file] = _[i++];
        });

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
                let x = selection[0];
                for (let name of Object.keys(normalizedMap[file][x]))
                    memo[file][name] = normalizedMap[file][x][name];
            }
        });

        const name_multiplier = {};
        for (let file of Object.keys(memo)) {
            for (let name of Object.keys(memo[file])) {
                if (!name_multiplier.hasOwnProperty(name))
                    name_multiplier[name] = 1;
                name_multiplier[name] *= memo[file][name];
            }
        }

        const names_element = document.getElementById("names");
        names_element.innerHTML = "";
        let ul = document.createElement("ul");
        Object.entries(name_multiplier)
            .sort((a, b) => b[1] - a[1])
            .slice(0, k)
            .map(([name, multiplier]) => [name, multiplier]).forEach(function ([name, multiplier]) {
            let li = document.createElement("li");
            li.appendChild(document.createTextNode(`${name}: ${multiplier.toFixed(2)}`));
            ul.appendChild(li);
        });
        names_element.appendChild(ul);
    });
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
                minMotherAge.querySelector('[value="' + i + '"]').disabled = (i > maxMotherAgeValue);
        }
        else
            for (let i = 21; i <= 38; i++)
                minMotherAge.querySelector('[value="' + i + '"]').disabled = true;
    }
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
                maxMotherAge.querySelector('[value="' + i + '"]').disabled = (i < minMotherAgeValue);
        }
        else
            for (let i = 21; i <= 38; i++)
                maxMotherAge.querySelector('[value="' + i + '"]').disabled = true;
    }
}